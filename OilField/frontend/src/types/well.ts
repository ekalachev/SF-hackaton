/**
 * Well-related type definitions
 * Based on API response format from TECHNICAL_EXECUTION_PLAN.md
 */

export interface Operator {
  readonly id: string;
  readonly name: string;
}

export interface Location {
  readonly latitude: number;
  readonly longitude: number;
  readonly county: string;
  readonly field: string;
}

export interface Production {
  readonly currentOilBblDay: number;
  readonly currentGasMcfDay: number;
  readonly cumulativeOilBbl: number;
  readonly lastProductionDate: string;
  readonly peakOilBblDay: number;
  readonly peakDate: string;
}

export interface Valuation {
  readonly npvUsd: number;
  readonly marketValueUsd: number;
  readonly discountPct: number;
  readonly confidence: number;
}

export interface Well {
  readonly id: string;
  readonly wellId: string;
  readonly wellName: string;
  readonly apiNumber?: string;
  readonly operator?: Operator;
  readonly location?: Location;
  readonly status: 'active' | 'plugged' | 'depleted';
  readonly production?: Production;
  readonly valuation?: Valuation;
  readonly nftTokenId?: string | null;
  readonly tags?: ReadonlyArray<string>;
}

export interface WellsQueryParams {
  readonly limit?: number;
  readonly offset?: number;
  readonly minProduction?: number;
  readonly maxProduction?: number;
  readonly minDiscount?: number;
  readonly county?: string;
  readonly status?: 'active' | 'plugged' | 'depleted';
  readonly sortBy?: 'production' | 'discount' | 'valuation';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface WellsResponse {
  readonly wells: ReadonlyArray<Well>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

/**
 * Valuation category based on discount percentage
 * - undervalued: >= 20% discount
 * - fair: between -20% and 20%
 * - overvalued: <= -20% discount
 */
export type ValuationCategory = 'undervalued' | 'fair' | 'overvalued';

/**
 * Get valuation category from discount percentage
 */
export function getValuationCategory(discountPct: number): ValuationCategory {
  if (discountPct >= 20) return 'undervalued';
  if (discountPct <= -20) return 'overvalued';
  return 'fair';
}
