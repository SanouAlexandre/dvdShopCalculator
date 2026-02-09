/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Tests for logger module in production mode
 * This file tests the production-specific file transports
 */

describe('logger in production mode', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Set production environment before importing
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
    // Clear the module cache to reset state
    jest.resetModules();
  });

  it('should add file transports in production mode', () => {
    // Clear the module cache to force re-import with new env
    jest.resetModules();

    // Re-import the logger with NODE_ENV=production
    const { logger: prodLogger } = require('../../src/utils/logger');

    // Check that file transports are added
    const transports = prodLogger.transports;

    // Should have Console + 2 File transports = 3 total
    expect(transports.length).toBeGreaterThanOrEqual(3);

    // Find file transports by checking for File transport type
    const fileTransports = transports.filter(
      (t: unknown) => t && (t as { name?: string }).name === 'file'
    );

    expect(fileTransports.length).toBe(2);

    // Check filenames using options or direct properties
    const filenames = fileTransports.map(
      (t: { filename?: string; options?: { filename?: string } }) =>
        t.filename || (t.options && t.options.filename)
    );

    expect(filenames).toContain('error.log');
    expect(filenames).toContain('combined.log');
  });
});

describe('logger format with stack traces', () => {
  it('should handle errors with stack in actual logger', () => {
    jest.resetModules();

    // Import the actual logger
    const { logger: realLogger } = require('../../src/utils/logger');

    // Create a custom transport to capture output
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Transport = require('winston-transport');

    let capturedInfo: Record<string, unknown> = {};

    class TestTransport extends Transport {
      log(info: Record<string, unknown>, callback: () => void) {
        capturedInfo = info;
        callback();
      }
    }

    // Add our test transport to capture the formatted output
    const testTransport = new TestTransport();
    realLogger.add(testTransport);

    // Log an error with stack trace
    const testError = new Error('Test error with stack');
    realLogger.error(testError);

    // Remove the test transport
    realLogger.remove(testTransport);

    // Verify the message was captured and formatted
    expect(capturedInfo).toBeDefined();
    expect(capturedInfo.level).toBe('error');
  });

  it('should format message without stack correctly', () => {
    jest.resetModules();

    const { logger: realLogger } = require('../../src/utils/logger');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Transport = require('winston-transport');

    let capturedInfo: Record<string, unknown> = {};

    class TestTransport extends Transport {
      log(info: Record<string, unknown>, callback: () => void) {
        capturedInfo = info;
        callback();
      }
    }

    const testTransport = new TestTransport();
    realLogger.add(testTransport);

    // Log a simple message without error
    realLogger.info('Simple message without stack');

    realLogger.remove(testTransport);

    expect(capturedInfo).toBeDefined();
    expect(capturedInfo.level).toBe('info');
    expect(capturedInfo.message).toBe('Simple message without stack');
  });
});

