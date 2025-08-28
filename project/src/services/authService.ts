import supabase from "../config/supabase";
import {
  UserRegistration,
  UserLogin,
  AuthResponse,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  VerifyOTPRequest,
  ResetPasswordWithOTPRequest,
  OTPResponse,
} from "../types/auth";
import { ApiError } from "../middleware/errorHandler";
import { OTPManager } from "../utils/otpUtils";
import { EmailService } from "../utils/emailService";

export const registerUser = async (
  userData: UserRegistration
): Promise<AuthResponse> => {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.name, // or any key your DB trigger expects
        },
      },
    });

    if (authError) {
      throw new ApiError(400, authError.message);
    }

    if (!authData.user) {
      throw new ApiError(500, "User registration failed");
    }

    // No need to manually insert into 'users' table — trigger will handle it
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || "",
        username: userData.name, // Placeholder; actual profile name comes from 'directors'
        created_at: authData.user.created_at || new Date().toISOString(),
      },
      token: authData.session?.access_token || null,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Registration failed: ${(error as Error).message}`);
  }
};

export const loginUser = async (
  credentials: UserLogin
): Promise<AuthResponse> => {
  try {
    // Login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new ApiError(401, error.message);
    }

    if (!data.user || !data.session) {
      throw new ApiError(401, "Login failed");
    }

    // Get user profile data from 'directors' table
    const { data: userData, error: profileError } = await supabase
      .from("directors")
      .select("username")
      .eq("auth_user_id", data.user.id) // ✅ Fix here
      .single();

    if (profileError) {
      throw new ApiError(
        500,
        `Failed to retrieve user profile: ${profileError.message}`
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        username: userData?.username || "",
        created_at: data.user.created_at || "",
      },
      token: data.session.access_token,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Login failed: ${(error as Error).message}`);
  }
};

export const resetPassword = async (
  request: ResetPasswordRequest
): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      `Password reset failed: ${(error as Error).message}`
    );
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("directors") // updated from 'users'
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new ApiError(404, `User profile not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      `Failed to get user profile: ${(error as Error).message}`
    );
  }
};

export const forgotPassword = async (
  request: ForgotPasswordRequest
): Promise<OTPResponse> => {
  try {
    // For security reasons, we don't check if user exists
    // This prevents email enumeration attacks
    // We'll always attempt to send OTP and store it
    
    // Generate OTP
    const otp = OTPManager.generateOTP();
    
    // Store OTP in database
    await OTPManager.storeOTP(request.email, otp);
    
    // Try to get username from directors table
    let userName: string | undefined;
    try {
      // First get the auth user ID from Supabase auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers.users) {
        const authUser = authUsers.users.find(u => u.email === request.email);
        
        if (authUser) {
          // Get username from directors table
          const { data: directorData, error: directorError } = await supabase
            .from("directors")
            .select("username")
            .eq("auth_user_id", authUser.id)
            .single();
          
          if (!directorError && directorData) {
            userName = directorData.username;
          }
        }
      }
    } catch (profileError) {
      // If we can't get the username, we'll use the email prefix
      console.log(`[AUTH SERVICE] Could not fetch username for ${request.email}, using email prefix`);
    }
    
    // Send OTP email with username if available
    await EmailService.sendOTPEmail(request.email, otp, userName);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    return {
      message: "OTP sent successfully. Please check your email.",
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to send OTP: ${(error as Error).message}`);
  }
};

export const verifyOTP = async (
  request: VerifyOTPRequest
): Promise<{ message: string }> => {
  try {
    const isValid = await OTPManager.verifyOTP(request.email, request.otp);
    
    if (!isValid) {
      throw new ApiError(400, "Invalid or expired OTP");
    }
    
    return { message: "OTP verified successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `OTP verification failed: ${(error as Error).message}`);
  }
};

export const resetPasswordWithOTP = async (
  request: ResetPasswordWithOTPRequest
): Promise<void> => {
  try {
    // Verify OTP first
    const isValid = await OTPManager.verifyOTP(request.email, request.otp);
    
    if (!isValid) {
      throw new ApiError(400, "Invalid or expired OTP");
    }
    
    // Check if passwords match
    if (request.newPassword !== request.confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }
    
    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(request.newPassword)) {
      throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number");
    }
    
    // For mobile apps, we need to update the password directly
    // We'll use Supabase's admin API with service role key
    
    // First, get the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new ApiError(500, `Failed to get users: ${userError.message}`);
    }
    
    // Find the user by email
    const user = users.users.find(u => u.email === request.email);
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: request.newPassword }
    );
    
    if (updateError) {
      throw new ApiError(500, `Failed to update password: ${updateError.message}`);
    }
    
    // Delete OTP after successful password reset
    await OTPManager.deleteOTP(request.email);
    
    // Try to get username for confirmation email
    let userName: string | undefined;
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers.users) {
        const authUser = authUsers.users.find(u => u.email === request.email);
        
        if (authUser) {
          const { data: directorData, error: directorError } = await supabase
            .from("directors")
            .select("username")
            .eq("auth_user_id", authUser.id)
            .single();
          
          if (!directorError && directorData) {
            userName = directorData.username;
          }
        }
      }
    } catch (profileError) {
      console.log(`[AUTH SERVICE] Could not fetch username for confirmation email to ${request.email}`);
    }
    
    // Send confirmation email
    await EmailService.sendPasswordResetConfirmation(request.email, userName);
    
    console.log(`[AUTH SERVICE] Password reset completed for ${request.email}`);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Password reset failed: ${(error as Error).message}`);
  }
};
