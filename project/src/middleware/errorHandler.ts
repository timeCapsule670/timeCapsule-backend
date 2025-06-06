import { Request, Response, NextFunction } from 'express';

// Custom error class
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle known errors with status code
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again later.'
  });
};