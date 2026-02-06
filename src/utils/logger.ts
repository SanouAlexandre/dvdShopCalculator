/**
 * Logger configuration module.
 * 
 * Provides a centralized logging facility using Winston.
 * Supports different log levels based on environment:
 * - Development: Console output with colors
 * - Production: Console + file logging (error.log and combined.log)
 * - Serverless (Vercel): Console only (no file system access)
 * 
 * @module logger
 */

import winston from 'winston';

/**
 * Custom log format combining timestamp, level, and message.
 * Includes stack trace for error logs.
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    // Include stack trace for errors if available
    if (stack && typeof stack === 'string') {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

/**
 * Winston logger instance configured for the application.
 * 
 * Log levels (in order of priority):
 * - error: Critical errors requiring immediate attention
 * - warn: Warning conditions that should be reviewed
 * - info: Informational messages about normal operation
 * - debug: Detailed debugging information
 * 
 * @example
 * logger.info('Server started on port 3000');
 * logger.error('Database connection failed', new Error('Connection timeout'));
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});

/**
 * Add file transports in production environment.
 * Skipped in serverless environments (Vercel) where file system is read-only.
 * 
 * Files created:
 * - logs/error.log: Contains only error-level logs
 * - logs/combined.log: Contains all log levels
 */
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  // Error log file - only error level messages
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  // Combined log file - all log levels
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export { logger };
