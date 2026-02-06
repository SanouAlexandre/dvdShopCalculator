/**
 * Express server configuration for the DVD Shop Calculator API.
 *
 * This module sets up the HTTP server with:
 * - Security headers (CSP, HSTS, X-Content-Type-Options, etc.)
 * - JSON body parsing middleware
 * - Static file serving for the frontend
 * - REST API endpoints for price calculation
 * - Error handling and 404 responses
 *
 * The server can run in two modes:
 * - Standalone: Listens on a port (default: 3000)
 * - Serverless: Exported for Vercel deployment
 *
 * @module server
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { Calculator } from './core/calculator';
import { CartParser } from './infrastructure/parsers/CartParser';
import { PriceFormatter } from './infrastructure/formatters/PriceFormatter';
import { logger } from './utils/logger';
import { DEFAULT_PORT, API_PREFIX } from './utils/constants';

/** Express application instance */
const app: Application = express();

/** Server port from environment or default */
const port = process.env.PORT || DEFAULT_PORT;

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Security: Disable X-Powered-By header.
 * This prevents attackers from easily identifying that the server runs Express,
 * reducing the attack surface for known Express vulnerabilities.
 */
app.disable('x-powered-by');

/**
 * Security headers middleware.
 * Applies comprehensive security headers to all responses:
 * - CSP: Prevents XSS and injection attacks
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - HSTS: Enforces HTTPS connections
 * - Permissions-Policy: Restricts browser features
 * - Referrer-Policy: Controls referrer information
 */
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy with upgrade-insecure-requests and frame-ancestors
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; upgrade-insecure-requests");
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Permissions Policy (disable unnecessary features)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  // Strict Transport Security with includeSubDomains
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

/** Parse JSON request bodies */
app.use(express.json());

/** Serve static files (frontend HTML, CSS, JS) from the public directory */
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

/** Parser for converting movie titles to Cart objects */
const parser = new CartParser();

/** Calculator for computing totals with discount rules */
const calculator = new Calculator();

/** Formatter for price display */
const formatter = new PriceFormatter();

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint.
 * Returns server status and timestamp.
 * Used by load balancers and monitoring systems.
 *
 * @route GET /health
 * @returns {object} 200 - Status object with timestamp
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Calculate cart total endpoint.
 * Accepts an array of movie titles and returns the calculated price
 * with any applicable discounts.
 *
 * @route POST /api/calculate
 * @param {string[]} items - Array of movie titles
 * @returns {object} 200 - Calculation result with total, discount, and breakdown
 * @returns {object} 400 - Invalid request (missing or invalid items)
 */
app.post(`${API_PREFIX}/calculate`, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body as { items?: string[] };

    if (!items || !Array.isArray(items)) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain an "items" array of movie titles',
      });
      return;
    }

    // Validate items
    if (items.some(item => typeof item !== 'string')) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'All items must be strings',
      });
      return;
    }

    // Parse and calculate
    const cart = parser.parseArray(items);
    const result = calculator.calculate(cart);

    // Return formatted response
    res.json({
      totalPrice: result.totalPrice,
      currency: result.currency,
      itemsCount: result.itemsCount,
      discountApplied: result.discountApplied,
      breakdown: formatter.formatJSON(result),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Global error handling middleware.
 * Catches unhandled errors and returns appropriate error responses.
 * In development mode, includes error message for debugging.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

/**
 * 404 Not Found handler.
 * Catches requests to undefined routes.
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start HTTP server in standalone mode.
 * Skipped in serverless environments (Vercel) where the platform handles routing.
 */
if (!process.env.VERCEL) {
  app.listen(port, () => {
    logger.info(`🎬 DVD Shop Calculator API running on port ${port}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`Calculate endpoint: POST http://localhost:${port}${API_PREFIX}/calculate`);
  });
}

// Export for Vercel serverless
export default app;
export { app };
