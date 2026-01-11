import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { Knex } from 'knex';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import knexfile configuration
const knexConfig = require(path.join(__dirname, '..', 'knexfile.js'));

describe('001_initial_schema migration', () => {
  let db: Knex;

  beforeAll(async () => {
    // Use development config for testing
    db = knex(knexConfig.development);

    // Ensure clean slate - manually drop all tables first (in reverse dependency order)
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

    // Run the migration
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Extension setup', () => {
    it('should enable pgvector extension', async () => {
      const result = await db.raw(
        "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].extname).toBe('vector');
    });
  });

  describe('Table creation', () => {
    it('should create operators table', async () => {
      const exists = await db.schema.hasTable('operators');
      expect(exists).toBe(true);
    });

    it('should create wells table', async () => {
      const exists = await db.schema.hasTable('wells');
      expect(exists).toBe(true);
    });

    it('should create production_history table', async () => {
      const exists = await db.schema.hasTable('production_history');
      expect(exists).toBe(true);
    });

    it('should create valuations table', async () => {
      const exists = await db.schema.hasTable('valuations');
      expect(exists).toBe(true);
    });
  });

  describe('Operators table schema', () => {
    it('should have correct columns', async () => {
      const columns = await db.table('operators').columnInfo();
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('operator_number');
      expect(columns).toHaveProperty('address');
      expect(columns).toHaveProperty('created_at');
      expect(columns).toHaveProperty('updated_at');
    });

    it('should enforce unique name constraint', async () => {
      await db('operators').insert({ name: 'Test Operator 1' });
      await expect(
        db('operators').insert({ name: 'Test Operator 1' })
      ).rejects.toThrow();
    });
  });

  describe('Wells table schema', () => {
    it('should have correct columns', async () => {
      const columns = await db.table('wells').columnInfo();
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('well_id');
      expect(columns).toHaveProperty('well_name');
      expect(columns).toHaveProperty('api_number');
      expect(columns).toHaveProperty('operator_id');
      expect(columns).toHaveProperty('latitude');
      expect(columns).toHaveProperty('longitude');
      expect(columns).toHaveProperty('county');
      expect(columns).toHaveProperty('field');
      expect(columns).toHaveProperty('state');
      expect(columns).toHaveProperty('status');
      expect(columns).toHaveProperty('depth_ft');
      expect(columns).toHaveProperty('completion_date');
      expect(columns).toHaveProperty('embedding');
      expect(columns).toHaveProperty('embedding_model');
      expect(columns).toHaveProperty('description');
      expect(columns).toHaveProperty('created_at');
      expect(columns).toHaveProperty('updated_at');
    });

    it('should enforce unique well_id constraint', async () => {
      await db('wells').insert({ well_id: 'TX-001', well_name: 'Test Well' });
      await expect(
        db('wells').insert({ well_id: 'TX-001', well_name: 'Test Well 2' })
      ).rejects.toThrow();
    });

    it('should have foreign key to operators', async () => {
      const operator = await db('operators')
        .insert({ name: 'Test Operator FK' })
        .returning('id');

      const well = await db('wells').insert({
        well_id: 'TX-002',
        well_name: 'Test Well FK',
        operator_id: operator[0].id,
      });

      expect(well).toBeDefined();
    });
  });

  describe('Production history table schema', () => {
    it('should have correct columns', async () => {
      const columns = await db.table('production_history').columnInfo();
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('well_id');
      expect(columns).toHaveProperty('date');
      expect(columns).toHaveProperty('oil_bbl');
      expect(columns).toHaveProperty('gas_mcf');
      expect(columns).toHaveProperty('water_bbl');
      expect(columns).toHaveProperty('created_at');
      expect(columns).toHaveProperty('updated_at');
    });

    it('should enforce unique (well_id, date) constraint', async () => {
      const well = await db('wells')
        .insert({ well_id: 'TX-003', well_name: 'Test Well Prod' })
        .returning('id');

      await db('production_history').insert({
        well_id: well[0].id,
        date: '2024-01-01',
        oil_bbl: 100,
      });

      await expect(
        db('production_history').insert({
          well_id: well[0].id,
          date: '2024-01-01',
          oil_bbl: 200,
        })
      ).rejects.toThrow();
    });

    it('should cascade delete when well is deleted', async () => {
      const well = await db('wells')
        .insert({ well_id: 'TX-004', well_name: 'Test Well Cascade' })
        .returning('id');

      await db('production_history').insert({
        well_id: well[0].id,
        date: '2024-01-01',
        oil_bbl: 100,
      });

      await db('wells').where({ id: well[0].id }).del();

      const count = await db('production_history')
        .where({ well_id: well[0].id })
        .count();
      expect(Number(count[0].count)).toBe(0);
    });
  });

  describe('Valuations table schema', () => {
    it('should have correct columns', async () => {
      const columns = await db.table('valuations').columnInfo();
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('well_id');
      expect(columns).toHaveProperty('npv_usd');
      expect(columns).toHaveProperty('market_value_usd');
      expect(columns).toHaveProperty('discount_pct');
      expect(columns).toHaveProperty('confidence');
      expect(columns).toHaveProperty('remaining_reserves_bbl');
      expect(columns).toHaveProperty('calculated_at');
      expect(columns).toHaveProperty('created_at');
      expect(columns).toHaveProperty('updated_at');
    });

    it('should enforce unique well_id constraint', async () => {
      const well = await db('wells')
        .insert({ well_id: 'TX-005', well_name: 'Test Well Val' })
        .returning('id');

      await db('valuations').insert({
        well_id: well[0].id,
        npv_usd: 1000000,
      });

      await expect(
        db('valuations').insert({
          well_id: well[0].id,
          npv_usd: 2000000,
        })
      ).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have index on wells.operator_id', async () => {
      const result = await db.raw(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'wells' AND indexname = 'idx_wells_operator'"
      );
      expect(result.rows).toHaveLength(1);
    });

    it('should have index on wells.status', async () => {
      const result = await db.raw(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'wells' AND indexname = 'idx_wells_status'"
      );
      expect(result.rows).toHaveLength(1);
    });

    it('should have index on wells.county', async () => {
      const result = await db.raw(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'wells' AND indexname = 'idx_wells_county'"
      );
      expect(result.rows).toHaveLength(1);
    });

    it('should have HNSW index on wells.embedding', async () => {
      const result = await db.raw(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'wells' AND indexname = 'idx_wells_embedding'"
      );
      expect(result.rows).toHaveLength(1);
    });

    it('should have index on production_history(well_id, date)', async () => {
      const result = await db.raw(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'production_history' AND indexname = 'idx_production_well_date'"
      );
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Triggers', () => {
    it('should update operators.updated_at on update', async () => {
      const operator = await db('operators')
        .insert({ name: 'Test Operator Trigger' })
        .returning('*');

      const originalUpdatedAt = operator[0].updated_at;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await db('operators')
        .where({ id: operator[0].id })
        .update({ address: '123 Test St' });

      const updated = await db('operators')
        .where({ id: operator[0].id })
        .first();

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should update wells.updated_at on update', async () => {
      const well = await db('wells')
        .insert({ well_id: 'TX-006', well_name: 'Test Well Trigger' })
        .returning('*');

      const originalUpdatedAt = well[0].updated_at;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await db('wells')
        .where({ id: well[0].id })
        .update({ status: 'plugged' });

      const updated = await db('wells').where({ id: well[0].id }).first();

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('Vector operations', () => {
    it('should support vector insertion and retrieval', async () => {
      // Create a simple 384-dimension vector
      const embedding = Array(384).fill(0.1);

      const well = await db('wells')
        .insert({
          well_id: 'TX-007',
          well_name: 'Test Well Vector',
          embedding: JSON.stringify(embedding),
        })
        .returning('*');

      expect(well[0].embedding).toBeDefined();
    });

    it('should support cosine similarity search', async () => {
      // Create wells with distinctly different embeddings
      // embedding1 will be closer to our query vector [0.1, 0.1, 0.1, ...]
      const embedding1 = Array(384).fill(0).map((_, i) => i < 192 ? 0.1 : 0.2);
      // embedding2 will be very different from our query vector
      const embedding2 = Array(384).fill(0).map((_, i) => i < 192 ? 0.9 : 0.8);

      await db('wells').insert({
        well_id: 'TX-008',
        well_name: 'Similar Well',
        embedding: JSON.stringify(embedding1),
      });

      await db('wells').insert({
        well_id: 'TX-009',
        well_name: 'Different Well',
        embedding: JSON.stringify(embedding2),
      });

      // Query for similarity using a vector closer to embedding1
      const queryVector = Array(384).fill(0).map((_, i) => i < 192 ? 0.1 : 0.2);
      const result = await db.raw(
        `SELECT well_id, embedding <=> ? as distance
         FROM wells
         WHERE embedding IS NOT NULL
         ORDER BY distance
         LIMIT 2`,
        [JSON.stringify(queryVector)]
      );

      // TX-008 should be the most similar (first result)
      expect(result.rows[0].well_id).toBe('TX-008');
      // TX-008 should have significantly lower distance than TX-009
      const tx008Distance = parseFloat(result.rows[0].distance);
      const tx009 = result.rows.find((r: { well_id: string }) => r.well_id === 'TX-009');
      if (tx009) {
        const tx009Distance = parseFloat(tx009.distance);
        expect(tx008Distance).toBeLessThan(tx009Distance);
      }
    });
  });

  describe('Migration rollback', () => {
    it('should successfully rollback migration', async () => {
      await db.migrate.rollback(undefined, true);

      const hasOperators = await db.schema.hasTable('operators');
      const hasWells = await db.schema.hasTable('wells');
      const hasProduction = await db.schema.hasTable('production_history');
      const hasValuations = await db.schema.hasTable('valuations');

      expect(hasOperators).toBe(false);
      expect(hasWells).toBe(false);
      expect(hasProduction).toBe(false);
      expect(hasValuations).toBe(false);
    });
  });
});
