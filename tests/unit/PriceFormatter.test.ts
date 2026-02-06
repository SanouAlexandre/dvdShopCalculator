import { PriceFormatter } from '../../src/infrastructure/formatters/PriceFormatter';
import { CalculationResult } from '../../src/core/calculator';

describe('PriceFormatter', () => {
  let formatter: PriceFormatter;

  beforeEach(() => {
    formatter = new PriceFormatter();
  });

  describe('constructor', () => {
    it('should use default currency symbol and locale', () => {
      const result = formatter.formatPrice(100);
      expect(result).toContain('€');
    });

    it('should accept custom currency symbol', () => {
      const customFormatter = new PriceFormatter({ currencySymbol: '$' });
      const result = customFormatter.formatPrice(100);
      expect(result).toContain('$');
    });

    it('should accept custom locale', () => {
      const customFormatter = new PriceFormatter({ locale: 'en-US' });
      const result = customFormatter.formatPrice(1000);
      expect(result).toContain('1,000');
    });
  });

  describe('formatPrice', () => {
    it('should format integer prices without decimals', () => {
      expect(formatter.formatPrice(20)).toBe('20 €');
    });

    it('should format prices with decimals', () => {
      const result = formatter.formatPrice(27.5);
      expect(result).toContain('27,5');
      expect(result).toContain('€');
    });

    it('should format zero price', () => {
      expect(formatter.formatPrice(0)).toBe('0 €');
    });

    it('should format large prices with proper formatting', () => {
      const result = formatter.formatPrice(1000);
      // French locale uses space as thousand separator
      expect(result).toMatch(/1[\s\u202f]?000 €/);
    });
  });

  describe('formatResult', () => {
    it('should format receipt with BTTF movies only', () => {
      const result: CalculationResult = {
        totalPrice: 36,
        currency: 'EUR',
        itemsCount: 3,
        discountApplied: '20%',
        breakdown: {
          bttfMoviesCount: 3,
          bttfBasePrice: 45,
          bttfDiscountedPrice: 36,
          otherMoviesCount: 0,
          otherMoviesPrice: 0,
        },
      };

      const output = formatter.formatResult(result);
      expect(output).toContain('DVD SHOP - RECEIPT');
      expect(output).toContain('Back to the Future DVDs: 3');
      expect(output).toContain('Base price:');
      expect(output).toContain('Discount: -20%');
      expect(output).toContain('After discount:');
      expect(output).toContain('TOTAL:');
    });

    it('should format receipt with other movies only', () => {
      const result: CalculationResult = {
        totalPrice: 40,
        currency: 'EUR',
        itemsCount: 2,
        discountApplied: null,
        breakdown: {
          bttfMoviesCount: 0,
          bttfBasePrice: 0,
          bttfDiscountedPrice: 0,
          otherMoviesCount: 2,
          otherMoviesPrice: 40,
        },
      };

      const output = formatter.formatResult(result);
      expect(output).toContain('Other DVDs: 2');
      expect(output).not.toContain('Back to the Future DVDs');
      expect(output).toContain('TOTAL:');
    });

    it('should format receipt with mixed cart', () => {
      const result: CalculationResult = {
        totalPrice: 56,
        currency: 'EUR',
        itemsCount: 4,
        discountApplied: '20%',
        breakdown: {
          bttfMoviesCount: 3,
          bttfBasePrice: 45,
          bttfDiscountedPrice: 36,
          otherMoviesCount: 1,
          otherMoviesPrice: 20,
        },
      };

      const output = formatter.formatResult(result);
      expect(output).toContain('Back to the Future DVDs: 3');
      expect(output).toContain('Other DVDs: 1');
      expect(output).toContain('Discount: -20%');
    });

    it('should format receipt without discount when not applied', () => {
      const result: CalculationResult = {
        totalPrice: 15,
        currency: 'EUR',
        itemsCount: 1,
        discountApplied: null,
        breakdown: {
          bttfMoviesCount: 1,
          bttfBasePrice: 15,
          bttfDiscountedPrice: 15,
          otherMoviesCount: 0,
          otherMoviesPrice: 0,
        },
      };

      const output = formatter.formatResult(result);
      expect(output).not.toContain('Discount:');
      expect(output).not.toContain('After discount:');
    });
  });

  describe('formatSimple', () => {
    it('should return simple price format', () => {
      const result: CalculationResult = {
        totalPrice: 56,
        currency: 'EUR',
        itemsCount: 4,
        discountApplied: '20%',
        breakdown: {
          bttfMoviesCount: 3,
          bttfBasePrice: 45,
          bttfDiscountedPrice: 36,
          otherMoviesCount: 1,
          otherMoviesPrice: 20,
        },
      };

      const output = formatter.formatSimple(result);
      expect(output).toBe('Prix total: 56 €');
    });
  });

  describe('formatJSON', () => {
    it('should return JSON-friendly object', () => {
      const result: CalculationResult = {
        totalPrice: 56,
        currency: 'EUR',
        itemsCount: 4,
        discountApplied: '20%',
        breakdown: {
          bttfMoviesCount: 3,
          bttfBasePrice: 45,
          bttfDiscountedPrice: 36,
          otherMoviesCount: 1,
          otherMoviesPrice: 20,
        },
      };

      const output = formatter.formatJSON(result);
      expect(output).toEqual({
        totalPrice: 56,
        currency: 'EUR',
        formattedPrice: '56 €',
        itemsCount: 4,
        discountApplied: '20%',
        breakdown: {
          bttfMovies: {
            count: 3,
            basePrice: 45,
            discountedPrice: 36,
          },
          otherMovies: {
            count: 1,
            price: 20,
          },
        },
      });
    });

    it('should handle null discount in JSON format', () => {
      const result: CalculationResult = {
        totalPrice: 20,
        currency: 'EUR',
        itemsCount: 1,
        discountApplied: null,
        breakdown: {
          bttfMoviesCount: 0,
          bttfBasePrice: 0,
          bttfDiscountedPrice: 0,
          otherMoviesCount: 1,
          otherMoviesPrice: 20,
        },
      };

      const output = formatter.formatJSON(result);
      expect(output).toHaveProperty('discountApplied', null);
    });
  });
});
