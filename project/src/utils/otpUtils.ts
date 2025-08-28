import supabase from '../config/supabase';

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export interface OTPData {
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

export class OTPManager {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly OTP_TABLE = 'password_reset_otps';

  /**
   * Generate a random 6-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP in database
   */
  static async storeOTP(email: string, otp: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete any existing OTPs for this email
    await supabase
      .from(this.OTP_TABLE)
      .delete()
      .eq('email', email);

    // Insert new OTP
    const { error } = await supabase
      .from(this.OTP_TABLE)
      .insert({
        email,
        otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to store OTP: ${error.message}`);
    }
  }

  /**
   * Verify OTP from database
   */
  static async verifyOTP(email: string, otp: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.OTP_TABLE)
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > new Date(data.expires_at)) {
      // Delete expired OTP
      await supabase
        .from(this.OTP_TABLE)
        .delete()
        .eq('email', email);
      return false;
    }

    // Check if max attempts exceeded
    if (data.attempts >= this.MAX_ATTEMPTS) {
      // Delete OTP after max attempts
      await supabase
        .from(this.OTP_TABLE)
        .delete()
        .eq('email', email);
      return false;
    }

    // Increment attempts
    await supabase
      .from(this.OTP_TABLE)
      .update({ attempts: data.attempts + 1 })
      .eq('email', email);

    return true;
  }

  /**
   * Delete OTP after successful use
   */
  static async deleteOTP(email: string): Promise<void> {
    await supabase
      .from(this.OTP_TABLE)
      .delete()
      .eq('email', email);
  }

  /**
   * Clean up expired OTPs
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    // Delete expired OTPs
    const { error } = await supabase
      .from(this.OTP_TABLE)
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to cleanup expired OTPs:', error);
    }
  }
}

// Clean up expired OTPs every hour
setInterval(() => {
  OTPManager.cleanupExpiredOTPs();
}, 60 * 60 * 1000);
