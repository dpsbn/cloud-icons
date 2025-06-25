import { Router } from 'express';
import { getIcons, getProviders, getIconByName } from '../controllers/iconController';

const router = Router();

// Routes
router.get('/api/:provider/icons', getIcons);
router.get('/api/cloud-providers', getProviders);
router.get('/api/:provider/icon/:icon_name', getIconByName);

export default router;
