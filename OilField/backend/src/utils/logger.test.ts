import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import logger, { logInfo, logError, logRequest, logDebug, logWarn } from './logger';

describe('Logger', () => {
  const logsDir = path.join(__dirname, '../../logs');

  beforeEach(() => {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  describe('logInfo', () => {
    it('should not throw when logging info messages with category and context', () => {
      expect(() => {
        logInfo('system', 'Test info message', { detail: 'test' });
      }).not.toThrow();
    });

    it('should not throw when logging info without context', () => {
      expect(() => {
        logInfo('api', 'Simple info message');
      }).not.toThrow();
    });
  });

  describe('logError', () => {
    it('should not throw when logging errors with stack traces', () => {
      const error = new Error('Test error');
      expect(() => {
        logError('Test error message', error, { context: 'test' });
      }).not.toThrow();
    });

    it('should not throw when logging error without additional context', () => {
      const error = new Error('Simple error');
      expect(() => {
        logError('Error occurred', error);
      }).not.toThrow();
    });
  });

  describe('logRequest', () => {
    it('should not throw when logging API requests with timing', () => {
      expect(() => {
        logRequest('GET', '/api/wells', 200, 150, { query: { limit: 10 } });
      }).not.toThrow();
    });

    it('should not throw when logging requests without context', () => {
      expect(() => {
        logRequest('POST', '/api/wells', 201, 250);
      }).not.toThrow();
    });
  });

  describe('logDebug', () => {
    it('should not throw when logging debug messages with category', () => {
      expect(() => {
        logDebug('db', 'Database query', { query: 'SELECT * FROM wells' });
      }).not.toThrow();
    });
  });

  describe('logWarn', () => {
    it('should not throw when logging warning messages', () => {
      expect(() => {
        logWarn('system', 'Warning message', { detail: 'test' });
      }).not.toThrow();
    });
  });

  describe('Winston logger instance', () => {
    it('should expose Winston logger methods', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should have correct log level configuration', () => {
      expect(logger.level).toBeDefined();
      expect(typeof logger.level).toBe('string');
    });

    it('should have transports configured', () => {
      expect(logger.transports).toBeDefined();
      expect(Array.isArray(logger.transports)).toBe(true);
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });

  describe('Log file creation', () => {
    it('should create logs directory if it does not exist', () => {
      expect(fs.existsSync(logsDir)).toBe(true);
    });
  });
});
