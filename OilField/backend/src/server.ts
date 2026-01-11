import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logInfo, logError } from './utils/logger';
import { requestLoggingMiddleware } from './middleware/logging';
import { AppError } from './utils/errors';
import { wellsRouter } from './routes/wells.routes';
import { similarityRouter } from './routes/similarity.routes';
import { aiRouter } from './routes/ai.routes';
import smtRouter from './routes/smt.routes';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLoggingMiddleware);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'OilField API is running' });
});

// Mount routers
app.use('/api/wells', wellsRouter);
app.use('/api', similarityRouter);
app.use('/api', aiRouter);
app.use('/api/smt', smtRouter);

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, 'Route not found'));
});

// Error handler
app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    logError(`AppError: ${err.message}`, err, { statusCode: err.statusCode });
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  } else {
    logError(`Unexpected error: ${err.message}`, err);
    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Export app for testing
export default app;

// Start server only when run directly (not imported by tests)
if (require.main === module) {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    logInfo('system', 'Server started', { port: PORT, env: env.NODE_ENV });
    logInfo('system', 'Health check available', { url: `http://localhost:${PORT}/health` });
  });
}
