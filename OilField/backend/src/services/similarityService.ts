/**
 * SimilarityService - Vector similarity search using pgvector
 * Implements semantic search and well similarity matching
 */

import { Knex } from 'knex';
import type {
  Well,
  FindSimilarWellsOptions,
  SemanticSearchOptions,
  SimilarWellResult,
  SemanticSearchResult,
} from '../types/well';

/**
 * Custom error for when a well is not found
 */
export class WellNotFoundError extends Error {
  constructor(wellId: string) {
    super(`Well not found: ${wellId}`);
    this.name = 'WellNotFoundError';
  }
}

/**
 * Service for finding similar wells using vector embeddings
 * Uses pgvector's cosine distance operator (<=>)
 */
export class SimilarityService {
  constructor(private readonly db: Knex) {}

  /**
   * Find similar wells using vector similarity
   * Uses pgvector HNSW index for fast approximate nearest neighbor search
   *
   * @param wellId - Target well ID to find similar wells for
   * @param options - Search options (limit, minSimilarity, excludeOperator)
   * @returns Array of wells with similarity scores (0-1, higher is more similar)
   */
  async findSimilarWells(
    wellId: string,
    options: FindSimilarWellsOptions = {}
  ): Promise<SimilarWellResult[]> {
    const { limit = 5, minSimilarity = 0.7, threshold, excludeOperator = false } = options;
    // Use threshold if provided, otherwise fall back to minSimilarity
    const similarityThreshold = threshold ?? minSimilarity;

    // Build query using pgvector cosine distance operator (<=>)
    // Cosine distance ranges from 0 to 2 (0 = identical, 2 = opposite)
    // We normalize to similarity: (2 - cosine_distance) / 2 to get [0, 1] range
    // This ensures similarity is always in [0, 1] where 1 = most similar, 0 = least similar
    const query = this.db('wells as w')
      .select([
        'w.*',
        this.db.raw('(2 - (w.embedding <=> target.embedding)) / 2.0 as similarity'),
      ])
      .crossJoin(
        this.db.raw(
          '(select embedding, operator_id from wells where id = ?) as target',
          [wellId]
        )
      )
      .where('w.id', '!=', wellId);

    // Optionally exclude wells from same operator
    if (excludeOperator) {
      void query.whereRaw('w.operator_id != target.operator_id');
    }

    // Execute query with similarity threshold and ordering
    // Use WHERE instead of HAVING since we're not using GROUP BY
    // Apply same normalization in WHERE clause
    const results = (await query
      .whereRaw('(2 - (w.embedding <=> target.embedding)) / 2.0 >= ?', [similarityThreshold])
      .orderByRaw('w.embedding <=> target.embedding')
      .limit(limit)) as unknown as Array<Record<string, unknown>>;

    // Get target well for generating match reasons
    const targetWell = (await this.db('wells')
      .where('id', wellId)
      .first()) as unknown as Record<string, unknown> | undefined;
    if (!targetWell) {
      throw new WellNotFoundError(wellId);
    }
    const targetWellEntity = this.mapRowToWell(targetWell);

    return results.map((row: Record<string, unknown>) => {
      const similarWell = this.mapRowToWell(row);
      return {
        well: similarWell,
        similarity: parseFloat(String(row.similarity)),
        matchReasons: this.generateMatchReasons(targetWellEntity, similarWell),
      };
    });
  }

  /**
   * Semantic search using natural language query
   * Generates embedding for query text and finds matching wells
   *
   * @param queryText - Natural language search query
   * @param options - Search options (limit, filters)
   * @returns Array of wells with relevance scores (0-1)
   */
  async semanticSearch(
    queryText: string,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    const { limit = 10, threshold, filters = {} } = options;

    // Generate embedding for query text
    // Note: This requires EmbeddingService integration
    const queryEmbedding = await this.generateQueryEmbedding(queryText);

    // Build base query
    // Normalize relevance score to [0, 1] range using same formula as similarity
    let query = this.db('wells').select([
      '*',
      this.db.raw('(2 - (embedding <=> ?::vector)) / 2.0 as relevance_score', [
        JSON.stringify(queryEmbedding),
      ]),
    ]);

    // Apply filters
    if (filters.county) {
      query = query.where('county', filters.county);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.minProduction !== undefined) {
      query = query.where('current_oil_bbl_day', '>=', filters.minProduction);
    }

    // Apply threshold filter if provided
    if (threshold !== undefined) {
      query = query.whereRaw('(2 - (embedding <=> ?::vector)) / 2.0 >= ?', [
        JSON.stringify(queryEmbedding),
        threshold,
      ]);
    }

    // Execute query ordered by relevance
    const results = (await query
      .orderByRaw('embedding <=> ?::vector', [JSON.stringify(queryEmbedding)])
      .limit(limit)) as unknown as Array<Record<string, unknown>>;

    return results.map((row: Record<string, unknown>) => ({
      well: this.mapRowToWell(row),
      relevanceScore: parseFloat(String(row.relevance_score)),
    }));
  }

