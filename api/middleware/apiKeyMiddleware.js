"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyMiddleware = void 0;
const logger_1 = require("../services/logger");
const logger = (0, logger_1.createLogger)('apiKeyMiddleware');
// Load API keys from environment variables
// Format: KEY1:NAME1:STANDARD_LIMIT1:SVG_LIMIT1:METADATA_LIMIT1,KEY2:NAME2:...
const loadApiKeys = () => {
    const apiKeysStr = process.env.API_KEYS || '';
    if (!apiKeysStr) {
        logger.warn('No API keys configured');
        return [];
    }
    try {
        return apiKeysStr.split(',').map(keyStr => {
            const [key, name, standardLimit, svgLimit, metadataLimit] = keyStr.split(':');
            return {
                key,
                name: name || 'Unknown',
                rateLimit: {
                    standard: parseInt(standardLimit || '200', 10),
                    svg: parseInt(svgLimit || '500', 10),
                    metadata: parseInt(metadataLimit || '100', 10),
                },
            };
        });
    }
    catch (err) {
        logger.error({ err }, 'Error parsing API keys');
        return [];
    }
};
// Cache the API keys to avoid parsing them on every request
const apiKeys = loadApiKeys();
// Middleware to extract and validate API key
const apiKeyMiddleware = (req, res, next) => {
    // Get API key from header or query parameter
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) {
        // No API key provided, continue without API key
        // This allows the app to be used without an API token
        logger.debug({ ip: req.ip }, 'No API key provided');
        return next();
    }
    // Find the API key in our list
    const apiKeyConfig = apiKeys.find(k => k.key === apiKey);
    if (!apiKeyConfig) {
        // Invalid API key, log but continue without API key
        logger.warn({ ip: req.ip, apiKey }, 'Invalid API key provided');
        return next();
    }
    // Valid API key, attach it to the request for use by rate limiting middleware
    logger.debug({ ip: req.ip, apiKeyName: apiKeyConfig.name }, 'Valid API key provided');
    req.apiKeyConfig = apiKeyConfig;
    next();
};
exports.apiKeyMiddleware = apiKeyMiddleware;
