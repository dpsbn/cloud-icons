import pino from 'pino';

// Configure the logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
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
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create namespaced loggers for different parts of the application
export const createLogger = (namespace: string) => {
  return logger.child({ namespace });
};

// Default logger
export default logger;
