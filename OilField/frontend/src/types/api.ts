/**
 * API Response Types
 * Based on backend types from backend/src/types/well.types.ts
 * Following SOLID principles - Single Responsibility for API contracts
 */

/**
 * Operator information
 */
export interface Operator {
  id: string;
  name: string;
  operatorNumber?: string;
  address?: string;
}

/**
 * Geographic location of a well
 */
export interface Location {
  latitude: number;
  longitude: number;
  county: string;
  field: string;
}

/**
 * Production metrics for a well
 */
export interface Production {
  currentOilBblDay: number;
  currentGasMcfDay: number;
  cumulativeOilBbl: number;
  lastProductionDate: string;
  peakOilBblDay: number;
  peakDate: string;
}

/**
 * Valuation metrics for a well
 */
export interface Valuation {
  npvUsd: number;
  marketValueUsd: number;
  discountPct: number;
  confidence: number;
  remainingReservesBbl?: number;
}

/**
 * Well summary information (used in lists)
 */
export interface Well {
  id: string;
  wellId: string;
  wellName: string;
  apiNumber?: string;
  operator?: Operator;
  location?: Location;
  status: string;
  production?: Production;
  valuation?: Valuation;
  nftTokenId?: string | null;
  tags?: readonly string[];
}

/**
 * Detailed well information (used in detail view)
 */
export interface WellDetail extends Well {
  completionDate?: string;
  totalDepthFt?: number;
}

/**
 * Production history entry
 */
export interface ProductionHistoryEntry {
  date: string;
  oilBbl: number;
  gasMcf: number;
  waterBbl: number;
  daysProduced: number;
  oilBblDay: number;
  gasMcfDay: number;
}

/**
 * Similar well result with similarity score
 */
export interface SimilarWell {
  well: Well;
  similarity: number;
  reason?: string;
  matchReasons?: readonly string[];
}

/**
 * Query filters for wells endpoint
 */
export interface WellFilters {
  limit?: number;
  offset?: number;
  minProduction?: number;
  maxProduction?: number;
  minDiscount?: number;
  county?: string;
  status?: 'active' | 'plugged' | 'depleted';
  sortBy?: 'production' | 'discount' | 'valuation';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response from GET /api/wells
 */
export interface GetWellsResponse {
  wells: Well[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Response from GET /api/wells/:id
 */
export interface GetWellByIdResponse {
  well: WellDetail;
  productionHistory: ProductionHistoryEntry[];
  latestValuation: Valuation | null;
  operator: Operator | null;
}

/**
 * Response from GET /api/wells/:id/similar
 */
export interface GetSimilarWellsResponse {
  targetWell: {
    id: string;
    wellId: string;
    wellName: string;
  };
  similarWells: SimilarWell[];
}

/**
 * Response from GET /api/wells/:id/valuation
 */
export interface DynamicValuationResponse {
  wellId: string;
  wellName: string;
  valuation: {
    npvUsd: number;
    marketValueUsd: number;
    discountPct: number;
    confidence: number;
    remainingReservesBbl: number;
    forecast: number[];
  };
  calculatedAt: string;
}

/**
 * API Error response
 */
export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}
