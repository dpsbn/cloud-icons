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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIcons = getIcons;
exports.getProviders = getProviders;
exports.getIconByName = getIconByName;
const iconService_1 = require("../services/iconService");
// Constants
const DEFAULT_PAGE_SIZE = 24;
function getIcons(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { provider } = req.params;
        const page = Math.max(1, parseInt((_a = req.query.page) !== null && _a !== void 0 ? _a : '1'));
        const pageSize = Math.max(1, parseInt((_b = req.query.pageSize) !== null && _b !== void 0 ? _b : String(DEFAULT_PAGE_SIZE)));
        const { search } = req.query;
        try {
            console.log('Received request:', { provider, search, page, pageSize });
            const allIcons = yield (0, iconService_1.readIconsData)();
            let filteredIcons = (0, iconService_1.filterIconsByProvider)(allIcons, provider);
            // Apply search if provided
            if (search) {
                filteredIcons = (0, iconService_1.searchIcons)(filteredIcons, search);
            }
            const start = (page - 1) * pageSize;
            const paginatedIcons = filteredIcons.slice(start, start + pageSize);
            // Load SVG content for paginated icons
            const iconsWithContent = yield Promise.all(paginatedIcons.map(iconService_1.getIconContent));
            const response = {
                total: filteredIcons.length,
                page,
                pageSize,
                data: iconsWithContent
            };
            console.log(`Returning ${iconsWithContent.length} icons (total: ${filteredIcons.length})`);
            res.json(response);
        }
        catch (err) {
            console.error('Failed to load icons:', err);
            res.status(500).json({ error: 'Failed to load icons' });
        }
    });
}
function getProviders(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const icons = yield (0, iconService_1.readIconsData)();
            const providers = [...new Set(icons.map(icon => icon.provider))];
            res.json(providers);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to load providers' });
        }
    });
}
function getIconByName(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { provider, icon_name } = req.params;
        const format = (_a = req.query.format) !== null && _a !== void 0 ? _a : 'json';
        const size = Math.max(1, parseInt((_b = req.query.size) !== null && _b !== void 0 ? _b : '24'));
        try {
            const icons = yield (0, iconService_1.readIconsData)();
            const normalizedIconName = icon_name.replace(/\.[^/.]+$/, '').toLowerCase();
            const icon = icons.find(i => i.provider.toLowerCase() === provider.toLowerCase() &&
                i.id.toLowerCase() === normalizedIconName);
            if (!icon) {
                res.status(404).json({ error: 'Icon not found' });
                return;
            }
            if (format === 'json') {
                const iconWithContent = yield (0, iconService_1.getIconContent)(icon, size);
                res.json(iconWithContent);
                return;
            }
            const iconWithContent = yield (0, iconService_1.getIconContent)(icon, size);
            if (!iconWithContent.svg_content) {
                res.status(404).json({ error: 'SVG file not found' });
                return;
            }
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(iconWithContent.svg_content);
        }
        catch (err) {
            console.error('Error:', err);
            res.status(500).json({ error: 'Failed to load icon' });
        }
    });
}
