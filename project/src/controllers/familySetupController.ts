import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { FamilySetupService } from '../services/familySetupService';
import { FamilySetupRequest } from '../types/familySetup';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/auth';

// Validation rules for family setup
export const familySetupValidation = [
  body('selectedRole')
    .notEmpty()
    .withMessage('Selected role is required')
    .isIn(['Mom', 'Dad', 'Guardian', 'Other'])
    .withMessage('Selected role must be one of: Mom, Dad, Guardian, Other'),
  body('actorIds')
    .optional()
    .custom((value) => {
      // Allow string, array, or undefined
      if (value === undefined || value === null) return true;
      
      // UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (typeof value === 'string') {
        // If it's a comma-separated string, validate each part
        const ids = value.split(',').map(id => id.trim()).filter(id => id.length > 0);
        return ids.every(id => uuidRegex.test(id));
      }
      
      if (Array.isArray(value)) {
        return value.every((id: any) => typeof id === 'string' && id.trim().length > 0 && uuidRegex.test(id.trim()));
      }
      
      return false;
    })
    .withMessage('Actor IDs must be valid UUIDs in string or array format'),
];

// Validation rules for director role update only
export const updateDirectorRoleValidation = [
  body('selectedRole')
    .notEmpty()
    .withMessage('Selected role is required')
    .isIn(['Mom', 'Dad', 'Guardian', 'Other'])
    .withMessage('Selected role must be one of: Mom, Dad, Guardian, Other'),
];

// Validation rules for creating relationships only
export const createRelationshipsValidation = [
  body('actorIds')
    .isArray({ min: 1 })
    .withMessage('Actor IDs must be a non-empty array')
    .custom((value) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return value.every((id: any) => typeof id === 'string' && id.trim().length > 0 && uuidRegex.test(id.trim()));
    })
    .withMessage('All actor IDs must be valid UUIDs'),
  body('relationship')
    .notEmpty()
    .withMessage('Relationship is required')
    .isIn(['Mom', 'Dad', 'Guardian', 'Other'])
    .withMessage('Relationship must be one of: Mom, Dad, Guardian, Other'),
];

/**
 * @desc    Complete family setup (update director role + create relationships)
 * @route   POST /api/family-setup
 * @access  Private
 */
export const setupFamily = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400);
    }

    if (!req.user?.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const requestData: FamilySetupRequest = {
      selectedRole: req.body.selectedRole,
      actorIds: req.body.actorIds,
    };

    console.log('🚀 Family Setup Controller - Processing request:', {
      userId: req.user.id,
      selectedRole: requestData.selectedRole,
      actorIds: requestData.actorIds
    });

    const result = await FamilySetupService.setupFamily(req.user.id, requestData);

    console.log('✅ Family Setup Controller - Setup completed successfully');
    return sendSuccess(res, result, result.message, 200);

  } catch (error) {
    console.error('❌ Family Setup Controller - Error:', error);
    
    if (error instanceof Error) {
      return sendError(res, error.message, 500);
    }
    
    return sendError(res, 'An unexpected error occurred during family setup', 500);
  }
};

/**
 * @desc    Update only the director's role/type
 * @route   PUT /api/family-setup/director-role
 * @access  Private
 */
export const updateDirectorRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400);
    }

    if (!req.user?.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { selectedRole } = req.body;

    console.log('📝 Family Setup Controller - Updating director role:', {
      userId: req.user.id,
      selectedRole
    });

    const result = await FamilySetupService.updateDirectorRole(req.user.id, selectedRole);

    console.log('✅ Family Setup Controller - Director role updated successfully');
    return sendSuccess(res, result, result.message, 200);

  } catch (error) {
    console.error('❌ Family Setup Controller - Error updating director role:', error);
    
    if (error instanceof Error) {
      return sendError(res, error.message, 500);
    }
    
    return sendError(res, 'An unexpected error occurred while updating director role', 500);
  }
};

/**
 * @desc    Create only the director-actor relationships
 * @route   POST /api/family-setup/relationships
 * @access  Private
 */
export const createRelationships = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400);
    }

    if (!req.user?.id) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { actorIds, relationship } = req.body;

    console.log('🔗 Family Setup Controller - Creating relationships:', {
      userId: req.user.id,
      actorIds,
      relationship
    });

    const result = await FamilySetupService.createDirectorActorRelationships(
      req.user.id,
      actorIds,
      relationship
    );

    console.log('✅ Family Setup Controller - Relationships created successfully');
    return sendSuccess(res, result, result.message, 200);

  } catch (error) {
    console.error('❌ Family Setup Controller - Error creating relationships:', error);
    
    if (error instanceof Error) {
      return sendError(res, error.message, 500);
    }
    
    return sendError(res, 'An unexpected error occurred while creating relationships', 500);
  }
};
