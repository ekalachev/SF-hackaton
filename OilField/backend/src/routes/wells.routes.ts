/**
 * Wells API Routes
 * Implements GET /api/wells and GET /api/wells/:id endpoints
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles HTTP request/response for wells
 * - Dependency Inversion: Depends on WellService abstraction
 * - Interface Segregation: Specific validation schemas per endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { WellService, WellNotFoundError } from '../services/wellService';
import { AppError } from '../utils/errors';
import { getWellsQuerySchema, wellIdParamSchema } from './validation.schemas';
import { logError } from '../utils/logger';

export const wellsRouter = Router();

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
const wellService = new WellService(db);

/**
 * GET /api/wells
 * List wells with filtering, sorting, and pagination
 *
 * Query parameters:
 * - limit: number (1-500, default 100)
 * - offset: number (default 0)
 * - county: string
 * - status: 'active' | 'plugged' | 'depleted'
 * - minDiscount: number (0-100)
 * - sortBy: 'production' | 'discount' | 'valuation'
 * - sortOrder: 'asc' | 'desc'
 *
 * Response: GetWellsResponse
 */
wellsRouter.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters with Zod
    const validationResult = getWellsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      return next(new AppError(400, `Invalid query parameters: ${errorMessage}`));
    }

    const filters = validationResult.data;

    // Call service
    const result = await wellService.getWells(filters);

    // Return response
    res.status(200).json(result);
  } catch (error) {
    logError('Error in GET /api/wells', error as Error);
    next(error);
  }
}));

/**
 * GET /api/wells/:id
 * Get well details by ID (UUID or well_id string)
 *
 * Path parameters:
 * - id: string (UUID or well_id)
 *
 * Response: GetWellByIdResponse
 */
wellsRouter.get('/:id', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate path parameter with Zod schema
    const validationResult = wellIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => err.message)
        .join(', ');
      return next(new AppError(400, errorMessage));
    }

    const { id } = validationResult.data;

    // Call service
    const result = await wellService.getWellById(id);

    // Return response
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof WellNotFoundError) {
      return next(new AppError(404, error.message));
    }

    logError('Error in GET /api/wells/:id', error as Error);
    next(error);
  }
}));

/**
 * GET /api/wells/:id/valuation
 * Calculate dynamic valuation for a well based on current production data
 *
 * Path parameters:
 * - id: string (UUID or well_id)
 *
 * Response: Dynamic valuation with NPV, market value, confidence
 */
wellsRouter.get('/:id/valuation', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate path parameter with Zod schema
    const validationResult = wellIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => err.message)
        .join(', ');
      return next(new AppError(400, errorMessage));
    }

    const { id } = validationResult.data;

    // Call service
    const result = await wellService.getDynamicValuation(id);

    // Return response
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof WellNotFoundError) {
      return next(new AppError(404, error.message));
    }

    logError('Error in GET /api/wells/:id/valuation', error as Error);
    next(error);
  }
}));
