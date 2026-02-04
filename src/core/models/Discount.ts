/**
 * Represents a discount that can be applied to cart items
 */
export interface Discount {
  readonly name: string;
  readonly percentage: number; // e.g., 10 for 10%, 20 for 20%
  readonly description: string;
}

/**
 * Creates a discount object
 */
export function createDiscount(name: string, percentage: number, description: string): Discount {
  if (percentage < 0 || percentage > 100) {
    throw new Error(`Invalid discount percentage: ${percentage}. Must be between 0 and 100.`);
  }

  return {
    name,
    percentage,
    description,
  };
}

/**
 * Applies a discount to a price
 */
export function applyDiscount(price: number, discount: Discount): number {
  const multiplier = (100 - discount.percentage) / 100;
  return price * multiplier;
}

/**
 * No discount (0%)
 */
export const NO_DISCOUNT: Discount = {
  name: 'No Discount',
  percentage: 0,
  description: 'No discount applied',
};
