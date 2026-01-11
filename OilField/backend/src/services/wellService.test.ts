/**
 * Integration tests for WellService
 * Following TDD - tests written before implementation
 * Using real database connection for integration testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WellService, WellNotFoundError } from './wellService';
import { db } from '../config/database';

describe('WellService - Integration Tests', () => {
  let service: WellService;

  beforeAll(async () => {
    service = new WellService(db);

    // Ensure database is seeded
    const wellCount = await db('wells').count('* as count').first();
    if (!wellCount || parseInt(String(wellCount.count), 10) === 0) {
      console.warn('Warning: Database is not seeded. Some tests may fail.');
    }
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('getWells', () => {
    it('should return wells with default limit of 100', async () => {
      const result = await service.getWells({});

      expect(result.wells).toBeDefined();
      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.hasMore).toBe(result.offset + result.limit < result.total);
    });

    it('should apply limit and offset filters', async () => {
      const result = await service.getWells({ limit: 5, offset: 2 });

      expect(result.limit).toBe(5);
      expect(result.offset).toBe(2);
      expect(result.wells.length).toBeLessThanOrEqual(5);
    });

    it('should enforce max limit of 500', async () => {
      const result = await service.getWells({ limit: 1000 });

      expect(result.limit).toBe(500);
    });

    it('should filter by county', async () => {
      // First, get a valid county from the database
      const well = await db('wells').whereNotNull('county').first();

      if (!well) {
        console.warn('Skipping test: No wells with county in database');
        return;
      }

      const result = await service.getWells({ county: well.county });

      expect(result.wells.every((w) => w.location?.county === well.county)).toBe(
        true
      );
    });

    it('should filter by status', async () => {
      const result = await service.getWells({ status: 'active' });

      expect(result.wells.every((w) => w.status === 'active')).toBe(true);
    });

    it('should filter by minimum discount percentage', async () => {
      const minDiscount = 30;
      const result = await service.getWells({ minDiscount });

      // All wells with valuation should have discount >= minDiscount
      result.wells.forEach((well) => {
        if (well.valuation) {
          expect(well.valuation.discountPct).toBeGreaterThanOrEqual(minDiscount);
        }
      });
    });

    it('should sort by discount ascending', async () => {
      const result = await service.getWells({
        sortBy: 'discount',
        sortOrder: 'asc',
        limit: 10,
      });

      // Verify ascending order (each item >= previous)
      for (let i = 1; i < result.wells.length; i++) {
        const prev = result.wells[i - 1].valuation?.discountPct ?? 0;
        const curr = result.wells[i].valuation?.discountPct ?? 0;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('should sort by valuation descending by default', async () => {
      const result = await service.getWells({ sortBy: 'valuation', limit: 10 });

      // Verify descending order (each item <= previous)
      for (let i = 1; i < result.wells.length; i++) {
        const prev = result.wells[i - 1].valuation?.marketValueUsd ?? 0;
        const curr = result.wells[i].valuation?.marketValueUsd ?? 0;
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });
  });

  describe('getWellById', () => {
    it('should return well details with production history and valuation', async () => {
      // Get a real well from the database
      const existingWell = await db('wells').first();

      if (!existingWell) {
        console.warn('Skipping test: No wells in database');
        return;
      }

      const result = await service.getWellById(existingWell.id);

      expect(result.well).toBeDefined();
      expect(result.well.id).toBe(existingWell.id);
      expect(result.well.wellId).toBe(existingWell.well_id);
      expect(result.well.wellName).toBe(existingWell.well_name);
      expect(result.productionHistory).toBeDefined();
      expect(Array.isArray(result.productionHistory)).toBe(true);
    });

    it('should throw WellNotFoundError when well not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(service.getWellById(fakeId)).rejects.toThrow(
        WellNotFoundError
      );
    });

    it('should support lookup by well_id string', async () => {
      // Get a real well from the database
      const existingWell = await db('wells').first();

      if (!existingWell) {
        console.warn('Skipping test: No wells in database');
        return;
      }

      const result = await service.getWellById(existingWell.well_id);

      expect(result.well).toBeDefined();
      expect(result.well.wellId).toBe(existingWell.well_id);
    });

    it('should return production history ordered by date descending', async () => {
      // Get a well that has production history
      const wellWithProduction = await db('wells')
        .join('production_history', 'wells.id', 'production_history.well_id')
        .select('wells.id')
        .first();

      if (!wellWithProduction) {
        console.warn('Skipping test: No wells with production history');
        return;
      }

      const result = await service.getWellById(wellWithProduction.id);

      if (result.productionHistory.length > 1) {
        // Verify descending order
        for (let i = 1; i < result.productionHistory.length; i++) {
          const prev = result.productionHistory[i - 1].date;
          const curr = result.productionHistory[i].date;
          expect(curr <= prev).toBe(true);
        }
      }
    });

    it('should include operator details when available', async () => {
      // Get a well with an operator
      const wellWithOperator = await db('wells')
        .whereNotNull('operator_id')
        .first();

      if (!wellWithOperator) {
        console.warn('Skipping test: No wells with operator');
        return;
      }

      const result = await service.getWellById(wellWithOperator.id);

      expect(result.operator).toBeDefined();
      expect(result.operator).not.toBeNull();
      if (result.operator) {
        expect(result.operator.name).toBeDefined();
      }
    });
  });
});
