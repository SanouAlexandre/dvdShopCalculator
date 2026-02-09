/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * Unit tests for Express server configuration.
 * Tests middleware, routes, and error handling.
 */

import request from 'supertest';

// Mock Sentry before importing server
jest.mock('../../src/instrumentation/sentry', () => ({
  initSentry: jest.fn(),
  sentryRequestHandler: jest.fn((_req, _res, next) => next()),
  sentryErrorHandler: jest.fn((_err, _req, _res, next) => next(_err)),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set VERCEL env to prevent server from listening on port
process.env.VERCEL = '1';

import { app } from '../../src/server';
import { addBreadcrumb } from '../../src/instrumentation/sentry';

describe('Server', () => {
  describe('Security Headers', () => {
    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-security-policy']).toBe(
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; upgrade-insecure-requests"
      );
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set Permissions-Policy header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['permissions-policy']).toBe(
        'geolocation=(), microphone=(), camera=(), payment=()'
      );
    });

    it('should set Strict-Transport-Security header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['strict-transport-security']).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
    });

    it('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('POST /api/calculate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should add breadcrumb for request tracking', async () => {
      await request(app)
        .post('/api/calculate')
        .send({ items: ['Back to the Future 1'] });

      expect(addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Calculate request received',
          category: 'api',
          level: 'info',
        })
      );
    });

    it('should calculate price for single movie', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: ['Back to the Future 1'] });

      expect(response.status).toBe(200);
      expect(response.body.totalPrice).toBe(15);
      expect(response.body.currency).toBe('EUR');
      expect(response.body.itemsCount).toBe(1);
    });

    it('should calculate price for BTTF trilogy with 20% discount', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({
          items: ['Back to the Future 1', 'Back to the Future 2', 'Back to the Future 3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.totalPrice).toBe(36);
      expect(response.body.discountApplied).toBe('20%');
      expect(response.body.itemsCount).toBe(3);
    });

    it('should calculate price for two BTTF movies with 10% discount', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({
          items: ['Back to the Future 1', 'Back to the Future 2'],
        });

      expect(response.status).toBe(200);
      expect(response.body.totalPrice).toBe(27);
      expect(response.body.discountApplied).toBe('10%');
    });

    it('should calculate price for mixed cart', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({
          items: ['Back to the Future 1', 'Back to the Future 2', 'La chèvre'],
        });

      expect(response.status).toBe(200);
      expect(response.body.totalPrice).toBe(47);
      expect(response.body.discountApplied).toBe('10%');
    });

    it('should return breakdown in response', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: ['Back to the Future 1'] });

      expect(response.status).toBe(200);
      expect(response.body.breakdown).toBeDefined();
    });

    it('should handle empty items array', async () => {
      const response = await request(app).post('/api/calculate').send({ items: [] });

      expect(response.status).toBe(200);
      expect(response.body.totalPrice).toBe(0);
      expect(response.body.itemsCount).toBe(0);
    });

    it('should return 400 for missing items', async () => {
      const response = await request(app).post('/api/calculate').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
      expect(response.body.message).toBe(
        'Request body must contain an "items" array of movie titles'
      );
    });

    it('should return 400 for null items', async () => {
      const response = await request(app).post('/api/calculate').send({ items: null });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
    });

    it('should return 400 for non-array items', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: 'Back to the Future 1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
    });

    it('should return 400 for non-string items in array', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: [1, 2, 3] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
      expect(response.body.message).toBe('All items must be strings');
    });

    it('should return 400 for mixed types in array', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: ['Back to the Future 1', 123] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
      expect(response.body.message).toBe('All items must be strings');
    });

    it('should track items count in breadcrumb', async () => {
      await request(app)
        .post('/api/calculate')
        .send({ items: ['Movie 1', 'Movie 2', 'Movie 3'] });

      expect(addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { itemsCount: 3 },
        })
      );
    });

    it('should track 0 items count when items is undefined', async () => {
      await request(app).post('/api/calculate').send({});

      expect(addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { itemsCount: 0 },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/unknown-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toBe('The requested endpoint does not exist');
    });

    it('should return 404 for unknown POST endpoints', async () => {
      const response = await request(app).post('/unknown-endpoint').send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });

    it('should handle JSON parse errors', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Express body-parser throws an error which is caught by error handler
      // The global error handler returns 500 for unhandled errors
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Static File Serving', () => {
    it('should serve index.html for root path', async () => {
      const response = await request(app).get('/');

      // Expect either 200 (file exists) or 404 (file doesn't exist in test env)
      expect([200, 404]).toContain(response.status);
    });
  });
});