  /**
   * Generate match reasons explaining why wells are similar
   * Analyzes well attributes to explain similarity
   *
   * @param targetWell - The reference well
   * @param similarWell - The similar well to compare
   * @returns Array of human-readable reasons
   */
  generateMatchReasons(targetWell: Well, similarWell: Well): string[] {
    const reasons: string[] = [];

    // Production similarity
    if (
      targetWell.current_oil_bbl_day !== undefined &&
      similarWell.current_oil_bbl_day !== undefined
    ) {
      const prodDiff = Math.abs(
        targetWell.current_oil_bbl_day - similarWell.current_oil_bbl_day
      );
      if (prodDiff < 10) {
        reasons.push(
          `Similar production rate (${similarWell.current_oil_bbl_day} vs ${targetWell.current_oil_bbl_day} bbl/day)`
        );
      }
    }

    // Same formation
    if (targetWell.formation && similarWell.formation) {
      if (targetWell.formation === similarWell.formation) {
        reasons.push(`Same formation (${targetWell.formation})`);
      }
    }

    // Valuation similarity (both undervalued)
    if (
      targetWell.valuation_discount_pct !== undefined &&
      similarWell.valuation_discount_pct !== undefined
    ) {
      const targetUndervalued = targetWell.valuation_discount_pct >= 20;
      const similarUndervalued = similarWell.valuation_discount_pct >= 20;
      if (targetUndervalued && similarUndervalued) {
        reasons.push(
          `Both undervalued (${similarWell.valuation_discount_pct}% vs ${targetWell.valuation_discount_pct}%)`
        );
      }
    }

    // Same county
    if (targetWell.county && similarWell.county) {
      if (targetWell.county === similarWell.county) {
        reasons.push(`Same county (${targetWell.county})`);
      }
    }

    // Similar decline rate
    if (targetWell.decline_rate_annual && similarWell.decline_rate_annual) {
      const declineDiff = Math.abs(
        targetWell.decline_rate_annual - similarWell.decline_rate_annual
      );
      if (declineDiff < 0.05) {
        reasons.push(
          `Similar decline rate (${(similarWell.decline_rate_annual * 100).toFixed(1)}%/year)`
        );
      }
    }

    return reasons;
  }

  /**
   * Generate embedding for query text
   * This is a placeholder - actual implementation would call EmbeddingService
   *
   * @param _queryText - Text to generate embedding for (unused until EmbeddingService integration)
   * @returns Vector embedding (384 dimensions)
   */
  private generateQueryEmbedding(_queryText: string): Promise<number[]> {
    // TODO: Integrate with EmbeddingService when available
    // For now, return a mock embedding for testing
    // In production, this should call:
    // const embeddingService = new EmbeddingService(this.db);
    // return await embeddingService.generateEmbedding(_queryText);

    // Mock implementation for testing - return synchronously wrapped in Promise
    return Promise.resolve(new Array(384).fill(0.5) as number[]);
  }

  /**
   * Map database row to Well type
   * Handles type conversions and null values
   *
   * @param row - Database row
   * @returns Well entity
   */
  private mapRowToWell(row: Record<string, unknown>): Well {
    return {
      id: String(row.id),
      well_id: String(row.well_id),
      well_name: String(row.well_name),
      api_number: row.api_number ? String(row.api_number) : null,
      operator_id: row.operator_id ? String(row.operator_id) : null,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      county: row.county ? String(row.county) : null,
      field: row.field ? String(row.field) : null,
      state: String(row.state || 'TX'),
      status: String(row.status || 'active'),
      depth_ft: row.depth_ft ? Number(row.depth_ft) : null,
      completion_date: row.completion_date ? new Date(row.completion_date as string) : null,
      embedding: row.embedding ? (row.embedding as number[]) : null,
      embedding_model: String(row.embedding_model || 'all-MiniLM-L6-v2'),
      description: row.description ? String(row.description) : null,
      current_oil_bbl_day: row.current_oil_bbl_day ? Number(row.current_oil_bbl_day) : undefined,
      formation: row.formation ? String(row.formation) : undefined,
      valuation_discount_pct: row.valuation_discount_pct
        ? Number(row.valuation_discount_pct)
        : undefined,
      decline_rate_annual: row.decline_rate_annual
        ? Number(row.decline_rate_annual)
        : undefined,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }
}
