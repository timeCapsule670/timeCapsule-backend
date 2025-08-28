"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordWithOTP = exports.verifyOTP = exports.forgotPassword = exports.getUserProfile = exports.resetPassword = exports.loginUser = exports.registerUser = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const errorHandler_1 = require("../middleware/errorHandler");
const otpUtils_1 = require("../utils/otpUtils");
const emailService_1 = require("../utils/emailService");
const registerUser = async (userData) => {
    try {
        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase_1.default.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    username: userData.name, // or any key your DB trigger expects
                },
            },
        });
        if (authError) {
            throw new errorHandler_1.ApiError(400, authError.message);
        }
        if (!authData.user) {
            throw new errorHandler_1.ApiError(500, "User registration failed");
        }
        // No need to manually insert into 'users' table — trigger will handle it
        return {
            user: {
                id: authData.user.id,
                email: authData.user.email || "",
                username: userData.name, // Placeholder; actual profile name comes from 'directors'
                created_at: authData.user.created_at || new Date().toISOString(),
            },
            token: authData.session?.access_token || null,
        };
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Registration failed: ${error.message}`);
    }
};
exports.registerUser = registerUser;
const loginUser = async (credentials) => {
    try {
        // Login with Supabase Auth
        const { data, error } = await supabase_1.default.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });
        if (error) {
            throw new errorHandler_1.ApiError(401, error.message);
        }
        if (!data.user || !data.session) {
            throw new errorHandler_1.ApiError(401, "Login failed");
        }
        // Get user profile data from 'directors' table
        const { data: userData, error: profileError } = await supabase_1.default
            .from("directors")
            .select("username")
            .eq("auth_user_id", data.user.id) // ✅ Fix here
            .single();
        if (profileError) {
            throw new errorHandler_1.ApiError(500, `Failed to retrieve user profile: ${profileError.message}`);
        }
        return {
            user: {
                id: data.user.id,
                email: data.user.email || "",
                username: userData?.username || "",
                created_at: data.user.created_at || "",
            },
            token: data.session.access_token,
        };
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Login failed: ${error.message}`);
    }
};
exports.loginUser = loginUser;
const resetPassword = async (request) => {
    try {
        const { error } = await supabase_1.default.auth.resetPasswordForEmail(request.email, {
            redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
        });
        if (error) {
            throw new errorHandler_1.ApiError(400, error.message);
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Password reset failed: ${error.message}`);
    }
};
exports.resetPassword = resetPassword;
const getUserProfile = async (userId) => {
    try {
        const { data, error } = await supabase_1.default
            .from("directors") // updated from 'users'
            .select("*")
            .eq("id", userId)
            .single();
        if (error) {
            throw new errorHandler_1.ApiError(404, `User profile not found: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to get user profile: ${error.message}`);
    }
};
exports.getUserProfile = getUserProfile;
const forgotPassword = async (request) => {
    try {
        // For security reasons, we don't check if user exists
        // This prevents email enumeration attacks
        // We'll always attempt to send OTP and store it
        // Generate OTP
        const otp = otpUtils_1.OTPManager.generateOTP();
        // Store OTP in database
        await otpUtils_1.OTPManager.storeOTP(request.email, otp);
        // Send OTP email
        await emailService_1.EmailService.sendOTPEmail(request.email, otp);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        return {
            message: "OTP sent successfully. Please check your email.",
            expiresAt: expiresAt.toISOString()
        };
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to send OTP: ${error.message}`);
    }
};
exports.forgotPassword = forgotPassword;
const verifyOTP = async (request) => {
    try {
        const isValid = await otpUtils_1.OTPManager.verifyOTP(request.email, request.otp);
        if (!isValid) {
            throw new errorHandler_1.ApiError(400, "Invalid or expired OTP");
        }
        return { message: "OTP verified successfully" };
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `OTP verification failed: ${error.message}`);
    }
};
exports.verifyOTP = verifyOTP;
const resetPasswordWithOTP = async (request) => {
    try {
        // Verify OTP first
        const isValid = await otpUtils_1.OTPManager.verifyOTP(request.email, request.otp);
        if (!isValid) {
            throw new errorHandler_1.ApiError(400, "Invalid or expired OTP");
        }
        // Check if passwords match
        if (request.newPassword !== request.confirmPassword) {
            throw new errorHandler_1.ApiError(400, "Passwords do not match");
        }
        // Validate password requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(request.newPassword)) {
            throw new errorHandler_1.ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number");
        }
        // For mobile apps, we need to update the password directly
        // We'll use Supabase's admin API with service role key
        // First, get the user by email
        const { data: users, error: userError } = await supabase_1.default.auth.admin.listUsers();
        if (userError) {
            throw new errorHandler_1.ApiError(500, `Failed to get users: ${userError.message}`);
        }
        // Find the user by email
        const user = users.users.find(u => u.email === request.email);
        if (!user) {
            throw new errorHandler_1.ApiError(404, "User not found");
        }
        // Update the user's password
        const { error: updateError } = await supabase_1.default.auth.admin.updateUserById(user.id, { password: request.newPassword });
        if (updateError) {
            throw new errorHandler_1.ApiError(500, `Failed to update password: ${updateError.message}`);
        }
        // Delete OTP after successful password reset
        await otpUtils_1.OTPManager.deleteOTP(request.email);
        // Send confirmation email
        await emailService_1.EmailService.sendPasswordResetConfirmation(request.email);
        console.log(`[AUTH SERVICE] Password reset completed for ${request.email}`);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Password reset failed: ${error.message}`);
    }
};
exports.resetPasswordWithOTP = resetPasswordWithOTP;
