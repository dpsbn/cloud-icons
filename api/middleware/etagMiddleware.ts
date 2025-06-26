import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { createLogger } from '../services/logger';

const logger = createLogger('etagMiddleware');

/**
 * Generates an ETag for the response body
 * @param body - The response body to generate an ETag for
 * @returns The generated ETag
 */
function generateETag(body: any): string {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  return crypto.createHash('md5').update(bodyString).digest('hex').slice(0, 16); // Use first 16 chars of MD5 hash
}

/**
 * Middleware to add ETag support to responses
 * This middleware:
 * 1. Captures the original res.json and res.send methods
 * 2. Adds ETag headers to responses
 * 3. Handles conditional requests (If-None-Match)
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  // Save original methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override res.json method
  res.json = function (body: any): Response {
    // Generate ETag for the response
    const etag = generateETag(body);

    // Set ETag header
    res.setHeader('ETag', `"${etag}"`);

    // Check if client sent If-None-Match header
    const ifNoneMatch = req.headers['if-none-match'];

    if (ifNoneMatch === `"${etag}"`) {
      // Resource hasn't changed, return 304 Not Modified
      logger.debug(
        {
          path: req.path,
          etag,
          method: req.method,
        },
        'ETag match, returning 304'
      );

      res.status(304).end();
      return res;
    }

    // Resource has changed or no If-None-Match header, return full response
    logger.debug(
      {
        path: req.path,
        etag,
        method: req.method,
        ifNoneMatch: ifNoneMatch || 'none',
      },
      'ETag generated'
    );

    return originalJson.call(this, body);
  };

  // Override res.send method for non-JSON responses (like SVG)
  res.send = function (body: any): Response {
    // Only add ETag for string responses (like SVG)
    if (typeof body === 'string') {
      const etag = generateETag(body);
      res.setHeader('ETag', `"${etag}"`);

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === `"${etag}"`) {
        logger.debug(
          {
            path: req.path,
            etag,
            contentType: res.get('Content-Type'),
          },
          'ETag match for binary/text content, returning 304'
        );

        res.status(304).end();
        return res;
      }

      logger.debug(
        {
          path: req.path,
          etag,
          contentType: res.get('Content-Type'),
        },
        'ETag generated for binary/text content'
      );
    }

    return originalSend.call(this, body);
  };

  next();
}
