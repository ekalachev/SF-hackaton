import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLoggingMiddleware } from './logging';

describe('Request Logging Middleware', () => {
  it('should call next function', () => {
    const req = {
      method: 'GET',
      url: '/api/wells',
      query: {},
      params: {},
      ip: '127.0.0.1',
    } as unknown as Request;

    const res = {
      on: vi.fn(),
      statusCode: 200,
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    requestLoggingMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should register finish event listener on response', () => {
    const req = {
      method: 'POST',
      url: '/api/wells',
      query: { limit: 10 },
      params: { id: '123' },
      ip: '192.168.1.1',
    } as unknown as Request;

    const onSpy = vi.fn();
    const res = {
      on: onSpy,
      statusCode: 201,
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    requestLoggingMiddleware(req, res, next);

    expect(onSpy).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log request when response finishes', () => {
    const req = {
      method: 'DELETE',
      url: '/api/wells/123',
      query: {},
      params: { id: '123' },
      ip: '10.0.0.1',
    } as unknown as Request;

    let finishCallback: (() => void) | undefined;
    const onSpy = vi.fn((event: string, callback: () => void) => {
      if (event === 'finish') {
        finishCallback = callback;
      }
    });

    const res = {
      on: onSpy,
      statusCode: 204,
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    requestLoggingMiddleware(req, res, next);

    expect(finishCallback).toBeDefined();

    // Trigger finish event - should not throw
    expect(() => {
      if (finishCallback) finishCallback();
    }).not.toThrow();
  });

  it('should handle different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

    methods.forEach(method => {
      const req = {
        method,
        url: '/api/test',
        query: {},
        params: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const res = {
        on: vi.fn(),
        statusCode: 200,
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      expect(() => {
        requestLoggingMiddleware(req, res, next);
      }).not.toThrow();
    });
  });

  it('should handle different status codes', () => {
    const statusCodes = [200, 201, 400, 404, 500];

    statusCodes.forEach(statusCode => {
      const req = {
        method: 'GET',
        url: '/api/test',
        query: {},
        params: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      let finishCallback: (() => void) | undefined;
      const res = {
        on: vi.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            finishCallback = callback;
          }
        }),
        statusCode,
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      requestLoggingMiddleware(req, res, next);

      expect(() => {
        if (finishCallback) finishCallback();
      }).not.toThrow();
    });
  });
});
