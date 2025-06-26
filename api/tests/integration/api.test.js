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
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../index");
const iconService = __importStar(require("../../services/iconService"));
// Mock dependencies
jest.mock('../../services/iconService');
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
const mockIconWithContent = {
    ...mockIcons[0],
    svg_content: '<svg width="64" height="64"><rect width="64" height="64" fill="blue" /></svg>',
};
describe('API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock readIconsData to return mock icons
        iconService.readIconsData.mockResolvedValue(mockIcons);
        // Mock getIconContent to return mock icon with content
        iconService.getIconContent.mockResolvedValue(mockIconWithContent);
        // Mock searchIcons to return filtered icons
        iconService.searchIcons.mockImplementation((icons, query) => {
            if (!query) {
                return icons;
            }
            return icons.filter((icon) => icon.icon_name.toLowerCase().includes(query.toLowerCase()) ||
                icon.description.toLowerCase().includes(query.toLowerCase()) ||
                icon.id.toLowerCase().includes(query.toLowerCase()) ||
                icon.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())));
        });
        // Mock filterIconsByProvider to return filtered icons
        iconService.filterIconsByProvider.mockImplementation((icons, provider) => {
            if (provider.toLowerCase() === 'all') {
                return icons;
            }
            return icons.filter((icon) => icon.provider.toLowerCase() === provider.toLowerCase());
        });
    });
    describe('GET /api/cloud-providers', () => {
        it('should return a list of cloud providers', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/cloud-providers');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(['azure', 'aws']);
            expect(iconService.readIconsData).toHaveBeenCalled();
        });
        it('should handle errors', async () => {
            // Mock readIconsData to throw an error
            iconService.readIconsData.mockRejectedValue(new Error('Failed to read icons data'));
            const response = await (0, supertest_1.default)(index_1.app).get('/api/cloud-providers');
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/:provider/icons', () => {
        it('should return a list of icons for a provider', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icons');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('pageSize');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.length).toBe(2); // 2 azure icons
            expect(iconService.readIconsData).toHaveBeenCalled();
            expect(iconService.filterIconsByProvider).toHaveBeenCalledWith(mockIcons, 'azure');
        });
        it('should support pagination', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icons?page=1&pageSize=1');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total', 2); // 2 azure icons
            expect(response.body).toHaveProperty('page', 1);
            expect(response.body).toHaveProperty('pageSize', 1);
            expect(response.body.data.length).toBe(1); // 1 icon per page
        });
        it('should support searching', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icons?search=storage');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total', 1); // 1 azure icon with 'storage'
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].id).toBe('storage-account');
            expect(iconService.searchIcons).toHaveBeenCalled();
        });
        it('should handle errors', async () => {
            // Mock readIconsData to throw an error
            iconService.readIconsData.mockRejectedValue(new Error('Failed to read icons data'));
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icons');
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/:provider/icon/:icon_name', () => {
        it('should return an icon in JSON format', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icon/storage-account?format=json');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', 'storage-account');
            expect(response.body).toHaveProperty('svg_content');
            expect(iconService.readIconsData).toHaveBeenCalled();
            expect(iconService.getIconContent).toHaveBeenCalled();
        });
        it('should return an icon in SVG format', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icon/storage-account?format=svg');
            expect(response.status).toBe(200);
            expect(response.header['content-type']).toBe('image/svg+xml');
            expect(response.text).toBe(mockIconWithContent.svg_content);
        });
        it('should support specifying icon size', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icon/storage-account?size=32');
            expect(response.status).toBe(200);
            expect(iconService.getIconContent).toHaveBeenCalledWith(expect.anything(), 32);
        });
        it('should return 404 if icon is not found', async () => {
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icon/non-existent-icon');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Icon not found');
        });
        it('should handle errors', async () => {
            // Mock readIconsData to throw an error
            iconService.readIconsData.mockRejectedValue(new Error('Failed to read icons data'));
            const response = await (0, supertest_1.default)(index_1.app).get('/api/azure/icon/storage-account');
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
});
