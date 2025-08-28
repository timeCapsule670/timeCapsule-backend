-- Create password reset OTPs table
-- This table stores OTPs for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_password_reset_otps_updated_at 
    BEFORE UPDATE ON password_reset_otps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE password_reset_otps IS 'Stores OTPs for password reset functionality';
COMMENT ON COLUMN password_reset_otps.email IS 'User email address';
COMMENT ON COLUMN password_reset_otps.otp IS '6-digit OTP code';
COMMENT ON COLUMN password_reset_otps.expires_at IS 'OTP expiration timestamp';
COMMENT ON COLUMN password_reset_otps.attempts IS 'Number of verification attempts';
COMMENT ON COLUMN password_reset_otps.created_at IS 'OTP creation timestamp';
COMMENT ON COLUMN password_reset_otps.updated_at IS 'OTP last update timestamp';
