"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const errorHandler_1 = require("./errorHandler");
// Middleware factory for validating requests with Zod schemas
const validate = (schema) => async (req, _res, next) => {
    try {
        // Validate request against schema
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        // If validation passes, continue to the next middleware
        return next();
    }
    catch (error) {
        // If validation fails, format the error and pass it to the error handler
        if (error instanceof zod_1.ZodError) {
            // Format Zod validation errors
            const formattedErrors = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            // Create a 400 Bad Request error with formatted validation errors
            const validationError = new errorHandler_1.AppError('Validation failed', 400);
            validationError.validationErrors = formattedErrors;
            return next(validationError);
        }
        // For other errors, pass them to the error handler
        return next(error);
    }
};
exports.validate = validate;
