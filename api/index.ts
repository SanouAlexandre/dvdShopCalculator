/**
 * Vercel Serverless Function entry point for the DVD Shop Calculator API.
 *
 * This module provides a lightweight Express application optimized for
 * serverless deployment on Vercel. It includes:
 * - Security headers (CSP, HSTS, X-Content-Type-Options, etc.)
 * - JSON body parsing
 * - REST API endpoints for price calculation
 * - Error handling with Sentry integration
 *
 * Note: This module does NOT include:
 * - Static file serving (handled by Vercel's static hosting)
 * - File-based logging (Vercel has read-only filesystem)
 *
 * @module api/index
 * @see https://vercel.com/docs/functions/serverless-functions
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { Calculator } from '../src/core/calculator';
import { CartParser } from '../src/infrastructure/parsers/CartParser';
import { PriceFormatter } from '../src/infrastructure/formatters/PriceFormatter';
import { API_PREFIX } from '../src/utils/constants';
import {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  captureException,
  addBreadcrumb,
} from '../src/instrumentation/sentry';

// Initialize Sentry at module load
initSentry();

/** Express application instance for serverless deployment */
const app: Application = express();

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Disable X-Powered-By header.
 * Prevents identification of Express framework.
 */
app.disable('x-powered-by');

/**
 * Sentry request handler.
 * Must be the first middleware for proper tracing.
 */
app.use(sentryRequestHandler);

/**
 * Security headers middleware.
 * Comprehensive protection against common web vulnerabilities.
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
 * @route GET /health
 * @returns {object} 200 - Status with timestamp
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Calculate cart total endpoint.
 * @route POST /api/calculate
 * @param {string[]} items - Array of movie titles
 * @returns {object} 200 - Calculation result
 */
app.post(`${API_PREFIX}/calculate`, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body as { items?: string[] };

    // Add breadcrumb for debugging
    addBreadcrumb({
      message: 'Calculate request received',
      category: 'api',
      level: 'info',
      data: { itemsCount: items?.length ?? 0 },
    });

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
 * Sentry error handler middleware.
 * Captures exceptions and sends them to Sentry.
 */
app.use(sentryErrorHandler);

/**
 * Global error handling middleware.
 * Returns 500 with generic message for security.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  // Additional capture with context
  captureException(err, {
    url: _req.url,
    method: _req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  });
});

export default app;
