import express from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', authController.registerValidation, authController.register);
router.post('/login', authController.loginValidation, authController.login);
router.post('/reset-password', authController.resetPasswordValidation, authController.resetPassword);

// New forgot password flow endpoints
router.post('/forgot-password', authController.forgotPasswordValidation, authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTPValidation, authController.verifyOTP);
router.post('/reset-password-with-otp', authController.resetPasswordWithOTPValidation, authController.resetPasswordWithOTP);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

export default router;