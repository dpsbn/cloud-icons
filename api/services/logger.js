"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const pino_1 = __importDefault(require("pino"));
// Configure the logger
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: undefined, // Don't include pid and hostname in every log
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
});
// Create namespaced loggers for different parts of the application
const createLogger = (namespace) => {
    return logger.child({ namespace });
};
exports.createLogger = createLogger;
// Default logger
exports.default = logger;
