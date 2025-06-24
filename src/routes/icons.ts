import { Router, Request, Response, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// TypeScript types
export interface Icon {
  id: string;
  provider: string;
  icon_name: string;
  description: string;
  tags: string[];
  svg_path: string;
  png_path: string;
  license: string;
}

export interface PaginatedIcons {
  total: number;
  page: number;
  pageSize: number;
  icons: Icon[];
}

const iconsFilePath = path.resolve(process.cwd(), 'src/data/icons.json');

function readIconsData(): Icon[] {
  console.log('Reading icons from:', iconsFilePath);
  try {
    const data = fs.readFileSync(iconsFilePath, 'utf-8');
    const icons = JSON.parse(data);
    console.log('Icons loaded successfully. Total icons:', icons.length);
    return icons;
  } catch (err) {
    console.error('Error reading icons file:', err);
    return [];
  }
}

function modifySvgSize(svgContent: string, size: number): string {
  // Extract the original viewBox values
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
  if (!viewBoxMatch || !viewBoxMatch[1]) {
    // If no viewBox found, just set width and height
    return svgContent.replace(
      /<svg([^>]*)>/i,
      (match, attributes) => {
        const cleanedAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/g, '');
        return `<svg${cleanedAttributes} width="${size}" height="${size}">`;
      }
    );
  }

  // Get the original viewBox values
  const viewBox = viewBoxMatch[1];
  const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);

  // Calculate the scaling factor to maintain aspect ratio
  const scale = size / Math.max(vbWidth, vbHeight);
  const width = Math.round(vbWidth * scale);
  const height = Math.round(vbHeight * scale);

  // Update the SVG attributes while preserving the viewBox
  const modifiedSvg = svgContent.replace(
    /<svg([^>]*)>/i,
    (match, attributes) => {
      // Remove existing width and height attributes
      const cleanedAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/g, '');
      return `<svg${cleanedAttributes} width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet">`;
    }
  );

  return modifiedSvg;
}

// GET /icons - all icons
router.get('/icons', (_, res: Response<Icon[]>) => {
  try {
    const icons = readIconsData();
    res.json(icons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load icons' } as any);
  }
});

// GET /cloud-providers - list unique providers
router.get('/cloud-providers', (_, res: Response<string[]>) => {
  try {
    const icons = readIconsData();
    const providers = Array.from(new Set(icons.map(icon => icon.provider)));
    res.json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load providers' } as any);
  }
});

const iconHandler: RequestHandler<{ provider: string }> = (req, res) => {
  const { page = '1', pageSize = '10' } = req.query as { page?: string; pageSize?: string };
  const { provider } = req.params;
  if (!provider) {
    res.status(400).json({ error: 'provider param is required' } as any);
    return;
  }
  try {
    const icons = readIconsData().filter(icon => icon.provider === provider);
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 10;
    const start = (p - 1) * ps;
    const paginated = icons.slice(start, start + ps);
    res.json({
      total: icons.length,
      page: p,
      pageSize: ps,
      icons: paginated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load icons' } as any);
  }
};

// GET /:provider/icons?page=1&pageSize=10
router.get('/:provider/icons', iconHandler);

// GET /:provider/icon/:icon_name
router.get(
  '/:provider/icon/:icon_name',
  (req: Request<{ provider: string; icon_name: string }>, res: Response) => {
    const { provider, icon_name } = req.params;
    const format = req.query.format as string || 'json';
    const size = parseInt(req.query.size as string) || 24; // Default size is 24px

    if (!provider || !icon_name) {
      res.status(400).json({ error: 'provider and icon_name params are required' });
      return;
    }

    try {
      const icons = readIconsData();
      const normalizedIconName = icon_name.replace(/\.[^/.]+$/, '').toLowerCase();

      const icon = icons.find(i =>
        i.provider.toLowerCase() === provider.toLowerCase() &&
        i.id.toLowerCase() === normalizedIconName
      );

      if (!icon) {
        res.status(404).json({ error: 'Icon not found' });
        return;
      }

      // If format=json, return JSON response
      if (format === 'json') {
        res.json(icon);
      } else {
        // Serve the SVG file with specified size
        const svgPath = path.join(process.cwd(), 'public', icon.svg_path);
        if (fs.existsSync(svgPath)) {
          const svgContent = fs.readFileSync(svgPath, 'utf-8');
          const modifiedSvg = modifySvgSize(svgContent, size);

          res.setHeader('Content-Type', 'image/svg+xml');
          res.send(modifiedSvg);
        } else {
          res.status(404).json({ error: 'SVG file not found' });
        }
      }
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Failed to load icon' });
    }
  }
);

export default router;
