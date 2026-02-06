/**
 * Application constants
 * 
 * This file contains all configuration constants used throughout the application.
 * Centralizing these values makes it easy to modify pricing, discounts, and other
 * settings without changing business logic code.
 * 
 * @module constants
 */

// ============================================================================
// PRICING CONSTANTS
// ============================================================================

/**
 * Standard DVD price in euros.
 * This is the default price for any DVD that is not part of a special collection.
 */
export const STANDARD_DVD_PRICE = 20;

/**
 * Back to the Future DVD price in euros.
 * BTTF movies have a lower base price as a promotion.
 */
export const BTTF_DVD_PRICE = 15;

// ============================================================================
// DISCOUNT CONSTANTS
// ============================================================================

/**
 * Discount percentage when customer has 2 different BTTF episodes.
 * Applied to the total price of all BTTF movies in the cart.
 */
export const BTTF_2_EPISODES_DISCOUNT = 10;

/**
 * Discount percentage when customer has all 3 BTTF episodes (complete trilogy).
 * Applied to the total price of all BTTF movies in the cart.
 */
export const BTTF_3_EPISODES_DISCOUNT = 20;

// ============================================================================
// MOVIE PATTERN CONSTANTS
// ============================================================================

/**
 * Regular expression pattern to match Back to the Future movie titles.
 * Captures the episode number (1, 2, or 3) in a capture group.
 * Case-insensitive matching.
 * 
 * @example
 * BTTF_TITLE_PATTERN.exec("Back to the Future 1") // ["Back to the Future 1", "1"]
 * BTTF_TITLE_PATTERN.exec("Back to the Future 2") // ["Back to the Future 2", "2"]
 */
export const BTTF_TITLE_PATTERN = /^Back to the Future\s*(\d)$/i;

/**
 * Valid episode numbers for Back to the Future trilogy.
 * Used for validation and type safety.
 */
export const BTTF_EPISODES = [1, 2, 3] as const;

// ============================================================================
// API CONSTANTS
// ============================================================================

/**
 * Default port for the HTTP server.
 * Can be overridden by the PORT environment variable.
 */
export const DEFAULT_PORT = 3000;

/**
 * API route prefix for all endpoints.
 * All API routes will be prefixed with this value.
 */
export const API_PREFIX = '/api';

// ============================================================================
// CURRENCY CONSTANTS
// ============================================================================

/**
 * Default currency code (ISO 4217).
 * Used for display and formatting purposes.
 */
export const DEFAULT_CURRENCY = 'EUR';

/**
 * Currency symbol for display.
 * Used when formatting prices for user display.
 */
export const CURRENCY_SYMBOL = '€';
