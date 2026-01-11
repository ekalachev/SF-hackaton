import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../knexfile.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * TDD Test for Database Seeding
 * Tests that seed script correctly populates all tables from wells.json
 * Following acceptance criteria from task-202
 */
describe('Database seed script', () => {
  let db: Knex;
  let wellsData: Array<{
    id: string;
    name: string;
    operator: string;
    location: {
      latitude: number;
      longitude: number;
      county: string;
      state: string;
      field: string;
    };
    status: string;
    attributes: {
      completion_date: string;
      depth_ft: number;
      api_number: number;
    };
    production: {
      current_bbl_day: number;
      cumulative_bbl: number;
      cumulative_gas_mcf: number;
      cumulative_water_bbl: number;
      decline_rate: number;
    };
    production_history: Array<{
      date: string;
      oil_bbl: number;
      gas_mcf: number;
      water_bbl: number;
      days_produced: number;
    }>;
    valuation: {
      npvUsd: number;
      marketValueUsd: number;
      discountPct: number;
      confidence: number;
      remainingReservesBbl: number;
    };
    embedding: number[];
    embeddingModel: string;
    description: string;
  }>;

  beforeAll(async () => {
    // Setup database connection
    db = knex(knexConfig.development);

    // Load wells data
    const dataPath = join(__dirname, '../../data/processed/wells.json');
    wellsData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    // Ensure clean state - manually drop all tables first (in reverse dependency order)
    await db.raw('DROP TABLE IF EXISTS well_narratives CASCADE');
    await db.raw('DROP TABLE IF EXISTS valuations CASCADE');
    await db.raw('DROP TABLE IF EXISTS production_history CASCADE');
    await db.raw('DROP TABLE IF EXISTS wells CASCADE');
    await db.raw('DROP TABLE IF EXISTS operators CASCADE');
    await db.raw('DROP EXTENSION IF EXISTS vector CASCADE');

    // Rollback migration tracking to clean state
    try {
      await db.migrate.rollback(undefined, true);
    } catch (error) {
      // Migration tracking might not exist, which is fine
    }

    // Run migrations
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean all tables before each test
    await db('valuations').del();
    await db('production_history').del();
    await db('wells').del();
    await db('operators').del();
  });

  describe('Seed script execution', () => {
    it('should seed operators table from wells.json', async () => {
      // Run seed
      await db.seed.run();

      // Verify operators were seeded
      const operators = await db('operators').select('*');

      // Extract unique operators from wells data
      const uniqueOperators = [...new Set(wellsData.map((w) => w.operator))];

      expect(operators.length).toBeGreaterThan(0);
      expect(operators.length).toBe(uniqueOperators.length);

      // Verify each operator has required fields
      operators.forEach((op) => {
        expect(op.id).toBeDefined();
        expect(op.name).toBeDefined();
        expect(op.created_at).toBeDefined();
        expect(op.updated_at).toBeDefined();
      });
    });

    it('should seed wells table with all required fields', async () => {
      // Run seed
      await db.seed.run();

      // Verify wells were seeded
      const wells = await db('wells').select('*');

      expect(wells.length).toBe(wellsData.length);

      // Verify first well has all required fields
      const firstWell = wells[0];
      expect(firstWell.id).toBeDefined();
      expect(firstWell.well_id).toBeDefined();
      expect(firstWell.well_name).toBeDefined();
      expect(firstWell.api_number).toBeDefined();
      expect(firstWell.operator_id).toBeDefined();
      expect(firstWell.latitude).toBeDefined();
      expect(firstWell.longitude).toBeDefined();
      expect(firstWell.county).toBeDefined();
      expect(firstWell.field).toBeDefined();
      expect(firstWell.state).toBeDefined();
      expect(firstWell.status).toBeDefined();
      expect(firstWell.depth_ft).toBeDefined();
      expect(firstWell.completion_date).toBeDefined();
      expect(firstWell.created_at).toBeDefined();
      expect(firstWell.updated_at).toBeDefined();
    });

    it('should seed wells with embeddings', async () => {
      // Run seed
      await db.seed.run();

      // Verify embeddings were seeded
      const wellsWithEmbeddings = await db('wells')
        .select('embedding', 'embedding_model')
        .whereNotNull('embedding');

      expect(wellsWithEmbeddings.length).toBe(wellsData.length);

      // Verify embedding dimensions and model
      wellsWithEmbeddings.forEach((well) => {
        expect(well.embedding).toBeDefined();
        expect(well.embedding_model).toBe('all-MiniLM-L6-v2');

        // Parse embedding - pgvector stores as string like '[1,2,3]'
        const embeddingArray = typeof well.embedding === 'string'
          ? JSON.parse(well.embedding)
          : well.embedding;

        // Verify embedding dimension is 384
        expect(embeddingArray.length).toBe(384);
      });
    });

    it('should seed production_history table', async () => {
      // Run seed
      await db.seed.run();

      // Verify production history was seeded
      const productionRecords = await db('production_history').select('*');

      // Calculate expected count
      const expectedCount = wellsData.reduce(
        (sum, well) => sum + well.production_history.length,
        0
      );

      expect(productionRecords.length).toBe(expectedCount);

      // Verify production record structure
      const firstRecord = productionRecords[0];
      expect(firstRecord.id).toBeDefined();
      expect(firstRecord.well_id).toBeDefined();
      expect(firstRecord.date).toBeDefined();
      expect(firstRecord.oil_bbl).toBeDefined();
      expect(firstRecord.gas_mcf).toBeDefined();
      expect(firstRecord.water_bbl).toBeDefined();
      expect(firstRecord.created_at).toBeDefined();
      expect(firstRecord.updated_at).toBeDefined();
    });

    it('should seed valuations table', async () => {
      // Run seed
      await db.seed.run();

      // Verify valuations were seeded
      const valuations = await db('valuations').select('*');

      expect(valuations.length).toBe(wellsData.length);

      // Verify valuation structure
      const firstValuation = valuations[0];
      expect(firstValuation.id).toBeDefined();
      expect(firstValuation.well_id).toBeDefined();
      expect(firstValuation.npv_usd).toBeDefined();
      expect(firstValuation.market_value_usd).toBeDefined();
      expect(firstValuation.discount_pct).toBeDefined();
      expect(firstValuation.confidence).toBeDefined();
      expect(firstValuation.remaining_reserves_bbl).toBeDefined();
      expect(firstValuation.created_at).toBeDefined();
      expect(firstValuation.updated_at).toBeDefined();
    });

    it('should maintain foreign key relationships', async () => {
      // Run seed
      await db.seed.run();

      // Verify operator-well relationship
      const wellsWithOperators = await db('wells')
        .join('operators', 'wells.operator_id', '=', 'operators.id')
        .select('wells.id', 'operators.name as operator_name');

      expect(wellsWithOperators.length).toBe(wellsData.length);

      // Verify well-production_history relationship
      const productionWithWells = await db('production_history')
        .join('wells', 'production_history.well_id', '=', 'wells.id')
        .select('production_history.id', 'wells.well_name');

      expect(productionWithWells.length).toBeGreaterThan(0);

      // Verify well-valuations relationship
      const valuationsWithWells = await db('valuations')
        .join('wells', 'valuations.well_id', '=', 'wells.id')
        .select('valuations.id', 'wells.well_name');

      expect(valuationsWithWells.length).toBe(wellsData.length);
    });

    it('should run idempotently (can run multiple times)', async () => {
      // Run seed first time
      await db.seed.run();

      const firstRunOperators = await db('operators').count('* as count');
      const firstRunWells = await db('wells').count('* as count');
      const firstRunProduction = await db('production_history').count('* as count');
      const firstRunValuations = await db('valuations').count('* as count');

      // Run seed second time
      await db.seed.run();

      const secondRunOperators = await db('operators').count('* as count');
      const secondRunWells = await db('wells').count('* as count');
      const secondRunProduction = await db('production_history').count('* as count');
      const secondRunValuations = await db('valuations').count('* as count');

      // Verify counts remain the same (idempotent)
      expect(secondRunOperators[0].count).toBe(firstRunOperators[0].count);
      expect(secondRunWells[0].count).toBe(firstRunWells[0].count);
      expect(secondRunProduction[0].count).toBe(firstRunProduction[0].count);
      expect(secondRunValuations[0].count).toBe(firstRunValuations[0].count);
    });
  });

  describe('Data integrity', () => {
    it('should correctly map JSON data to database fields', async () => {
      // Run seed
      await db.seed.run();

      // Pick a specific well from the source data
      const sourceWell = wellsData[0];

      // Find the same well in the database
      const dbWell = await db('wells')
        .where('well_id', sourceWell.id)
        .first();

      expect(dbWell).toBeDefined();
      expect(dbWell.well_name).toBe(sourceWell.name);
      expect(dbWell.api_number).toBe(sourceWell.attributes.api_number.toString());
      expect(Number(dbWell.latitude)).toBeCloseTo(sourceWell.location.latitude, 6);
      expect(Number(dbWell.longitude)).toBeCloseTo(sourceWell.location.longitude, 6);
      expect(dbWell.county).toBe(sourceWell.location.county);
      expect(dbWell.state).toBe(sourceWell.location.state);
      expect(dbWell.field).toBe(sourceWell.location.field);
      expect(dbWell.status).toBe(sourceWell.status);
      expect(dbWell.depth_ft).toBe(sourceWell.attributes.depth_ft);
    });

    it('should correctly link operators to wells', async () => {
      // Run seed
      await db.seed.run();

      const sourceWell = wellsData[0];

      // Find well with operator
      const dbWell = await db('wells')
        .join('operators', 'wells.operator_id', '=', 'operators.id')
        .where('wells.well_id', sourceWell.id)
        .select('operators.name as operator_name')
        .first();

      expect(dbWell).toBeDefined();
      expect(dbWell.operator_name).toBe(sourceWell.operator);
    });

    it('should correctly seed production history with dates', async () => {
      // Run seed
      await db.seed.run();

      const sourceWell = wellsData[0];
      const dbWell = await db('wells').where('well_id', sourceWell.id).first();

      const productionRecords = await db('production_history')
        .where('well_id', dbWell.id)
        .orderBy('date', 'desc');

      expect(productionRecords.length).toBe(sourceWell.production_history.length);

      // Verify first production record matches
      const firstSourceRecord = sourceWell.production_history[0];
      const matchingDbRecord = productionRecords.find((r) => {
        const dbDate = new Date(r.date).toISOString().slice(0, 7);
        return dbDate === firstSourceRecord.date;
      });

      expect(matchingDbRecord).toBeDefined();
      expect(Number(matchingDbRecord!.oil_bbl)).toBe(firstSourceRecord.oil_bbl);
      expect(Number(matchingDbRecord!.gas_mcf)).toBe(firstSourceRecord.gas_mcf);
      expect(Number(matchingDbRecord!.water_bbl)).toBe(firstSourceRecord.water_bbl);
    });

    it('should correctly seed valuations with proper precision', async () => {
      // Run seed
      await db.seed.run();

      const sourceWell = wellsData[0];
      const dbWell = await db('wells').where('well_id', sourceWell.id).first();

      const valuation = await db('valuations')
        .where('well_id', dbWell.id)
        .first();

      expect(valuation).toBeDefined();
      expect(Number(valuation.npv_usd)).toBeCloseTo(sourceWell.valuation.npvUsd, 2);
      expect(Number(valuation.market_value_usd)).toBeCloseTo(sourceWell.valuation.marketValueUsd, 2);
      expect(Number(valuation.discount_pct)).toBeCloseTo(sourceWell.valuation.discountPct, 2);
      expect(Number(valuation.confidence)).toBeCloseTo(sourceWell.valuation.confidence, 2);
      expect(Number(valuation.remaining_reserves_bbl)).toBeCloseTo(sourceWell.valuation.remainingReservesBbl, 2);
    });
  });
});
