import { CalculationResult } from '../../core/calculator';
import { CURRENCY_SYMBOL } from '../../utils/constants';

/**
 * Formatter configuration
 */
export interface FormatterConfig {
  readonly currencySymbol?: string;
  readonly locale?: string;
}

/**
 * Formats prices and calculation results for display
 */
export class PriceFormatter {
  private readonly currencySymbol: string;
  private readonly locale: string;

  constructor(config: FormatterConfig = {}) {
    this.currencySymbol = config.currencySymbol ?? CURRENCY_SYMBOL;
    this.locale = config.locale ?? 'fr-FR';
  }

  /**
   * Formats a price value with currency symbol
   */
  formatPrice(price: number): string {
    const formatted = new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

    return `${formatted} ${this.currencySymbol}`;
  }

  /**
   * Formats a calculation result for display
   */
  formatResult(result: CalculationResult): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════');
    lines.push('         DVD SHOP - RECEIPT');
    lines.push('═══════════════════════════════════════');
    lines.push('');

    // BTTF movies section
    if (result.breakdown.bttfMoviesCount > 0) {
      lines.push(`Back to the Future DVDs: ${result.breakdown.bttfMoviesCount}`);
      lines.push(`  Base price: ${this.formatPrice(result.breakdown.bttfBasePrice)}`);

      if (result.discountApplied) {
        lines.push(`  Discount: -${result.discountApplied}`);
        lines.push(`  After discount: ${this.formatPrice(result.breakdown.bttfDiscountedPrice)}`);
      }

      lines.push('');
    }

    // Other movies section
    if (result.breakdown.otherMoviesCount > 0) {
      lines.push(`Other DVDs: ${result.breakdown.otherMoviesCount}`);
      lines.push(`  Price: ${this.formatPrice(result.breakdown.otherMoviesPrice)}`);
      lines.push('');
    }

    lines.push('───────────────────────────────────────');
    lines.push(`TOTAL: ${this.formatPrice(result.totalPrice)}`);
    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Formats a simple price output
   */
  formatSimple(result: CalculationResult): string {
    return `Prix total: ${this.formatPrice(result.totalPrice)}`;
  }

  /**
   * Formats result as JSON-friendly object
   */
  formatJSON(result: CalculationResult): object {
    return {
      totalPrice: result.totalPrice,
      currency: result.currency,
      formattedPrice: this.formatPrice(result.totalPrice),
      itemsCount: result.itemsCount,
      discountApplied: result.discountApplied,
      breakdown: {
        bttfMovies: {
          count: result.breakdown.bttfMoviesCount,
          basePrice: result.breakdown.bttfBasePrice,
          discountedPrice: result.breakdown.bttfDiscountedPrice,
        },
        otherMovies: {
          count: result.breakdown.otherMoviesCount,
          price: result.breakdown.otherMoviesPrice,
        },
      },
    };
  }
}
