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
exports.deleteMessage = exports.updateMessage = exports.getMessage = exports.getMessagesByChild = exports.getMessages = exports.createMessage = exports.updateMessageValidation = exports.createMessageValidation = void 0;
const express_validator_1 = require("express-validator");
const messageService = __importStar(require("../services/messageService"));
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation rules
exports.createMessageValidation = [
    (0, express_validator_1.body)('child_id').isUUID().withMessage('Valid child ID is required'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
    (0, express_validator_1.body)('type')
        .isIn(['text', 'audio', 'video', 'image'])
        .withMessage('Type must be one of: text, audio, video, image'),
    (0, express_validator_1.body)('delivery_date')
        .notEmpty()
        .withMessage('Delivery date is required')
        .isISO8601()
        .withMessage('Delivery date must be a valid date in ISO 8601 format'),
    (0, express_validator_1.body)('media_url').optional().isURL().withMessage('Media URL must be a valid URL'),
    (0, express_validator_1.body)('ai_prompt').optional().isString().withMessage('AI prompt must be a string'),
];
exports.updateMessageValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid message ID is required'),
    (0, express_validator_1.body)('title').optional().isString().withMessage('Title must be a string'),
    (0, express_validator_1.body)('content').optional().isString().withMessage('Content must be a string'),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['text', 'audio', 'video', 'image'])
        .withMessage('Type must be one of: text, audio, video, image'),
    (0, express_validator_1.body)('delivery_date')
        .optional()
        .isISO8601()
        .withMessage('Delivery date must be a valid date in ISO 8601 format'),
    (0, express_validator_1.body)('media_url').optional().isURL().withMessage('Media URL must be a valid URL'),
    (0, express_validator_1.body)('ai_prompt').optional().isString().withMessage('AI prompt must be a string'),
];
// Controller functions
const createMessage = async (req, res) => {
    try {
        // Check validation results
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return (0, responseFormatter_1.sendError)(res, errors.array()[0].msg, 400);
        }
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const messageData = req.body;
        const result = await messageService.createMessage(req.user.id, messageData);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Message created successfully', 201);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.createMessage = createMessage;
const getMessages = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const messages = await messageService.getMessagesByUserId(req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, messages, 'Messages retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getMessages = getMessages;
const getMessagesByChild = async (req, res) => {
    try {
        const { childId } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const messages = await messageService.getMessagesByChildId(childId, req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, messages, 'Messages retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getMessagesByChild = getMessagesByChild;
const getMessage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        const message = await messageService.getMessageById(id, req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, message, 'Message retrieved successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.getMessage = getMessage;
const updateMessage = async (req, res) => {
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
        const result = await messageService.updateMessage(id, req.user.id, updateData);
        return (0, responseFormatter_1.sendSuccess)(res, result, 'Message updated successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.updateMessage = updateMessage;
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id) {
            return (0, responseFormatter_1.sendError)(res, 'User not authenticated', 401);
        }
        await messageService.deleteMessage(id, req.user.id);
        return (0, responseFormatter_1.sendSuccess)(res, null, 'Message deleted successfully');
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            return (0, responseFormatter_1.sendError)(res, error.message, error.statusCode);
        }
        return (0, responseFormatter_1.sendError)(res, error.message, 500);
    }
};
exports.deleteMessage = deleteMessage;
