import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Log format with timestamp and JSON structure
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development (colorized and readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${String(timestamp)} [${String(level)}]: ${String(message)} ${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport for all logs
    new DailyRotateFile({
      dirname: path.join(__dirname, '../../logs'),
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),
    // Separate file for errors
    new DailyRotateFile({
      dirname: path.join(__dirname, '../../logs'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),
  ],
});

// Add http log level
logger.level = process.env.LOG_LEVEL || 'info';

/**
 * Log API request with timing information
 */
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: Record<string, unknown>
): void => {
  logger.http('API Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...context,
  });
};

/**
 * Log error with stack trace
 */
export const logError = (
  message: string,
  error: Error,
  context?: Record<string, unknown>
): void => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

/**
 * Log informational message with category
 */
export const logInfo = (
  category: string,
  message: string,
  context?: Record<string, unknown>
): void => {
  logger.info(message, { category, ...context });
};

/**
 * Log debug message with category
 */
export const logDebug = (
  category: string,
  message: string,
  context?: Record<string, unknown>
): void => {
  logger.debug(message, { category, ...context });
};

/**
 * Log warning message with category
 */
export const logWarn = (
  category: string,
  message: string,
  context?: Record<string, unknown>
): void => {
  logger.warn(message, { category, ...context });
};

export default logger;