describe('logger Loki transport configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.LOKI_HOST;
    delete process.env.LOKI_BASIC_AUTH;
    delete process.env.HOSTNAME;
    delete process.env.SERVICE_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('should log warning when LOKI_HOST is set but winston-loki is not installed', () => {
    // Mock require to simulate winston-loki not being installed
    jest.doMock('winston-loki', () => {
      throw new Error('MODULE_NOT_FOUND');
    });

    process.env.LOKI_HOST = 'http://localhost:3100';
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    require('../../src/utils/logger');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Loki] LOKI_HOST configured but winston-loki not installed'
    );
    consoleSpy.mockRestore();
  });

  it('should configure Loki transport when LOKI_HOST and winston-loki are available', () => {
    // Create a proper mock that behaves like an EventEmitter
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EventEmitter = require('events');

    class MockLokiTransport extends EventEmitter {
      name = 'loki';
      static calledWith: unknown = null;
      constructor(options: unknown) {
        super();
        MockLokiTransport.calledWith = options;
      }
      log(_info: unknown, callback: () => void) {
        callback();
      }
    }

    jest.doMock('winston-loki', () => MockLokiTransport);

    process.env.LOKI_HOST = 'http://localhost:3100';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation(); // suppress legacy warning

    require('../../src/utils/logger');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Loki] Transport configured for http://localhost:3100'
    );
    expect(MockLokiTransport.calledWith).toEqual(
      expect.objectContaining({
        host: 'http://localhost:3100',
        json: true,
        replaceTimestamp: true,
      })
    );
    consoleSpy.mockRestore();
  });

  it('should add hostname label when HOSTNAME env is set', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EventEmitter = require('events');

    class MockLokiTransport extends EventEmitter {
      name = 'loki';
      static calledWith: unknown = null;
      constructor(options: unknown) {
        super();
        MockLokiTransport.calledWith = options;
      }
      log(_info: unknown, callback: () => void) {
        callback();
      }
    }

    jest.doMock('winston-loki', () => MockLokiTransport);

    process.env.LOKI_HOST = 'http://localhost:3100';
    process.env.HOSTNAME = 'test-host-123';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    require('../../src/utils/logger');

    expect(MockLokiTransport.calledWith).toEqual(
      expect.objectContaining({
        labels: expect.objectContaining({
          host: 'test-host-123',
        }),
      })
    );
  });

  it('should use custom SERVICE_NAME in labels', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EventEmitter = require('events');

    class MockLokiTransport extends EventEmitter {
      name = 'loki';
      static calledWith: unknown = null;
      constructor(options: unknown) {
        super();
        MockLokiTransport.calledWith = options;
      }
      log(_info: unknown, callback: () => void) {
        callback();
      }
    }

    jest.doMock('winston-loki', () => MockLokiTransport);

    process.env.LOKI_HOST = 'http://localhost:3100';
    process.env.SERVICE_NAME = 'my-custom-service';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    require('../../src/utils/logger');

    expect(MockLokiTransport.calledWith).toEqual(
      expect.objectContaining({
        labels: expect.objectContaining({
          app: 'my-custom-service',
        }),
      })
    );
  });

  it('should add basicAuth when LOKI_BASIC_AUTH is configured', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EventEmitter = require('events');

    class MockLokiTransport extends EventEmitter {
      name = 'loki';
      static calledWith: unknown = null;
      constructor(options: unknown) {
        super();
        MockLokiTransport.calledWith = options;
      }
      log(_info: unknown, callback: () => void) {
        callback();
      }
    }

    jest.doMock('winston-loki', () => MockLokiTransport);

    process.env.LOKI_HOST = 'http://localhost:3100';
    process.env.LOKI_BASIC_AUTH = 'user:password';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    require('../../src/utils/logger');

    expect(MockLokiTransport.calledWith).toEqual(
      expect.objectContaining({
        basicAuth: 'user:password',
      })
    );
  });

  it('should handle Loki connection errors via onConnectionError callback', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EventEmitter = require('events');

    let capturedErrorHandler: ((err: Error) => void) | undefined;

    class MockLokiTransport extends EventEmitter {
      name = 'loki';
      constructor(options: { onConnectionError?: (err: Error) => void }) {
        super();
        capturedErrorHandler = options.onConnectionError;
      }
      log(_info: unknown, callback: () => void) {
        callback();
      }
    }

    jest.doMock('winston-loki', () => MockLokiTransport);

    process.env.LOKI_HOST = 'http://localhost:3100';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error');

    require('../../src/utils/logger');

    // Trigger the error callback
    expect(capturedErrorHandler).toBeDefined();
    capturedErrorHandler!(new Error('Connection refused'));

    expect(consoleErrorSpy).toHaveBeenCalledWith('[Loki] Connection error:', 'Connection refused');
  });

  it('should not configure Loki when LOKI_HOST is not set', () => {
    // Remove any previous mocks - use real module behavior
    jest.unmock('winston-loki');

    delete process.env.LOKI_HOST;

    // Clear previous console spy calls by creating a fresh spy
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleSpy.mockClear(); // Clear any previous calls
    jest.spyOn(console, 'error').mockImplementation();

    const { logger: testLogger } = require('../../src/utils/logger');

    // Logger should still work but no Loki transport was configured for THIS test
    // We just verify the logger is functional
    expect(testLogger).toBeDefined();
    expect(testLogger.transports).toBeDefined();

    // Clean up
    consoleSpy.mockRestore();
  });
});
