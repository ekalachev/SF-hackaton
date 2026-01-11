/**
 * Similarity API Routes
 * Implements GET /api/wells/:id/similar and POST /api/search/semantic endpoints
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles HTTP request/response for similarity
 * - Dependency Inversion: Depends on SimilarityService abstraction
 * - Interface Segregation: Specific validation schemas per endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { SimilarityService, WellNotFoundError } from '../services/similarityService';
import { AppError } from '../utils/errors';
import {
  wellIdParamSchema,
  similarWellsQuerySchema,
  semanticSearchBodySchema,
} from './validation.schemas';
import { logError } from '../utils/logger';
import type { WellRow } from '../types/well.types';

export const similarityRouter = Router();

/**
 * Async handler wrapper to properly handle promise rejections
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Initialize service (could be injected via DI container in future)
const similarityService = new SimilarityService(db);

/**
 * GET /api/wells/:id/similar
 * Find wells similar to a specific well
 *
 * Path parameters:
 * - id: string (well UUID)
 *
 * Query parameters:
 * - limit: number (1-100, default 10)
 * - threshold: number (0-1, default 0.7)
 *
 * Response: { targetWell, similarWells }
 */
similarityRouter.get(
  '/wells/:id/similar',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate path parameter
      const paramValidation = wellIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        return next(new AppError(400, 'Invalid well ID'));
      }

      // Validate query parameters
      const queryValidation = similarWellsQuerySchema.safeParse(req.query);

      if (!queryValidation.success) {
        const errorMessage = queryValidation.error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        return next(new AppError(400, `Invalid query parameters: ${errorMessage}`));
      }

      const { id } = paramValidation.data;
      const { limit, threshold } = queryValidation.data;

      // Strict UUID validation for similarity endpoint
      // UUID format: 8-4-4-4-12 hexadecimal digits with hyphens
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(id)) {
        return next(new AppError(400, 'Invalid UUID format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'));
      }

      // Get target well for response
      const targetWell = await db<WellRow>('wells').where('id', id).first();

      if (!targetWell) {
        return next(new AppError(404, `Well not found: ${id}`));
      }

      // Find similar wells
      const similarWells = await similarityService.findSimilarWells(id, {
        limit,
        threshold,
      });

      // Return response
      res.status(200).json({
        targetWell: {
          id: targetWell.id,
          wellId: targetWell.well_id,
          wellName: targetWell.well_name,
        },
        similarWells,
      });
    } catch (error: unknown) {
      if (error instanceof WellNotFoundError) {
        return next(new AppError(404, error.message));
      }

      logError('Error in GET /api/wells/:id/similar', error as Error);
      next(error);
    }
  })
);

/**
 * POST /api/search/semantic
 * Semantic search using natural language
 *
 * Request body:
 * - query: string (required, 1-1000 chars)
 * - limit: number (1-100, default 10)
 * - threshold: number (0-1, default 0.7)
 * - filters: { county?, status?, minDiscount? }
 *
 * Response: { query, results, totalResults, searchTime }
 */
similarityRouter.post(
  '/search/semantic',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = semanticSearchBodySchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        return next(new AppError(400, `Invalid request body: ${errorMessage}`));
      }

      const { query, limit, threshold, filters } = validationResult.data;

      // Track search time
      const startTime = Date.now();

      // Perform semantic search
      const results = await similarityService.semanticSearch(query, {
        limit,
        threshold,
        filters,
      });

      const searchTime = Date.now() - startTime;

      // Return response
      res.status(200).json({
        query,
        results,
        totalResults: results.length,
        searchTime: `${searchTime}ms`,
      });
    } catch (error) {
      logError('Error in POST /api/search/semantic', error as Error);
      next(error);
    }
  })
);
