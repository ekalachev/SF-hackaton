/**
 * Tests for well color coding utilities
 * Following TDD - tests written first
 */

import { describe, it, expect } from 'vitest';
import { getWellColor, categorizeWells, defaultColorConfig } from './wellColors';
import type { Well } from '@/types/api';

describe('wellColors', () => {
  describe('getWellColor', () => {
    /**
     * Data-driven test for NPV color coding
     * Tests multiple scenarios with single parameterized test
     */
    it.each([
      // [npv, expectedColor, scenario]
      [150000, '#10b981', 'healthy well (NPV > $100k)'],
      [100000, '#10b981', 'boundary: exactly $100k'],
      [75000, '#f59e0b', 'moderate well (NPV $50k-$100k)'],
      [50000, '#f59e0b', 'boundary: exactly $50k'],
      [25000, '#ef4444', 'concerning well (NPV < $50k)'],
      [0, '#ef4444', 'zero NPV'],
      [-10000, '#ef4444', 'negative NPV'],
    ])('should return %s for well with NPV %d (%s)', (npv, expectedColor) => {
      const well: Well = {
        id: 'test-well',
        wellId: 'TEST-001',
        wellName: 'Test Well',
        status: 'active',
        valuation: {
          npvUsd: npv,
          marketValueUsd: npv * 1.2,
          discountPct: 20,
          confidence: 0.8,
        },
      };

      const color = getWellColor(well);
      expect(color).toBe(expectedColor);
    });

    it('should handle well without valuation data', () => {
      const well: Well = {
        id: 'test-well',
        wellId: 'TEST-001',
        wellName: 'Test Well',
        status: 'active',
      };

      const color = getWellColor(well);
      expect(color).toBe('#ef4444'); // Should default to concerning (red)
    });

    it('should handle well with null/undefined NPV', () => {
      const well: Well = {
        id: 'test-well',
        wellId: 'TEST-001',
        wellName: 'Test Well',
        status: 'active',
        valuation: {
          npvUsd: 0,
          marketValueUsd: 0,
          discountPct: 0,
          confidence: 0,
        },
      };

      const color = getWellColor(well);
      expect(color).toBe('#ef4444'); // Zero NPV is concerning
    });

    it('should use custom color config when provided', () => {
      const customConfig = {
        healthy: { threshold: 200000, color: '#00ff00' },
        moderate: { threshold: 100000, color: '#ffff00' },
        concerning: { color: '#ff0000' },
      };

      const well: Well = {
        id: 'test-well',
        wellId: 'TEST-001',
        wellName: 'Test Well',
        status: 'active',
        valuation: {
          npvUsd: 150000,
          marketValueUsd: 180000,
          discountPct: 20,
          confidence: 0.8,
        },
      };

      const color = getWellColor(well, customConfig);
      expect(color).toBe('#ffff00'); // 150k is moderate with custom thresholds
    });
  });

  describe('categorizeWells', () => {
    it('should categorize wells correctly by NPV', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Healthy Well 1',
          status: 'active',
          valuation: { npvUsd: 150000, marketValueUsd: 180000, discountPct: 20, confidence: 0.8 },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Healthy Well 2',
          status: 'active',
          valuation: { npvUsd: 200000, marketValueUsd: 240000, discountPct: 20, confidence: 0.9 },
        },
        {
          id: 'well-3',
          wellId: 'W003',
          wellName: 'Moderate Well 1',
          status: 'active',
          valuation: { npvUsd: 75000, marketValueUsd: 90000, discountPct: 20, confidence: 0.7 },
        },
        {
          id: 'well-4',
          wellId: 'W004',
          wellName: 'Moderate Well 2',
          status: 'active',
          valuation: { npvUsd: 60000, marketValueUsd: 72000, discountPct: 20, confidence: 0.6 },
        },
        {
          id: 'well-5',
          wellId: 'W005',
          wellName: 'Concerning Well 1',
          status: 'active',
          valuation: { npvUsd: 30000, marketValueUsd: 36000, discountPct: 20, confidence: 0.5 },
        },
        {
          id: 'well-6',
          wellId: 'W006',
          wellName: 'Concerning Well 2',
          status: 'active',
          valuation: { npvUsd: 10000, marketValueUsd: 12000, discountPct: 20, confidence: 0.4 },
        },
      ];

      const categorized = categorizeWells(wells);

      expect(categorized.healthy).toHaveLength(2);
      expect(categorized.moderate).toHaveLength(2);
      expect(categorized.concerning).toHaveLength(2);

      expect(categorized.healthy[0].id).toBe('well-1');
      expect(categorized.healthy[1].id).toBe('well-2');
      expect(categorized.moderate[0].id).toBe('well-3');
      expect(categorized.moderate[1].id).toBe('well-4');
      expect(categorized.concerning[0].id).toBe('well-5');
      expect(categorized.concerning[1].id).toBe('well-6');
    });

    it('should handle wells without valuation data', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'No Valuation',
          status: 'active',
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Healthy Well',
          status: 'active',
          valuation: { npvUsd: 150000, marketValueUsd: 180000, discountPct: 20, confidence: 0.8 },
        },
      ];

      const categorized = categorizeWells(wells);

      expect(categorized.healthy).toHaveLength(1);
      expect(categorized.moderate).toHaveLength(0);
      expect(categorized.concerning).toHaveLength(1);
    });

    it('should handle empty wells array', () => {
      const categorized = categorizeWells([]);

      expect(categorized.healthy).toHaveLength(0);
      expect(categorized.moderate).toHaveLength(0);
      expect(categorized.concerning).toHaveLength(0);
    });

    it('should handle boundary NPV values correctly', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Exactly 100k',
          status: 'active',
          valuation: { npvUsd: 100000, marketValueUsd: 120000, discountPct: 20, confidence: 0.8 },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Exactly 50k',
          status: 'active',
          valuation: { npvUsd: 50000, marketValueUsd: 60000, discountPct: 20, confidence: 0.8 },
        },
        {
          id: 'well-3',
          wellId: 'W003',
          wellName: 'Just below 100k',
          status: 'active',
          valuation: { npvUsd: 99999, marketValueUsd: 120000, discountPct: 20, confidence: 0.8 },
        },
        {
          id: 'well-4',
          wellId: 'W004',
          wellName: 'Just below 50k',
          status: 'active',
          valuation: { npvUsd: 49999, marketValueUsd: 60000, discountPct: 20, confidence: 0.8 },
        },
      ];

      const categorized = categorizeWells(wells);

      expect(categorized.healthy).toHaveLength(1);
      expect(categorized.healthy[0].id).toBe('well-1');
      expect(categorized.moderate).toHaveLength(2);
      expect(categorized.moderate.map(w => w.id)).toEqual(['well-2', 'well-3']);
      expect(categorized.concerning).toHaveLength(1);
      expect(categorized.concerning[0].id).toBe('well-4');
    });
  });

  describe('defaultColorConfig', () => {
    it('should have correct default values', () => {
      expect(defaultColorConfig.healthy.threshold).toBe(100000);
      expect(defaultColorConfig.healthy.color).toBe('#10b981');
      expect(defaultColorConfig.moderate.threshold).toBe(50000);
      expect(defaultColorConfig.moderate.color).toBe('#f59e0b');
      expect(defaultColorConfig.concerning.color).toBe('#ef4444');
    });
  });
});
