import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as promptService from '../services/promptService';
import * as categoriesService from '../services/categoriesService';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { GeneratePromptRequest } from '../types/prompts';

const DEFAULT_CATEGORY_NAMES = ['Emotional Support'];

export const generatePromptValidation = [
  body('conversation')
    .isArray({ min: 1 })
    .withMessage('Conversation must be a non-empty array'),
  body('conversation.*.role')
    .isIn(['user', 'assistant'])
    .withMessage('Each conversation turn must have role "user" or "assistant"'),
  body('conversation.*.content')
    .notEmpty()
    .withMessage('Each conversation turn must have non-empty content'),
  body('categoryIds')
    .optional()
    .isArray()
    .withMessage('categoryIds must be an array'),
  body('categoryIds.*')
    .isUUID()
    .withMessage('Each category ID must be a valid UUID')
];

export const generatePrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    if (!req.user?.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { conversation, categoryIds } = req.body as GeneratePromptRequest;

    let categoryNames: string[];
    if (categoryIds && categoryIds.length > 0) {
      categoryNames = await categoriesService.getCategoryNamesByIds(categoryIds);
    } else {
      categoryNames = await categoriesService.getDirectorCategoryNames(req.user.id);
    }
    if (categoryNames.length === 0) {
      categoryNames = DEFAULT_CATEGORY_NAMES;
    }

    const result = await promptService.generatePrompt(conversation, categoryNames);
    return sendSuccess(res, result, 'Message generated successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode);
    }
    const message = (error as Error).message;
    if (message.includes('OPENROUTER') || message.includes('OpenRouter')) {
      return sendError(res, message, 502);
    }
    return sendError(res, message, 500);
  }
};
