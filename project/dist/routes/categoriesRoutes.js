"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoriesController_1 = require("../controllers/categoriesController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/categories - Get all available moment categories
router.get('/', categoriesController_1.getAllCategories);
// POST /api/director/categories - Save director's selected categories
router.post('/director', auth_1.authenticate, categoriesController_1.saveCategoriesValidation, categoriesController_1.saveDirectorCategories);
exports.default = router;
