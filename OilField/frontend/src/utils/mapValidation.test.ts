/**
 * Tests for map validation utilities
 * Following TDD - tests written first
 */

import { describe, it, expect, vi } from 'vitest';
import { validateWellsForMap } from './mapValidation';
import type { Well } from '@/types/api';

// Mock logger to avoid console spam in tests
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('mapValidation', () => {
  describe('validateWellsForMap', () => {
    it('should validate wells with valid coordinates', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Valid Well 1',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -95.301,
            county: 'Smith',
            field: 'East Texas',
          },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Valid Well 2',
          status: 'active',
          location: {
            latitude: 29.7604,
            longitude: -95.3698,
            county: 'Harris',
            field: 'Houston',
          },
        },
      ];

      const result = validateWellsForMap(wells);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalWells).toBe(2);
      expect(result.stats.validCoordinates).toBe(2);
      expect(result.stats.invalidCoordinates).toBe(0);
      expect(result.stats.duplicatePositions).toBe(0);
    });

    it('should detect wells with missing coordinates', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Valid Well',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -95.301,
            county: 'Smith',
            field: 'East Texas',
          },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Invalid Well - No Location',
          status: 'active',
        },
      ];

      const result = validateWellsForMap(wells);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('well-2');
      expect(result.errors[0]).toContain('missing coordinates');
      expect(result.stats.validCoordinates).toBe(1);
      expect(result.stats.invalidCoordinates).toBe(1);
    });

    it('should detect duplicate positions', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Well 1',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -95.301,
            county: 'Smith',
            field: 'East Texas',
          },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Well 2 - Duplicate Position',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -95.301,
            county: 'Smith',
            field: 'East Texas',
          },
        },
      ];

      const result = validateWellsForMap(wells);

      expect(result.valid).toBe(true); // Duplicates are warnings, not errors
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('well-2');
      expect(result.warnings[0]).toContain('duplicate position');
      expect(result.stats.duplicatePositions).toBe(1);
    });

    it('should detect coordinates outside Texas bounds', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Outside Texas - Too North',
          status: 'active',
          location: {
            latitude: 38.0, // Too far north
            longitude: -95.301,
            county: 'Unknown',
            field: 'Unknown',
          },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Outside Texas - Too South',
          status: 'active',
          location: {
            latitude: 24.0, // Too far south
            longitude: -95.301,
            county: 'Unknown',
            field: 'Unknown',
          },
        },
        {
          id: 'well-3',
          wellId: 'W003',
          wellName: 'Outside Texas - Too East',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -92.0, // Too far east
            county: 'Unknown',
            field: 'Unknown',
          },
        },
        {
          id: 'well-4',
          wellId: 'W004',
          wellName: 'Outside Texas - Too West',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -108.0, // Too far west
            county: 'Unknown',
            field: 'Unknown',
          },
        },
      ];

      const result = validateWellsForMap(wells);

      expect(result.valid).toBe(true); // Out of bounds is warning, not error
      expect(result.warnings).toHaveLength(4);
      expect(result.warnings.some(w => w.includes('well-1') && w.includes('latitude'))).toBe(true);
      expect(result.warnings.some(w => w.includes('well-2') && w.includes('latitude'))).toBe(true);
      expect(result.warnings.some(w => w.includes('well-3') && w.includes('longitude'))).toBe(true);
      expect(result.warnings.some(w => w.includes('well-4') && w.includes('longitude'))).toBe(true);
    });

    it('should handle empty wells array', () => {
      const result = validateWellsForMap([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.stats.totalWells).toBe(0);
      expect(result.stats.validCoordinates).toBe(0);
      expect(result.stats.invalidCoordinates).toBe(0);
    });

    it('should handle mixed valid and invalid wells', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'Valid Well',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -95.301,
            county: 'Smith',
            field: 'East Texas',
          },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'Invalid Well',
          status: 'active',
        },
        {
          id: 'well-3',
          wellId: 'W003',
          wellName: 'Out of Bounds Well',
          status: 'active',
          location: {
            latitude: 40.0,
            longitude: -95.301,
            county: 'Unknown',
            field: 'Unknown',
          },
        },
        {
          id: 'well-4',
          wellId: 'W004',
          wellName: 'Duplicate Position',
          status: 'active',
          location: {
            latitude: 32.4487,
            longitude: -95.301,
            county: 'Smith',
            field: 'East Texas',
          },
        },
      ];

      const result = validateWellsForMap(wells);

      expect(result.valid).toBe(false); // Has errors
      expect(result.errors).toHaveLength(1); // One invalid well
      expect(result.warnings).toHaveLength(2); // Out of bounds + duplicate
      expect(result.stats.validCoordinates).toBe(3);
      expect(result.stats.invalidCoordinates).toBe(1);
      expect(result.stats.duplicatePositions).toBe(1);
    });

    it('should validate Texas boundary coordinates correctly', () => {
      const wells: Well[] = [
        {
          id: 'well-1',
          wellId: 'W001',
          wellName: 'North Boundary',
          status: 'active',
          location: {
            latitude: 36.5, // Within Texas
            longitude: -100.0,
            county: 'Dallam',
            field: 'Panhandle',
          },
        },
        {
          id: 'well-2',
          wellId: 'W002',
          wellName: 'South Boundary',
          status: 'active',
          location: {
            latitude: 25.8, // Within Texas
            longitude: -97.0,
            county: 'Cameron',
            field: 'South Texas',
          },
        },
        {
          id: 'well-3',
          wellId: 'W003',
          wellName: 'West Boundary',
          status: 'active',
          location: {
            latitude: 31.0,
            longitude: -106.5, // Within Texas
            county: 'El Paso',
            field: 'West Texas',
          },
        },
        {
          id: 'well-4',
          wellId: 'W004',
          wellName: 'East Boundary',
          status: 'active',
          location: {
            latitude: 32.0,
            longitude: -94.0, // Within Texas
            county: 'Newton',
            field: 'East Texas',
          },
        },
      ];

      const result = validateWellsForMap(wells);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.stats.validCoordinates).toBe(4);
    });
  });
});
