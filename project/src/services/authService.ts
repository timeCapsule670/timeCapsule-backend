import supabase from "../config/supabase";
import {
  UserRegistration,
  UserLogin,
  AuthResponse,
  ResetPasswordRequest,
} from "../types/auth";
import { ApiError } from "../middleware/errorHandler";

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
