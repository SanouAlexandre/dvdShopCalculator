import {
  STANDARD_DVD_PRICE,
  BTTF_DVD_PRICE,
  BTTF_2_EPISODES_DISCOUNT,
  BTTF_3_EPISODES_DISCOUNT,
  BTTF_TITLE_PATTERN,
  BTTF_EPISODES,
  DEFAULT_PORT,
  API_PREFIX,
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOL,
} from '../../src/utils/constants';

describe('constants', () => {
  describe('pricing constants', () => {
    it('should have STANDARD_DVD_PRICE set to 20', () => {
      expect(STANDARD_DVD_PRICE).toBe(20);
    });

    it('should have BTTF_DVD_PRICE set to 15', () => {
      expect(BTTF_DVD_PRICE).toBe(15);
    });
  });

  describe('discount constants', () => {
    it('should have BTTF_2_EPISODES_DISCOUNT set to 10', () => {
      expect(BTTF_2_EPISODES_DISCOUNT).toBe(10);
    });

    it('should have BTTF_3_EPISODES_DISCOUNT set to 20', () => {
      expect(BTTF_3_EPISODES_DISCOUNT).toBe(20);
    });
  });

  describe('BTTF pattern constants', () => {
    it('should have a valid BTTF_TITLE_PATTERN regex', () => {
      expect(BTTF_TITLE_PATTERN).toBeInstanceOf(RegExp);
      expect(BTTF_TITLE_PATTERN.test('Back to the Future 1')).toBe(true);
      expect(BTTF_TITLE_PATTERN.test('back to the future 2')).toBe(true);
      expect(BTTF_TITLE_PATTERN.test('Some other movie')).toBe(false);
    });

    it('should have BTTF_EPISODES containing 1, 2, 3', () => {
      expect(BTTF_EPISODES).toEqual([1, 2, 3]);
    });
  });

  describe('API constants', () => {
    it('should have DEFAULT_PORT set to 3000', () => {
      expect(DEFAULT_PORT).toBe(3000);
    });

    it('should have API_PREFIX set to /api', () => {
      expect(API_PREFIX).toBe('/api');
    });
  });

  describe('currency constants', () => {
    it('should have DEFAULT_CURRENCY set to EUR', () => {
      expect(DEFAULT_CURRENCY).toBe('EUR');
    });

    it('should have CURRENCY_SYMBOL set to €', () => {
      expect(CURRENCY_SYMBOL).toBe('€');
    });
  });
});
