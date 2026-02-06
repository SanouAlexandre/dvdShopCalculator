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
    const filenames = fileTransports.map((t: { filename?: string; options?: { filename?: string } }) => 
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
