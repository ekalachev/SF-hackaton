import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all HTTP requests with method, URL, status code, and timing
 */
export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req.method, req.url, res.statusCode, duration, {
      query: req.query,
      params: req.params,
      ip: req.ip,
    });
  });

  next();
};
