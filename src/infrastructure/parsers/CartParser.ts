import { Cart, createCart } from '../../core/models/Cart';
import { Movie, createMovie } from '../../core/models/Movie';
import { STANDARD_DVD_PRICE, BTTF_DVD_PRICE } from '../../utils/constants';

/**
 * Parser configuration
 */
export interface ParserConfig {
  readonly standardPrice?: number;
  readonly bttfPrice?: number;
}

/**
 * Parser for converting text input to Cart objects
 */
export class CartParser {
  private readonly standardPrice: number;
  private readonly bttfPrice: number;

  constructor(config: ParserConfig = {}) {
    this.standardPrice = config.standardPrice ?? STANDARD_DVD_PRICE;
    this.bttfPrice = config.bttfPrice ?? BTTF_DVD_PRICE;
  }

  /**
   * Parses a multiline string into a Cart
   * Each line represents one movie title
   */
  parse(input: string): Cart {
    if (!input || input.trim() === '') {
      return createCart([]);
    }

    const lines = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const movies = lines.map(title => this.parseMovieTitle(title));

    return createCart(movies);
  }

  /**
   * Parses an array of movie titles into a Cart
   */
  parseArray(titles: string[]): Cart {
    if (!titles || titles.length === 0) {
      return createCart([]);
    }

    const movies = titles
      .map(title => title.trim())
      .filter(title => title.length > 0)
      .map(title => this.parseMovieTitle(title));

    return createCart(movies);
  }

  /**
   * Parses a single movie title into a Movie object
   */
  private parseMovieTitle(title: string): Movie {
    return createMovie(title, this.standardPrice, this.bttfPrice);
  }

  /**
   * Validates input and returns any errors
   */
  validate(input: string): string[] {
    const errors: string[] = [];

    if (!input || input.trim() === '') {
      errors.push('Input is empty');
      return errors;
    }

    const lines = input.split('\n').map(line => line.trim());

    lines.forEach((line, index) => {
      if (line.length === 0) {
        return; // Skip empty lines
      }

      if (line.length > 200) {
        errors.push(`Line ${index + 1}: Title too long (max 200 characters)`);
      }
    });

    return errors;
  }
}
