import { BackToTheFutureDiscountRule } from '../../src/core/rules/BackToTheFutureDiscountRule';
import { CartParser } from '../../src/infrastructure/parsers/CartParser';

describe('BackToTheFutureDiscountRule', () => {
  let rule: BackToTheFutureDiscountRule;
  let parser: CartParser;

  beforeEach(() => {
    rule = new BackToTheFutureDiscountRule();
    parser = new CartParser();
  });

  describe('applies', () => {
    it('should not apply for empty cart', () => {
      const cart = parser.parse('');
      expect(rule.applies(cart)).toBe(false);
    });

    it('should not apply for cart with only standard DVDs', () => {
      const cart = parser.parse('La chèvre\nLes Visiteurs');
      expect(rule.applies(cart)).toBe(false);
    });

    it('should not apply for single BTTF episode', () => {
      const cart = parser.parse('Back to the Future 1');
      expect(rule.applies(cart)).toBe(false);
    });

    it('should not apply for same BTTF episode multiple times', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 1');
      expect(rule.applies(cart)).toBe(false);
    });

    it('should apply for 2 different BTTF episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2');
      expect(rule.applies(cart)).toBe(true);
    });

    it('should apply for 3 different BTTF episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nBack to the Future 3');
      expect(rule.applies(cart)).toBe(true);
    });
  });

  describe('getDiscount', () => {
    it('should return 0% for no BTTF movies', () => {
      const cart = parser.parse('La chèvre');
      const discount = rule.getDiscount(cart);
      expect(discount.percentage).toBe(0);
    });

    it('should return 0% for single BTTF episode', () => {
      const cart = parser.parse('Back to the Future 1');
      const discount = rule.getDiscount(cart);
      expect(discount.percentage).toBe(0);
    });

    it('should return 10% for 2 different BTTF episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2');
      const discount = rule.getDiscount(cart);
      expect(discount.percentage).toBe(10);
    });

    it('should return 20% for 3 different BTTF episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nBack to the Future 3');
      const discount = rule.getDiscount(cart);
      expect(discount.percentage).toBe(20);
    });
  });

  describe('getApplicableItemsBasePrice', () => {
    it('should return 0 for no BTTF movies', () => {
      const cart = parser.parse('La chèvre');
      expect(rule.getApplicableItemsBasePrice(cart)).toBe(0);
    });

    it('should return 15 for one BTTF movie', () => {
      const cart = parser.parse('Back to the Future 1');
      expect(rule.getApplicableItemsBasePrice(cart)).toBe(15);
    });

    it('should return sum of all BTTF movies', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nLa chèvre');
      expect(rule.getApplicableItemsBasePrice(cart)).toBe(30);
    });

    it('should include duplicate BTTF movies', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 1');
      expect(rule.getApplicableItemsBasePrice(cart)).toBe(30);
    });
  });

  describe('calculateDiscountedPrice', () => {
    it('should return base price when no discount applies', () => {
      const cart = parser.parse('Back to the Future 1');
      expect(rule.calculateDiscountedPrice(cart)).toBe(15);
    });

    it('should apply 10% discount for 2 episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2');
      // 30 * 0.9 = 27
      expect(rule.calculateDiscountedPrice(cart)).toBe(27);
    });

    it('should apply 20% discount for 3 episodes', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nBack to the Future 3');
      // 45 * 0.8 = 36
      expect(rule.calculateDiscountedPrice(cart)).toBe(36);
    });

    it('should apply discount to all BTTF DVDs including duplicates', () => {
      const cart = parser.parse(
        'Back to the Future 1\nBack to the Future 2\nBack to the Future 1'
      );
      // 45 * 0.9 = 40.5
      expect(rule.calculateDiscountedPrice(cart)).toBe(40.5);
    });
  });

  describe('getDiscountResult', () => {
    it('should return complete discount result', () => {
      const cart = parser.parse('Back to the Future 1\nBack to the Future 2\nBack to the Future 3');
      const result = rule.getDiscountResult(cart);

      expect(result.ruleName).toBe('Back to the Future Discount');
      expect(result.originalPrice).toBe(45);
      expect(result.discountedPrice).toBe(36);
      expect(result.savings).toBe(9);
      expect(result.discount.percentage).toBe(20);
    });
  });
});
