import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import iconsRouter from './routes/icons';
import { readIconsData } from './services/iconService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { etagMiddleware } from './middleware/etagMiddleware';
import { apiKeyMiddleware } from './middleware/apiKeyMiddleware';
import logger from './services/logger';
import Redis from 'ioredis';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3002;

// Serve static files from the root public directory
app.use('/icons', express.static(path.join(process.cwd(), '..', 'public', 'icons')));

// Add JSON body parser middleware
app.use(express.json());

// Add compression middleware
app.use(compression());

// Security middleware with enhanced headers
app.use(
  helmet({
    xContentTypeOptions: true, // instead of contentTypeNosniff
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // Prevents clickjacking
      },
      reportOnly: false,
    },

    // HTTP Strict Transport Security
    // Only enable HSTS in production to avoid issues with local development
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 15552000, // 180 days in seconds
            includeSubDomains: true,
            preload: true,
          }
        : false,

    // X-Content-Type-Options to prevent MIME type sniffing
    // contentTypeNosniff: true,

    // X-Frame-Options to prevent clickjacking
    frameguard: {
      action: 'deny',
    },

    // X-XSS-Protection as an additional layer of XSS protection
    xssFilter: true,

    // Disable X-Powered-By header to hide Express
    hidePoweredBy: true,

    // Referrer Policy to control the Referer header
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // Permissions Policy is not supported in helmet v8.1.0
    // If needed, it can be implemented separately using a custom middleware

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Set to false to allow loading resources from different origins

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: 'same-origin' },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: 'same-site' },

    // Origin-Agent-Cluster
    originAgentCluster: true,
  })
);

// Apply API key middleware before rate limiting
app.use(apiKeyMiddleware);

// Rate limiting with API key support
const iconRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: req => {
    // Check if request has a valid API key with custom rate limits
    const apiKeyConfig = (req as any).apiKeyConfig;

    if (apiKeyConfig) {
      // Use the rate limits from the API key configuration
      if (req.path.endsWith('.svg')) {
        return apiKeyConfig.rateLimit.svg;
      }
      if (req.path === '/icons' || req.path.includes('/icons')) {
        return apiKeyConfig.rateLimit.metadata;
      }
      return apiKeyConfig.rateLimit.standard;
    }

    // Default rate limits for requests without API key
    if (req.path.endsWith('.svg')) {
      return 500;
    } // More lenient for SVGs
    if (req.path === '/icons' || req.path.includes('/icons')) {
      return 100;
    } // Stricter for metadata
    return 200; // Default limit
  },
  keyGenerator: req => {
    // Include API key in the rate limit key if available
    const apiKey = (req as any).apiKeyConfig?.key || '';
    return apiKey ? `${apiKey}:${req.path}` : `${req.ip}:${req.path}`;
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Add custom message for rate limited requests
  message: (req: Request, res: Response) => {
    const apiKeyConfig = (req as any).apiKeyConfig;
    const isApiKey = !!apiKeyConfig;

    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        apiKey: isApiKey ? apiKeyConfig.name : 'none',
      },
      'Rate limit exceeded'
    );

    return {
      status: 'error',
      message: 'Too many requests, please try again later',
      apiKeyUsed: isApiKey,
      retryAfter: res.getHeader('Retry-After'),
    };
  },
});
app.use(iconRateLimit);

// Mount routes
app.use('/', iconsRouter);

// CORS configuration with enhanced security
app.use(
  cors({
    // Only allow specific origins defined in the environment variable
    origin: (origin, callback) => {
      // Get allowed origins from environment variable
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

      // Allow requests with no origin (like mobile apps, curl requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all origins if no specific origins are configured
      if (process.env.NODE_ENV === 'development' && allowedOrigins.length === 0) {
        logger.warn({ origin }, 'CORS: All origins allowed in development mode');
        return callback(null, true);
      }

      // In production, require specific origins
      if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
        logger.warn('CORS: No allowed origins configured in production mode');
        // Default to a restrictive policy in production if no origins are specified
        allowedOrigins.push('https://cloudicons.example.com');
      }

      // Check if the request origin is in the allowed list
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        logger.debug({ origin }, 'CORS: Origin allowed');
        return callback(null, true);
      }

      // Origin not allowed
      logger.warn({ origin, allowedOrigins }, 'CORS: Origin not allowed');
      return callback(new Error('CORS: Origin not allowed'), false);
    },
    methods: ['GET'], // Only allow GET requests
    maxAge: 86400, // 24 hours cache for preflight requests
    credentials: false, // Don't allow cookies
    allowedHeaders: ['Content-Type', 'X-API-Key'], // Only allow these headers
    exposedHeaders: [
      'Content-Length',
      'ETag',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ], // Expose these headers to clients
  })
);

// Compression with optimized settings
app.use(
  compression({
    level: 6, // Compression level (0-9, where 9 is best compression but slowest)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress responses with this header
      if (req.headers['x-no-compression']) {
        return false;
      }

      // Use compression filter function from the compression library
      // to determine if the response should be compressed
      return compression.filter(req, res);
    },
  })
);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Request received');
  next();
});

// Apply ETag middleware for client-side caching
app.use(etagMiddleware);

// Parse JSON request bodies
app.use(express.json());

// Health check with deep checks
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check Redis connectivity if configured
    let redisStatus = 'not_configured';
    if (process.env.REDIS_URL) {
      try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        redisStatus = 'connected';
        redis.disconnect();
      } catch (err) {
        logger.error({ err }, 'Redis health check failed');
        redisStatus = 'error';
      }
    }

    // Check data access
    let dataStatus = 'error';
    try {
      const icons = await readIconsData();
      dataStatus = icons && icons.length > 0 ? 'ok' : 'empty';
    } catch (err) {
      logger.error({ err }, 'Data health check failed');
    }

    const isHealthy = redisStatus !== 'error' && dataStatus === 'ok';
    const statusCode = isHealthy ? 200 : 503;

    const response = {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: redisStatus,
        data: dataStatus,
      },
    };

    logger.info({ health: response }, 'Health check');
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    res.status(503).json({ status: 'error', error: 'Service unavailable' });
  }
});

// Mount the icons router at /api
app.use('/api', iconsRouter);

// Serve static files with optimized cache headers
app.use(
  express.static(
    path.join(__dirname, process.env.NODE_ENV === 'production' ? '../public' : '../public'),
    {
      // Don't set a default maxAge here, we'll set it based on file type
      setHeaders: (res, filePath) => {
        // Set different cache policies based on file type
        if (filePath.endsWith('.svg')) {
          // SVG icons - cache for 7 days
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        } else if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          // Images - cache for 30 days
          res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
        } else if (filePath.match(/\.(css|js)$/i)) {
          // CSS and JS files - cache for 7 days but allow revalidation
          res.setHeader('Cache-Control', 'public, max-age=604800, must-revalidate');
        } else if (filePath.match(/\.(woff|woff2|ttf|eot|otf)$/i)) {
          // Fonts - cache for 1 year (rarely change)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Other static assets - cache for 1 day
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }

        // Add Vary header for proper caching with compression
        res.setHeader('Vary', 'Accept-Encoding');

        // Add ETag support (in addition to the ETag middleware)
        // This is handled by express.static automatically

        // Prevent caching for HTML files in development
        if (process.env.NODE_ENV !== 'production' && filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, max-age=0');
        }
      },
    }
  )
);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Export the app for testing
export { app };

// Start server if this file is run directly
if (require.main === module) {
  app
    .listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    })
    .on('error', (err: Error) => {
      logger.error({ err }, 'Failed to start server');
      process.exit(1);
    });
}
