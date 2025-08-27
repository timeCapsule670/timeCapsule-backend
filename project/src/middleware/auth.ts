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

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Development bypass - uncomment this line to bypass role checks during development
    // if (process.env.NODE_ENV === 'development') return next();

    // Debug logging
    console.log('Authorization check:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      requiredRoles: roles,
      hasRole: req.user?.role && roles.includes(req.user.role)
    });

    // Check if user exists and has a role
    if (!req.user) {
      return res.status(403).json({
        success: false,
        error: 'User not authenticated for authorization.'
      });
    }

    // If no specific role is required, allow access
    if (roles.length === 0) {
      return next();
    }

    // Check if user has any of the required roles
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role || 'none'}.`
      });
    }

    next();
  };
};