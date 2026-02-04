/**
 * Application constants
 */

// Pricing
export const STANDARD_DVD_PRICE = 20; // € for standard DVDs
export const BTTF_DVD_PRICE = 15; // € for Back to the Future DVDs

// Discounts
export const BTTF_2_EPISODES_DISCOUNT = 10; // % discount for 2 different episodes
export const BTTF_3_EPISODES_DISCOUNT = 20; // % discount for 3 different episodes (complete trilogy)

// Back to the Future movie patterns
export const BTTF_TITLE_PATTERN = /^Back to the Future\s*(\d)$/i;
export const BTTF_EPISODES = [1, 2, 3] as const;

// API
export const DEFAULT_PORT = 3000;
export const API_PREFIX = '/api';

// Currency
export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCY_SYMBOL = '€';
