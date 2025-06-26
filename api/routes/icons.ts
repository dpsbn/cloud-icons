import { Router } from 'express';
import { getIconByName, getIcons, getProviders } from '../controllers/iconController';
import { validate } from '../middleware/validationMiddleware';
import {
  cloudProvidersSchema,
  getIconByNameSchema,
  getIconsSchema,
} from '../middleware/validationSchemas';

const router = Router();

// Routes with validation
router.get('/:provider/icons', validate(getIconsSchema), getIcons);
router.get('/cloud-providers', validate(cloudProvidersSchema), getProviders);
router.get('/:provider/icon/:icon_name', validate(getIconByNameSchema), getIconByName);

export default router;
