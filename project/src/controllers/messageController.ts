import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as messageService from '../services/messageService';
import { CreateMessageRequest, UpdateMessageRequest, MessageType } from '../types/messages';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

// Validation rules
export const createMessageValidation = [
  body('child_id').isUUID().withMessage('Valid child ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type')
    .isIn(['text', 'audio', 'video', 'image'])
    .withMessage('Type must be one of: text, audio, video, image'),
  body('delivery_date')
    .notEmpty()
    .withMessage('Delivery date is required')
    .isISO8601()
    .withMessage('Delivery date must be a valid date in ISO 8601 format'),
  body('media_url').optional().isURL().withMessage('Media URL must be a valid URL'),
  body('ai_prompt').optional().isString().withMessage('AI prompt must be a string'),
];

export const updateMessageValidation = [
  param('id').isUUID().withMessage('Valid message ID is required'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('content').optional().isString().withMessage('Content must be a string'),
  body('type')
    .optional()
    .isIn(['text', 'audio', 'video', 'image'])
    .withMessage('Type must be one of: text, audio, video, image'),
  body('delivery_date')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date in ISO 8601 format'),
  body('media_url').optional().isURL().withMessage('Media URL must be a valid URL'),
  body('ai_prompt').optional().isString().withMessage('AI prompt must be a string'),
];

// Controller functions
export const createMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const messageData: CreateMessageRequest = req.body;
    const result = await messageService.createMessage(req.user.id, messageData);
    
    return sendSuccess(res, result, 'Message created successfully', 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const messages = await messageService.getMessagesByUserId(req.user.id);
    return sendSuccess(res, messages, 'Messages retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const getMessagesByChild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { childId } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const messages = await messageService.getMessagesByChildId(childId, req.user.id);
    return sendSuccess(res, messages, 'Messages retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const getMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const message = await messageService.getMessageById(id, req.user.id);
    return sendSuccess(res, message, 'Message retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const updateMessage = async (req: AuthenticatedRequest, res: Response) => {
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

    const updateData: UpdateMessageRequest = req.body;
    const result = await messageService.updateMessage(id, req.user.id, updateData);
    
    return sendSuccess(res, result, 'Message updated successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    await messageService.deleteMessage(id, req.user.id);
    return sendSuccess(res, null, 'Message deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, (error as Error).message, 500);
  }
};