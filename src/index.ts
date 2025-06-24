import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import iconsRouter from './routes/icons';
import { readIconsData } from './services/iconService';
import Redis from 'ioredis';
import { Icon } from './types/icon';

const app = express();
const PORT = process.env.PORT ?? 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Rate limiting
const iconRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    if (req.path.endsWith('.svg')) return 500;  // More lenient for SVGs
    if (req.path === '/icons') return 100;      // Stricter for metadata
    return 200;                                 // Default limit
  },
  keyGenerator: (req) => {
    return req.ip + req.path;  // Rate limit per IP and endpoint
  }
});
app.use(iconRateLimit);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET'],
  maxAge: 86400, // 24 hours
}));

// Compression
app.use(compression());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Health check with deep checks
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Add your deep health checks here
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ status: 'error', error: 'Service unavailable' });
  }
});

// Mount the icons router
app.use('/', iconsRouter);

// Serve static files
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// 404 handler
app.use((req: Request, res: Response) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Using Redis for caching (if available)
let redis: Redis | null = null;
try {
  redis = new Redis();
  console.log('Redis connected successfully');
} catch (err) {
  console.log('Redis not available, continuing without caching');
}

async function getIconWithCache(provider: string, iconName: string) {
  if (!redis) {
    const icons = await readIconsData();
    return icons.find((i: Icon) =>
      i.provider.toLowerCase() === provider.toLowerCase() &&
      i.id.toLowerCase() === iconName.toLowerCase()
    );
  }

  const cacheKey = `icon:${provider}:${iconName}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // If not in cache, fetch and store
    const icons = await readIconsData();
    const icon = icons.find((i: Icon) =>
      i.provider.toLowerCase() === provider.toLowerCase() &&
      i.id.toLowerCase() === iconName.toLowerCase()
    );

    if (icon) {
      await redis.set(cacheKey, JSON.stringify(icon), 'EX', 3600); // 1 hour cache
    }

    return icon;
  } catch (err) {
    console.error('Redis error:', err);
    // Fallback to direct read if Redis fails
    const icons = await readIconsData();
    return icons.find((i: Icon) =>
      i.provider.toLowerCase() === provider.toLowerCase() &&
      i.id.toLowerCase() === iconName.toLowerCase()
    );
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err: Error) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
