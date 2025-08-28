"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateChildProfiles = exports.deleteChildProfile = exports.updateChildProfile = exports.getChildProfile = exports.getChildProfiles = exports.createChildProfiles = exports.updateChildProfileValidation = exports.createChildProfilesValidation = void 0;
const express_validator_1 = require("express-validator");
const childProfileService_1 = require("../services/childProfileService");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation rules for creating child profiles - matches frontend format exactly
exports.createChildProfilesValidation = [
    (0, express_validator_1.body)('children')
        .isArray({ min: 1 })
        .withMessage('At least one child profile is required')
        .custom((children) => {
        if (children.length > 10) {
            throw new Error('Maximum 10 child profiles can be created at once');
        }
        return true;
    }),
    (0, express_validator_1.body)('children.*.id')
        .notEmpty()
        .withMessage('Child ID is required for each child'),
    (0, express_validator_1.body)('children.*.name')
        .notEmpty()
        .withMessage('Name is required for each child')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('children.*.birthday')
        .notEmpty()
        .withMessage('Birthday is required for each child')
        .isString()
        .withMessage('Birthday must be a string'),
    (0, express_validator_1.body)('children.*.username')
        .optional()
        .isString()
        .withMessage('Username must be a string')
];
// Validation rules for updating child profiles
exports.updateChildProfileValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Valid child profile ID is required'),
    (0, express_validator_1.body)('first_name')
        .optional()
        .isString()
        .withMessage('First name must be a string')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('last_name')
        .optional()
        .isString()
        .withMessage('Last name must be a string')
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    (0, express_validator_1.body)('date_of_birth')
        .optional()
        .isString()
        .withMessage('Date of birth must be a string')
        .custom((value) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error('Date of birth must be a valid date');
        }
        return true;
    }),
    (0, express_validator_1.body)('gender')
        .optional()
        .isString()
        .withMessage('Gender must be a string')
        .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
        .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters')
];
/**
 * Creates child profiles with full setup flow
 */
const createChildProfiles = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const request = req.body;
        // Process the request
        const result = await childProfileService_1.ChildProfileService.createChildProfiles(req.user.id, request);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Child profiles created successfully', 201);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.createChildProfiles = createChildProfiles;
/**
 * Gets all child profiles for the authenticated user
 */
const getChildProfiles = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const profiles = await childProfileService_1.ChildProfileService.getChildProfilesByDirector(req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, profiles, 'Child profiles retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getChildProfiles = getChildProfiles;
/**
 * Gets a specific child profile by ID
 */
const getChildProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        // Get all profiles and find the specific one
        const profiles = await childProfileService_1.ChildProfileService.getChildProfilesByDirector(req.user.id);
        const profile = profiles.actors.find(actor => actor.id === id);
        if (!profile) {
            return (0, responseFormatter_1.sendError)(res, 'Child profile not found', 404);
        }
        // Get the relationship for this profile
        const relationship = profiles.relationships.find(rel => rel.actor_id === id);
        return (0, responseFormatter_1.sendSuccess)(res, { profile, relationship }, 'Child profile retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getChildProfile = getChildProfile;
/**
 * Updates a child profile
 */
const updateChildProfile = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        // Process update data
        const updateData = req.body;
        // Convert date format if provided
        if (updateData.date_of_birth) {
            try {
                const date = new Date(updateData.date_of_birth);
                if (isNaN(date.getTime())) {
                    return (0, responseFormatter_1.sendError)(res, 'Invalid date format', 400);
                }
                updateData.date_of_birth = date.toISOString().split('T')[0];
            }
            catch (error) {
                return (0, responseFormatter_1.sendError)(res, 'Invalid date format', 400);
            }
        }
        const updatedProfile = await childProfileService_1.ChildProfileService.updateChildProfile(id, req.user.id, updateData);
        return (0, responseFormatter_1.sendSuccess)(res, updatedProfile, 'Child profile updated successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.updateChildProfile = updateChildProfile;
/**
 * Deletes a child profile
 */
const deleteChildProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        await childProfileService_1.ChildProfileService.deleteChildProfile(id, req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, null, 'Child profile deleted successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.deleteChildProfile = deleteChildProfile;
/**
 * Bulk update multiple child profiles
 */
const bulkUpdateChildProfiles = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return (0, responseFormatter_1.sendError)(res, 'Updates must be an array', 400);
        }
        const results = [];
        for (const update of updates) {
            try {
                const { id, ...updateData } = update;
                const updatedProfile = await childProfileService_1.ChildProfileService.updateChildProfile(id, req.user.id, updateData);
                results.push({ id, success: true, data: updatedProfile });
            }
            catch (error) {
                results.push({
                    id: update.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return (0, responseFormatter_1.sendSuccess)(res, { results }, 'Bulk update completed');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.bulkUpdateChildProfiles = bulkUpdateChildProfiles;
