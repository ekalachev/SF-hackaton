/**
 * AI API Routes
 * Implements AI-powered features for well analysis and reporting
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles HTTP request/response for AI features
 * - Dependency Inversion: Depends on ClaudeService abstraction
 * - Interface Segregation: Specific validation schemas per endpoint
 *
 * Implementation spec: docs/CLAUDE_CLI_INTEGRATION.md lines 700-814
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { ClaudeService } from '../services/claudeService';
import { AppError } from '../utils/errors';
import { wellIdParamSchema } from './validation.schemas';
import { logError } from '../utils/logger';
import type { WellReportData, ValuationReportData, ProductionHistoryData } from '../types/claude.types';

export const aiRouter = Router();

/**
 * Build WellReportData from raw database records
 */
async function buildWellReportData(wellId: string): Promise<WellReportData | null> {
  // Get well data
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const well = await db('wells').where({ id: wellId }).first();
  if (!well) return null;

  // Get production history
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const productionRows = await db('production_history')
    .where({ well_id: wellId })
    .orderBy('date', 'desc');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const productionHistory: ProductionHistoryData[] = productionRows.map((row: { date: Date; oil_bbl: string; gas_mcf: string; water_bbl: string }) => ({
    date: new Date(row.date).toISOString().split('T')[0],
    oilBbl: parseFloat(row.oil_bbl) || 0,
    gasMcf: parseFloat(row.gas_mcf) || 0,
    waterBbl: parseFloat(row.water_bbl) || 0,
  }));

  // Compute production metrics
  let currentOilBblDay = 0;
  let peakOilBblDay = 0;
  let peakDate = '';
  let cumulativeOilBbl = 0;

  if (productionHistory.length > 0) {
    // Current rate = most recent month's daily average (assuming monthly data)
    currentOilBblDay = Math.round(productionHistory[0].oilBbl / 30);

    // Find peak and cumulative
    for (const record of productionHistory) {
      const dailyRate = record.oilBbl / 30;
      if (dailyRate > peakOilBblDay) {
        peakOilBblDay = Math.round(dailyRate);
        peakDate = record.date;
      }
      cumulativeOilBbl += record.oilBbl;
    }
  }

  // Estimate decline rate (simple linear if we have enough data)
  let declineRateAnnual = 0.15; // Default 15%
  if (productionHistory.length >= 12) {
    const recentYear = productionHistory.slice(0, 12);
    const oldestRate = recentYear[11].oilBbl;
    const newestRate = recentYear[0].oilBbl;
    if (oldestRate > 0) {
      declineRateAnnual = Math.max(0, (oldestRate - newestRate) / oldestRate);
    }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    id: well.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    wellId: well.well_id || well.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    wellName: well.well_name || 'Unknown Well',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    county: well.county || 'Unknown',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    state: well.state || 'TX',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    formation: well.field || 'Unknown Formation',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    totalDepthFt: well.depth_ft || 10000,
    lateralLengthFt: 5000, // Default value
    currentOilBblDay,
    peakOilBblDay,
    peakDate: peakDate || new Date().toISOString().split('T')[0],
    cumulativeOilBbl,
    declineRateAnnual,
    declineType: 'Exponential',
    productionHistory: productionHistory.slice(0, 6), // Last 6 months
    comparables: [], // Would need separate query
  };
}

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
const claudeService = new ClaudeService();

/**
 * POST /api/wells/:id/generate-report
 * Generate AI investment report for a well
 *
 * Path parameters:
 * - id: string (UUID or well_id)
 *
 * Response:
 * - wellId: string
 * - report: string (markdown formatted)
 * - generatedAt: string (ISO timestamp)
 * - format: "markdown"
 */
aiRouter.post(
  '/wells/:id/generate-report',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate path parameter
      const validationResult = wellIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        return next(new AppError(400, 'Invalid well ID'));
      }

      const { id } = validationResult.data;

      // Basic validation: check if it's a reasonable ID format
      const isValidFormat = /^[a-zA-Z0-9-]+$/.test(id);

      if (!isValidFormat) {
        return next(new AppError(400, 'Invalid well ID format'));
      }

      // Build well report data with production metrics
      const wellData = await buildWellReportData(id);

      if (!wellData) {
        return next(new AppError(404, 'Well not found'));
      }

      // Get most recent valuation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const valuation = await db('valuations')
        .where({ well_id: id })
        .orderBy('valuation_date', 'desc')
        .first();

      if (!valuation) {
        return next(new AppError(404, 'Well valuation not found'));
      }

      // Build valuation data (convert strings to numbers as PostgreSQL returns decimals as strings)
      const valuationData: ValuationReportData = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        npvUsd: parseFloat(valuation.npv_usd) || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        marketValueUsd: parseFloat(valuation.market_value_usd) || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        discountPct: parseFloat(valuation.discount_pct) || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        remainingReservesBbl: parseFloat(valuation.remaining_reserves_bbl) || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        confidence: parseFloat(valuation.confidence) || 0.8,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        oilPriceUsd: parseFloat(valuation.oil_price_usd) || 75,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        operatingCostPerBbl: parseFloat(valuation.operating_cost_per_bbl) || 25,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        discountRate: parseFloat(valuation.discount_rate) || 0.1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        royaltyRate: parseFloat(valuation.royalty_rate) || 0.125,
      };

      // Generate report
      const report = await claudeService.generateInvestmentReport(wellData, valuationData);

      res.status(200).json({
        wellId: wellData.wellId,
        report,
        generatedAt: new Date().toISOString(),
        format: 'markdown',
      });
    } catch (error) {
      logError('Error generating report', error as Error);
      next(new AppError(500, 'Failed to generate report'));
    }
  })
);

/**
 * GET /api/wells/:id/narrative
 * Get AI-generated well narrative with caching
 *
 * Path parameters:
 * - id: string (UUID or well_id)
 *
 * Caching:
 * - Narratives cached for 7 days in well_narratives table
 * - Fresh narratives generated if cache miss or stale
 *
 * Response:
 * - wellId: string
 * - narrative: string (markdown formatted)
 */
aiRouter.get(
  '/wells/:id/narrative',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate path parameter
      const validationResult = wellIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        return next(new AppError(400, 'Invalid well ID'));
      }

      const { id } = validationResult.data;

      // Basic validation: check if it's a reasonable ID format
      const isValidFormat = /^[a-zA-Z0-9-]+$/.test(id);

      if (!isValidFormat) {
        return next(new AppError(400, 'Invalid well ID format'));
      }

      // Check if well exists
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const well = await db('wells').where({ id }).first();

      if (!well) {
        return next(new AppError(404, 'Well not found'));
      }

      // Check if narrative already exists and is fresh (< 7 days)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let narrative = await db('well_narratives')
        .where({ well_id: id })
        .where('created_at', '>', db.raw("NOW() - INTERVAL '7 days'"))
        .first();

      if (!narrative) {
        // Generate new narrative
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const text = await claudeService.generateWellNarrative(well as WellReportData);

        // Cache it
        await db('well_narratives').insert({
          well_id: id,
          narrative: text,
          created_at: new Date(),
        });

        narrative = { narrative: text };
      }

      res.status(200).json({
        wellId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        narrative: narrative.narrative as string,
      });
    } catch (error) {
      logError('Error generating narrative', error as Error);
      next(new AppError(500, 'Failed to generate narrative'));
    }
  })
);
