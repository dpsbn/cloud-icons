"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const dompurify_1 = __importDefault(require("dompurify"));
const svgSanitizer_1 = require("../../utils/svgSanitizer");
// Mock dependencies
jest.mock('jsdom');
jest.mock('dompurify');
jest.mock('../../services/logger', () => ({
    createLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
    }),
}));
describe('svgSanitizer', () => {
    let mockSanitize;
    beforeEach(() => {
        // Mock DOMPurify.sanitize
        mockSanitize = jest.fn(content => content);
        dompurify_1.default.mockReturnValue({
            sanitize: mockSanitize,
            setConfig: jest.fn(),
        });
        // Mock JSDOM
        jsdom_1.JSDOM.mockImplementation(() => ({
            window: {},
        }));
    });
    it('should sanitize valid SVG content', () => {
        const svgContent = '<svg width="100" height="100"><rect width="100" height="100" fill="blue" /></svg>';
        mockSanitize.mockReturnValue(svgContent);
        const result = (0, svgSanitizer_1.sanitizeSvg)(svgContent);
        expect(mockSanitize).toHaveBeenCalledWith(svgContent, expect.any(Object));
        expect(result).toBe(svgContent);
    });
    it('should return original content if not SVG', () => {
        const nonSvgContent = '<div>Not an SVG</div>';
        const result = (0, svgSanitizer_1.sanitizeSvg)(nonSvgContent);
        expect(mockSanitize).not.toHaveBeenCalled();
        expect(result).toBe(nonSvgContent);
    });
    it('should handle SVG with script tags', () => {
        const maliciousSvg = '<svg width="100" height="100"><script>alert("XSS")</script></svg>';
        const sanitizedSvg = '<svg width="100" height="100"></svg>';
        mockSanitize.mockReturnValue(sanitizedSvg);
        const result = (0, svgSanitizer_1.sanitizeSvg)(maliciousSvg);
        expect(mockSanitize).toHaveBeenCalledWith(maliciousSvg, expect.any(Object));
        expect(result).toBe(sanitizedSvg);
    });
    it('should handle SVG with event handlers', () => {
        const maliciousSvg = '<svg width="100" height="100" onload="alert(\'XSS\')"><rect width="100" height="100" fill="blue" /></svg>';
        const sanitizedSvg = '<svg width="100" height="100"><rect width="100" height="100" fill="blue" /></svg>';
        mockSanitize.mockReturnValue(sanitizedSvg);
        const result = (0, svgSanitizer_1.sanitizeSvg)(maliciousSvg);
        expect(mockSanitize).toHaveBeenCalledWith(maliciousSvg, expect.any(Object));
        expect(result).toBe(sanitizedSvg);
    });
    it('should return original content if sanitization throws an error', () => {
        const svgContent = '<svg width="100" height="100"><rect width="100" height="100" fill="blue" /></svg>';
        mockSanitize.mockImplementation(() => {
            throw new Error('Sanitization error');
        });
        const result = (0, svgSanitizer_1.sanitizeSvg)(svgContent);
        expect(mockSanitize).toHaveBeenCalledWith(svgContent, expect.any(Object));
        expect(result).toBe(svgContent);
    });
    it('should handle SVG with XML declaration', () => {
        const svgContent = '<?xml version="1.0" encoding="UTF-8"?><svg width="100" height="100"><rect width="100" height="100" fill="blue" /></svg>';
        mockSanitize.mockReturnValue(svgContent);
        const result = (0, svgSanitizer_1.sanitizeSvg)(svgContent);
        expect(mockSanitize).toHaveBeenCalledWith(svgContent, expect.any(Object));
        expect(result).toBe(svgContent);
    });
});
