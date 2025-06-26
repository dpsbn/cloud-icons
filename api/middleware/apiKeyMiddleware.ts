import { NextFunction, Request, Response } from 'express';
import { createLogger } from '../services/logger';
import rateLimit from 'express-rate-limit';

const logger = createLogger('apiKeyMiddleware');

// Define the structure for API keys with their rate limits
export interface ApiKeyConfig {
  key: string;
  name: string;
  rateLimit: {
    standard: number;
    svg: number;
    metadata: number;
  };
}

// Load API keys from environment variables
// Format: KEY1:NAME1:STANDARD_LIMIT1:SVG_LIMIT1:METADATA_LIMIT1,KEY2:NAME2:...
const loadApiKeys = (): ApiKeyConfig[] => {
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
  } catch (err) {
    logger.error({ err }, 'Error parsing API keys');
    return [];
  }
};

// Cache the API keys to avoid parsing them on every request
const apiKeys = loadApiKeys();

// Create a rate limiter for non-API key requests
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // limit each IP to 60 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: async (req: Request) => {
    // Use IP address as the key for rate limiting
    return req.ip || '';
  },
  skip: (req) => {
    // Skip rate limiting if a valid API key is provided
    const apiKey = req.headers['x-api-key'] || (req.query.api_key as string);
    return apiKeys.some(k => k.key === apiKey);
  },
});

// Middleware to extract and validate API key
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get API key from header or query parameter
  const apiKey = req.headers['x-api-key'] || (req.query.api_key as string);

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
  (req as any).apiKeyConfig = apiKeyConfig;

  next();
};
