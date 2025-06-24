import { Request, Response } from 'express';
import { IconWithContent, PaginatedResponse, ErrorResponse } from '../types/icon';
import { readIconsData, searchIcons, getIconContent, filterIconsByProvider } from '../services/iconService';

// Constants
const DEFAULT_PAGE_SIZE = 24;

export async function getIcons(
  req: Request<
    { provider: string },
    unknown,
    unknown,
    { search?: string; page?: string; pageSize?: string }
  >,
  res: Response<PaginatedResponse<IconWithContent> | ErrorResponse>
) {
  const { provider } = req.params;
  const page = Math.max(1, parseInt(req.query.page ?? '1'));
  const pageSize = Math.max(1, parseInt(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)));
  const { search } = req.query;

  try {
    console.log('Received request:', { provider, search, page, pageSize });

    const allIcons = await readIconsData();
    let filteredIcons = filterIconsByProvider(allIcons, provider);

    // Apply search if provided
    if (search) {
      filteredIcons = searchIcons(filteredIcons, search);
    }

    const start = (page - 1) * pageSize;
    const paginatedIcons = filteredIcons.slice(start, start + pageSize);

    // Load SVG content for paginated icons
    const iconsWithContent = await Promise.all(
      paginatedIcons.map(getIconContent)
    );

    const response = {
      total: filteredIcons.length,
      page,
      pageSize,
      data: iconsWithContent
    };

    console.log(`Returning ${iconsWithContent.length} icons (total: ${filteredIcons.length})`);
    res.json(response);
  } catch (err) {
    console.error('Failed to load icons:', err);
    res.status(500).json({ error: 'Failed to load icons' });
  }
}

export async function getProviders(
  _req: Request,
  res: Response<string[] | ErrorResponse>
) {
  try {
    const icons = await readIconsData();
    const providers = [...new Set(icons.map(icon => icon.provider))];
    res.json(providers);
  } catch (err) {
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

  try {
    const icons = await readIconsData();
    const normalizedIconName = icon_name.replace(/\.[^/.]+$/, '').toLowerCase();

    const icon = icons.find(i =>
      i.provider.toLowerCase() === provider.toLowerCase() &&
      i.id.toLowerCase() === normalizedIconName
    );

    if (!icon) {
      res.status(404).json({ error: 'Icon not found' });
      return;
    }

    if (format === 'json') {
      const iconWithContent = await getIconContent(icon, size);
      res.json(iconWithContent);
      return;
    }

    const iconWithContent = await getIconContent(icon, size);

    if (!iconWithContent.svg_content) {
      res.status(404).json({ error: 'SVG file not found' });
      return;
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(iconWithContent.svg_content);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to load icon' });
  }
}