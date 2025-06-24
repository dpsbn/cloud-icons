import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// TypeScript interfaces
interface Icon {
  id: string;
  provider: string;
  icon_name: string;
  description: string;
  tags: string[];
  svg_path: string;
  png_path: string;
  license: string;
}

interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

interface ErrorResponse {
  error: string;
}

type IconResponse = Icon | ErrorResponse | string;

// Constants
const ICONS_FILE_PATH = path.resolve(process.cwd(), 'src/data/icons.json');
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ICON_SIZE = 24;

// Helper functions
async function readIconsData(): Promise<Icon[]> {
  try {
    const data = await fs.readFile(ICONS_FILE_PATH, 'utf-8');
    const icons = JSON.parse(data) as Icon[];
    console.log('Icons loaded successfully. Total icons:', icons.length);
    return icons;
  } catch (err) {
    console.error('Error reading icons file:', err);
    throw new Error('Failed to read icons data');
  }
}

function modifySvgSize(svgContent: string, size: number): string {
  const viewBoxRegex = /viewBox=["']([^"']+)["']/i;
  const viewBoxMatch = viewBoxRegex.exec(svgContent);

  if (!viewBoxMatch?.[1]) {
    return svgContent.replace(
      /<svg([^>]*)>/i,
      (_match, attributes) => {
        const cleanedAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/g, '');
        return `<svg${cleanedAttributes} width="${size}" height="${size}">`;
      }
    );
  }


  return svgContent.replace(
    /<svg([^>]*)>/i,
    (_match, attributes) => {
      const cleanedAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/g, '');
      return `<svg${cleanedAttributes} width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet">`;
    }
  );
}

// Route handlers
router.get('/icons', async (_req: Request, res: Response<Icon[] | ErrorResponse>) => {
  try {
    const icons = await readIconsData();
    res.json(icons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load icons' });
  }
});

router.get('/cloud-providers', async (_req: Request, res: Response<string[] | ErrorResponse>) => {
  try {
    const icons = await readIconsData();
    const providers = [...new Set(icons.map(icon => icon.provider))];
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load providers' });
  }
});

router.get('/:provider/icons', async (
  req: Request<{ provider: string }, unknown, unknown, { page?: string; pageSize?: string }>,
  res: Response<PaginatedResponse<Icon> | ErrorResponse>
) => {
  const { provider } = req.params;
  const page = Math.max(1, parseInt(req.query.page ?? '1'));
  const pageSize = Math.max(1, parseInt(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)));

  try {
    const icons = (await readIconsData()).filter(icon =>
      icon.provider.toLowerCase() === provider.toLowerCase()
    );

    const start = (page - 1) * pageSize;
    const paginatedIcons = icons.slice(start, start + pageSize);

    res.json({
      total: icons.length,
      page,
      pageSize,
      data: paginatedIcons
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load icons' });
  }
});

router.get('/:provider/icon/:icon_name', async (
  req: Request<
    { provider: string; icon_name: string },
    unknown,
    unknown,
    { format?: string; size?: string }
  >,
  res: Response<IconResponse>
) => {
  const { provider, icon_name } = req.params;
  const format = req.query.format ?? 'json';
  const size = Math.max(1, parseInt(req.query.size ?? String(DEFAULT_ICON_SIZE)));

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
      res.json(icon);
      return;
    }

    const svgPath = path.join(process.cwd(), 'public', icon.svg_path);

    try {
      const svgContent = await fs.readFile(svgPath, 'utf-8');
      const modifiedSvg = modifySvgSize(svgContent, size);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(modifiedSvg);
    } catch (err) {
      res.status(404).json({ error: 'SVG file not found' });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to load icon' });
  }
});

// Make readIconsData function exportable
export { readIconsData };

export default router;
