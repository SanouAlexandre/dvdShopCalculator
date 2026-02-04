import { CartParser } from '../../src/infrastructure/parsers/CartParser';

describe('CartParser', () => {
  let parser: CartParser;

  beforeEach(() => {
    parser = new CartParser();
  });

  describe('parse', () => {
    it('should return empty cart for empty input', () => {
      const cart = parser.parse('');
      expect(cart.items).toHaveLength(0);
    });

    it('should return empty cart for whitespace-only input', () => {
      const cart = parser.parse('   \n\n   ');
      expect(cart.items).toHaveLength(0);
    });

    it('should parse single movie title', () => {
      const cart = parser.parse('La chèvre');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].title).toBe('La chèvre');
      expect(cart.items[0].price).toBe(20);
      expect(cart.items[0].isBackToTheFuture).toBe(false);
    });

    it('should parse multiple movie titles', () => {
      const cart = parser.parse('La chèvre\nLes Visiteurs\nAmélie');
      expect(cart.items).toHaveLength(3);
      expect(cart.items.map((m: { title: string }) => m.title)).toEqual(['La chèvre', 'Les Visiteurs', 'Amélie']);
    });

    it('should parse Back to the Future 1', () => {
      const cart = parser.parse('Back to the Future 1');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].title).toBe('Back to the Future 1');
      expect(cart.items[0].price).toBe(15);
      expect(cart.items[0].isBackToTheFuture).toBe(true);
      expect(cart.items[0].bttfEpisode).toBe(1);
    });

    it('should parse Back to the Future 2', () => {
      const cart = parser.parse('Back to the Future 2');
      expect(cart.items[0].bttfEpisode).toBe(2);
    });

    it('should parse Back to the Future 3', () => {
      const cart = parser.parse('Back to the Future 3');
      expect(cart.items[0].bttfEpisode).toBe(3);
    });

    it('should ignore empty lines', () => {
      const cart = parser.parse('La chèvre\n\nLes Visiteurs\n\n');
      expect(cart.items).toHaveLength(2);
    });

    it('should trim whitespace from titles', () => {
      const cart = parser.parse('  La chèvre  \n  Les Visiteurs  ');
      expect(cart.items[0].title).toBe('La chèvre');
      expect(cart.items[1].title).toBe('Les Visiteurs');
    });

    it('should handle case variations in BTTF titles', () => {
      const cart = parser.parse('back to the future 1');
      expect(cart.items[0].isBackToTheFuture).toBe(true);
    });

    it('should not recognize invalid BTTF episode numbers', () => {
      const cart = parser.parse('Back to the Future 4');
      expect(cart.items[0].isBackToTheFuture).toBe(false);
      expect(cart.items[0].price).toBe(20);
    });

    it('should not recognize BTTF without episode number', () => {
      const cart = parser.parse('Back to the Future');
      expect(cart.items[0].isBackToTheFuture).toBe(false);
      expect(cart.items[0].price).toBe(20);
    });
  });

  describe('parseArray', () => {
    it('should return empty cart for empty array', () => {
      const cart = parser.parseArray([]);
      expect(cart.items).toHaveLength(0);
    });

    it('should parse array of movie titles', () => {
      const cart = parser.parseArray(['La chèvre', 'Back to the Future 1']);
      expect(cart.items).toHaveLength(2);
      expect(cart.items[0].isBackToTheFuture).toBe(false);
      expect(cart.items[1].isBackToTheFuture).toBe(true);
    });

    it('should filter out empty strings', () => {
      const cart = parser.parseArray(['La chèvre', '', '  ', 'Les Visiteurs']);
      expect(cart.items).toHaveLength(2);
    });
  });

  describe('validate', () => {
    it('should return error for empty input', () => {
      const errors = parser.validate('');
      expect(errors).toContain('Input is empty');
    });

    it('should return no errors for valid input', () => {
      const errors = parser.validate('La chèvre\nBack to the Future 1');
      expect(errors).toHaveLength(0);
    });

    it('should return error for title exceeding max length', () => {
      const longTitle = 'A'.repeat(201);
      const errors = parser.validate(longTitle);
      expect(errors.some((e: string) => e.includes('too long'))).toBe(true);
    });
  });

  describe('custom prices', () => {
    it('should use custom prices when configured', () => {
      const customParser = new CartParser({
        standardPrice: 25,
        bttfPrice: 18,
      });

      const cart = customParser.parse('La chèvre\nBack to the Future 1');
      expect(cart.items[0].price).toBe(25);
      expect(cart.items[1].price).toBe(18);
    });
  });
});
