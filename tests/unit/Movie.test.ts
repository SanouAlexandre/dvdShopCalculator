import { createMovie, isBackToTheFutureMovie, Movie } from '../../src/core/models/Movie';
import { STANDARD_DVD_PRICE, BTTF_DVD_PRICE } from '../../src/utils/constants';

describe('Movie', () => {
  describe('createMovie', () => {
    describe('standard movies', () => {
      it('should create a standard movie with correct price', () => {
        const movie = createMovie('La chèvre', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        
        expect(movie.title).toBe('La chèvre');
        expect(movie.price).toBe(STANDARD_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(false);
        expect(movie.bttfEpisode).toBeUndefined();
      });

      it('should trim whitespace from title', () => {
        const movie = createMovie('  Les Visiteurs  ', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.title).toBe('Les Visiteurs');
      });

      it('should treat non-BTTF movies as standard', () => {
        const movie = createMovie('Back 2 the Future', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(false);
      });
    });

    describe('Back to the Future pattern', () => {
      it('should recognize "Back to the Future 1"', () => {
        const movie = createMovie('Back to the Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(1);
        expect(movie.price).toBe(BTTF_DVD_PRICE);
      });

      it('should recognize "Back to the Future 2"', () => {
        const movie = createMovie('Back to the Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.bttfEpisode).toBe(2);
      });

      it('should recognize "Back to the Future 3"', () => {
        const movie = createMovie('Back to the Future 3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.bttfEpisode).toBe(3);
      });

      it('should be case insensitive', () => {
        const movie = createMovie('BACK TO THE FUTURE 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(true);
      });

      it('should handle optional space before episode number', () => {
        const movie = createMovie('Back to the Future1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(1);
      });
    });

    describe('Back to Future pattern (without "the")', () => {
      it('should recognize "Back to Future 1"', () => {
        const movie = createMovie('Back to Future 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(1);
      });

      it('should recognize "Back to Future 2"', () => {
        const movie = createMovie('Back to Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.bttfEpisode).toBe(2);
      });

      it('should recognize "back to future 3" (lowercase)', () => {
        const movie = createMovie('back to future 3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(3);
      });
    });

    describe('BTTF abbreviation pattern', () => {
      it('should recognize "BTTF 1"', () => {
        const movie = createMovie('BTTF 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(1);
      });

      it('should recognize "BTTF 2"', () => {
        const movie = createMovie('BTTF 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.bttfEpisode).toBe(2);
      });

      it('should recognize "bttf 3" (lowercase)', () => {
        const movie = createMovie('bttf 3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(3);
      });

      it('should recognize "BTTF3" (no space)', () => {
        const movie = createMovie('BTTF3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(3);
      });
    });

    describe('French title pattern', () => {
      it('should recognize "Retour vers le futur 1"', () => {
        const movie = createMovie('Retour vers le futur 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        
        expect(movie.isBackToTheFuture).toBe(true);
        expect(movie.bttfEpisode).toBe(1);
      });

      it('should recognize "Retour vers le futur 2"', () => {
        const movie = createMovie('Retour vers le futur 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.bttfEpisode).toBe(2);
      });

      it('should recognize "Retour vers le futur 3"', () => {
        const movie = createMovie('Retour vers le futur 3', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.bttfEpisode).toBe(3);
      });

      it('should be case insensitive for French title', () => {
        const movie = createMovie('RETOUR VERS LE FUTUR 1', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(true);
      });
    });

    describe('invalid episode numbers', () => {
      it('should not recognize episode 0', () => {
        const movie = createMovie('Back to the Future 0', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(false);
      });

      it('should not recognize episode 4', () => {
        const movie = createMovie('Back to the Future 4', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(false);
      });

      it('should not recognize episode 5', () => {
        const movie = createMovie('BTTF 5', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(false);
      });

      it('should not recognize episode 9', () => {
        const movie = createMovie('Retour vers le futur 9', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
        expect(movie.isBackToTheFuture).toBe(false);
      });
    });
  });

  describe('isBackToTheFutureMovie', () => {
    it('should return true for BTTF movie with episode', () => {
      const movie: Movie = {
        title: 'Back to the Future 1',
        price: BTTF_DVD_PRICE,
        isBackToTheFuture: true,
        bttfEpisode: 1,
      };
      
      expect(isBackToTheFutureMovie(movie)).toBe(true);
    });

    it('should return false for standard movie', () => {
      const movie: Movie = {
        title: 'La chèvre',
        price: STANDARD_DVD_PRICE,
        isBackToTheFuture: false,
      };
      
      expect(isBackToTheFutureMovie(movie)).toBe(false);
    });

    it('should return false if isBackToTheFuture is true but bttfEpisode is undefined', () => {
      const movie: Movie = {
        title: 'Back to the Future',
        price: BTTF_DVD_PRICE,
        isBackToTheFuture: true,
        bttfEpisode: undefined,
      };
      
      expect(isBackToTheFutureMovie(movie)).toBe(false);
    });

    it('should narrow type after check', () => {
      const movie = createMovie('Back to the Future 2', STANDARD_DVD_PRICE, BTTF_DVD_PRICE);
      
      if (isBackToTheFutureMovie(movie)) {
        // Type should be narrowed to include bttfEpisode as number
        expect(movie.bttfEpisode).toBe(2);
      }
    });
  });
});
