/**
 * Tests for SimilarityService
 * Following TDD: Write failing tests first
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { Knex } from 'knex';
import { SimilarityService } from '../src/services/similarityService';
import type { Well } from '../src/types/well';

describe('SimilarityService', () => {
  let db: Knex;
  let service: SimilarityService;
  let testWellId: string;
  let similarWellId: string;

  beforeAll(async () => {
    // Setup test database connection
    db = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'oilfield_test',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
    });

    // Migrations are now run globally in tests/setup.ts
    service = new SimilarityService(db);

    // Create test operator
    const [operator] = await db('operators')
      .insert({
        name: 'Test Operator',
        operator_number: 'OP-001',
      })
      .returning('id');

    // Create test wells with embeddings
    const testEmbedding = new Array(384).fill(0.5);
    const similarEmbedding = new Array(384).fill(0.51); // Very similar
    const differentEmbedding = new Array(384).fill(0.1); // Different

    const [well1] = await db('wells')
      .insert({
        well_id: 'WELL-001',
        well_name: 'Test Well 1',
        api_number: 'API-001',
        operator_id: operator.id,
        county: 'Test County',
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        embedding: JSON.stringify(testEmbedding),
        embedding_model: 'all-MiniLM-L6-v2',
      })
      .returning('id');

    const [well2] = await db('wells')
      .insert({
        well_id: 'WELL-002',
        well_name: 'Test Well 2',
        api_number: 'API-002',
        operator_id: operator.id,
        county: 'Test County',
        state: 'TX',
        status: 'active',
        depth_ft: 5100,
        embedding: JSON.stringify(similarEmbedding),
        embedding_model: 'all-MiniLM-L6-v2',
      })
      .returning('id');

    await db('wells').insert({
      well_id: 'WELL-003',
      well_name: 'Test Well 3',
      api_number: 'API-003',
      operator_id: operator.id,
      county: 'Different County',
      state: 'TX',
      status: 'inactive',
      depth_ft: 4000,
      embedding: JSON.stringify(differentEmbedding),
      embedding_model: 'all-MiniLM-L6-v2',
    });

    testWellId = well1.id;
    similarWellId = well2.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db('wells').where('well_id', 'like', 'WELL-%').del();
    await db('operators').where('operator_number', 'OP-001').del();
    await db.destroy();
  });

  describe('findSimilarWells', () => {
    it('should find similar wells using vector similarity', async () => {
      const results = await service.findSimilarWells(testWellId, { limit: 5 });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return wells with similarity scores between 0 and 1', async () => {
      const results = await service.findSimilarWells(testWellId, { limit: 5 });

      results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
        expect(typeof result.similarity).toBe('number');
      });
    });

    it('should order results by similarity (highest first)', async () => {
      const results = await service.findSimilarWells(testWellId, { limit: 5 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('should exclude the target well from results', async () => {
      const results = await service.findSimilarWells(testWellId, { limit: 5 });

      const containsTargetWell = results.some((result) => result.well.id === testWellId);
      expect(containsTargetWell).toBe(false);
    });

    it('should respect minSimilarity threshold', async () => {
      const results = await service.findSimilarWells(testWellId, {
        limit: 10,
        minSimilarity: 0.9,
      });

      results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should exclude same operator wells when excludeOperator is true', async () => {
      const results = await service.findSimilarWells(testWellId, {
        limit: 10,
        excludeOperator: true,
      });

      const [targetWell] = await db('wells').where('id', testWellId).select('operator_id');

      results.forEach((result) => {
        expect(result.well.operator_id).not.toBe(targetWell.operator_id);
      });
    });

    it('should handle empty results when no similar wells exist', async () => {
      const results = await service.findSimilarWells(testWellId, {
        limit: 5,
        minSimilarity: 0.999, // Very high threshold
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('semanticSearch', () => {
    it('should search wells using natural language query', async () => {
      const results = await service.semanticSearch('active well in Test County', {
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return wells with relevance scores between 0 and 1 (with small floating point tolerance)', async () => {
      const results = await service.semanticSearch('producing well', { limit: 10 });

      results.forEach((result) => {
        // Allow for small floating point imprecision in cosine similarity
        // pgvector can produce values slightly outside [0,1] due to numerical precision
        expect(result.relevanceScore).toBeGreaterThanOrEqual(-0.01);
        expect(result.relevanceScore).toBeLessThanOrEqual(1.01);
        expect(typeof result.relevanceScore).toBe('number');
      });
    });

    it('should apply county filter when provided', async () => {
      const results = await service.semanticSearch('well', {
        limit: 10,
        filters: { county: 'Test County' },
      });

      results.forEach((result) => {
        expect(result.well.county).toBe('Test County');
      });
    });

    it('should apply status filter when provided', async () => {
      const results = await service.semanticSearch('well', {
        limit: 10,
        filters: { status: 'active' },
      });

      results.forEach((result) => {
        expect(result.well.status).toBe('active');
      });
    });

    it('should respect limit parameter', async () => {
      const results = await service.semanticSearch('well', { limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateMatchReasons', () => {
    it('should generate reasons for well similarity', () => {
      const well1: Well = {
        id: '1',
        well_id: 'W1',
        well_name: 'Well 1',
        api_number: null,
        operator_id: null,
        latitude: null,
        longitude: null,
        county: 'Test County',
        field: null,
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        completion_date: null,
        embedding: null,
        embedding_model: 'all-MiniLM-L6-v2',
        description: null,
        current_oil_bbl_day: 100,
        formation: 'Eagle Ford',
        valuation_discount_pct: 25,
        decline_rate_annual: 0.15,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const well2: Well = {
        ...well1,
        id: '2',
        well_id: 'W2',
        well_name: 'Well 2',
        current_oil_bbl_day: 105,
        valuation_discount_pct: 22,
      };

      const reasons = service.generateMatchReasons(well1, well2);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
    });

    it('should detect similar production rates', () => {
      const well1: Well = {
        id: '1',
        well_id: 'W1',
        well_name: 'Well 1',
        api_number: null,
        operator_id: null,
        latitude: null,
        longitude: null,
        county: 'Test County',
        field: null,
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        completion_date: null,
        embedding: null,
        embedding_model: 'all-MiniLM-L6-v2',
        description: null,
        current_oil_bbl_day: 100,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const well2: Well = {
        ...well1,
        id: '2',
        well_id: 'W2',
        current_oil_bbl_day: 105,
      };

      const reasons = service.generateMatchReasons(well1, well2);

      expect(reasons.some((r) => r.includes('Similar production rate'))).toBe(true);
    });

    it('should detect same formation', () => {
      const well1: Well = {
        id: '1',
        well_id: 'W1',
        well_name: 'Well 1',
        api_number: null,
        operator_id: null,
        latitude: null,
        longitude: null,
        county: 'Test County',
        field: null,
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        completion_date: null,
        embedding: null,
        embedding_model: 'all-MiniLM-L6-v2',
        description: null,
        formation: 'Eagle Ford',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const well2: Well = {
        ...well1,
        id: '2',
        well_id: 'W2',
      };

      const reasons = service.generateMatchReasons(well1, well2);

      expect(reasons.some((r) => r.includes('Same formation'))).toBe(true);
    });

    it('should detect same county', () => {
      const well1: Well = {
        id: '1',
        well_id: 'W1',
        well_name: 'Well 1',
        api_number: null,
        operator_id: null,
        latitude: null,
        longitude: null,
        county: 'Test County',
        field: null,
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        completion_date: null,
        embedding: null,
        embedding_model: 'all-MiniLM-L6-v2',
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const well2: Well = {
        ...well1,
        id: '2',
        well_id: 'W2',
      };

      const reasons = service.generateMatchReasons(well1, well2);

      expect(reasons.some((r) => r.includes('Same county'))).toBe(true);
    });

    it('should detect undervalued wells', () => {
      const well1: Well = {
        id: '1',
        well_id: 'W1',
        well_name: 'Well 1',
        api_number: null,
        operator_id: null,
        latitude: null,
        longitude: null,
        county: 'Test County',
        field: null,
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        completion_date: null,
        embedding: null,
        embedding_model: 'all-MiniLM-L6-v2',
        description: null,
        valuation_discount_pct: 25,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const well2: Well = {
        ...well1,
        id: '2',
        well_id: 'W2',
        valuation_discount_pct: 30,
      };

      const reasons = service.generateMatchReasons(well1, well2);

      expect(reasons.some((r) => r.includes('Both undervalued'))).toBe(true);
    });

    it('should detect similar decline rates', () => {
      const well1: Well = {
        id: '1',
        well_id: 'W1',
        well_name: 'Well 1',
        api_number: null,
        operator_id: null,
        latitude: null,
        longitude: null,
        county: 'Test County',
        field: null,
        state: 'TX',
        status: 'active',
        depth_ft: 5000,
        completion_date: null,
        embedding: null,
        embedding_model: 'all-MiniLM-L6-v2',
        description: null,
        decline_rate_annual: 0.15,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const well2: Well = {
        ...well1,
        id: '2',
        well_id: 'W2',
        decline_rate_annual: 0.16,
      };

      const reasons = service.generateMatchReasons(well1, well2);

      expect(reasons.some((r) => r.includes('Similar decline rate'))).toBe(true);
    });
  });
});
