/**
 * WellService - Business logic for well queries
 * Implements CRUD operations with filtering, sorting, and aggregation
 *
 * Following SOLID principles:
 * - Single Responsibility: Handles only well-related business logic
 * - Dependency Inversion: Depends on Knex abstraction, not concrete DB
 */

import type { Knex } from 'knex';
import type {
  WellFilters,
  GetWellsResponse,
  GetWellByIdResponse,
  Well,
  WellDetail,
  Operator,
  Valuation,
  ProductionHistoryEntry,
  WellRow,
  OperatorRow,
  ProductionHistoryRow,
  ValuationRow,
} from '../types/well.types';
import {
  calculateValuation,
  type ValuationResult,
  type ProductionRecord,
} from '../utils/valuationCalculations';

/**
 * Custom error for well not found scenarios
 */
export class WellNotFoundError extends Error {
  constructor(wellId: string) {
    super(`Well not found: ${wellId}`);
    this.name = 'WellNotFoundError';
  }
}

export class WellService {
  private readonly MAX_LIMIT = 500;
  private readonly DEFAULT_LIMIT = 100;

  constructor(private readonly db: Knex) {}

  /**
   * Get wells with optional filtering, sorting, and pagination
   * @param filters - Query filters per TECHNICAL_EXECUTION_PLAN.md lines 462-516
   * @returns Paginated list of wells with metadata
   */
  async getWells(filters: WellFilters): Promise<GetWellsResponse> {
    const limit = this.normalizeLimit(filters.limit);
    const offset = filters.offset ?? 0;

    // Build base query with joins
    const query = this.buildWellsQuery(filters);

    // Get total count (before pagination)
    // Need to include joins if filtering by valuation fields
    let countQuery = this.db('wells').count('* as count');

    if (filters.minDiscount !== undefined) {
      countQuery = countQuery.leftJoin('valuations', 'wells.id', 'valuations.well_id');
    }

    countQuery = countQuery.modify((qb) => {
      return void this.applyFilters(qb, filters);
    });

    const countResult = await countQuery.first();

    const total = parseInt(String(countResult?.count ?? '0'), 10);

    // Apply sorting
    const sortedQuery = this.applySorting(query, filters);

    // Apply pagination
    const paginatedQuery = sortedQuery.limit(limit).offset(offset);

    // Execute query
    const rows = (await paginatedQuery) as Array<
      WellRow & {
        operator_name?: string;
        operator_number?: string;
        npv_usd?: string;
        market_value_usd?: string;
        discount_pct?: string;
        confidence?: string;
      }
    >;

    // Get production data for all wells
    const wellIds = rows.map((row) => row.id);
    const productionData = await this.getLatestProductionForWells(wellIds);

    // Transform rows to domain objects
    const wells = rows.map((row) =>
      this.transformWellRow(row, productionData.get(row.id))
    );

    return {
      wells,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get well by ID with complete details, production history, and valuation
   * @param id - Well UUID or well_id
   * @returns Complete well details per TECHNICAL_EXECUTION_PLAN.md lines 518-578
   */
  async getWellById(id: string): Promise<GetWellByIdResponse> {
    // Fetch well - check if ID is UUID format or well_id string
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const wellRow = isUuid
      ? await this.db<WellRow>('wells').where('id', id).first()
      : await this.db<WellRow>('wells').where('well_id', id).first();

    if (!wellRow) {
      throw new WellNotFoundError(id);
    }

    // Fetch operator (if exists)
    let operator: Operator | null = null;
    if (wellRow.operator_id) {
      const operatorRow = await this.db<OperatorRow>('operators')
        .where('id', wellRow.operator_id)
        .first();

      if (operatorRow) {
        operator = this.transformOperatorRow(operatorRow);
      }
    }

    // Fetch production history (last 24 months)
    const productionRows = await this.db<ProductionHistoryRow>(
      'production_history'
    )
      .where('well_id', wellRow.id)
      .orderBy('date', 'desc')
      .limit(24);

    const productionHistory = productionRows.map((row) =>
      this.transformProductionRow(row)
    );

    // Fetch latest valuation
    const valuationRow = await this.db<ValuationRow>('valuations')
      .where('well_id', wellRow.id)
      .first();

    const latestValuation = valuationRow
      ? this.transformValuationRow(valuationRow)
      : null;

    // Transform well to detail object
    const well = this.transformWellDetailRow(wellRow, operator, latestValuation);

    return {
      well,
      productionHistory,
      latestValuation,
      operator,
    };
  }

  /**
   * Calculate dynamic valuation for a well based on current production data
   * @param id - Well UUID or well_id
   * @returns Dynamically calculated valuation
   */
  async getDynamicValuation(id: string): Promise<{
    wellId: string;
    wellName: string;
    valuation: ValuationResult;
    calculatedAt: string;
  }> {
    // Fetch well
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const wellRow = isUuid
      ? await this.db<WellRow>('wells').where('id', id).first()
      : await this.db<WellRow>('wells').where('well_id', id).first();

    if (!wellRow) {
      throw new WellNotFoundError(id);
    }

    // Fetch production history (all available data for better curve fitting)
    const productionRows = await this.db<ProductionHistoryRow>(
      'production_history'
    )
      .where('well_id', wellRow.id)
      .orderBy('date', 'asc');

    // Transform to ProductionRecord format
    const productionHistory: ProductionRecord[] = productionRows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      oilBbl: parseFloat(row.oil_bbl ?? '0'),
    }));

