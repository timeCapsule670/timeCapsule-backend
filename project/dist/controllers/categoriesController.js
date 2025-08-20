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
exports.saveDirectorCategories = exports.getAllCategories = exports.saveCategoriesValidation = void 0;
const express_validator_1 = require("express-validator");
const categoriesService = __importStar(require("../services/categoriesService"));
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation rules
exports.saveCategoriesValidation = [
    (0, express_validator_1.body)('category_ids')
        .isArray({ min: 1 })
        .withMessage('At least one category must be selected'),
    (0, express_validator_1.body)('category_ids.*')
        .isString()
        .notEmpty()
        .withMessage('Each category ID must be a non-empty string'),
];
// Get all available categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await categoriesService.getAllCategories();
        return (0, responseFormatter_1.sendSuccess)(res, categories, 'Categories retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getAllCategories = getAllCategories;
// Save director's selected categories
const saveDirectorCategories = async (req, res) => {
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
        const result = await categoriesService.saveDirectorCategories(req.user.id, requestData);
        const message = result.saved_count > 0
            ? `Successfully saved ${result.saved_count} new category selection(s)`
            : 'All selected categories were already saved';
        return (0, responseFormatter_1.sendSuccess)(res, result, message, 200);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        // Handle specific error cases
        const errorMessage = error.message;
        if (errorMessage.includes('Invalid category IDs')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        if (errorMessage.includes('At least one category must be selected')) {
            return (0, responseFormatter_1.sendError)(res, errorMessage, 400);
        }
        return (0, responseFormatter_1.sendError)(res, errorMessage, 500);
    }
};
exports.saveDirectorCategories = saveDirectorCategories;
