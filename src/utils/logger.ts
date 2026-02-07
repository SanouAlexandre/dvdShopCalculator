/**
 * Logger configuration module.
 *
 * Provides a centralized logging facility using Winston.
 * Supports different log levels based on environment:
 * - Development: Console output with colors
 * - Production: Console + file logging (error.log and combined.log)
 * - Serverless (Vercel): Console only (no file system access)
 *
 * Optional transports:
 * - Loki: Push logs to Grafana Loki for aggregation
 *   Configure via LOKI_HOST environment variable
 *
 * @module logger
 */

import winston from 'winston';

/** Loki transport for remote log aggregation */
let LokiTransport: typeof import('winston-loki') | null = null;

/**
 * Attempt to load winston-loki transport.
 * Fails silently if not installed.
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LokiTransport = require('winston-loki');
} catch {
  // winston-loki not installed, skip
}

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

/**
 * Loki configuration.
 * Set LOKI_HOST to enable Grafana Loki integration.
 *
 * Environment variables:
 * - LOKI_HOST: Loki push API endpoint (e.g., http://loki:3100)
 * - LOKI_BASIC_AUTH: Optional basic auth credentials (user:password)
 * - SERVICE_NAME: Service name label (default: dvd-shop-calculator)
 *
 * @example
 * LOKI_HOST=http://localhost:3100 npm start
 */
const LOKI_HOST = process.env.LOKI_HOST;

if (LOKI_HOST && LokiTransport) {
  const lokiLabels: Record<string, string> = {
    app: process.env.SERVICE_NAME || 'dvd-shop-calculator',
    env: process.env.NODE_ENV || 'development',
  };

  // Add hostname if available
  if (process.env.HOSTNAME) {
    lokiLabels.host = process.env.HOSTNAME;
  }

  interface LokiOptions {
    host: string;
    labels: Record<string, string>;
    json: boolean;
    format: ReturnType<typeof winston.format.json>;
    replaceTimestamp: boolean;
    onConnectionError: (err: Error) => void;
    basicAuth?: string;
  }

  const lokiOptions: LokiOptions = {
    host: LOKI_HOST,
    labels: lokiLabels,
    json: true,
    format: winston.format.json(),
    replaceTimestamp: true,
    onConnectionError: (err: Error) => {
      console.error('[Loki] Connection error:', err.message);
    },
  };

  // Add basic auth if configured
  if (process.env.LOKI_BASIC_AUTH) {
    lokiOptions.basicAuth = process.env.LOKI_BASIC_AUTH;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger.add(new LokiTransport(lokiOptions as any));
  console.log(`[Loki] Transport configured for ${LOKI_HOST}`);
} else if (LOKI_HOST && !LokiTransport) {
  console.warn('[Loki] LOKI_HOST configured but winston-loki not installed');
}

export { logger };
