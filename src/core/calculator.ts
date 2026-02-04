import { Cart, getOtherMovies, getBackToTheFutureMovies } from './models/Cart';
import { DiscountRule } from './rules/DiscountRule';
import { BackToTheFutureDiscountRule } from './rules/BackToTheFutureDiscountRule';

/**
 * Result of a price calculation
 */
export interface CalculationResult {
  readonly totalPrice: number;
  readonly currency: string;
  readonly itemsCount: number;
  readonly discountApplied: string | null;
  readonly breakdown: PriceBreakdown;
}

/**
 * Detailed price breakdown
 */
export interface PriceBreakdown {
  readonly bttfMoviesCount: number;
  readonly bttfBasePrice: number;
  readonly bttfDiscountedPrice: number;
  readonly otherMoviesCount: number;
  readonly otherMoviesPrice: number;
}

/**
 * Calculator configuration
 */
export interface CalculatorConfig {
  readonly currency?: string;
  readonly discountRules?: DiscountRule[];
}

/**
 * Main calculator class for computing cart totals with discounts
 */
export class Calculator {
  private readonly currency: string;
  private readonly discountRules: DiscountRule[];

  constructor(config: CalculatorConfig = {}) {
    this.currency = config.currency ?? 'EUR';
    this.discountRules = config.discountRules ?? [new BackToTheFutureDiscountRule()];
  }

  /**
   * Calculates the total price for a cart
   */
  calculateTotal(cart: Cart): number {
    const result = this.calculate(cart);
    return result.totalPrice;
  }

  /**
   * Calculates the full result with breakdown
   */
  calculate(cart: Cart): CalculationResult {
    const bttfMovies = getBackToTheFutureMovies(cart);
    const otherMovies = getOtherMovies(cart);

    // Calculate other movies price (no discount)
    const otherMoviesPrice = otherMovies.reduce((sum, movie) => sum + movie.price, 0);

    // Calculate BTTF movies price with potential discount
    let bttfBasePrice = bttfMovies.reduce((sum, movie) => sum + movie.price, 0);
    let bttfDiscountedPrice = bttfBasePrice;
    let discountApplied: string | null = null;

    // Apply discount rules
    for (const rule of this.discountRules) {
      if (rule.applies(cart)) {
        bttfDiscountedPrice = rule.calculateDiscountedPrice(cart);
        const discount = rule.getDiscount(cart);
        discountApplied = `${discount.percentage}%`;
        break; // Apply only the first matching rule
      }
    }

    const totalPrice = bttfDiscountedPrice + otherMoviesPrice;

    return {
      totalPrice,
      currency: this.currency,
      itemsCount: cart.items.length,
      discountApplied,
      breakdown: {
        bttfMoviesCount: bttfMovies.length,
        bttfBasePrice,
        bttfDiscountedPrice,
        otherMoviesCount: otherMovies.length,
        otherMoviesPrice,
      },
    };
  }
}
