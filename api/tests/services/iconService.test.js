"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const ioredis_1 = __importDefault(require("ioredis"));
const iconService = __importStar(require("../../services/iconService"));
const svgSanitizer_1 = require("../../utils/svgSanitizer");
// Mock dependencies
jest.mock('fs/promises');
jest.mock('path');
jest.mock('ioredis');
jest.mock('../../services/logger', () => ({
    createLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
    }),
    default: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
    },
}));
jest.mock('../../utils/svgSanitizer', () => ({
    sanitizeSvg: jest.fn(content => content), // By default, return the input unchanged
}));
// Mock data
const mockIcons = [
    {
        id: 'storage-account',
        provider: 'azure',
        icon_name: 'Storage Account',
        description: 'Azure Storage Account',
        tags: ['storage', 'azure', 'cloud'],
        svg_path: 'azure/storage-account.svg',
        png_path: 'azure/storage-account.png',
        license: 'MIT',
    },
    {
        id: 'virtual-machine',
        provider: 'azure',
        icon_name: 'Virtual Machine',
        description: 'Azure Virtual Machine',
        tags: ['compute', 'azure', 'vm'],
        svg_path: 'azure/virtual-machine.svg',
        png_path: 'azure/virtual-machine.png',
        license: 'MIT',
    },
    {
        id: 's3-bucket',
        provider: 'aws',
        icon_name: 'S3 Bucket',
        description: 'AWS S3 Bucket',
        tags: ['storage', 'aws', 'cloud'],
        svg_path: 'aws/s3-bucket.svg',
        png_path: 'aws/s3-bucket.png',
        license: 'MIT',
    },
];
const mockSvgContent = `<svg width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="blue" />
</svg>`;
describe('iconService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset process.env.NODE_ENV
        process.env.NODE_ENV = 'test';
        // Mock path.join to return a predictable path
        path_1.default.join.mockImplementation((...args) => args.join('/'));
        // Mock process.cwd to return a predictable path
        jest.spyOn(process, 'cwd').mockReturnValue('/test');
    });
    describe('readIconsData', () => {
        it('should read icons data from file', async () => {
            // Mock fs.readFile to return mock icons data
            promises_1.default.readFile.mockResolvedValue(JSON.stringify(mockIcons));
            // Mock fs.readdir to return mock directory contents
            promises_1.default.readdir.mockResolvedValue(['data', 'public']);
            const result = await iconService.readIconsData();
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/data/icons.json', 'utf-8');
            expect(result).toEqual(mockIcons);
            expect(result.length).toBe(3);
        });
        it('should throw an error if reading file fails', async () => {
            // Mock fs.readFile to throw an error
            promises_1.default.readFile.mockRejectedValue(new Error('File not found'));
            // Mock fs.readdir to return mock directory contents
            promises_1.default.readdir.mockResolvedValue(['data', 'public']);
            await expect(iconService.readIconsData()).rejects.toThrow('Failed to read icons data: File not found');
        });
    });
    describe('modifySvgSize', () => {
        it('should modify SVG size attributes with viewBox', () => {
            const svgContent = `<svg width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="blue" />
      </svg>`;
            const size = 64;
            const result = iconService.modifySvgSize(svgContent, size);
            expect(result).toContain(`width="${size}"`);
            expect(result).toContain(`height="${size}"`);
            expect(result).toContain('preserveAspectRatio="xMidYMid meet"');
            expect(result).not.toContain('width="100"');
            expect(result).not.toContain('height="100"');
        });
        it('should modify SVG size attributes without viewBox', () => {
            const svgContent = `<svg width="100" height="100">
        <rect width="100" height="100" fill="blue" />
      </svg>`;
            const size = 64;
            const result = iconService.modifySvgSize(svgContent, size);
            expect(result).toContain(`width="${size}"`);
            expect(result).toContain(`height="${size}"`);
            expect(result).not.toContain('preserveAspectRatio="xMidYMid meet"');
            expect(result).not.toContain('width="100"');
            expect(result).not.toContain('height="100"');
        });
        it('should return original content if SVG tag is not found', () => {
            const svgContent = `<div>Not an SVG</div>`;
            const size = 64;
            const result = iconService.modifySvgSize(svgContent, size);
            expect(result).toBe(svgContent);
        });
    });
    describe('searchIcons', () => {
        it('should return all icons if no search query is provided', () => {
            const result = iconService.searchIcons(mockIcons);
            expect(result).toEqual(mockIcons);
            expect(result.length).toBe(3);
        });
        it('should filter icons by name', () => {
            const result = iconService.searchIcons(mockIcons, 'storage');
            expect(result.length).toBe(2);
            expect(result[0].id).toBe('storage-account');
            expect(result[1].id).toBe('s3-bucket');
        });
        it('should filter icons by description', () => {
            const result = iconService.searchIcons(mockIcons, 'virtual');
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('virtual-machine');
        });
        it('should filter icons by id', () => {
            const result = iconService.searchIcons(mockIcons, 's3');
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('s3-bucket');
        });
        it('should filter icons by tags', () => {
            const result = iconService.searchIcons(mockIcons, 'compute');
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('virtual-machine');
        });
        it('should be case insensitive', () => {
            const result = iconService.searchIcons(mockIcons, 'STORAGE');
            expect(result.length).toBe(2);
        });
        it('should trim search query', () => {
            const result = iconService.searchIcons(mockIcons, '  storage  ');
            expect(result.length).toBe(2);
        });
    });
    describe('filterIconsByProvider', () => {
        it('should filter icons by provider', () => {
            const result = iconService.filterIconsByProvider(mockIcons, 'azure');
            expect(result.length).toBe(2);
            expect(result[0].provider).toBe('azure');
            expect(result[1].provider).toBe('azure');
        });
        it('should be case insensitive', () => {
            const result = iconService.filterIconsByProvider(mockIcons, 'AZURE');
            expect(result.length).toBe(2);
            expect(result[0].provider).toBe('azure');
            expect(result[1].provider).toBe('azure');
        });
        it('should return all icons if provider is "all"', () => {
            const result = iconService.filterIconsByProvider(mockIcons, 'all');
            expect(result).toEqual(mockIcons);
            expect(result.length).toBe(3);
        });
    });
    describe('getIconContent', () => {
        beforeEach(() => {
            // Mock fs.readFile to return mock SVG content
            promises_1.default.readFile.mockResolvedValue(mockSvgContent);
            // Mock sanitizeSvg to return the input unchanged
            svgSanitizer_1.sanitizeSvg.mockImplementation(content => content);
        });
        it('should read SVG content from file and resize it', async () => {
            const icon = mockIcons[0];
            const size = 64;
            const result = await iconService.getIconContent(icon, size);
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/public/azure/storage-account.svg', 'utf-8');
            expect(result).toHaveProperty('svg_content');
            expect(result.svg_content).toContain(`width="${size}"`);
            expect(result.svg_content).toContain(`height="${size}"`);
        });
        it('should use default size if not provided', async () => {
            const icon = mockIcons[0];
            const result = await iconService.getIconContent(icon);
            expect(result.svg_content).toContain('width="64"');
            expect(result.svg_content).toContain('height="64"');
        });
        it('should sanitize SVG content', async () => {
            const icon = mockIcons[0];
            const size = 64;
            await iconService.getIconContent(icon, size);
            expect(svgSanitizer_1.sanitizeSvg).toHaveBeenCalledWith(mockSvgContent);
        });
        it('should throw an error if reading file fails', async () => {
            const icon = mockIcons[0];
            const size = 64;
            // Mock fs.readFile to throw an error
            promises_1.default.readFile.mockRejectedValue(new Error('File not found'));
            await expect(iconService.getIconContent(icon, size)).rejects.toThrow('Failed to read SVG file: File not found');
        });
    });
    describe('getIconWithCache', () => {
        let mockRedisGet;
        let mockRedisSet;
        beforeEach(() => {
            // Mock Redis get and set methods
            mockRedisGet = jest.fn();
            mockRedisSet = jest.fn();
            // Mock Redis constructor to return an object with get and set methods
            ioredis_1.default.mockImplementation(() => ({
                get: mockRedisGet,
                set: mockRedisSet,
            }));
            // Mock fs.readFile to return mock icons data
            promises_1.default.readFile.mockResolvedValue(JSON.stringify(mockIcons));
            // Mock fs.readdir to return mock directory contents
            promises_1.default.readdir.mockResolvedValue(['data', 'public']);
        });
        it('should return icon from cache if available', async () => {
            // Mock Redis get to return cached icon
            mockRedisGet.mockResolvedValue(JSON.stringify(mockIcons[0]));
            // Set environment variable to enable caching
            process.env.CACHE_ENABLED = 'true';
            process.env.REDIS_URL = 'redis://localhost:6379';
            const result = await iconService.getIconWithCache('azure', 'storage-account');
            expect(mockRedisGet).toHaveBeenCalledWith('icon:azure:storage-account');
            expect(result).toEqual(mockIcons[0]);
            expect(promises_1.default.readFile).not.toHaveBeenCalled(); // Should not read from file
        });
        it('should read from file and cache if not in cache', async () => {
            // Mock Redis get to return null (not in cache)
            mockRedisGet.mockResolvedValue(null);
            // Set environment variable to enable caching
            process.env.CACHE_ENABLED = 'true';
            process.env.REDIS_URL = 'redis://localhost:6379';
            const result = await iconService.getIconWithCache('azure', 'storage-account');
            expect(mockRedisGet).toHaveBeenCalledWith('icon:azure:storage-account');
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/data/icons.json', 'utf-8');
            expect(mockRedisSet).toHaveBeenCalled(); // Should cache the result
            expect(result).toEqual(mockIcons[0]);
        });
        it('should read from file if Redis is not available', async () => {
            // Set environment variable to disable Redis
            process.env.CACHE_ENABLED = 'true';
            process.env.REDIS_URL = '';
            const result = await iconService.getIconWithCache('azure', 'storage-account');
            expect(mockRedisGet).not.toHaveBeenCalled(); // Should not try to get from Redis
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/data/icons.json', 'utf-8');
            expect(result).toEqual(mockIcons[0]);
        });
        it('should read from file if caching is disabled', async () => {
            // Set environment variable to disable caching
            process.env.CACHE_ENABLED = 'false';
            process.env.REDIS_URL = 'redis://localhost:6379';
            const result = await iconService.getIconWithCache('azure', 'storage-account');
            expect(mockRedisGet).not.toHaveBeenCalled(); // Should not try to get from Redis
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/data/icons.json', 'utf-8');
            expect(result).toEqual(mockIcons[0]);
        });
        it('should fall back to file if Redis throws an error', async () => {
            // Mock Redis get to throw an error
            mockRedisGet.mockRejectedValue(new Error('Redis error'));
            // Set environment variable to enable caching
            process.env.CACHE_ENABLED = 'true';
            process.env.REDIS_URL = 'redis://localhost:6379';
            const result = await iconService.getIconWithCache('azure', 'storage-account');
            expect(mockRedisGet).toHaveBeenCalledWith('icon:azure:storage-account');
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/data/icons.json', 'utf-8');
            expect(result).toEqual(mockIcons[0]);
        });
        it('should return undefined if icon is not found', async () => {
            // Mock Redis get to return null (not in cache)
            mockRedisGet.mockResolvedValue(null);
            // Set environment variable to enable caching
            process.env.CACHE_ENABLED = 'true';
            process.env.REDIS_URL = 'redis://localhost:6379';
            const result = await iconService.getIconWithCache('azure', 'non-existent-icon');
            expect(mockRedisGet).toHaveBeenCalledWith('icon:azure:non-existent-icon');
            expect(promises_1.default.readFile).toHaveBeenCalledWith('/test/data/icons.json', 'utf-8');
            expect(result).toBeUndefined();
        });
    });
});
