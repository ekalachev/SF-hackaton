/**
 * Well domain types
 * Based on database schema and API specification from TECHNICAL_EXECUTION_PLAN.md
 */

/**
 * Database row types (snake_case matching DB schema)
 */
export interface OperatorRow {
  id: string;
  name: string;
  operator_number: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WellRow {
  id: string;
  well_id: string;
  well_name: string;
  api_number: string | null;
  operator_id: string | null;
  latitude: string | null;
  longitude: string | null;
  county: string | null;
  field: string | null;
  state: string;
  status: string;
  depth_ft: number | null;
  completion_date: Date | null;
  embedding: string | null;
  embedding_model: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductionHistoryRow {
  id: string;
  well_id: string;
  date: Date;
  oil_bbl: string | null;
  gas_mcf: string | null;
  water_bbl: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ValuationRow {
  id: string;
  well_id: string;
  npv_usd: string | null;
  market_value_usd: string | null;
  discount_pct: string | null;
  confidence: string | null;
  remaining_reserves_bbl: string | null;
  calculated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Domain types (camelCase for API responses)
 */
export interface Operator {
  id: string;
  name: string;
  operatorNumber?: string;
  address?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  county: string;
  field: string;
}

export interface Production {
  currentOilBblDay: number;
  currentGasMcfDay: number;
  cumulativeOilBbl: number;
  lastProductionDate: string;
  peakOilBblDay: number;
  peakDate: string;
}

export interface Valuation {
  npvUsd: number;
  marketValueUsd: number;
  discountPct: number;
  confidence: number;
}

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
  tags?: string[];
}

export interface ProductionHistoryEntry {
  date: string;
  oilBbl: number;
  gasMcf: number;
  waterBbl: number;
  daysProduced: number;
  oilBblDay: number;
  gasMcfDay: number;
}

export interface WellDetail extends Well {
  completionDate?: string;
  totalDepthFt?: number;
}

/**
 * Query filter types
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
 * Service response types
 */
export interface GetWellsResponse {
  wells: Well[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GetWellByIdResponse {
  well: WellDetail;
  productionHistory: ProductionHistoryEntry[];
  latestValuation: Valuation | null;
  operator: Operator | null;
}
