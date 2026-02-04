import { Calculator } from '../../src/core/calculator';
import { CartParser } from '../../src/infrastructure/parsers/CartParser';

describe('Calculator', () => {
  let calculator: Calculator;
  let parser: CartParser;

  beforeEach(() => {
    calculator = new Calculator();
    parser = new CartParser();
  });

  describe('calculateTotal', () => {
    it('should return 0 for an empty cart', () => {
      const cart = parser.parse('');
      expect(calculator.calculateTotal(cart)).toBe(0);
    });

    it('should calculate price for a single standard DVD at 20€', () => {
      const cart = parser.parse('La chèvre');
      expect(calculator.calculateTotal(cart)).toBe(20);
    });

    it('should calculate price for multiple standard DVDs', () => {
      const cart = parser.parse('La chèvre\nLes Visiteurs');
      expect(calculator.calculateTotal(cart)).toBe(40);
    });

    it('should calculate price for a single BTTF DVD at 15€', () => {
      const cart = parser.parse('Back to the Future 1');
      expect(calculator.calculateTotal(cart)).toBe(15);
    });

    it('should apply 10% discount for 2 different BTTF episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2');
      // 2 × 15 × 0.9 = 27
      expect(calculator.calculateTotal(cart)).toBe(27);
    });

    it('should apply 20% discount for 3 different BTTF episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nBack to the Future 3');
      // 3 × 15 × 0.8 = 36
      expect(calculator.calculateTotal(cart)).toBe(36);
    });

    it('should handle mixed cart with BTTF discount and standard DVDs', () => {
      const cart = parser.parse(
        'Back to the Future 1\nBack to the Future 2\nBack to the Future 3\nLa chèvre'
      );
      // (3 × 15 × 0.8) + 20 = 36 + 20 = 56
      expect(calculator.calculateTotal(cart)).toBe(56);
    });

    it('should not apply discount for same BTTF episode multiple times', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 1');
      // 2 × 15 = 30 (no discount, same episode)
      expect(calculator.calculateTotal(cart)).toBe(30);
    });

    it('should apply discount to all BTTF DVDs including duplicates', () => {
      const cart = parser.parse(
        'Back to the Future 1\nBack to the Future 2\nBack to the Future 1'
      );
      // 3 DVDs × 15 × 0.9 = 40.5
      expect(calculator.calculateTotal(cart)).toBe(40.5);
    });
  });

  describe('calculate', () => {
    it('should return full calculation result with breakdown', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nLa chèvre');
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(47); // 27 + 20
      expect(result.currency).toBe('EUR');
      expect(result.itemsCount).toBe(3);
      expect(result.discountApplied).toBe('10%');
      expect(result.breakdown.bttfMoviesCount).toBe(2);
      expect(result.breakdown.bttfBasePrice).toBe(30);
      expect(result.breakdown.bttfDiscountedPrice).toBe(27);
      expect(result.breakdown.otherMoviesCount).toBe(1);
      expect(result.breakdown.otherMoviesPrice).toBe(20);
    });

    it('should return null discountApplied when no discount', () => {
      const cart = parser.parse('Back to the Future 1');
      const result = calculator.calculate(cart);

      expect(result.discountApplied).toBeNull();
    });
  });
});
