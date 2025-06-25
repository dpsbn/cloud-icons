"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readIconsData = readIconsData;
exports.modifySvgSize = modifySvgSize;
exports.searchIcons = searchIcons;
exports.getIconContent = getIconContent;
exports.filterIconsByProvider = filterIconsByProvider;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// Constants
const ICONS_FILE_PATH = path_1.default.resolve(process.cwd(), 'src/data/icons.json');
const DEFAULT_ICON_SIZE = 24;
function readIconsData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield promises_1.default.readFile(ICONS_FILE_PATH, 'utf-8');
            const icons = JSON.parse(data);
            console.log('Icons loaded successfully. Total icons:', icons.length);
            return icons;
        }
        catch (err) {
            console.error('Error reading icons file:', err);
            throw new Error('Failed to read icons data');
        }
    });
}
function modifySvgSize(svgContent, size) {
    const viewBoxRegex = /viewBox=["']([^"']+)["']/i;
    const viewBoxMatch = viewBoxRegex.exec(svgContent);
    if (!(viewBoxMatch === null || viewBoxMatch === void 0 ? void 0 : viewBoxMatch[1])) {
        return svgContent.replace(/<svg([^>]*)>/i, (_match, attributes) => {
            const cleanedAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/g, '');
            return `<svg${cleanedAttributes} width="${size}" height="${size}">`;
        });
    }
    return svgContent.replace(/<svg([^>]*)>/i, (_match, attributes) => {
        const cleanedAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/g, '');
        return `<svg${cleanedAttributes} width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet">`;
    });
}
function searchIcons(icons, searchQuery) {
    if (!searchQuery)
        return icons;
    const query = searchQuery.toLowerCase().trim();
    console.log(`Searching for: "${query}"`);
    const filtered = icons.filter(icon => {
        const matches = icon.icon_name.toLowerCase().includes(query) ||
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
function getIconContent(icon_1) {
    return __awaiter(this, arguments, void 0, function* (icon, size = DEFAULT_ICON_SIZE) {
        try {
            const svgPath = path_1.default.join(process.cwd(), 'public', icon.svg_path);
            const svgContent = yield promises_1.default.readFile(svgPath, 'utf-8');
            return Object.assign(Object.assign({}, icon), { svg_content: modifySvgSize(svgContent, size) });
        }
        catch (err) {
            console.error(`Failed to read SVG for icon ${icon.id}:`, err);
            return Object.assign(Object.assign({}, icon), { svg_content: '' // Empty string if SVG can't be read
             });
        }
    });
}
function filterIconsByProvider(icons, provider) {
    if (provider.toLowerCase() === 'all')
        return icons;
    return icons.filter(icon => icon.provider.toLowerCase() === provider.toLowerCase());
}
