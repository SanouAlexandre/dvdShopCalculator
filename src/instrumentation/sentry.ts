/**
 * Sentry Instrumentation Module.
 *
 * This module initializes Sentry for error tracking and performance monitoring.
 * It must be imported BEFORE any other modules to properly instrument them.
 *
 * Configuration via environment variables:
 * - SENTRY_DSN: Your Sentry project DSN (required for Sentry to work)
 * - SENTRY_ENVIRONMENT: Environment name (e.g., production, staging)
 * - SENTRY_RELEASE: Release version (optional, defaults to package version)
 *
 * @module instrumentation/sentry
 * @see https://docs.sentry.io/platforms/node/
 */

import * as Sentry from '@sentry/node';

/**
 * Sentry DSN from environment variables.
 * If not set, Sentry will be disabled.
 */
const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Current environment (production, staging, development).
 */
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

/**
 * Release version for tracking deployments.
 */
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || process.env.npm_package_version;

/**
 * Initialize Sentry SDK.
 * Only initializes if SENTRY_DSN is provided.
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.log('[Sentry] Disabled - SENTRY_DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Performance Monitoring
    // Capture 100% of transactions in development, 10% in production
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1,

    // Profiling (requires additional setup)
    profilesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1,

    // Integration options
    integrations: [
      // Automatically capture unhandled exceptions
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Ignore common non-critical errors
      'ECONNRESET',
      'ETIMEDOUT',
    ],
  });

  console.log(`[Sentry] Initialized for ${SENTRY_ENVIRONMENT} environment`);
}

/**
 * Captures an exception and sends it to Sentry.
 *
 * @param error - The error to capture
 * @param context - Additional context for the error
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Captures a message and sends it to Sentry.
 *
 * @param message - The message to capture
 * @param level - Severity level
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): void {
  if (!SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

/**
 * Sets user context for Sentry events.
 *
 * @param user - User information
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(user);
}

/**
 * Adds a breadcrumb for debugging.
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}): void {
  if (!SENTRY_DSN) return;
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Express error handler for Sentry.
 * Use this as middleware after all routes.
 * In Sentry v8+, error handling is done via setupExpressErrorHandler.
 */
export const sentryErrorHandler = ((
  _err: Error,
  _req: unknown,
  _res: unknown,
  next: (err?: Error) => void
) => {
  // Capture the error before passing to next
  if (SENTRY_DSN) {
    Sentry.captureException(_err);
  }
  next(_err);
});

/**
 * Express request handler for Sentry.
 * Use this as middleware before all routes.
 * In Sentry v8+, request handling is automatic.
 */
export const sentryRequestHandler = ((
  _req: unknown,
  _res: unknown,
  next: () => void
) => next());

// Re-export Sentry for advanced usage
export * as Sentry from '@sentry/node';
