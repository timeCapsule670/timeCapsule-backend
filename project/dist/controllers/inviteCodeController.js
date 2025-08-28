"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInviteCode = exports.getInviteCodesByDirector = exports.useInviteCode = exports.validateInviteCode = exports.generateInviteCode = exports.useInviteCodeValidation = exports.validateInviteCodeValidation = void 0;
const express_validator_1 = require("express-validator");
const inviteCodeService_1 = require("../services/inviteCodeService");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation middleware
exports.validateInviteCodeValidation = [
    (0, express_validator_1.body)('code')
        .notEmpty()
        .withMessage('Invite code is required')
        .isString()
        .withMessage('Invite code must be a string')
        .isLength({ min: 3, max: 50 })
        .withMessage('Invite code must be between 3 and 50 characters')
];
exports.useInviteCodeValidation = [
    (0, express_validator_1.body)('code')
        .notEmpty()
        .withMessage('Invite code is required')
        .isString()
        .withMessage('Invite code must be a string'),
    (0, express_validator_1.body)('userId')
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string')
];
// Controller methods
const generateInviteCode = async (req, res) => {
    try {
        const validationErrors = (0, express_validator_1.validationResult)(req);
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
        const result = await inviteCodeService_1.InviteCodeService.generateInviteCode(req.user.id);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
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
exports.generateInviteCode = generateInviteCode;
const validateInviteCode = async (req, res) => {
    try {
        const validationErrors = (0, express_validator_1.validationResult)(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: validationErrors.array()[0].msg
            });
        }
        const { code } = req.body;
        const result = await inviteCodeService_1.InviteCodeService.validateInviteCode(code);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
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
exports.validateInviteCode = validateInviteCode;
const useInviteCode = async (req, res) => {
    try {
        const validationErrors = (0, express_validator_1.validationResult)(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: validationErrors.array()[0].msg
            });
        }
        const { code, userId } = req.body;
        const result = await inviteCodeService_1.InviteCodeService.useInviteCode(code, userId);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
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
exports.useInviteCode = useInviteCode;
const getInviteCodesByDirector = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const inviteCodes = await inviteCodeService_1.InviteCodeService.getInviteCodesByDirector(req.user.id);
        res.status(200).json({
            success: true,
            data: inviteCodes
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
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
exports.getInviteCodesByDirector = getInviteCodesByDirector;
const revokeInviteCode = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const { codeId } = req.params;
        await inviteCodeService_1.InviteCodeService.revokeInviteCode(codeId, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Invite code revoked successfully'
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
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
exports.revokeInviteCode = revokeInviteCode;
