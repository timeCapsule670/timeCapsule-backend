import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authService';
import { UserRegistration, UserLogin, ResetPasswordRequest, ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordWithOTPRequest } from '../types/auth';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation rules
export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter'),
  body('name').notEmpty().withMessage('Name is required'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
];

// New validation rules for forgot password flow
export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
];

export const verifyOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 characters'),
];

export const resetPasswordWithOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 characters'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
];

// Controller functions
export const register = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const userData: UserRegistration = req.body;
    const result = await authService.registerUser(userData);
    
    return sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const credentials: UserLogin = req.body;
    const result = await authService.loginUser(credentials);
    
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const resetRequest: ResetPasswordRequest = req.body;
    await authService.resetPassword(resetRequest);
    
    return sendSuccess(res, null, 'Password reset email sent. Please check your inbox.', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const request: ForgotPasswordRequest = req.body;
    const result = await authService.forgotPassword(request);
    
    return sendSuccess(res, result, 'OTP sent successfully', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const request: VerifyOTPRequest = req.body;
    const result = await authService.verifyOTP(request);
    
    return sendSuccess(res, result, 'OTP verified successfully', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const resetPasswordWithOTP = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const request: ResetPasswordWithOTPRequest = req.body;
    await authService.resetPasswordWithOTP(request);
    
    return sendSuccess(res, null, 'Password reset successfully', 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userProfile = await authService.getUserProfile(req.user.id);
    return sendSuccess(res, userProfile, 'User profile retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};