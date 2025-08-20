"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const authenticate = async (req, res, next) => {
    try {
        // Get JWT token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please provide a valid token.'
            });
        }
        const token = authHeader.split(' ')[1];
        // Verify the token with Supabase
        const { data, error } = await supabase_1.default.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token.'
            });
        }
        // Add user data to request
        req.user = {
            id: data.user.id,
            email: data.user.email || '',
            role: data.user.app_metadata?.role
        };
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication error occurred.'
        });
    }
};
exports.authenticate = authenticate;
// Optional: Add role-based authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this resource.'
            });
        }
        next();
    };
};
exports.authorize = authorize;
