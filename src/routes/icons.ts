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

interface IconWithContent extends Icon {
  svg_content: string;
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
const DEFAULT_PAGE_SIZE = 24;
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

function searchIcons(icons: Icon[], searchQuery?: string): Icon[] {
  if (!searchQuery) return icons;

  const query = searchQuery.toLowerCase().trim();
  console.log(`Searching for: "${query}"`);

  const filtered = icons.filter(icon => {
    const matches =
      icon.icon_name.toLowerCase().includes(query) ||
      icon.description.toLowerCase().includes(query) ||
      icon.id.toLowerCase().includes(query) ||
      icon.tags.some(tag => tag.toLowerCase().includes(query));

    if (matches) {
      console.log(`Match found: ${icon.icon_name} (${icon.id})`);
    }
    return matches;
  });

  console.log(`Found ${filtered.length} matches`);
  return filtered;
}

// Helper function to read SVG content
async function getIconContent(icon: Icon): Promise<IconWithContent> {
  try {
    const svgPath = path.join(process.cwd(), 'public', icon.svg_path);
    const svgContent = await fs.readFile(svgPath, 'utf-8');
    return {
      ...icon,
      svg_content: modifySvgSize(svgContent, DEFAULT_ICON_SIZE)
    };
  } catch (err) {
    console.error(`Failed to read SVG for icon ${icon.id}:`, err);
    return {
      ...icon,
      svg_content: '' // Empty string if SVG can't be read
    };
  }
}

// Route handlers
router.get('/:provider/icons', async (
  req: Request<
    { provider: string },
    unknown,
    unknown,
    { search?: string; page?: string; pageSize?: string }
  >,
  res: Response<PaginatedResponse<IconWithContent> | ErrorResponse>
) => {
  const { provider } = req.params;
  const page = Math.max(1, parseInt(req.query.page ?? '1'));
  const pageSize = Math.max(1, parseInt(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)));
  const { search } = req.query;

  try {
    console.log('Received request:', { provider, search, page, pageSize });

    const allIcons = await readIconsData();

    // Filter by provider first (unless it's 'all')
    let filteredIcons = allIcons;
    if (provider.toLowerCase() !== 'all') {
      filteredIcons = allIcons.filter(icon =>
        icon.provider.toLowerCase() === provider.toLowerCase()
      );
    }

    // Then apply search if provided
    if (search) {
      const query = search.toLowerCase().trim();
      console.log(`Searching for: "${query}"`);

      filteredIcons = filteredIcons.filter(icon => {
        const matches =
          icon.icon_name.toLowerCase().includes(query) ||
          icon.description.toLowerCase().includes(query) ||
          icon.id.toLowerCase().includes(query) ||
          icon.tags.some(tag => tag.toLowerCase().includes(query));

        if (matches) {
          console.log(`Match found: ${icon.icon_name} (${icon.id})`);
        }
        return matches;
      });

      console.log(`Found ${filteredIcons.length} matches`);
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
