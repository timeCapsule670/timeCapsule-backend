import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as profilePictureService from '../services/profilePictureService';
import { SaveProfilePictureRequest } from '../types/profilePicture';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation rules
export const saveProfilePictureValidation = [
  body('type')
    .isIn(['upload', 'avatar'])
    .withMessage('Type must be either "upload" or "avatar"'),
  body('data')
    .notEmpty()
    .withMessage('Data is required'),
  body('firstName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO date (YYYY-MM-DD)')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        if (date > now) {
          throw new Error('Date of birth cannot be in the future');
        }
      }
      return true;
    }),
];

// Get all available avatars
export const getAllAvatars = async (req: Request, res: Response) => {
  try {
    const avatars = await profilePictureService.getAllAvatars();
    return sendSuccess(res, avatars, 'Avatars retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

// Save director's profile picture (either uploaded image or selected avatar)
export const saveProfilePicture = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const requestData: SaveProfilePictureRequest = req.body;
    const result = await profilePictureService.saveProfilePicture(req.user.id, requestData);
    
    return sendSuccess(res, result, 'Profile picture saved successfully', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    
    // Handle specific error cases
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('Invalid avatar ID')) {
      return sendError(res, errorMessage, 400);
    }
    if (errorMessage.includes('Profile picture type and data are required')) {
      return sendError(res, errorMessage, 400);
    }
    if (errorMessage.includes('Invalid profile picture type')) {
      return sendError(res, errorMessage, 400);
    }
    
    return sendError(res, errorMessage, 500);
  }
};

// Handle file upload for profile pictures
export const uploadProfilePicture = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const result = await profilePictureService.uploadProfilePicture(req.file);
    return sendSuccess(res, result, 'Profile picture uploaded successfully', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    
    // Handle specific error cases
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('Only image files are allowed')) {
      return sendError(res, errorMessage, 400);
    }
    if (errorMessage.includes('File size must be less than 5MB')) {
      return sendError(res, errorMessage, 400);
    }
    
    return sendError(res, errorMessage, 500);
  }
};
