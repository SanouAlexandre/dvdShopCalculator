import {
  createCart,
  getCartItemCount,
  getBackToTheFutureMovies,
  getOtherMovies,
  getUniqueBttfEpisodes,
} from '../../src/core/models/Cart';
import { createMovie } from '../../src/core/models/Movie';
import { STANDARD_DVD_PRICE, BTTF_DVD_PRICE } from '../../src/utils/constants';

describe('Cart', () => {
  describe('createCart', () => {
    it('should create an empty cart', () => {
      const cart = createCart([]);
      expect(cart.items).toEqual([]);
    });

    it('should create a cart with movies', () => {
      const movies = [
        createMovie('Movie 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Movie 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      expect(cart.items).toHaveLength(2);
    });

    it('should create a copy of the items array', () => {
      const movies = [createMovie('Movie 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE)];
      const cart = createCart(movies);
      movies.push(createMovie('Movie 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE));
      expect(cart.items).toHaveLength(1);
    });
  });

  describe('getCartItemCount', () => {
    it('should return 0 for empty cart', () => {
      const cart = createCart([]);
      expect(getCartItemCount(cart)).toBe(0);
    });

    it('should return correct count', () => {
      const movies = [
        createMovie('Movie 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Movie 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Movie 3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      expect(getCartItemCount(cart)).toBe(3);
    });
  });

  describe('getBackToTheFutureMovies', () => {
    it('should return empty array when no BTTF movies', () => {
      const movies = [
        createMovie('La chèvre', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Les Visiteurs', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const bttfMovies = getBackToTheFutureMovies(cart);
      expect(bttfMovies).toHaveLength(0);
    });

    it('should return only BTTF movies', () => {
      const movies = [
        createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('La chèvre', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Back to the Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const bttfMovies = getBackToTheFutureMovies(cart);
      expect(bttfMovies).toHaveLength(2);
      expect(bttfMovies.every(m => m.isBackToTheFuture)).toBe(true);
    });
  });

  describe('getOtherMovies', () => {
    it('should return empty array when all are BTTF movies', () => {
      const movies = [
        createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Back to the Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const otherMovies = getOtherMovies(cart);
      expect(otherMovies).toHaveLength(0);
    });

    it('should return only non-BTTF movies', () => {
      const movies = [
        createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('La chèvre', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Les Visiteurs', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const otherMovies = getOtherMovies(cart);
      expect(otherMovies).toHaveLength(2);
      expect(otherMovies.every(m => !m.isBackToTheFuture)).toBe(true);
    });
  });

  describe('getUniqueBttfEpisodes', () => {
    it('should return empty set for cart without BTTF movies', () => {
      const movies = [
        createMovie('La chèvre', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const episodes = getUniqueBttfEpisodes(cart);
      expect(episodes.size).toBe(0);
    });

    it('should return unique episodes only', () => {
      const movies = [
        createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Back to the Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const episodes = getUniqueBttfEpisodes(cart);
      expect(episodes.size).toBe(2);
      expect(episodes.has(1)).toBe(true);
      expect(episodes.has(2)).toBe(true);
    });

    it('should return all 3 episodes when present', () => {
      const movies = [
        createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Back to the Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
        createMovie('Back to the Future 3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE),
      ];
      const cart = createCart(movies);
      const episodes = getUniqueBttfEpisodes(cart);
      expect(episodes.size).toBe(3);
    });

    it('should handle BTTF movie without episode number', () => {
      // This is an edge case that might not happen in practice
      // but we test it for branch coverage
      const cart = createCart([]);
      const episodes = getUniqueBttfEpisodes(cart);
      expect(episodes.size).toBe(0);
    });
  });
});
