/**
 * Well data model interface
 * Represents oil well data structure from database
 */
export interface Well {
  // Identity
  id: string;
  well_id: string;
  well_name: string;
  api_number: string | null;

  // Operator relationship
  operator_id: string | null;
  operator_name?: string; // Joined from operators table

  // Location
  latitude: number | null;
  longitude: number | null;
  county: string | null;
  field: string | null;
  state: string;

  // Well attributes
  status: string;
  depth_ft: number | null;
  completion_date: Date | null;

  // Production data (joined or aggregated)
  current_oil_bbl_day?: number;
  cumulative_oil_bbl?: number;
  decline_rate_annual?: number;

  // Valuation data (joined from valuations table)
  valuation_discount_pct?: number;
  npv_usd?: number;
  market_value_usd?: number;

  // Semantic search fields
  embedding: number[] | null;
  embedding_model: string;
  description: string | null;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * Subset of Well data required for description generation
 */
export interface WellDescriptionInput {
  well_name: string;
  operator_name?: string;
  county: string | null;
  state: string;
  field: string | null;
  status: string;
  current_oil_bbl_day?: number;
  cumulative_oil_bbl?: number;
  decline_rate_annual?: number;
  valuation_discount_pct?: number;
}
