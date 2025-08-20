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
exports.uploadProfilePicture = exports.saveProfilePicture = exports.getAllAvatars = exports.saveProfilePictureValidation = void 0;
const express_validator_1 = require("express-validator");
const profilePictureService = __importStar(require("../services/profilePictureService"));
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation rules
exports.saveProfilePictureValidation = [
    (0, express_validator_1.body)('type')
        .isIn(['upload', 'avatar'])
        .withMessage('Type must be either "upload" or "avatar"'),
    (0, express_validator_1.body)('data')
        .notEmpty()
        .withMessage('Data is required'),
];
// Get all available avatars
const getAllAvatars = async (req, res) => {
    try {
        const avatars = await profilePictureService.getAllAvatars();
        return (0, responseFormatter_1.sendSuccess)(res, avatars, 'Avatars retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getAllAvatars = getAllAvatars;
// Save director's profile picture (either uploaded image or selected avatar)
const saveProfilePicture = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const requestData = req.body;
        const result = await profilePictureService.saveProfilePicture(req.user.id, requestData);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Profile picture saved successfully', 200);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        // Handle specific error cases
        const errorMessage = error.message;
        if (errorMessage.includes('Invalid avatar ID')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        if (errorMessage.includes('Profile picture type and data are required')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        if (errorMessage.includes('Invalid profile picture type')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        return (0, responseFormatter_1.sendError)(res, errorMessage, 500);
    }
};
exports.saveProfilePicture = saveProfilePicture;
// Handle file upload for profile pictures
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        if (!req.file) {
            return (0, responseFormatter_1.sendError)(res, 'No file uploaded', 400);
        }
        const result = await profilePictureService.uploadProfilePicture(req.file);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Profile picture uploaded successfully', 200);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        // Handle specific error cases
        const errorMessage = error.message;
        if (errorMessage.includes('Only image files are allowed')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        if (errorMessage.includes('File size must be less than 5MB')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        return (0, responseFormatter_1.sendError)(res, errorMessage, 500);
    }
};
exports.uploadProfilePicture = uploadProfilePicture;
