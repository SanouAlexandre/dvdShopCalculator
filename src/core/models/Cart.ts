import { Movie } from './Movie';

/**
 * Represents a shopping cart containing movies
 */
export interface Cart {
  readonly items: ReadonlyArray<Movie>;
}

/**
 * Creates a new Cart with the given items
 */
export function createCart(items: Movie[]): Cart {
  return {
    items: [...items],
  };
}

/**
 * Returns the total number of items in the cart
 */
export function getCartItemCount(cart: Cart): number {
  return cart.items.length;
}

/**
 * Returns only Back to the Future movies from the cart
 */
export function getBackToTheFutureMovies(cart: Cart): Movie[] {
  return cart.items.filter(movie => movie.isBackToTheFuture);
}

/**
 * Returns non-Back to the Future movies from the cart
 */
export function getOtherMovies(cart: Cart): Movie[] {
  return cart.items.filter(movie => !movie.isBackToTheFuture);
}

/**
 * Returns the unique Back to the Future episodes in the cart
 */
export function getUniqueBttfEpisodes(cart: Cart): Set<number> {
  const bttfMovies = getBackToTheFutureMovies(cart);
  const episodes = new Set<number>();

  for (const movie of bttfMovies) {
    if (movie.bttfEpisode !== undefined) {
      episodes.add(movie.bttfEpisode);
    }
  }

  return episodes;
}
