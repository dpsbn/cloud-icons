import fs from 'fs/promises';
import path from 'path';
import Redis from 'ioredis';
import { Icon, IconWithContent } from '../types/icon';
import { createLogger } from './logger';
import { sanitizeSvg } from '../utils/svgSanitizer';
import * as db from './db';

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

/**
 * Reads icon metadata from the database (with fallback to JSON file)
 *
 * This function attempts to read the icons data from the database first,
 * and falls back to the JSON file if the database is not available.
 *
 * @returns {Promise<Icon[]>} A promise that resolves to an array of Icon objects
 * @throws {Error} If the icons data cannot be read from any source
 */
export async function readIconsData(): Promise<Icon[]> {
  try {
    // First, try to read from the database
    logger.debug('Attempting to read icons from database');
    
    try {
      const { icons } = await db.getIcons('all', undefined, 1, 10000); // Get all icons
      logger.info({ count: icons.length }, 'Icons loaded from database successfully');
      return icons;
    } catch (dbError: any) {
      logger.warn({ err: dbError }, 'Database read failed, falling back to JSON file');
    }

    // Fallback to JSON file if database fails
    logger.debug(
      {
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        dirname: __dirname,
        possiblePaths: POSSIBLE_ICON_PATHS,
      },
      'Reading icons data from JSON file'
    );

    // Try each possible path until we find one that works
    let lastError: any = null;

    for (const iconPath of POSSIBLE_ICON_PATHS) {
      try {
        logger.debug({ tryingPath: iconPath }, 'Trying to read icons file');
        const data = await fs.readFile(iconPath, 'utf-8');
        const icons = JSON.parse(data) as Icon[];
        logger.info({ count: icons.length, path: iconPath }, 'Icons loaded from JSON file successfully');
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
      'Error reading icons'
    );
    throw new Error(`Failed to read icons data: ${err.message}`);
  }
}

/**
 * Efficiently modifies SVG size attributes
 *
 * This optimized version:
 * 1. Uses a single regex operation to find the SVG opening tag
 * 2. Parses attributes only once
 * 3. Handles viewBox detection more efficiently
 * 4. Constructs the new SVG tag in a single operation
 *
 * @param {string} svgContent - The original SVG content as a string
 * @param {number} size - The desired size in pixels (both width and height)
 * @returns {string} The modified SVG content with updated size attributes
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

/**
 * Searches for icons based on a search query
 *
 * This function filters the provided array of icons based on the search query.
 * It searches in icon name, description, id, and tags.
 *
 * @param {Icon[]} icons - The array of icons to search through
 * @param {string} [searchQuery] - The search query string (optional)
 * @returns {Icon[]} An array of icons that match the search query
 */
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
 *
 * This function retrieves the SVG content for an icon, using a multi-level caching strategy:
 * 1. First checks an in-memory cache (fastest)
 * 2. Then checks Redis cache if available
 * 3. Finally reads from the file system, sanitizes, and resizes the SVG
 *
 * The function also updates both caches with the retrieved content for future requests.
 *
 * @param {Icon} icon - The icon object containing metadata
 * @param {number} [size=64] - The desired size of the icon in pixels
 * @returns {Promise<IconWithContent>} A promise that resolves to the icon with its SVG content
 * @throws {Error} If the SVG file cannot be read or processed
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

    // Try to read from possible public paths
    let svgContent: string | null = null;
    let lastError: any = null;

    for (const publicPath of POSSIBLE_PUBLIC_PATHS) {
      try {
        const svgPath = path.join(publicPath, icon.svg_path);
        logger.debug({ svgPath }, 'Attempting to read SVG file');
        svgContent = await fs.readFile(svgPath, 'utf-8');
        break; // If successful, break the loop
      } catch (err) {
        lastError = err;
        logger.debug({ err }, 'Failed to read SVG from path, trying next');
      }
    }

    if (!svgContent) {
      // If all paths failed, try reading from the absolute path as a last resort
      try {
        const absolutePath = path.join('/app/public', icon.svg_path);
        logger.debug({ absolutePath }, 'Attempting to read SVG file from absolute path');
        svgContent = await fs.readFile(absolutePath, 'utf-8');
      } catch (err) {
        logger.error({ err, lastError }, 'All SVG read attempts failed');
        throw lastError || err;
      }
    }

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

/**
 * Filters icons by provider
 *
 * This function filters the provided array of icons to include only those
 * from the specified provider. If the provider is 'all', all icons are returned.
 *
 * @param {Icon[]} icons - The array of icons to filter
 * @param {string} provider - The provider to filter by (e.g., 'azure', 'aws')
 * @returns {Icon[]} An array of icons from the specified provider
 */
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
 * Uses database first, then Redis for persistent caching if available
 */
export async function getIconWithCache(
  provider: string,
  iconName: string
): Promise<Icon | undefined> {
  const cacheKey = `icon:${provider}:${iconName}`;

  // Try Redis cache first if available
  if (redis && CACHE_ENABLED) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug({ provider, iconName }, 'Icon metadata cache hit');
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn({ err, provider, iconName }, 'Redis cache error, continuing to database');
    }
  }

  logger.debug({ provider, iconName }, 'Icon metadata cache miss, querying database');

  try {
    // Try database first
    const icon = await db.getIconByName(provider, iconName);
    
    if (icon) {
      // Cache the result if Redis is available
      if (redis && CACHE_ENABLED) {
        try {
          await redis.set(cacheKey, JSON.stringify(icon), 'EX', ICON_CACHE_TTL);
          logger.debug(
            {
              provider,
              iconName,
              ttl: ICON_CACHE_TTL,
            },
            'Icon metadata cached'
          );
        } catch (cacheErr) {
          logger.warn({ err: cacheErr }, 'Failed to cache icon metadata');
        }
      }
      return icon;
    }

    // If not found in database, try fallback to JSON file
    logger.debug({ provider, iconName }, 'Icon not found in database, trying JSON fallback');
    const icons = await readIconsData();
    const fallbackIcon = icons.find(
      (i: Icon) =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === iconName.toLowerCase()
    );

    if (fallbackIcon && redis && CACHE_ENABLED) {
      try {
        await redis.set(cacheKey, JSON.stringify(fallbackIcon), 'EX', ICON_CACHE_TTL);
      } catch (cacheErr) {
        logger.warn({ err: cacheErr }, 'Failed to cache fallback icon metadata');
      }
    }

    return fallbackIcon;
  } catch (err) {
    logger.error({ err, provider, iconName }, 'Database query failed, falling back to JSON');
    // Final fallback to JSON file read
    const icons = await readIconsData();
    return icons.find(
      (i: Icon) =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === iconName.toLowerCase()
    );
  }
}
