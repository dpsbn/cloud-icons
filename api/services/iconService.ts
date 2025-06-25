import fs from 'fs/promises';
import path from 'path';
import { Icon, IconWithContent } from '../types/icon';

// Constants
const ICONS_FILE_PATH = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'data', 'icons.json')
  : path.join(process.cwd(), 'data', 'icons.json');

const DEFAULT_ICON_SIZE = 24;

export async function readIconsData(): Promise<Icon[]> {
  try {
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('Attempting to read icons from:', ICONS_FILE_PATH);

    // List contents of the current directory
    try {
      const contents = await fs.readdir(process.cwd());
      console.log('Contents of cwd:', contents);

      const dataContents = await fs.readdir(path.join(process.cwd(), 'data'));
      console.log('Contents of data directory:', dataContents);
    } catch (e) {
      console.error('Error listing directory contents:', e);
    }

    const data = await fs.readFile(ICONS_FILE_PATH, 'utf-8');
    const icons = JSON.parse(data) as Icon[];
    console.log('Icons loaded successfully. Total icons:', icons.length);
    return icons;
  } catch (err: any) {
    console.error('Error reading icons file:', err);
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);
    throw new Error(`Failed to read icons data: ${err.message}`);
  }
}

export function modifySvgSize(svgContent: string, size: number): string {
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

export function searchIcons(icons: Icon[], searchQuery?: string): Icon[] {
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

export async function getIconContent(icon: Icon, size: number = 64): Promise<IconWithContent> {
  try {
    const svgPath = path.join(process.cwd(), 'public', icon.svg_path);
    console.log('Attempting to read SVG from:', svgPath);
    const svgContent = await fs.readFile(svgPath, 'utf-8');

    // Add width and height attributes to the SVG
    const sizedSvgContent = svgContent.replace(/<svg/, `<svg width="${size}" height="${size}"`);

    return {
      ...icon,
      svg_content: sizedSvgContent
    };
  } catch (err: any) {
    console.error('Error reading SVG file:', err);
    throw new Error(`Failed to read SVG file: ${err.message}`);
  }
}

export function filterIconsByProvider(icons: Icon[], provider: string): Icon[] {
  if (provider.toLowerCase() === 'all') return icons;
  return icons.filter(icon => icon.provider.toLowerCase() === provider.toLowerCase());
}