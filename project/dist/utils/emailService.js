"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
// SendGrid email service utility
const mail_1 = __importDefault(require("@sendgrid/mail"));
class EmailService {
    /**
     * Initialize SendGrid with API key
     */
    static initializeSendGrid() {
        if (!this.SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY environment variable is required');
        }
        mail_1.default.setApiKey(this.SENDGRID_API_KEY);
    }
    /**
     * Send OTP email using SendGrid template
     */
    static async sendOTPEmail(email, otp) {
        try {
            this.initializeSendGrid();
            const msg = {
                to: email,
                from: this.SENDGRID_FROM_EMAIL,
                templateId: this.OTP_TEMPLATE_ID,
                dynamicTemplateData: {
                    otp: otp,
                    email: email,
                    expiryMinutes: 10
                }
            };
            await mail_1.default.send(msg);
            console.log(`[EMAIL SERVICE] OTP ${otp} sent to ${email} via SendGrid template`);
        }
        catch (error) {
            console.error('[EMAIL SERVICE] Error sending OTP email:', error);
            throw new Error('Failed to send OTP email');
        }
    }
    /**
     * Send password reset confirmation email
     */
    static async sendPasswordResetConfirmation(email) {
        try {
            this.initializeSendGrid();
            const msg = {
                to: email,
                from: this.SENDGRID_FROM_EMAIL,
                subject: 'Password Reset Successful',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't perform this action, please contact support immediately.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `
            };
            await mail_1.default.send(msg);
            console.log(`[EMAIL SERVICE] Password reset confirmation sent to ${email} via SendGrid`);
        }
        catch (error) {
            console.error('[EMAIL SERVICE] Error sending password reset confirmation:', error);
            throw new Error('Failed to send password reset confirmation email');
        }
    }
    /**
     * Generic email sending method
     */
    static async sendEmail(options) {
        try {
            this.initializeSendGrid();
            const msg = {
                to: options.to,
                from: this.SENDGRID_FROM_EMAIL,
                subject: options.subject,
                html: options.html
            };
            await mail_1.default.send(msg);
            console.log(`[EMAIL SERVICE] Email sent to ${options.to}`);
        }
        catch (error) {
            console.error('[EMAIL SERVICE] Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
}
exports.EmailService = EmailService;
EmailService.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
EmailService.SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
EmailService.OTP_TEMPLATE_ID = 'd-573c6eebb45a4a7abefe49a6c12ce70c';
