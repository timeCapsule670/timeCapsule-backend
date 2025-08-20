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
exports.deleteChild = exports.updateChild = exports.getChild = exports.getChildren = exports.createChild = exports.updateChildValidation = exports.createChildValidation = void 0;
const express_validator_1 = require("express-validator");
const childrenService = __importStar(require("../services/childrenService"));
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation rules
exports.createChildValidation = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('birth_date')
        .notEmpty()
        .withMessage('Birth date is required')
        .isISO8601()
        .withMessage('Birth date must be a valid date in ISO 8601 format'),
    (0, express_validator_1.body)('gender').optional().isString().withMessage('Gender must be a string'),
];
exports.updateChildValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid child ID is required'),
    (0, express_validator_1.body)('name').optional().isString().withMessage('Name must be a string'),
    (0, express_validator_1.body)('birth_date')
        .optional()
        .isISO8601()
        .withMessage('Birth date must be a valid date in ISO 8601 format'),
    (0, express_validator_1.body)('gender').optional().isString().withMessage('Gender must be a string'),
];
// Controller functions
const createChild = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const childData = req.body;
        const result = await childrenService.createChild(req.user.id, childData);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Child profile created successfully', 201);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.createChild = createChild;
const getChildren = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const children = await childrenService.getChildrenByUserId(req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, children, 'Children retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getChildren = getChildren;
const getChild = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const child = await childrenService.getChildById(id, req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, child, 'Child retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getChild = getChild;
const updateChild = async (req, res) => {
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
        const updateData = req.body;
        const result = await childrenService.updateChild(id, req.user.id, updateData);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Child profile updated successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.updateChild = updateChild;
const deleteChild = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        await childrenService.deleteChild(id, req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, null, 'Child profile deleted successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.deleteChild = deleteChild;
