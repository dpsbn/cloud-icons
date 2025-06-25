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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const icons_1 = __importDefault(require("./routes/icons"));
const iconService_1 = require("./services/iconService");
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3002;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
}));
// Rate limiting
const iconRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        if (req.path.endsWith('.svg'))
            return 500; // More lenient for SVGs
        if (req.path === '/icons')
            return 100; // Stricter for metadata
        return 200; // Default limit
    },
    keyGenerator: (req) => {
        return req.ip + req.path; // Rate limit per IP and endpoint
    }
});
app.use(iconRateLimit);
// CORS configuration
app.use((0, cors_1.default)({
    origin: ((_b = process.env.ALLOWED_ORIGINS) === null || _b === void 0 ? void 0 : _b.split(',')) || '*',
    methods: ['GET'],
    maxAge: 86400, // 24 hours
}));
// Compression
app.use((0, compression_1.default)());
// Request logging
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use(express_1.default.json());
// Health check with deep checks
app.get('/health', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Add your deep health checks here
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
    catch (error) {
        res.status(503).json({ status: 'error', error: 'Service unavailable' });
    }
}));
// Mount the icons router
app.use('/', icons_1.default);
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.svg')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));
// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});
// Error handling
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Using Redis for caching (if available)
let redis = null;
if (process.env.REDIS_URL) {
    try {
        redis = new ioredis_1.default(process.env.REDIS_URL);
        console.log('Redis connected successfully');
    }
    catch (err) {
        console.log('Redis connection failed:', err);
    }
}
else {
    console.log('No Redis URL provided, continuing without caching');
}
function getIconWithCache(provider, iconName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!redis) {
            const icons = yield (0, iconService_1.readIconsData)();
            return icons.find((i) => i.provider.toLowerCase() === provider.toLowerCase() &&
                i.id.toLowerCase() === iconName.toLowerCase());
        }
        const cacheKey = `icon:${provider}:${iconName}`;
        // Try cache first
        try {
            const cached = yield redis.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
            // If not in cache, fetch and store
            const icons = yield (0, iconService_1.readIconsData)();
            const icon = icons.find((i) => i.provider.toLowerCase() === provider.toLowerCase() &&
                i.id.toLowerCase() === iconName.toLowerCase());
            if (icon) {
                yield redis.set(cacheKey, JSON.stringify(icon), 'EX', 3600); // 1 hour cache
            }
            return icon;
        }
        catch (err) {
            console.error('Redis error:', err);
            // Fallback to direct read if Redis fails
            const icons = yield (0, iconService_1.readIconsData)();
            return icons.find((i) => i.provider.toLowerCase() === provider.toLowerCase() &&
                i.id.toLowerCase() === iconName.toLowerCase());
        }
    });
}
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
