"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iconController_1 = require("../controllers/iconController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = (0, express_1.Router)();
// Routes with validation
router.get('/:provider/icons', (0, validationMiddleware_1.validate)(validationSchemas_1.getIconsSchema), iconController_1.getIcons);
router.get('/cloud-providers', (0, validationMiddleware_1.validate)(validationSchemas_1.cloudProvidersSchema), iconController_1.getProviders);
router.get('/:provider/icon/:icon_name', (0, validationMiddleware_1.validate)(validationSchemas_1.getIconByNameSchema), iconController_1.getIconByName);
exports.default = router;
