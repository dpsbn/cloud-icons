"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeSvg = sanitizeSvg;
const jsdom_1 = require("jsdom");
const dompurify_1 = __importDefault(require("dompurify"));
const logger_1 = require("../services/logger");
const logger = (0, logger_1.createLogger)('svgSanitizer');
// Create a DOM environment for DOMPurify
const window = new jsdom_1.JSDOM('').window;
const DOMPurify = (0, dompurify_1.default)(window);
// Configure DOMPurify for SVG sanitization
DOMPurify.setConfig({
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: ['viewBox', 'preserveAspectRatio'],
    FORBID_ATTR: [
        'onerror',
        'onload',
        'onmouseover',
        'onmouseout',
        'onmousemove',
        'onmousedown',
        'onmouseup',
        'onclick',
        'ondblclick',
        'onkeydown',
        'onkeypress',
        'onkeyup',
        'onunload',
        'onabort',
        'onerror',
        'onresize',
        'onscroll',
        'onselect',
        'onsubmit',
        'onreset',
        'onchange',
        'onfocus',
        'onblur',
        'oncontextmenu',
        'ontoggle',
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
});
/**
 * Sanitizes SVG content to prevent XSS attacks
 * @param svgContent - The SVG content to sanitize
 * @returns The sanitized SVG content
 */
function sanitizeSvg(svgContent) {
    try {
        // Check if the content is actually SVG
        if (!svgContent.trim().startsWith('<svg') && !svgContent.includes('<svg')) {
            logger.warn('Content does not appear to be SVG');
            return svgContent; // Return original if not SVG
        }
        // Sanitize the SVG content
        const sanitized = DOMPurify.sanitize(svgContent, {
            USE_PROFILES: { svg: true },
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
            RETURN_TRUSTED_TYPE: false,
        });
        // Log if content was modified
        if (sanitized !== svgContent) {
            logger.info('SVG content was sanitized (potentially unsafe content removed)');
        }
        return sanitized;
    }
    catch (err) {
        logger.error({ err }, 'Error sanitizing SVG content');
        return svgContent; // Return original on error
    }
}
