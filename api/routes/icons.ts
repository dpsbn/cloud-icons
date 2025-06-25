import { Router } from 'express';
import { getIcons, getProviders, getIconByName } from '../controllers/iconController';

const router = Router();

// Routes
router.get('/:provider/icons', getIcons);
router.get('/cloud-providers', getProviders);
router.get('/:provider/icon/:icon_name', getIconByName);

export default router;
