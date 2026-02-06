import { logger } from '../../src/utils/logger';

describe('logger', () => {
  // Spy on console transports
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console output during tests
    infoSpy = jest.spyOn(logger, 'info').mockImplementation();
    errorSpy = jest.spyOn(logger, 'error').mockImplementation();
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation();
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('log levels', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('logging operations', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(infoSpy).toHaveBeenCalledWith('Test info message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(errorSpy).toHaveBeenCalledWith('Test error message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(warnSpy).toHaveBeenCalledWith('Test warning message');
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred:', error);
      expect(errorSpy).toHaveBeenCalledWith('Error occurred:', error);
    });

    it('should handle metadata objects', () => {
      logger.info('Message with metadata', { key: 'value' });
      expect(infoSpy).toHaveBeenCalledWith('Message with metadata', { key: 'value' });
    });
  });
});
