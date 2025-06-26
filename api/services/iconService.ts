import fs from 'fs/promises';
import path from 'path';
import Redis from 'ioredis';
import { Icon, IconWithContent } from '../types/icon';
import { createLogger } from './logger';
import { sanitizeSvg } from '../utils/svgSanitizer';

// Create a namespaced logger for this service
const logger = createLogger('iconService');

// Constants
// Define multiple possible paths for the icons file
const POSSIBLE_ICON_PATHS = [
  path.join(process.cwd(), 'data', 'icons.json'),      // Local data directory
  path.join(process.cwd(), '..', 'data', 'icons.json') // Root data directory
];

// Define possible paths for the public directory containing icons
const POSSIBLE_PUBLIC_PATHS = [
  path.join(process.cwd(), 'public'),      // Local public directory
  path.join(process.cwd(), '..', 'public') // Root public directory
];

// Log the possible paths for debugging
logger.debug(
  {
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    possiblePaths: POSSIBLE_ICON_PATHS,
    possiblePublicPaths: POSSIBLE_PUBLIC_PATHS,
  },
  'Possible paths'
);

const DEFAULT_ICON_SIZE = 24;

export async function readIconsData(): Promise<Icon[]> {
  try {
    logger.debug(
      {
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        dirname: __dirname,
        possiblePaths: POSSIBLE_ICON_PATHS,
      },
      'Reading icons data'
    );

    // List contents of the current directory
    try {
      const contents = await fs.readdir(process.cwd());
      logger.debug({ contents }, 'Contents of cwd');

      const dataContents = await fs.readdir(path.join(process.cwd(), 'data'));
      logger.debug({ dataContents }, 'Contents of data directory');
    } catch (e) {
      logger.error({ err: e }, 'Error listing directory contents');
    }

    // Try each possible path until we find one that works
    let lastError: any = null;

    for (const iconPath of POSSIBLE_ICON_PATHS) {
      try {
        logger.debug({ tryingPath: iconPath }, 'Trying to read icons file');
        const data = await fs.readFile(iconPath, 'utf-8');
        const icons = JSON.parse(data) as Icon[];
        logger.info({ count: icons.length, path: iconPath }, 'Icons loaded successfully');
        return icons;
      } catch (err) {
        lastError = err;
        logger.debug({ err, path: iconPath }, 'Failed to read icons from this path, trying next');
      }
    }

    // If we get here, all paths failed
    logger.error({ err: lastError }, 'All icon paths failed');
    throw new Error(`Failed to read icons data from any path: ${lastError.message}`);
  } catch (err: any) {
    logger.error(
      {
        err,
        cwd: process.cwd(),
        dirname: __dirname,
      },
      'Error reading icons file'
    );
    throw new Error(`Failed to read icons data: ${err.message}`);
  }
}

/**
 * Efficiently modifies SVG size attributes
 * This optimized version:
 * 1. Uses a single regex operation to find the SVG opening tag
 * 2. Parses attributes only once
 * 3. Handles viewBox detection more efficiently
 * 4. Constructs the new SVG tag in a single operation
 */
export function modifySvgSize(svgContent: string, size: number): string {
  // Find the SVG opening tag and capture its attributes
  const svgTagRegex = /<svg([^>]*)>/i;
  const svgMatch = svgTagRegex.exec(svgContent);

  if (!svgMatch) {
    logger.warn('SVG tag not found in content');
    return svgContent; // Return original if no SVG tag found
  }

  const attributes = svgMatch[1];
  const hasViewBox = /viewBox\s*=\s*["'][^"']+["']/i.test(attributes);

  // Remove any existing width/height attributes
  const cleanedAttributes = attributes.replace(/\s*(width|height)\s*=\s*["'][^"']*["']/gi, '');

  // Construct the new SVG tag
  const newSvgTag = hasViewBox
    ? `<svg${cleanedAttributes} width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet">`
    : `<svg${cleanedAttributes} width="${size}" height="${size}">`;

  // Replace only the opening tag
  return svgContent.replace(svgTagRegex, newSvgTag);
}

export function searchIcons(icons: Icon[], searchQuery?: string): Icon[] {
  if (!searchQuery) {
    return icons;
  }

  const query = searchQuery.toLowerCase().trim();
  logger.debug({ query }, 'Searching for icons');

  const filtered = icons.filter(icon => {
    const matches =
      icon.icon_name.toLowerCase().includes(query) ||
      icon.description.toLowerCase().includes(query) ||
      icon.id.toLowerCase().includes(query) ||
      icon.tags.some(tag => tag.toLowerCase().includes(query));

    if (matches) {
      logger.trace({ icon: icon.id, name: icon.icon_name }, 'Match found');
    }
    return matches;
  });

  logger.debug({ count: filtered.length }, 'Search results');
  return filtered;
}

// In-memory cache for resized SVGs
const svgMemoryCache = new Map<string, string>();

/**
 * Get icon content with SVG data, with multi-level caching
 * Uses both in-memory cache and Redis for persistent caching
 */
