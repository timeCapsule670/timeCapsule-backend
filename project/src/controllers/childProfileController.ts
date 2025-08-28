import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ChildProfileService } from '../services/childProfileService';
import { CreateChildProfileRequest, CreateActorRequest } from '../types/children';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation rules for creating child profiles - matches frontend format exactly
export const createChildProfilesValidation = [
  body('children')
    .isArray({ min: 1 })
    .withMessage('At least one child profile is required')
    .custom((children: any[]) => {
      if (children.length > 10) {
        throw new Error('Maximum 10 child profiles can be created at once');
      }
      return true;
    }),
  body('children.*.id')
    .notEmpty()
    .withMessage('Child ID is required for each child'),
  body('children.*.name')
    .notEmpty()
    .withMessage('Name is required for each child')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('children.*.birthday')
    .notEmpty()
    .withMessage('Birthday is required for each child')
    .isString()
    .withMessage('Birthday must be a string'),
  body('children.*.username')
    .optional()
    .isString()
    .withMessage('Username must be a string')
];

// Validation rules for updating child profiles
export const updateChildProfileValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid child profile ID is required'),
  body('first_name')
    .optional()
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('last_name')
    .optional()
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('date_of_birth')
    .optional()
    .isString()
    .withMessage('Date of birth must be a string')
    .custom((value: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Date of birth must be a valid date');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isString()
    .withMessage('Gender must be a string')
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

/**
 * Creates child profiles with full setup flow
 */
export const createChildProfiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const request: CreateChildProfileRequest = req.body;

    // Process the request
    const result = await ChildProfileService.createChildProfiles(req.user.id, request);
    
    return sendSuccess(res, result, 'Child profiles created successfully', 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

/**
 * Gets all child profiles for the authenticated user
 */
export const getChildProfiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const profiles = await ChildProfileService.getChildProfilesByDirector(req.user.id);
    return sendSuccess(res, profiles, 'Child profiles retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

/**
 * Gets a specific child profile by ID
 */
export const getChildProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    // Get all profiles and find the specific one
    const profiles = await ChildProfileService.getChildProfilesByDirector(req.user.id);
    const profile = profiles.actors.find(actor => actor.id === id);
    
    if (!profile) {
      return sendError(res, 'Child profile not found', 404);
    }

    // Get the relationship for this profile
    const relationship = profiles.relationships.find(rel => rel.actor_id === id);
    
    return sendSuccess(res, { profile, relationship }, 'Child profile retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

/**
 * Updates a child profile
 */
export const updateChildProfile = async (req: AuthenticatedRequest, res: Response) => {
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

    // Process update data
    const updateData: Partial<CreateActorRequest> = req.body;
    
    // Convert date format if provided
    if (updateData.date_of_birth) {
      try {
        const date = new Date(updateData.date_of_birth);
        if (isNaN(date.getTime())) {
          return sendError(res, 'Invalid date format', 400);
        }
        updateData.date_of_birth = date.toISOString().split('T')[0];
      } catch (error) {
        return sendError(res, 'Invalid date format', 400);
      }
    }

    const updatedProfile = await ChildProfileService.updateChildProfile(id, req.user.id, updateData);
    return sendSuccess(res, updatedProfile, 'Child profile updated successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

/**
 * Deletes a child profile
 */
export const deleteChildProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    await ChildProfileService.deleteChildProfile(id, req.user.id);
    return sendSuccess(res, null, 'Child profile deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

/**
 * Bulk update multiple child profiles
 */
export const bulkUpdateChildProfiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return sendError(res, 'Updates must be an array', 400);
    }

    const results = [];
    for (const update of updates) {
      try {
        const { id, ...updateData } = update;
        const updatedProfile = await ChildProfileService.updateChildProfile(id, req.user.id, updateData);
        results.push({ id, success: true, data: updatedProfile });
      } catch (error) {
        results.push({ 
          id: update.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return sendSuccess(res, { results }, 'Bulk update completed');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};
