import { Router } from 'express';
import { getAllCategories, saveDirectorCategories, saveCategoriesValidation } from '../controllers/categoriesController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/categories - Get all available moment categories
router.get('/', getAllCategories);

// POST /api/director/categories - Save director's selected categories
router.post('/director', authenticate, saveCategoriesValidation, saveDirectorCategories);

export default router;
