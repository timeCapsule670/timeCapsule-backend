// SendGrid email service utility
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static readonly SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  private static readonly SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
  private static readonly OTP_TEMPLATE_ID = 'd-573c6eebb45a4a7abefe49a6c12ce70c';

  /**
   * Initialize SendGrid with API key
   */
  private static initializeSendGrid(): void {
    if (!this.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }
    sgMail.setApiKey(this.SENDGRID_API_KEY);
  }

  /**
   * Send OTP email using SendGrid template
   */
  static async sendOTPEmail(email: string, otp: string, userName?: string): Promise<void> {
    try {
      this.initializeSendGrid();

      const msg = {
        to: email,
        from: this.SENDGRID_FROM_EMAIL,
        templateId: this.OTP_TEMPLATE_ID,
        dynamicTemplateData: {
          name: userName || email.split('@')[0], // Use provided name or extract from email
          otp: otp
        }
      };

      await sgMail.send(msg);
      console.log(`[EMAIL SERVICE] OTP ${otp} sent to ${email} via SendGrid template`);
    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmation(email: string, userName?: string): Promise<void> {
    try {
      this.initializeSendGrid();

      const msg = {
        to: email,
        from: this.SENDGRID_FROM_EMAIL,
        subject: 'Password Reset Successful',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Password Reset Successful</h2>
            <p>Hello ${userName || 'there'},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't perform this action, please contact support immediately.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `
      };

      await sgMail.send(msg);
      console.log(`[EMAIL SERVICE] Password reset confirmation sent to ${email} via SendGrid`);
    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending password reset confirmation:', error);
      throw new Error('Failed to send password reset confirmation email');
    }
  }

  /**
   * Generic email sending method
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      this.initializeSendGrid();

      const msg = {
        to: options.to,
        from: this.SENDGRID_FROM_EMAIL,
        subject: options.subject,
        html: options.html
      };

      await sgMail.send(msg);
      console.log(`[EMAIL SERVICE] Email sent to ${options.to}`);
    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}
