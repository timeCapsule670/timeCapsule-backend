export interface UserRegistration {
  email: string;
  password: string;
  name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  user: UserResponse | null;
  token: string | null;
  error?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

// New interfaces for forgot password flow
export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordWithOTPRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OTPResponse {
  message: string;
  expiresAt: string;
}