    // Calculate dynamic valuation
    // Use a hash of wellId for consistent market value variation
    const wellIndex = wellRow.well_id
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const valuation = calculateValuation(productionHistory, wellIndex);

    return {
      wellId: wellRow.well_id,
      wellName: wellRow.well_name,
      valuation,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build base query with joins for well data
   */
  private buildWellsQuery(filters: WellFilters): Knex.QueryBuilder {
    const baseQuery = this.db('wells')
      .select(
        'wells.*',
        'operators.name as operator_name',
        'operators.operator_number',
        'valuations.npv_usd',
        'valuations.market_value_usd',
        'valuations.discount_pct',
        'valuations.confidence'
      )
      .leftJoin('operators', 'wells.operator_id', 'operators.id')
      .leftJoin('valuations', 'wells.id', 'valuations.well_id');

    // Apply filters and return (Knex query builder is immutable-ish)
    return this.applyFilters(baseQuery, filters);
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    query: Knex.QueryBuilder,
    filters: WellFilters
  ): Knex.QueryBuilder {
    let filteredQuery = query;

    if (filters.county) {
      filteredQuery = filteredQuery.where('wells.county', filters.county);
    }

    if (filters.status) {
      filteredQuery = filteredQuery.where('wells.status', filters.status);
    }

    if (filters.minDiscount !== undefined) {
      filteredQuery = filteredQuery.whereRaw('valuations.discount_pct >= ?', [
        filters.minDiscount,
      ]);
    }

    // Production filters would require subquery for latest production
    if (filters.minProduction !== undefined || filters.maxProduction !== undefined) {
      // For now, we'll implement this as a post-filter in production
      // A more efficient approach would use a subquery or materialized view
    }

    return filteredQuery;
  }

  /**
   * Apply sorting to query
   */
  private applySorting(
    query: Knex.QueryBuilder,
    filters: WellFilters
  ): Knex.QueryBuilder {
    const sortOrder = filters.sortOrder ?? 'desc';

    switch (filters.sortBy) {
      case 'production':
        // Sort by current production (requires subquery)
        return query.orderBy('current_oil_bbl_day', sortOrder);

      case 'discount':
        return query.orderBy('valuations.discount_pct', sortOrder);

      case 'valuation':
      default:
        return query.orderBy('valuations.market_value_usd', sortOrder);
    }
  }

  /**
   * Get latest production data for multiple wells
   */
  private async getLatestProductionForWells(
    wellIds: string[]
  ): Promise<Map<string, ProductionHistoryRow>> {
    if (wellIds.length === 0) {
      return new Map();
    }

    // Get latest production for each well using a simpler approach
    // Group by well_id and get max date, then join back
    const latestDates = (await this.db('production_history')
      .select('well_id')
      .max('date as max_date')
      .whereIn('well_id', wellIds)
      .groupBy('well_id')) as Array<{
      well_id: string;
      max_date: Date;
    }>;

    if (latestDates.length === 0) {
      return new Map();
    }

    const latestProduction = (await this.db('production_history')
      .whereIn('well_id', wellIds)
      .where((qb) => {
        latestDates.forEach((row) => {
          void qb.orWhere((subQb) => {
            void subQb.where('well_id', row.well_id).where('date', row.max_date);
          });
        });
      })) as ProductionHistoryRow[];

    const productionMap = new Map<string, ProductionHistoryRow>();
    latestProduction.forEach((row) => {
      productionMap.set(row.well_id, row);
    });

    return productionMap;
  }

  /**
   * Transform database row to Well domain object
   */
  private transformWellRow(
    row: WellRow & {
      operator_name?: string;
      operator_number?: string;
      npv_usd?: string;
      market_value_usd?: string;
      discount_pct?: string;
      confidence?: string;
    },
    productionRow?: ProductionHistoryRow
  ): Well {
    const well: Well = {
      id: row.id,
      wellId: row.well_id,
      wellName: row.well_name,
      status: row.status,
    };

    // Optional fields
    if (row.api_number) {
      well.apiNumber = row.api_number;
    }

    // Operator
    if (row.operator_id && row.operator_name) {
      well.operator = {
        id: row.operator_id,
        name: row.operator_name,
        operatorNumber: row.operator_number ?? undefined,
      };
    }

    // Location
    if (row.latitude && row.longitude && row.county && row.field) {
      well.location = {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        county: row.county,
        field: row.field,
      };
    }

    // Valuation
    if (row.npv_usd && row.market_value_usd && row.discount_pct && row.confidence) {
      well.valuation = {
        npvUsd: parseFloat(row.npv_usd),
        marketValueUsd: parseFloat(row.market_value_usd),
        discountPct: parseFloat(row.discount_pct),
        confidence: parseFloat(row.confidence),
      };
    }

    // Production (if available)
    if (productionRow) {
      const oilBbl = parseFloat(productionRow.oil_bbl ?? '0');
      const gasMcf = parseFloat(productionRow.gas_mcf ?? '0');
      const daysInMonth = 30; // Simplified

      well.production = {
        currentOilBblDay: oilBbl / daysInMonth,
        currentGasMcfDay: gasMcf / daysInMonth,
        cumulativeOilBbl: oilBbl, // Would need sum from all history
        lastProductionDate: productionRow.date.toISOString().split('T')[0],
        peakOilBblDay: oilBbl / daysInMonth, // Would need MAX from history
        peakDate: productionRow.date.toISOString().split('T')[0],
      };
    }

    return well;
  }

  /**
   * Transform well row to detailed well object
   */
  private transformWellDetailRow(
    row: WellRow,
    operator: Operator | null,
    valuation: Valuation | null
  ): WellDetail {
    const well: WellDetail = {
      id: row.id,
      wellId: row.well_id,
      wellName: row.well_name,
      status: row.status,
    };

    if (row.api_number) well.apiNumber = row.api_number;
    if (operator) well.operator = operator;

    if (row.latitude && row.longitude && row.county && row.field) {
      well.location = {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        county: row.county,
        field: row.field,
      };
    }

    if (valuation) well.valuation = valuation;

    if (row.completion_date) {
      well.completionDate = row.completion_date.toISOString().split('T')[0];
    }

    if (row.depth_ft) {
      well.totalDepthFt = row.depth_ft;
    }

    return well;
  }

  /**
   * Transform operator row to domain object
   */
  private transformOperatorRow(row: OperatorRow): Operator {
    return {
      id: row.id,
      name: row.name,
      operatorNumber: row.operator_number ?? undefined,
      address: row.address ?? undefined,
    };
  }

  /**
   * Transform production history row to domain object
   */
  private transformProductionRow(row: ProductionHistoryRow): ProductionHistoryEntry {
    const oilBbl = parseFloat(row.oil_bbl ?? '0');
    const gasMcf = parseFloat(row.gas_mcf ?? '0');
    const waterBbl = parseFloat(row.water_bbl ?? '0');
    const daysProduced = 30; // Simplified - would calculate from date

    return {
      date: row.date.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
      oilBbl,
      gasMcf,
      waterBbl,
      daysProduced,
      oilBblDay: oilBbl / daysProduced,
      gasMcfDay: gasMcf / daysProduced,
    };
  }

  /**
   * Transform valuation row to domain object
   */
  private transformValuationRow(row: ValuationRow): Valuation {
    return {
      npvUsd: parseFloat(row.npv_usd ?? '0'),
      marketValueUsd: parseFloat(row.market_value_usd ?? '0'),
      discountPct: parseFloat(row.discount_pct ?? '0'),
      confidence: parseFloat(row.confidence ?? '0'),
    };
  }

  /**
   * Normalize limit to be within allowed range
   */
  private normalizeLimit(limit?: number): number {
    if (limit === undefined) {
      return this.DEFAULT_LIMIT;
    }

    return Math.min(Math.max(1, limit), this.MAX_LIMIT);
  }
}
