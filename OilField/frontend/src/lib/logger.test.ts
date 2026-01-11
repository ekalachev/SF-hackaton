import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger from './logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clear();
  });

  describe('Basic logging', () => {
    it('should log info messages and store them', () => {
      logger.info('ui', 'Test message', { detail: 'test' });
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].category).toBe('ui');
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].context).toEqual({ detail: 'test' });
      expect(logs[0].timestamp).toBeDefined();
    });

    it('should log error messages', () => {
      logger.error('api', 'Error occurred', { code: 500 });
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].category).toBe('api');
      expect(logs[0].message).toBe('Error occurred');
    });

    it('should log warn messages', () => {
      logger.warn('system', 'Warning message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].category).toBe('system');
    });

    it('should log debug messages', () => {
      logger.debug('performance', 'Debug info', { timing: 123 });
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].category).toBe('performance');
    });

    it('should log without context', () => {
      logger.info('ui', 'Simple message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBeUndefined();
    });
  });

  describe('Log history management', () => {
    it('should maintain log history', () => {
      logger.info('ui', 'Message 1');
      logger.error('api', 'Message 2');
      logger.warn('system', 'Message 3');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Message 1');
      expect(logs[1].message).toBe('Message 2');
      expect(logs[2].message).toBe('Message 3');
    });

    it('should limit log history to maxLogs', () => {
      // Add 1100 logs (max is 1000)
      for (let i = 0; i < 1100; i++) {
        logger.debug('system', `Message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1000);
      // Should have removed oldest logs
      expect(logs[0].message).toBe('Message 100');
      expect(logs[999].message).toBe('Message 1099');
    });

    it('should clear all logs', () => {
      logger.info('ui', 'Message 1');
      logger.error('api', 'Message 2');
      expect(logger.getLogs()).toHaveLength(2);

      logger.clear();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Subscriber notifications', () => {
    it('should notify subscribers when logging', () => {
      const mockListener = vi.fn();
      logger.subscribe(mockListener);

      logger.info('system', 'Test notification');

      expect(mockListener).toHaveBeenCalledOnce();
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          category: 'system',
          message: 'Test notification',
        })
      );
    });

    it('should support multiple subscribers', () => {
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();

      logger.subscribe(mockListener1);
      logger.subscribe(mockListener2);

      logger.warn('ui', 'Multiple subscribers');

      expect(mockListener1).toHaveBeenCalledOnce();
      expect(mockListener2).toHaveBeenCalledOnce();
    });

    it('should unsubscribe listeners', () => {
      const mockListener = vi.fn();
      const unsubscribe = logger.subscribe(mockListener);

      logger.info('system', 'First message');
      expect(mockListener).toHaveBeenCalledOnce();

      unsubscribe();

      logger.info('system', 'Second message');
      expect(mockListener).toHaveBeenCalledOnce(); // Still only once
    });
  });

  describe('API logging helpers', () => {
    it('should log API request', () => {
      logger.logApiRequest('POST', '/api/wells');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].category).toBe('api');
      expect(logs[0].message).toBe('API Request: POST /api/wells');
    });

    it('should log API response', () => {
      logger.logApiResponse('GET', '/api/wells', 200, 150);
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].category).toBe('api');
      expect(logs[0].message).toBe('API Response: GET /api/wells');
      expect(logs[0].context).toEqual({ status: 200, duration: '150ms' });
    });

    it('should log API error', () => {
      const error = new Error('Network error');
      logger.logApiError('DELETE', '/api/wells/123', error);
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].category).toBe('api');
      expect(logs[0].message).toBe('API Error: DELETE /api/wells/123');
      expect(logs[0].context).toEqual({ error: 'Network error' });
    });
  });

  describe('Performance logging', () => {
    it('should log performance metrics', () => {
      logger.logPerformance('render', 16.5, 'ms');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].category).toBe('performance');
      expect(logs[0].message).toBe('render: 16.5ms');
    });
  });

  describe('Log entry structure', () => {
    it('should create log entries with ISO timestamp', () => {
      logger.info('system', 'Test');
      const logs = logger.getLogs();

      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create immutable log copies', () => {
      logger.info('ui', 'Original message');
      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();

      expect(logs1).not.toBe(logs2); // Different array instances
      expect(logs1).toEqual(logs2); // But same content
    });
  });
});
