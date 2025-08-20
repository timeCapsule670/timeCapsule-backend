"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.resetPassword = exports.login = exports.register = exports.resetPasswordValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
const authService = __importStar(require("../services/authService"));
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation rules
exports.registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .matches(/[a-zA-Z]/)
        .withMessage('Password must contain at least one letter'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email address'),
];
// Controller functions
const register = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        const userData = req.body;
        const result = await authService.registerUser(userData);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'User registered successfully', 201);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        const credentials = req.body;
        const result = await authService.loginUser(credentials);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Login successful', 200);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.login = login;
const resetPassword = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        const resetRequest = req.body;
        await authService.resetPassword(resetRequest);
        return (0, responseFormatter_1.sendSuccess)(res, null, 'Password reset email sent. Please check your inbox.', 200);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.resetPassword = resetPassword;
const getProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const userProfile = await authService.getUserProfile(req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, userProfile, 'User profile retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getProfile = getProfile;
