import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmbeddingService } from './embeddingService';
import type { Knex } from 'knex';
import type { WellDescriptionInput } from '../models/Well';

// Mock Knex database instance
const mockDb = {} as Knex;

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService(mockDb);
  });

  describe('generateWellDescription', () => {
    it('should generate description for a well with full data', () => {
      const well: WellDescriptionInput = {
        well_name: 'Jones Ranch #1',
        operator_name: 'Texas Oil Co',
        county: 'Karnes',
        state: 'TX',
        field: 'Eagle Ford',
        status: 'active',
        current_oil_bbl_day: 150.5,
        cumulative_oil_bbl: 250000,
        decline_rate_annual: 0.12,
        valuation_discount_pct: 25,
      };

      const description = service.generateWellDescription(well);

      expect(description).toContain('Jones Ranch #1');
      expect(description).toContain('Karnes County');
      expect(description).toContain('TX');
      expect(description).toContain('Eagle Ford');
      expect(description).toContain('150.5 bbl/day');
      expect(description).toContain('active');
      expect(description).toContain('undervalued');
      expect(description).toContain('12.0% annually');
      expect(description).toContain('250,000 barrels');
      expect(description).toContain('Texas Oil Co');
    });

    it('should handle overvalued wells', () => {
      const well: WellDescriptionInput = {
        well_name: 'Smith Well #2',
        operator_name: 'Big Oil Corp',
        county: 'Reeves',
        state: 'TX',
        field: 'Permian',
        status: 'active',
        current_oil_bbl_day: 200,
        cumulative_oil_bbl: 500000,
        decline_rate_annual: 0.08,
        valuation_discount_pct: -25,
      };

      const description = service.generateWellDescription(well);

      expect(description).toContain('overvalued');
    });

    it('should handle fairly valued wells', () => {
      const well: WellDescriptionInput = {
        well_name: 'Test Well',
        county: 'Test County',
        state: 'TX',
        field: null,
        status: 'active',
        current_oil_bbl_day: 100,
        cumulative_oil_bbl: 100000,
        decline_rate_annual: 0.1,
        valuation_discount_pct: 5,
      };

      const description = service.generateWellDescription(well);

      expect(description).toContain('fairly valued');
      expect(description).toContain('unspecified');
    });

    it('should handle missing optional fields gracefully', () => {
      const well: WellDescriptionInput = {
        well_name: 'Minimal Well',
        county: null,
        state: 'TX',
        field: null,
        status: 'inactive',
      };

      const description = service.generateWellDescription(well);

      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
      expect(description).toContain('Minimal Well');
      expect(description).toContain('TX');
    });
  });

  describe('generateEmbedding', () => {
    it('should return 384-dimensional vector for valid text', async () => {
      const text = 'Oil well Jones Ranch #1 in Karnes County, TX.';

      const embedding = await service.generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should handle different text inputs', async () => {
      const text1 = 'First test text';
      const text2 = 'Different text content';

      const embedding1 = await service.generateEmbedding(text1);
      const embedding2 = await service.generateEmbedding(text2);

      expect(embedding1.length).toBe(384);
      expect(embedding2.length).toBe(384);
      // Embeddings should be different for different texts
      expect(JSON.stringify(embedding1)).not.toBe(JSON.stringify(embedding2));
    });

    it('should handle empty text', async () => {
      const text = '';

      const embedding = await service.generateEmbedding(text);

      expect(embedding.length).toBe(384);
    });

    it('should handle text with special characters', async () => {
      const text = 'Well "Name" with $pecial ch@racters & symbols!';

      const embedding = await service.generateEmbedding(text);

      expect(embedding.length).toBe(384);
    });
  });

  describe('Python script error handling', () => {
    it('should throw error if Python script fails', async () => {
      // This test will verify error handling
      // We'll need to mock the exec function to simulate failure
      const invalidText = null as unknown as string;

      await expect(
        service.generateEmbedding(invalidText)
      ).rejects.toThrow();
    });
  });
});
