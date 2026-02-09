/**
 * Unit tests for Sentry instrumentation module.
 * Tests all exported functions with and without SENTRY_DSN configured.
 */

// Store original env
const originalEnv = process.env;

// Mock Sentry before importing the module
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({ setExtras: jest.fn() })),
  captureConsoleIntegration: jest.fn(() => ({})),
}));

describe('Sentry Instrumentation', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initSentry', () => {
    it('should not initialize Sentry when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();
      
      expect(consoleSpy).toHaveBeenCalledWith('[Sentry] Disabled - SENTRY_DSN not configured');
      consoleSpy.mockRestore();
    });

    it('should initialize Sentry when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_ENVIRONMENT = 'test';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');
      
      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'test',
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith('[Sentry] Initialized for test environment');
      consoleSpy.mockRestore();
    });

    it('should use production sample rates in production environment', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_ENVIRONMENT = 'production';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');
      
      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1,
          profilesSampleRate: 0.1,
        })
      );
    });

    it('should use development sample rates in non-production environment', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_ENVIRONMENT = 'development';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');
      
      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1,
          profilesSampleRate: 1,
        })
      );
    });

    it('should filter sensitive headers in beforeSend', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');
      
      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();
      
      const initCall = Sentry.init.mock.calls[0][0];
      const event = {
        request: {
          headers: {
            authorization: 'Bearer token',
            cookie: 'session=abc',
            'x-api-key': 'secret',
            'content-type': 'application/json',
          },
        },
      };
      
      const result = initCall.beforeSend(event);
      
      expect(result.request.headers.authorization).toBeUndefined();
      expect(result.request.headers.cookie).toBeUndefined();
      expect(result.request.headers['x-api-key']).toBeUndefined();
      expect(result.request.headers['content-type']).toBe('application/json');
    });

    it('should handle events without request headers', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');
      
      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();
      
      const initCall = Sentry.init.mock.calls[0][0];
      const event = { message: 'test' };
      
      const result = initCall.beforeSend(event);
      
      expect(result).toEqual(event);
    });
  });

  describe('captureException', () => {
    it('should not capture when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const Sentry = require('@sentry/node');
      
      const { captureException } = require('../../src/instrumentation/sentry');
      captureException(new Error('test'));
      
      expect(Sentry.withScope).not.toHaveBeenCalled();
    });

    it('should capture exception when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { captureException } = require('../../src/instrumentation/sentry');
      const error = new Error('test error');
      captureException(error);
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should set extras when context is provided', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      const mockSetExtras = jest.fn();
      Sentry.withScope.mockImplementation((callback: (scope: { setExtras: jest.Mock }) => void) => 
        callback({ setExtras: mockSetExtras })
      );
      
      const { captureException } = require('../../src/instrumentation/sentry');
      captureException(new Error('test'), { url: '/test', method: 'POST' });
      
      expect(mockSetExtras).toHaveBeenCalledWith({ url: '/test', method: 'POST' });
    });
  });

  describe('captureMessage', () => {
    it('should not capture when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const Sentry = require('@sentry/node');
      
      const { captureMessage } = require('../../src/instrumentation/sentry');
      captureMessage('test message');
      
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should capture message when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { captureMessage } = require('../../src/instrumentation/sentry');
      captureMessage('test message', 'warning');
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('test message', 'warning');
    });

    it('should use info level by default', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { captureMessage } = require('../../src/instrumentation/sentry');
      captureMessage('test message');
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('test message', 'info');
    });
  });

  describe('setUser', () => {
    it('should not set user when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const Sentry = require('@sentry/node');
      
      const { setUser } = require('../../src/instrumentation/sentry');
      setUser({ id: '123' });
      
      expect(Sentry.setUser).not.toHaveBeenCalled();
    });

    it('should set user when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { setUser } = require('../../src/instrumentation/sentry');
      setUser({ id: '123', email: 'test@example.com' });
      
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: '123', email: 'test@example.com' });
    });

    it('should allow clearing user with null', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { setUser } = require('../../src/instrumentation/sentry');
      setUser(null);
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should not add breadcrumb when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const Sentry = require('@sentry/node');
      
      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({ message: 'test' });
      
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('should add breadcrumb when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({ 
        message: 'test breadcrumb', 
        category: 'api',
        level: 'info',
        data: { key: 'value' }
      });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'test breadcrumb',
        category: 'api',
        level: 'info',
        data: { key: 'value' },
      });
    });
  });

  describe('sentryErrorHandler', () => {
    it('should capture exception and call next when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      
      const { sentryErrorHandler } = require('../../src/instrumentation/sentry');
      const error = new Error('test error');
      const next = jest.fn();
      
      sentryErrorHandler(error, {}, {}, next);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should only call next when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const Sentry = require('@sentry/node');
      
      const { sentryErrorHandler } = require('../../src/instrumentation/sentry');
      const error = new Error('test error');
      const next = jest.fn();
      
      sentryErrorHandler(error, {}, {}, next);
      
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('sentryRequestHandler', () => {
    it('should call next', () => {
      const { sentryRequestHandler } = require('../../src/instrumentation/sentry');
      const next = jest.fn();
      
      sentryRequestHandler({}, {}, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('environment configuration', () => {
    it('should use NODE_ENV when SENTRY_ENVIRONMENT is not set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.SENTRY_ENVIRONMENT;
      process.env.NODE_ENV = 'staging';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');

      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'staging',
        })
      );
    });

    it('should default to development when no environment is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.SENTRY_ENVIRONMENT;
      delete process.env.NODE_ENV;
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');

      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'development',
        })
      );
    });

    it('should use SENTRY_RELEASE when set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_RELEASE = 'v1.2.3';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');

      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          release: 'v1.2.3',
        })
      );
    });

    it('should use npm_package_version when SENTRY_RELEASE is not set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.SENTRY_RELEASE;
      process.env.npm_package_version = '2.0.0';
      jest.spyOn(console, 'log').mockImplementation();
      const Sentry = require('@sentry/node');

      const { initSentry } = require('../../src/instrumentation/sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          release: '2.0.0',
        })
      );
    });
  });

  describe('captureException edge cases', () => {
    it('should capture exception without context', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      const mockSetExtras = jest.fn();
      Sentry.withScope.mockImplementation((callback: (scope: { setExtras: jest.Mock }) => void) =>
        callback({ setExtras: mockSetExtras })
      );

      const { captureException } = require('../../src/instrumentation/sentry');
      const error = new Error('test error without context');
      captureException(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      expect(mockSetExtras).not.toHaveBeenCalled();
    });

    it('should handle empty context object', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');
      const mockSetExtras = jest.fn();
      Sentry.withScope.mockImplementation((callback: (scope: { setExtras: jest.Mock }) => void) =>
        callback({ setExtras: mockSetExtras })
      );

      const { captureException } = require('../../src/instrumentation/sentry');
      captureException(new Error('test'), {});

      expect(mockSetExtras).toHaveBeenCalledWith({});
    });
  });

  describe('captureMessage levels', () => {
    it('should capture message with fatal level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { captureMessage } = require('../../src/instrumentation/sentry');
      captureMessage('fatal error', 'fatal');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('fatal error', 'fatal');
    });

    it('should capture message with error level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { captureMessage } = require('../../src/instrumentation/sentry');
      captureMessage('error occurred', 'error');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('error occurred', 'error');
    });

    it('should capture message with debug level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { captureMessage } = require('../../src/instrumentation/sentry');
      captureMessage('debug info', 'debug');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('debug info', 'debug');
    });
  });

  describe('setUser variations', () => {
    it('should set user with only username', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { setUser } = require('../../src/instrumentation/sentry');
      setUser({ username: 'testuser' });

      expect(Sentry.setUser).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('should set user with all fields', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { setUser } = require('../../src/instrumentation/sentry');
      setUser({ id: '123', email: 'test@example.com', username: 'testuser' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: '123',
        email: 'test@example.com',
        username: 'testuser'
      });
    });
  });

  describe('addBreadcrumb variations', () => {
    it('should add breadcrumb with message only', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({ message: 'minimal breadcrumb' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({ message: 'minimal breadcrumb' });
    });

    it('should add breadcrumb with category and level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({
        message: 'navigation',
        category: 'navigation',
        level: 'debug'
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'navigation',
        category: 'navigation',
        level: 'debug'
      });
    });

    it('should add breadcrumb with fatal level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({
        message: 'critical action',
        level: 'fatal'
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'critical action',
        level: 'fatal'
      });
    });

    it('should add breadcrumb with error level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({
        message: 'error breadcrumb',
        level: 'error'
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'error breadcrumb',
        level: 'error'
      });
    });

    it('should add breadcrumb with warning level', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const Sentry = require('@sentry/node');

      const { addBreadcrumb } = require('../../src/instrumentation/sentry');
      addBreadcrumb({
        message: 'warning breadcrumb',
        level: 'warning'
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'warning breadcrumb',
        level: 'warning'
      });
    });
  });
});
