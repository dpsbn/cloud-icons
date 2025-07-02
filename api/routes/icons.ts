import { Router } from 'express';
import { getIcons, getProviders, getIconByName, getTags, getStats } from '../controllers/iconController';
import { validate } from '../middleware/validationMiddleware';
import { iconSizeQuerySchema, iconNameParamSchema } from '../middleware/validationSchemas';
import { etagMiddleware } from '../middleware/etagMiddleware';
import { publicRateLimiter } from '../middleware/apiKeyMiddleware';

const router = Router();

// Apply rate limiting to all routes
router.use(publicRateLimiter);

// Get all icons for a provider with optional search and pagination
router.get(
  '/:provider/icons',
  validate(iconSizeQuerySchema),
  etagMiddleware,
  getIcons
);

// Get a list of all providers
router.get('/cloud-providers', etagMiddleware, getProviders);

// Get all available tags
router.get('/tags', etagMiddleware, getTags);

// Get database statistics
router.get('/stats', etagMiddleware, getStats);

// Get a specific icon by name
router.get(
  '/:provider/icon/:icon_name',
  validate(iconNameParamSchema),
  etagMiddleware,
  getIconByName
);

export default router;
