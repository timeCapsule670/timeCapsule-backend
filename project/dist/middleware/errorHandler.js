"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = void 0;
// Custom error class
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Handle known errors with status code
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    // Handle unexpected errors
    return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
    });
};
exports.errorHandler = errorHandler;
