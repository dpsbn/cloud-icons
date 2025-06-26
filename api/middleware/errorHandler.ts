import { NextFunction, Request, Response } from 'express';
import logger from '../services/logger';

// Custom error class with status code
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates this is a known operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(
    {
      err,
      url: req.url,
      method: req.method,
      ip: req.ip,
    },
    'Error occurred'
  );

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let stack: string | undefined = undefined;

  // If this is our custom AppError, use its properties
  if ('statusCode' in err) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from a validation library)
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'SyntaxError') {
    // Handle JSON parsing errors
    statusCode = 400;
    message = 'Invalid JSON';
  } else if (err.name === 'CastError') {
    // Handle database casting errors
    statusCode = 400;
    message = 'Invalid data format';
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  // Send the error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(stack && { stack }),
    ...((err as any).validationErrors && { validationErrors: (err as any).validationErrors }),
    timestamp: new Date().toISOString(),
  });
};

// 404 handler middleware - should be used before the error handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Cannot ${req.method} ${req.url}`, 404);
  next(err);
};
