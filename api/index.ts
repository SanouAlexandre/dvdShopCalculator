import express, { Application, Request, Response, NextFunction } from 'express';
import { Calculator } from '../src/core/calculator';
import { CartParser } from '../src/infrastructure/parsers/CartParser';
import { PriceFormatter } from '../src/infrastructure/formatters/PriceFormatter';
import { API_PREFIX } from '../src/utils/constants';

const app: Application = express();

// Security: Disable X-Powered-By header to hide Express fingerprint
app.disable('x-powered-by');

// Middleware
app.use(express.json());

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
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  });
});

export default app;
