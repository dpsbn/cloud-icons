"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iconController_1 = require("../controllers/iconController");
const router = (0, express_1.Router)();
// Routes
router.get('/:provider/icons', iconController_1.getIcons);
router.get('/cloud-providers', iconController_1.getProviders);
router.get('/:provider/icon/:icon_name', iconController_1.getIconByName);
exports.default = router;
