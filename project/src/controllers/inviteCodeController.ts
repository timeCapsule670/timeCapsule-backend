import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { InviteCodeService } from '../services/inviteCodeService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation middleware
export const validateInviteCodeValidation = [
  body('code')
    .notEmpty()
    .withMessage('Invite code is required')
    .isString()
    .withMessage('Invite code must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('Invite code must be between 3 and 50 characters')
];

export const useInviteCodeValidation = [
  body('code')
    .notEmpty()
    .withMessage('Invite code is required')
    .isString()
    .withMessage('Invite code must be a string'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
];

// Controller methods
export const generateInviteCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: validationErrors.array()[0].msg
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await InviteCodeService.generateInviteCode(req.user.id);
    
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const validateInviteCode = async (req: Request, res: Response) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: validationErrors.array()[0].msg
      });
    }

    const { code } = req.body;
    const result = await InviteCodeService.validateInviteCode(code);
    
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const useInviteCode = async (req: Request, res: Response) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: validationErrors.array()[0].msg
      });
    }

    const { code, userId } = req.body;
    const result = await InviteCodeService.useInviteCode(code, userId);
    
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getInviteCodesByDirector = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const inviteCodes = await InviteCodeService.getInviteCodesByDirector(req.user.id);
    
    res.status(200).json({
      success: true,
      data: inviteCodes
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const revokeInviteCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { codeId } = req.params;
    await InviteCodeService.revokeInviteCode(codeId, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Invite code revoked successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
