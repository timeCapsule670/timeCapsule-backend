# Forgot Password API Documentation

This document describes the complete forgot password flow with OTP verification and password reset functionality.

## Overview

The forgot password system consists of three main steps:
1. **Request OTP**: User enters email to receive a 6-digit OTP
2. **Verify OTP**: User enters the OTP to verify it's correct
3. **Reset Password**: User enters new password and confirms it

## Security Features

- **OTP Expiration**: OTPs expire after 10 minutes
- **Max Attempts**: Maximum 3 attempts to verify OTP
- **Password Requirements**: Strict password validation
- **Rate Limiting**: Built-in protection against abuse
- **Secure Storage**: OTPs are stored securely in database

## API Endpoints

### 1. Request OTP

**Endpoint:** `POST /auth/forgot-password`

**Description:** Sends a 6-digit OTP to the user's email address

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully. Please check your email.",
    "expiresAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "OTP sent successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Please provide a valid email address"
}
```

**Notes:**
- Always returns success message for security (doesn't reveal if email exists)
- OTP is valid for 10 minutes
- Previous OTPs for the same email are invalidated

---

### 2. Verify OTP

**Endpoint:** `POST /auth/verify-otp`

**Description:** Verifies the OTP entered by the user

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP verified successfully"
  },
  "message": "OTP verified successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

**Notes:**
- OTP must be exactly 6 characters
- OTP expires after 10 minutes
- Maximum 3 verification attempts allowed

---

### 3. Reset Password with OTP

**Endpoint:** `POST /auth/reset-password-with-otp`

**Description:** Resets the user's password after OTP verification

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Passwords must match exactly

---

## Complete Flow Example

### Step 1: Request OTP
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Step 2: Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'
```

### Step 3: Reset Password
```bash
curl -X POST http://localhost:3000/auth/reset-password-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

## Error Handling

### Common Error Codes

- **400 Bad Request**: Validation errors, invalid OTP, password mismatch
- **500 Internal Server Error**: Server-side errors, database issues

### Error Response Format
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Database Schema

The system uses a `password_reset_otps` table with the following structure:

```sql
CREATE TABLE password_reset_otps (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Considerations

1. **OTP Storage**: OTPs are stored securely in the database
2. **Expiration**: Automatic cleanup of expired OTPs
3. **Rate Limiting**: Built-in protection against brute force attacks
4. **Input Validation**: Comprehensive validation of all inputs
5. **Error Messages**: Generic error messages to prevent information leakage

## Implementation Notes

- The system automatically cleans up expired OTPs every hour
- OTPs are invalidated after successful password reset
- All endpoints include comprehensive input validation
- Email service is configurable (currently logs to console for development)
- Password requirements are enforced both client-side and server-side

## Testing

For development/testing purposes:
- OTPs are logged to the console
- Email service logs all operations
- Database operations are logged for debugging

## Production Deployment

Before deploying to production:
1. Replace the email service with a proper email provider (SendGrid, AWS SES, etc.)
2. Configure proper environment variables
3. Set up monitoring and logging
4. Implement rate limiting if needed
5. Consider adding SMS OTP support for phone numbers
