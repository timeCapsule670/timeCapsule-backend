import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as childrenService from '../services/childrenService';
import { CreateChildRequest, UpdateChildRequest } from '../types/children';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation rules
export const createChildValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('birth_date')
    .notEmpty()
    .withMessage('Birth date is required')
    .isISO8601()
    .withMessage('Birth date must be a valid date in ISO 8601 format'),
  body('gender').optional().isString().withMessage('Gender must be a string'),
];

export const updateChildValidation = [
  param('id').isUUID().withMessage('Valid child ID is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid date in ISO 8601 format'),
  body('gender').optional().isString().withMessage('Gender must be a string'),
];

// Controller functions
export const createChild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const childData: CreateChildRequest = req.body;
    const result = await childrenService.createChild(req.user.id, childData);
    
    return sendSuccess(res, result, 'Child profile created successfully', 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const getChildren = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const children = await childrenService.getChildrenByUserId(req.user.id);
    return sendSuccess(res, children, 'Children retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const getChild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const child = await childrenService.getChildById(id, req.user.id);
    return sendSuccess(res, child, 'Child retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const updateChild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const updateData: UpdateChildRequest = req.body;
    const result = await childrenService.updateChild(id, req.user.id, updateData);
    
    return sendSuccess(res, result, 'Child profile updated successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const deleteChild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    await childrenService.deleteChild(id, req.user.id);
    return sendSuccess(res, null, 'Child profile deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};