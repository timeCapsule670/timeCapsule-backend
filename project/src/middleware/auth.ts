import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get JWT token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.'
      });
    }

    // Add user data to request
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.app_metadata?.role
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error occurred.'
    });
  }
};

// Optional: Add role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource.'
      });
    }
    next();
  };
};