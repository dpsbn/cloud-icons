import { Request, Response } from 'express';
import { ErrorResponse, IconWithContent, PaginatedResponse } from '../types/icon';
import {
  filterIconsByProvider,
  getIconContent,
  readIconsData,
  searchIcons,
} from '../services/iconService';
import { createLogger } from '../services/logger';

// Create a namespaced logger for this controller
const logger = createLogger('iconController');

// Constants
const DEFAULT_PAGE_SIZE = 24;

export async function getIcons(
  req: Request<
    { provider: string },
    unknown,
    unknown,
    { search?: string; page?: string; pageSize?: string; size?: string }
  >,
  res: Response<PaginatedResponse<IconWithContent> | ErrorResponse>
) {
  const { provider } = req.params;
  const page = Math.max(1, parseInt(req.query.page ?? '1'));
  const pageSize = Math.max(1, parseInt(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)));
  const size = Math.max(1, parseInt(req.query.size ?? '64'));
  const { search } = req.query;

  try {
    logger.info(
      {
        provider,
        search,
        page,
        pageSize,
        size,
        ip: req.ip,
      },
      'Received request for icons'
    );

    const allIcons = await readIconsData();
    let filteredIcons = filterIconsByProvider(allIcons, provider);

    // Apply search if provided
    if (search) {
      filteredIcons = searchIcons(filteredIcons, search);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedIcons = filteredIcons.slice(start, end);

    // Load SVG content for paginated icons
    const iconsWithContent = await Promise.all(
      paginatedIcons.map(icon => getIconContent(icon, size))
    );

    const response = {
      total: filteredIcons.length,
      page,
      pageSize,
      data: iconsWithContent,
    };

    logger.info(
      {
        count: iconsWithContent.length,
        total: filteredIcons.length,
        provider,
      },
      'Returning icons'
    );

    res.json(response);
  } catch (err) {
    logger.error({ err, provider }, 'Failed to load icons');
    res.status(500).json({ error: 'Failed to load icons' });
  }
}

export async function getProviders(req: Request, res: Response<string[] | ErrorResponse>) {
  try {
    logger.info({ ip: req.ip }, 'Request for providers');
    const icons = await readIconsData();
    const providers = [...new Set(icons.map(icon => icon.provider))];
    logger.info({ count: providers.length }, 'Returning providers');
    res.json(providers);
  } catch (err) {
    logger.error({ err }, 'Failed to load providers');
    res.status(500).json({ error: 'Failed to load providers' });
  }
}

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
    const icons = await readIconsData();
    const normalizedIconName = icon_name.replace(/\.[^/.]+$/, '').toLowerCase();

    const icon = icons.find(
      i =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === normalizedIconName
    );

    if (!icon) {
      logger.warn({ provider, icon_name }, 'Icon not found');
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
        'Returning icon in JSON format'
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
      'Returning icon in SVG format'
    );
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(iconWithContent.svg_content);
  } catch (err) {
    logger.error({ err, provider, icon_name }, 'Failed to load icon');
    res.status(500).json({ error: 'Failed to load icon' });
  }
}
