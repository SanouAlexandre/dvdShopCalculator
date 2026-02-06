import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { Calculator } from './core/calculator';
import { CartParser } from './infrastructure/parsers/CartParser';
import { PriceFormatter } from './infrastructure/formatters/PriceFormatter';
import { logger } from './utils/logger';
import { DEFAULT_PORT, API_PREFIX } from './utils/constants';

const app: Application = express();
const port = process.env.PORT || DEFAULT_PORT;

// Middleware
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Services
const parser = new CartParser();
const calculator = new Calculator();
const formatter = new PriceFormatter();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Calculate endpoint
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

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// Start server only when not in serverless environment
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