export async function getIconContent(icon: Icon, size: number = 64): Promise<IconWithContent> {
  try {
    // Create cache keys
    const memoryCacheKey = `${icon.id}:${size}`;
    const redisCacheKey = `svg:${icon.id}:${size}`;

    // 1. Check in-memory cache first (fastest)
    if (CACHE_ENABLED && svgMemoryCache.has(memoryCacheKey)) {
      logger.debug({ iconId: icon.id, size, cacheType: 'memory' }, 'SVG cache hit');
      return {
        ...icon,
        svg_content: svgMemoryCache.get(memoryCacheKey)!,
      };
    }

    // 2. Check Redis cache if available
    if (CACHE_ENABLED && redis) {
      try {
        const cachedSvg = await redis.get(redisCacheKey);
        if (cachedSvg) {
          logger.debug({ iconId: icon.id, size, cacheType: 'redis' }, 'SVG cache hit');

          // Also update memory cache
          svgMemoryCache.set(memoryCacheKey, cachedSvg);

          return {
            ...icon,
            svg_content: cachedSvg,
          };
        }
      } catch (cacheErr) {
        logger.warn({ err: cacheErr, iconId: icon.id }, 'Redis SVG cache error');
        // Continue to file read on cache error
      }
    }

    // 3. Read from file system, sanitize, and resize
    logger.debug({ iconId: icon.id, size }, 'SVG cache miss, reading from file');
    const svgPath = path.join(process.cwd(), '..', 'public', icon.svg_path);
    logger.debug({ svgPath }, 'Reading SVG file');
    const svgContent = await fs.readFile(svgPath, 'utf-8');

    // Sanitize the SVG content to prevent XSS attacks
    const sanitizedSvgContent = sanitizeSvg(svgContent);

    // Resize the sanitized SVG content
    const sizedSvgContent = modifySvgSize(sanitizedSvgContent, size);

    // 4. Update both caches
    if (CACHE_ENABLED) {
      // Update memory cache
      svgMemoryCache.set(memoryCacheKey, sizedSvgContent);

      // Prevent memory cache from growing too large
      if (svgMemoryCache.size > MEMORY_CACHE_SIZE) {
        const firstKey = svgMemoryCache.keys().next().value;
        if (firstKey) {
          svgMemoryCache.delete(firstKey);
          logger.debug({ cacheSize: svgMemoryCache.size }, 'Memory SVG cache pruned');
        }
      }

      // Update Redis cache if available
      if (redis) {
        try {
          await redis.set(redisCacheKey, sizedSvgContent, 'EX', SVG_CACHE_TTL);
          logger.debug(
            {
              iconId: icon.id,
              size,
              ttl: SVG_CACHE_TTL,
            },
            'SVG cached in Redis'
          );
        } catch (cacheErr) {
          logger.warn({ err: cacheErr, iconId: icon.id }, 'Failed to cache SVG in Redis');
        }
      }
    }

    return {
      ...icon,
      svg_content: sizedSvgContent,
    };
  } catch (err: any) {
    logger.error({ err, iconId: icon.id, svgPath: icon.svg_path }, 'Error reading SVG file');
    throw new Error(`Failed to read SVG file: ${err.message}`);
  }
}

export function filterIconsByProvider(icons: Icon[], provider: string): Icon[] {
  if (provider.toLowerCase() === 'all') {
    return icons;
  }
  return icons.filter(icon => icon.provider.toLowerCase() === provider.toLowerCase());
}

// Cache configuration
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false';
const DEFAULT_CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10);
const ICON_CACHE_TTL = parseInt(process.env.ICON_CACHE_TTL || '86400', 10);
const SVG_CACHE_TTL = parseInt(process.env.SVG_CACHE_TTL || '604800', 10);
const MEMORY_CACHE_SIZE = parseInt(process.env.MEMORY_CACHE_SIZE || '1000', 10);

// Redis client for caching
let redis: Redis | null = null;
if (CACHE_ENABLED && process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    logger.info(
      {
        cacheEnabled: CACHE_ENABLED,
        defaultTTL: DEFAULT_CACHE_TTL,
        iconTTL: ICON_CACHE_TTL,
        svgTTL: SVG_CACHE_TTL,
      },
      'Redis connected successfully'
    );
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed, continuing without Redis caching');
  }
} else {
  logger.info(
    {
      cacheEnabled: CACHE_ENABLED,
      redisUrl: !!process.env.REDIS_URL,
    },
    'Redis caching not configured'
  );
}

/**
 * Get an icon by provider and name, with caching
 * Uses Redis for persistent caching if available
 */
export async function getIconWithCache(
  provider: string,
  iconName: string
): Promise<Icon | undefined> {
  // If Redis is not available or caching is disabled, read directly from file
  if (!redis || !CACHE_ENABLED) {
    logger.debug({ provider, iconName }, 'Cache disabled or Redis unavailable, reading directly');
    const icons = await readIconsData();
    return icons.find(
      (i: Icon) =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === iconName.toLowerCase()
    );
  }

  const cacheKey = `icon:${provider}:${iconName}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug({ provider, iconName }, 'Icon metadata cache hit');
      return JSON.parse(cached);
    }

    logger.debug({ provider, iconName }, 'Icon metadata cache miss');

    // If not in cache, fetch and store
    const icons = await readIconsData();
    const icon = icons.find(
      (i: Icon) =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === iconName.toLowerCase()
    );

    if (icon) {
      await redis.set(cacheKey, JSON.stringify(icon), 'EX', ICON_CACHE_TTL);
      logger.debug(
        {
          provider,
          iconName,
          ttl: ICON_CACHE_TTL,
        },
        'Icon metadata cached'
      );
    }

    return icon;
  } catch (err) {
    logger.error({ err, provider, iconName }, 'Redis error, falling back to direct read');
    // Fallback to direct read if Redis fails
    const icons = await readIconsData();
    return icons.find(
      (i: Icon) =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === iconName.toLowerCase()
    );
  }
}
