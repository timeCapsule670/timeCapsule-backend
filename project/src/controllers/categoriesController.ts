import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as categoriesService from '../services/categoriesService';
import { SaveCategoriesRequest } from '../types/categories';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation rules
export const saveCategoriesValidation = [
  body('category_ids')
    .isArray({ min: 1 })
    .withMessage('At least one category must be selected'),
  body('category_ids.*')
    .isString()
    .notEmpty()
    .withMessage('Each category ID must be a non-empty string'),
];

// Get all available categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoriesService.getAllCategories();
    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

// Save director's selected categories
export const saveDirectorCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const requestData: SaveCategoriesRequest = req.body;
    const result = await categoriesService.saveDirectorCategories(req.user.id, requestData);
    
    const message = result.saved_count > 0 
      ? `Successfully saved ${result.saved_count} new category selection(s)`
      : 'All selected categories were already saved';
    
    return sendSuccess(res, result, message, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    
    // Handle specific error cases
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('Invalid category IDs')) {
      return sendError(res, errorMessage, 400);
    }
    if (errorMessage.includes('At least one category must be selected')) {
      return sendError(res, errorMessage, 400);
    }
    
    return sendError(res, errorMessage, 500);
  }
};
