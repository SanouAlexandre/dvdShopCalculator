import { Cart } from '../models/Cart';
import { Discount } from '../models/Discount';

/**
 * Interface for discount rules
 * Follows the Strategy pattern for extensibility
 */
export interface DiscountRule {
  /**
   * Unique name for the rule
   */
  readonly name: string;

  /**
   * Checks if this discount rule applies to the given cart
   */
  applies(cart: Cart): boolean;

  /**
   * Calculates the discount for the given cart
   * Returns the discount to be applied
   */
  getDiscount(cart: Cart): Discount;

  /**
   * Calculates the total price for applicable items after discount
   */
  calculateDiscountedPrice(cart: Cart): number;

  /**
   * Returns the base price of applicable items (before discount)
   */
  getApplicableItemsBasePrice(cart: Cart): number;
}

/**
 * Result of applying discount rules
 */
export interface DiscountResult {
  readonly ruleName: string;
  readonly discount: Discount;
  readonly originalPrice: number;
  readonly discountedPrice: number;
  readonly savings: number;
}
