import { Cart, getBackToTheFutureMovies, getUniqueBttfEpisodes } from '../models/Cart';
import { Discount, createDiscount, applyDiscount, NO_DISCOUNT } from '../models/Discount';
import { DiscountRule, DiscountResult } from './DiscountRule';

/**
 * Discount rule for Back to the Future trilogy
 *
 * Rules:
 * - 2 different BTTF movies: 10% discount on all BTTF movies
 * - 3 different BTTF movies: 20% discount on all BTTF movies
 */
export class BackToTheFutureDiscountRule implements DiscountRule {
  readonly name = 'Back to the Future Discount';

  private readonly discountFor2 = createDiscount(
    'BTTF 2 Episodes',
    10,
    '10% discount for having 2 different Back to the Future episodes'
  );

  private readonly discountFor3 = createDiscount(
    'BTTF Complete Trilogy',
    20,
    '20% discount for having all 3 Back to the Future episodes'
  );

  /**
   * Applies if there are at least 2 different BTTF episodes
   */
  applies(cart: Cart): boolean {
    const uniqueEpisodes = getUniqueBttfEpisodes(cart);
    return uniqueEpisodes.size >= 2;
  }

  /**
   * Returns the appropriate discount based on unique episodes
   */
  getDiscount(cart: Cart): Discount {
    const uniqueEpisodes = getUniqueBttfEpisodes(cart);

    if (uniqueEpisodes.size >= 3) {
      return this.discountFor3;
    }

    if (uniqueEpisodes.size >= 2) {
      return this.discountFor2;
    }

    return NO_DISCOUNT;
  }

  /**
   * Returns the base price of all BTTF movies in the cart
   */
  getApplicableItemsBasePrice(cart: Cart): number {
    const bttfMovies = getBackToTheFutureMovies(cart);
    return bttfMovies.reduce((sum, movie) => sum + movie.price, 0);
  }

  /**
   * Calculates the discounted price for all BTTF movies
   */
  calculateDiscountedPrice(cart: Cart): number {
    const basePrice = this.getApplicableItemsBasePrice(cart);
    const discount = this.getDiscount(cart);

    return applyDiscount(basePrice, discount);
  }

  /**
   * Returns detailed discount result
   */
  getDiscountResult(cart: Cart): DiscountResult {
    const originalPrice = this.getApplicableItemsBasePrice(cart);
    const discountedPrice = this.calculateDiscountedPrice(cart);
    const discount = this.getDiscount(cart);

    return {
      ruleName: this.name,
      discount,
      originalPrice,
      discountedPrice,
      savings: originalPrice - discountedPrice,
    };
  }
}
