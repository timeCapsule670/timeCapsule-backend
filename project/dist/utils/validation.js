"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateChildProfileData = exports.convertDateFormat = exports.validateBirthday = exports.validateChildName = exports.ValidationError = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
class ValidationError extends errorHandler_1.ApiError {
    constructor(message) {
        super(400, message);
    }
}
exports.ValidationError = ValidationError;
/**
 * Validates child name according to requirements
 */
const validateChildName = (name) => {
    const errors = [];
    if (!name || typeof name !== 'string') {
        errors.push('Name is required and must be a string');
        return { isValid: false, errors };
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    if (trimmedName.length > 50) {
        errors.push('Name cannot exceed 50 characters');
    }
    // Allow alphanumeric characters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z0-9\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
        errors.push('Name can only contain letters, numbers, spaces, hyphens, and apostrophes');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateChildName = validateChildName;
/**
 * Validates birthday according to requirements
 */
const validateBirthday = (birthday) => {
    const errors = [];
    if (!birthday || typeof birthday !== 'string') {
        errors.push('Birthday is required and must be a string');
        return { isValid: false, errors };
    }
    // Check if it's a valid date
    const date = new Date(birthday);
    if (isNaN(date.getTime())) {
        errors.push('Birthday must be a valid date');
        return { isValid: false, errors };
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const birthYear = date.getFullYear();
    // Check if date is in the future
    if (date > now) {
        errors.push('Birthday cannot be in the future');
    }
    // Check if date is more than 120 years ago
    if (currentYear - birthYear > 120) {
        errors.push('Birthday cannot be more than 120 years ago');
    }
    // Check if date is less than 1 year ago (reasonable minimum for a child)
    if (currentYear - birthYear < 1) {
        errors.push('Birthday must be at least 1 year ago');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateBirthday = validateBirthday;
/**
 * Converts MM/DD/YYYY format to ISO date format (YYYY-MM-DD)
 */
const convertDateFormat = (dateString) => {
    // Check if it's already in ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    // Check if it's in MM/DD/YYYY format
    const mmddyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(mmddyyyyRegex);
    if (match) {
        const [, month, day, year] = match;
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
    }
    // If it's in DD/MM/YYYY format, assume and convert
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmatch = dateString.match(ddmmyyyyRegex);
    if (ddmatch) {
        const [, day, month, year] = ddmatch;
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
    }
    // If format is unrecognized, return as is (will be validated later)
    return dateString;
};
exports.convertDateFormat = convertDateFormat;
/**
 * Validates the complete child profile data
 */
const validateChildProfileData = (childData) => {
    const errors = [];
    // Validate name
    const nameValidation = (0, exports.validateChildName)(childData.first_name);
    if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
    }
    // Validate birthday
    const birthdayValidation = (0, exports.validateBirthday)(childData.date_of_birth);
    if (!birthdayValidation.isValid) {
        errors.push(...birthdayValidation.errors);
    }
    // Validate gender if provided
    if (childData.gender !== undefined && childData.gender !== null) {
        if (typeof childData.gender !== 'string') {
            errors.push('Gender must be a string');
        }
        else if (!['male', 'female', 'other', 'prefer-not-to-say'].includes(childData.gender.toLowerCase())) {
            errors.push('Gender must be one of: male, female, other, prefer-not-to-say');
        }
    }
    // Validate notes if provided
    if (childData.notes !== undefined && childData.notes !== null) {
        if (typeof childData.notes !== 'string') {
            errors.push('Notes must be a string');
        }
        else if (childData.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateChildProfileData = validateChildProfileData;
/**
 * Sanitizes input data to prevent injection attacks
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return '';
    }
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};
exports.sanitizeInput = sanitizeInput;
