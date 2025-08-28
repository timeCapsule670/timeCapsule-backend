# Forgot Password Setup Guide

This guide explains how to set up and use the forgot password functionality in your TimeCapsule backend application.

## Prerequisites

1. **Database**: PostgreSQL database with Supabase or similar setup
2. **Node.js**: Version 14 or higher
3. **Dependencies**: All required npm packages installed

## Setup Steps

### 1. Database Setup

Run the SQL script to create the required table:

```bash
# Connect to your PostgreSQL database
psql -h your-host -U your-username -d your-database

# Run the SQL script
\i password_reset_otps_table.sql
```

Or copy and paste the contents of `password_reset_otps_table.sql` into your database client.

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email service configuration (for production)
EMAIL_SERVICE=sendgrid  # or 'ses', 'nodemailer', etc.
EMAIL_API_KEY=your_email_service_api_key
EMAIL_FROM=noreply@yourdomain.com

# Password reset redirect URL (optional)
PASSWORD_RESET_REDIRECT_URL=https://yourdomain.com/reset-password

# OTP configuration (optional, defaults are fine)
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
```

### 3. Install Dependencies

If you plan to use a real email service, install the appropriate package:

```bash
# For SendGrid
npm install @sendgrid/mail

# For AWS SES
npm install @aws-sdk/client-ses

# For Nodemailer
npm install nodemailer
```

### 4. Configure Email Service

Update the `EmailService` class in `src/utils/emailService.ts` to use your preferred email provider.

Example with SendGrid:

```typescript
import sgMail from '@sendgrid/mail';

export class EmailService {
  static async sendOTPEmail(email: string, otp: string): Promise<void> {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: 'Password Reset OTP',
      html: `...` // Your HTML template
    };
    
    await sgMail.send(msg);
  }
}
```

## Testing the Implementation

### 1. Start Your Server

```bash
npm run dev
# or
npm start
```

### 2. Test with Postman

Import the `forgot_password_postman_collection.json` file into Postman and test the endpoints.

### 3. Test with cURL

```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Step 2: Verify OTP (check console for OTP)
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'

# Step 3: Reset Password
curl -X POST http://localhost:3000/auth/reset-password-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

## Development vs Production

### Development Mode

- OTPs are logged to the console
- Email service logs operations instead of sending emails
- All operations are logged for debugging

### Production Mode

- Replace email service with real email provider
- Remove console.log statements
- Set up proper monitoring and logging
- Configure rate limiting if needed

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Max Attempts**: Maximum 3 attempts to verify OTP
3. **Automatic Cleanup**: Expired OTPs are cleaned up every hour
4. **Password Validation**: Strict password requirements enforced
5. **Input Validation**: Comprehensive validation on all endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your database connection string
   - Ensure the `password_reset_otps` table exists

2. **OTP Not Being Sent**
   - Check console logs for OTP (development mode)
   - Verify email service configuration
   - Check environment variables

3. **Validation Errors**
   - Ensure all required fields are provided
   - Check password requirements
   - Verify email format

4. **OTP Verification Fails**
   - Check if OTP has expired (10 minutes)
   - Verify OTP format (6 digits)
   - Check if max attempts exceeded

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
NODE_ENV=development
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/forgot-password` | POST | Request OTP |
| `/auth/verify-otp` | POST | Verify OTP |
| `/auth/reset-password-with-otp` | POST | Reset password |

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Passwords must match exactly

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your database connection
3. Ensure all environment variables are set
4. Check the API documentation in `FORGOT_PASSWORD_API_DOCS.md`

## Next Steps

1. **Customize Email Templates**: Update the HTML templates in `EmailService`
2. **Add Rate Limiting**: Implement rate limiting for production use
3. **SMS Support**: Add SMS OTP support for phone numbers
4. **Monitoring**: Set up monitoring and alerting for failed attempts
5. **Analytics**: Track password reset usage and success rates
