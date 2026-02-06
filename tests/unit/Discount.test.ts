import {
  createDiscount,
  applyDiscount,
  NO_DISCOUNT,
} from '../../src/core/models/Discount';

describe('Discount', () => {
  describe('createDiscount', () => {
    it('should create a valid discount', () => {
      const discount = createDiscount('Test Discount', 10, '10% off');
      
      expect(discount.name).toBe('Test Discount');
      expect(discount.percentage).toBe(10);
      expect(discount.description).toBe('10% off');
    });

    it('should accept 0% discount', () => {
      const discount = createDiscount('No discount', 0, 'No discount applied');
      expect(discount.percentage).toBe(0);
    });

    it('should accept 100% discount', () => {
      const discount = createDiscount('Free', 100, 'Everything is free');
      expect(discount.percentage).toBe(100);
    });

    it('should throw error for negative percentage', () => {
      expect(() => {
        createDiscount('Invalid', -10, 'Invalid discount');
      }).toThrow('Invalid discount percentage: -10. Must be between 0 and 100.');
    });

    it('should throw error for percentage over 100', () => {
      expect(() => {
        createDiscount('Invalid', 150, 'Invalid discount');
      }).toThrow('Invalid discount percentage: 150. Must be between 0 and 100.');
    });
  });

  describe('applyDiscount', () => {
    it('should apply 0% discount (no change)', () => {
      const discount = createDiscount('None', 0, 'No discount');
      expect(applyDiscount(100, discount)).toBe(100);
    });

    it('should apply 10% discount', () => {
      const discount = createDiscount('10% off', 10, '10% discount');
      expect(applyDiscount(100, discount)).toBe(90);
    });

    it('should apply 20% discount', () => {
      const discount = createDiscount('20% off', 20, '20% discount');
      expect(applyDiscount(50, discount)).toBe(40);
    });

    it('should apply 100% discount (free)', () => {
      const discount = createDiscount('Free', 100, '100% discount');
      expect(applyDiscount(100, discount)).toBe(0);
    });

    it('should handle decimal prices', () => {
      const discount = createDiscount('10% off', 10, '10% discount');
      expect(applyDiscount(27.5, discount)).toBe(24.75);
    });
  });

  describe('NO_DISCOUNT constant', () => {
    it('should have correct properties', () => {
      expect(NO_DISCOUNT.name).toBe('No Discount');
      expect(NO_DISCOUNT.percentage).toBe(0);
      expect(NO_DISCOUNT.description).toBe('No discount applied');
    });

    it('should not change price when applied', () => {
      expect(applyDiscount(100, NO_DISCOUNT)).toBe(100);
    });
  });
});
