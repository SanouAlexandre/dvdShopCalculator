import request from 'supertest';
import { app } from '../../src/server';

describe('API E2E Tests', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/calculate', () => {
    it('should calculate price for BTTF trilogy', async () => {
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

    it('should return 400 for missing items', async () => {
      const response = await request(app).post('/api/calculate').send({});

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

    it('should return 400 for non-string items', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: [1, 2, 3] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
    });

    it('should handle empty items array', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ items: [] });

      expect(response.status).toBe(200);
      expect(response.body.totalPrice).toBe(0);
      expect(response.body.itemsCount).toBe(0);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/unknown');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });
  });
});
