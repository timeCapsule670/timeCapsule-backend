# SendGrid Email Service Setup

This guide explains how to set up SendGrid email service for the TimeCapsule backend.

## Prerequisites

1. **SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **API Key**: Generate an API key from your SendGrid dashboard
3. **Sender Verification**: Verify your sender email address in SendGrid

## Installation

Install the required packages:

```bash
npm install @sendgrid/mail @types/sendgrid__mail
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## Template Configuration

The OTP email service uses SendGrid template ID: `d-573c6eebb45a4a7abefe49a6c12ce70c`

### Template Variables

The following dynamic template data is sent to your SendGrid template:

- `otp`: The generated OTP code
- `email`: The recipient's email address
- `expiryMinutes`: OTP expiry time (10 minutes)

### Template Setup in SendGrid

1. Go to your SendGrid dashboard
2. Navigate to **Email API** > **Dynamic Templates**
3. Create a new template or use the existing one with ID `d-573c6eebb45a4a7abefe49a6c12ce70c`
4. Design your email template using the variables above

Example template content:
```html
<h2>Password Reset Request</h2>
<p>You have requested to reset your password. Use the following OTP to proceed:</p>
<div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
  <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">{{otp}}</h1>
</div>
<p><strong>This OTP will expire in {{expiryMinutes}} minutes.</strong></p>
<p>If you didn't request this password reset, please ignore this email.</p>
```

## Usage

The email service is automatically used by the authentication system:

```typescript
import { EmailService } from './utils/emailService';

// Send OTP email
await EmailService.sendOTPEmail('user@example.com', '123456');

// Send password reset confirmation
await EmailService.sendPasswordResetConfirmation('user@example.com');

// Send custom email
await EmailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<p>Custom HTML content</p>'
});
```

## Error Handling

The service includes comprehensive error handling:
- Validates required environment variables
- Catches and logs SendGrid API errors
- Throws meaningful error messages for debugging

## Testing

To test the email service:

1. Set up your environment variables
2. Ensure your SendGrid account is active
3. Test with a verified sender email
4. Check SendGrid activity logs for delivery status

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Verify your SendGrid API key is correct
2. **Sender Not Verified**: Ensure your sender email is verified in SendGrid
3. **Template Not Found**: Check that the template ID exists and is accessible
4. **Rate Limits**: Monitor your SendGrid usage and upgrade if needed

### Debug Mode

Enable debug logging by checking the console output for detailed error messages.

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for sensitive configuration
- Regularly rotate your SendGrid API keys
- Monitor email sending activity for suspicious patterns
