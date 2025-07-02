import { Request, Response } from 'express';
import { ErrorResponse, IconWithContent, PaginatedResponse } from '../types/icon';
import {
  getIconContent,
  getIconWithCache,
} from '../services/iconService';
import * as db from '../services/db';
import { createLogger } from '../services/logger';

// Create a namespaced logger for this controller
const logger = createLogger('iconController');

// Constants
const DEFAULT_PAGE_SIZE = 24;

/**
 * Get paginated icons for a specific provider with optional search and filtering
 *
 * This endpoint returns a paginated list of icons for the specified provider.
 * It supports searching by name, description, id, or tags, and can resize icons to the specified size.
 *
 * @param {Request} req - Express request object with provider parameter and optional query parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} A promise that resolves when the response is sent
 */
export async function getIcons(
  req: Request<
    { provider: string },
    unknown,
    unknown,
    { search?: string; page?: string; pageSize?: string; size?: string; tags?: string }
  >,
  res: Response<PaginatedResponse<IconWithContent> | ErrorResponse>
) {
  const { provider } = req.params;
  const page = Math.max(1, parseInt(req.query.page ?? '1'));
  const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE))));
  const size = Math.max(1, parseInt(req.query.size ?? '64'));
  const { search, tags } = req.query;
  const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;

  try {
    logger.info(
      {
        provider,
        search,
        tags: tagsArray,
        page,
        pageSize,
        size,
        ip: req.ip,
      },
      'Received request for icons'
    );

    // Use database service to get icons with pagination and filtering
    const { icons, total } = await db.getIcons(provider, search, page, pageSize, tagsArray);

    // Load SVG content for the icons
    const iconsWithContent = await Promise.all(
      icons.map(icon => getIconContent(icon, size))
    );

    const response = {
      total,
      page,
      pageSize,
      data: iconsWithContent,
    };

    logger.info(
      {
        count: iconsWithContent.length,
        total,
        provider,
      },
      'Returning icons from database'
    );

    res.json(response);
  } catch (err) {
    logger.error({ err, provider }, 'Failed to load icons from database');
    res.status(500).json({ error: 'Failed to load icons' });
  }
}

/**
 * Get a list of all available cloud providers
 *
 * This endpoint returns a list of all cloud providers that have icons available.
 * The list is retrieved from the database.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} A promise that resolves when the response is sent
 */
export async function getProviders(req: Request, res: Response<string[] | ErrorResponse>) {
  try {
    logger.info({ ip: req.ip }, 'Request for providers');
    const providers = await db.getProviders();
    logger.info({ count: providers.length, providers }, 'Returning providers from database');
    res.json(providers);
  } catch (err) {
    logger.error({ err }, 'Failed to load providers from database');
    res.status(500).json({ error: 'Failed to load providers' });
  }
}

/**
 * Get a specific icon by name from a provider
 *
 * This endpoint returns a specific icon in either JSON or SVG format.
 * The icon can be resized to the specified size.
 *
 * @param {Request} req - Express request object with provider and icon_name parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} A promise that resolves when the response is sent
 */
export async function getIconByName(
  req: Request<
    { provider: string; icon_name: string },
    unknown,
    unknown,
    { format?: string; size?: string }
  >,
  res: Response
) {
  const { provider, icon_name } = req.params;
  const format = req.query.format ?? 'json';
  const size = Math.max(1, parseInt(req.query.size ?? '24'));

  logger.info(
    {
      provider,
      icon_name,
      format,
      size,
      ip: req.ip,
    },
    'Request for specific icon'
  );

  try {
    const normalizedIconName = icon_name.replace(/\.[^/.]+$/, '').toLowerCase();

    // Use database service with caching to get icon
    const icon = await getIconWithCache(provider, normalizedIconName);

    if (!icon) {
      logger.warn({ provider, icon_name, normalizedIconName }, 'Icon not found in database');
      res.status(404).json({ error: 'Icon not found' });
      return;
    }

    if (format === 'json') {
      const iconWithContent = await getIconContent(icon, size);
      logger.info(
        {
          provider,
          icon_name,
          format,
        },
        'Returning icon in JSON format from database'
      );
      res.json(iconWithContent);
      return;
    }

    const iconWithContent = await getIconContent(icon, size);

    if (!iconWithContent.svg_content) {
      logger.warn(
        {
          provider,
          icon_name,
          svgPath: icon.svg_path,
        },
        'SVG file not found'
      );
      res.status(404).json({ error: 'SVG file not found' });
      return;
    }

    logger.info(
      {
        provider,
        icon_name,
        format: 'svg',
        size,
      },
      'Returning icon in SVG format from database'
    );
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(iconWithContent.svg_content);
  } catch (err) {
    logger.error({ err, provider, icon_name }, 'Failed to load icon from database');
    res.status(500).json({ error: 'Failed to load icon' });
  }
}

/**
 * Get all available tags
 */
export async function getTags(req: Request, res: Response<string[] | ErrorResponse>) {
  try {
    logger.info({ ip: req.ip }, 'Request for tags');
    const tags = await db.getTags();
    logger.info({ count: tags.length }, 'Returning tags from database');
    res.json(tags);
  } catch (err) {
    logger.error({ err }, 'Failed to load tags from database');
    res.status(500).json({ error: 'Failed to load tags' });
  }
}

/**
 * Get database health status
 */
export async function getHealth(req: Request, res: Response) {
  try {
    const health = await db.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    logger.info({ health }, 'Health check completed');
    res.status(statusCode).json(health);
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
}

/**
 * Get database statistics
 */
export async function getStats(req: Request, res: Response) {
  try {
    logger.info({ ip: req.ip }, 'Request for database statistics');
    const stats = await db.getStats();
    logger.info({ stats }, 'Returning database statistics');
    res.json(stats);
  } catch (err) {
    logger.error({ err }, 'Failed to load database statistics');
    res.status(500).json({ error: 'Failed to load statistics' });
  }
}
