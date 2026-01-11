/**
 * Well entity type definitions
 * Mirrors database schema from 001_initial_schema.ts
 */

/**
 * Well entity representing an oil/gas well
 */
export interface Well {
  // Primary key
  id: string;

  // Identity
  well_id: string;
  well_name: string;
  api_number: string | null;

  // Operator relationship
  operator_id: string | null;

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

  // Semantic search - pgvector embedding
  embedding: number[] | null;
  embedding_model: string;

  // Metadata
  description: string | null;

  // Production metrics (computed from production_history)
  current_oil_bbl_day?: number;

  // Formation data
  formation?: string | null;

  // Valuation metrics (from valuations table)
  valuation_discount_pct?: number;
  decline_rate_annual?: number;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * Options for finding similar wells
 */
export interface FindSimilarWellsOptions {
  limit?: number;
  minSimilarity?: number;
  threshold?: number; // Alias for minSimilarity
  excludeOperator?: boolean;
}

/**
 * Options for semantic search
 */
export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number; // Minimum relevance score threshold
  filters?: {
    county?: string;
    status?: string;
    minProduction?: number;
  };
}

/**
 * Result of similarity search with well and similarity score
 */
export interface SimilarWellResult {
  well: Well;
  similarity: number;
  matchReasons: string[];
}

/**
 * Result of semantic search with well and relevance score
 */
export interface SemanticSearchResult {
  well: Well;
  relevanceScore: number;
}
