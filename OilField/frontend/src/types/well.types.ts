/**
 * Well domain types for frontend
 * Aligned with backend types from backend/src/types/well.types.ts
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
  remainingReservesBbl?: number;
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

export interface GetWellByIdResponse {
  well: WellDetail;
  productionHistory: ProductionHistoryEntry[];
  latestValuation: Valuation | null;
  operator: Operator | null;
}
