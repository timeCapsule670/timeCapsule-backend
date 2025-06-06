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