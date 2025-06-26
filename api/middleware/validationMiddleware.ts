import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

// Middleware factory for validating requests with Zod schemas
export const validate =
  (schema: AnyZodObject) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate request against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If validation passes, continue to the next middleware
      return next();
    } catch (error) {
      // If validation fails, format the error and pass it to the error handler
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        // Create a 400 Bad Request error with formatted validation errors
        const validationError = new AppError('Validation failed', 400);
        (validationError as any).validationErrors = formattedErrors;

        return next(validationError);
      }

      // For other errors, pass them to the error handler
      return next(error);
    }
  };
