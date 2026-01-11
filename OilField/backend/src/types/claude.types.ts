/**
 * Types for Claude AI Service
 * Used for investment report generation
 */

/**
 * Well data required for AI report generation
 */
export interface WellReportData {
  // Identity
  id: string;
  wellId: string;
  wellName: string;

  // Location
  county: string;
  state: string;

  // Technical details
  formation: string;
  totalDepthFt: number;
  lateralLengthFt: number;

  // Production metrics
  currentOilBblDay: number;
  peakOilBblDay: number;
  peakDate: string;
  cumulativeOilBbl: number;
  declineRateAnnual: number;
  declineType: string;

  // Historical data
  productionHistory: ProductionHistoryData[];
  comparables: ComparableWellData[];
}

/**
 * Valuation data required for AI report generation
 */
export interface ValuationReportData {
  // Valuation metrics
  npvUsd: number;
  marketValueUsd: number;
  discountPct: number;
  remainingReservesBbl: number;
  confidence: number;

  // Economic assumptions
  oilPriceUsd: number;
  operatingCostPerBbl: number;
  discountRate: number;
  royaltyRate: number;
}

/**
 * Production history entry for reports
 */
export interface ProductionHistoryData {
  date: string;
  oilBbl: number;
  gasMcf: number;
  waterBbl: number;
}

/**
 * Comparable well data for reports
 */
export interface ComparableWellData {
  wellName: string;
  location: string;
  productionRate: number;
  salePrice: number;
  saleDate: string;
}

/**
 * Result of AI report generation
 */
export interface ReportGenerationResult {
  report: string;
  wordCount: number;
  generatedAt: Date;
}
