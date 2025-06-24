import fs from 'fs/promises';
import path from 'path';
import { Icon, IconWithContent } from '../types/icon';

// Constants
const ICONS_FILE_PATH = path.resolve(process.cwd(), 'src/data/icons.json');
const DEFAULT_ICON_SIZE = 24;

export async function readIconsData(): Promise<Icon[]> {
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

export async function getIconContent(icon: Icon, size: number = DEFAULT_ICON_SIZE): Promise<IconWithContent> {
  try {
    const svgPath = path.join(process.cwd(), 'public', icon.svg_path);
    const svgContent = await fs.readFile(svgPath, 'utf-8');
    return {
      ...icon,
      svg_content: modifySvgSize(svgContent, size)
    };
  } catch (err) {
    console.error(`Failed to read SVG for icon ${icon.id}:`, err);
    return {
      ...icon,
      svg_content: '' // Empty string if SVG can't be read
    };
  }
}

export function filterIconsByProvider(icons: Icon[], provider: string): Icon[] {
  if (provider.toLowerCase() === 'all') return icons;
  return icons.filter(icon => icon.provider.toLowerCase() === provider.toLowerCase());
}