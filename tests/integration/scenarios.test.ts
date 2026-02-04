import { Calculator } from '../../src/core/calculator';
import { CartParser } from '../../src/infrastructure/parsers/CartParser';

/**
 * Integration tests based on the examples from the requirements
 */
describe('DVD Shop Calculator - Integration Scenarios', () => {
  let calculator: Calculator;
  let parser: CartParser;

  beforeEach(() => {
    calculator = new Calculator();
    parser = new CartParser();
  });

  describe('Scenario 1: Complete BTTF Trilogy', () => {
    it('should calculate 36€ for all 3 BTTF movies (20% discount)', () => {
      const input = `Back to the Future 1
Back to the Future 2
Back to the Future 3`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(36);
      expect(result.discountApplied).toBe('20%');
      expect(result.itemsCount).toBe(3);
    });
  });

  describe('Scenario 2: Two BTTF Movies', () => {
    it('should calculate 27€ for 2 BTTF movies (10% discount)', () => {
      const input = `Back to the Future 1
Back to the Future 2`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(27);
      expect(result.discountApplied).toBe('10%');
      expect(result.itemsCount).toBe(2);
    });
  });

  describe('Scenario 3: BTTF Trilogy + Standard DVD', () => {
    it('should calculate 56€ for 3 BTTF movies + 1 standard DVD', () => {
      const input = `Back to the Future 1
Back to the Future 2
Back to the Future 3
La chèvre`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      // (3 × 15 × 0.8) + 20 = 36 + 20 = 56
      expect(result.totalPrice).toBe(56);
      expect(result.discountApplied).toBe('20%');
      expect(result.breakdown.bttfDiscountedPrice).toBe(36);
      expect(result.breakdown.otherMoviesPrice).toBe(20);
    });
  });

  describe('Scenario 4: Single BTTF Movie', () => {
    it('should calculate 15€ for 1 BTTF movie (no discount)', () => {
      const input = 'Back to the Future 1';

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(15);
      expect(result.discountApplied).toBeNull();
    });
  });

  describe('Scenario 5: Only Standard DVDs', () => {
    it('should calculate 40€ for 2 standard DVDs (no discount)', () => {
      const input = `La chèvre
Les Visiteurs`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(40);
      expect(result.discountApplied).toBeNull();
    });
  });

  describe('Scenario 6: Mixed Cart with 2 BTTF Episodes', () => {
    it('should calculate 47€ for 2 BTTF movies + 1 standard DVD', () => {
      const input = `Back to the Future 1
Back to the Future 2
Amélie`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      // (2 × 15 × 0.9) + 20 = 27 + 20 = 47
      expect(result.totalPrice).toBe(47);
      expect(result.discountApplied).toBe('10%');
    });
  });

  describe('Scenario 7: Duplicate BTTF Episodes', () => {
    it('should not apply discount for same episode multiple times', () => {
      const input = `Back to the Future 1
Back to the Future 1`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      // 2 × 15 = 30 (no discount, same episode)
      expect(result.totalPrice).toBe(30);
      expect(result.discountApplied).toBeNull();
    });
  });

  describe('Scenario 8: Multiple Copies with Discount', () => {
    it('should apply discount to ALL BTTF DVDs when condition is met', () => {
      const input = `Back to the Future 1
Back to the Future 2
Back to the Future 1`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      // 3 DVDs × 15 × 0.9 = 40.5 (discount applies to all BTTF including duplicates)
      expect(result.totalPrice).toBe(40.5);
      expect(result.discountApplied).toBe('10%');
    });
  });

  describe('Scenario 9: Large Mixed Cart', () => {
    it('should handle large cart with multiple movies', () => {
      const input = `Back to the Future 1
Back to the Future 2
Back to the Future 3
La chèvre
Les Visiteurs
Amélie
Le Dîner de cons`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      // BTTF: 3 × 15 × 0.8 = 36
      // Others: 4 × 20 = 80
      // Total: 116
      expect(result.totalPrice).toBe(116);
      expect(result.discountApplied).toBe('20%');
      expect(result.itemsCount).toBe(7);
      expect(result.breakdown.bttfMoviesCount).toBe(3);
      expect(result.breakdown.otherMoviesCount).toBe(4);
    });
  });

  describe('Scenario 10: Empty Cart', () => {
    it('should return 0€ for empty cart', () => {
      const cart = parser.parse('');
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(0);
      expect(result.itemsCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle BTTF episodes 1, 2, and 3 only', () => {
      const input = `Back to the Future 4
Back to the Future 0`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      // Invalid episode numbers treated as standard DVDs
      expect(result.totalPrice).toBe(40);
      expect(result.breakdown.bttfMoviesCount).toBe(0);
    });

    it('should handle whitespace in input', () => {
      const input = `  Back to the Future 1  
  Back to the Future 2  

Back to the Future 3`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(36);
      expect(result.itemsCount).toBe(3);
    });

    it('should be case insensitive for BTTF titles', () => {
      const input = `BACK TO THE FUTURE 1
back to the future 2
Back To The Future 3`;

      const cart = parser.parse(input);
      const result = calculator.calculate(cart);

      expect(result.totalPrice).toBe(36);
      expect(result.discountApplied).toBe('20%');
    });
  });
});
