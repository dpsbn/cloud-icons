"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../services/logger"));
// Custom error class with status code
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Indicates this is a known operational error
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Error handler middleware
const errorHandler = (err, req, res, _next) => {
    logger_1.default.error({
        err,
        url: req.url,
        method: req.method,
        ip: req.ip,
    }, 'Error occurred');
    // Default error values
    let statusCode = 500;
    let message = 'Internal Server Error';
    let stack = undefined;
    // If this is our custom AppError, use its properties
    if ('statusCode' in err) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err.name === 'ValidationError') {
        // Handle validation errors (e.g., from a validation library)
        statusCode = 400;
        message = err.message;
    }
    else if (err.name === 'SyntaxError') {
        // Handle JSON parsing errors
        statusCode = 400;
        message = 'Invalid JSON';
    }
    else if (err.name === 'CastError') {
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
        ...(err.validationErrors && { validationErrors: err.validationErrors }),
        timestamp: new Date().toISOString(),
    });
};
exports.errorHandler = errorHandler;
// 404 handler middleware - should be used before the error handler
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Cannot ${req.method} ${req.url}`, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
