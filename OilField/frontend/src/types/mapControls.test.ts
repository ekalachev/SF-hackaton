/**
 * Tests for mapControls types and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  MapStyleOptionSchema,
  MAP_STYLE_URLS,
  MAJOR_BASINS,
  DEFAULT_HEATMAP_CONFIG,
  DEFAULT_MAP_CONTROLS_STATE,
  getCountiesForBasins,
  isCountyInBasin,
  calculateDistanceMiles,
} from './mapControls';

describe('mapControls types', () => {
  describe('MapStyleOptionSchema', () => {
    it('should validate valid map styles', () => {
      expect(MapStyleOptionSchema.parse('satellite')).toBe('satellite');
      expect(MapStyleOptionSchema.parse('terrain')).toBe('terrain');
      expect(MapStyleOptionSchema.parse('streets')).toBe('streets');
      expect(MapStyleOptionSchema.parse('dark')).toBe('dark');
      expect(MapStyleOptionSchema.parse('light')).toBe('light');
    });

    it('should reject invalid map styles', () => {
      expect(() => MapStyleOptionSchema.parse('invalid')).toThrow();
      expect(() => MapStyleOptionSchema.parse('')).toThrow();
      expect(() => MapStyleOptionSchema.parse(123)).toThrow();
    });
  });

  describe('MAP_STYLE_URLS', () => {
    it('should have URLs for all style options', () => {
      expect(MAP_STYLE_URLS.satellite).toContain('mapbox://');
      expect(MAP_STYLE_URLS.terrain).toContain('mapbox://');
      expect(MAP_STYLE_URLS.streets).toContain('mapbox://');
      expect(MAP_STYLE_URLS.dark).toContain('mapbox://');
      expect(MAP_STYLE_URLS.light).toContain('mapbox://');
    });
  });

  describe('MAJOR_BASINS', () => {
    it('should have correct basin configurations', () => {
      expect(MAJOR_BASINS.length).toBe(6);

      const permian = MAJOR_BASINS.find(b => b.id === 'permian');
      expect(permian).toBeDefined();
      expect(permian?.name).toBe('Permian Basin');
      expect(permian?.counties.length).toBeGreaterThan(0);

      const eagleFord = MAJOR_BASINS.find(b => b.id === 'eagleFord');
      expect(eagleFord).toBeDefined();
      expect(eagleFord?.name).toBe('Eagle Ford Shale');
    });
  });

  describe('DEFAULT_HEATMAP_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_HEATMAP_CONFIG.enabled).toBe(false);
      expect(DEFAULT_HEATMAP_CONFIG.intensity).toBe(1);
      expect(DEFAULT_HEATMAP_CONFIG.radius).toBe(30);
      expect(DEFAULT_HEATMAP_CONFIG.opacity).toBe(0.7);
    });
  });

  describe('DEFAULT_MAP_CONTROLS_STATE', () => {
    it('should have correct default state', () => {
      expect(DEFAULT_MAP_CONTROLS_STATE.heatmapEnabled).toBe(false);
      expect(DEFAULT_MAP_CONTROLS_STATE.selectedBasins).toEqual([]);
      expect(DEFAULT_MAP_CONTROLS_STATE.selectedCounties).toEqual([]);
      expect(DEFAULT_MAP_CONTROLS_STATE.mapStyle).toBe('dark');
      expect(DEFAULT_MAP_CONTROLS_STATE.clusteringEnabled).toBe(true);
      expect(DEFAULT_MAP_CONTROLS_STATE.radiusToolActive).toBe(false);
      expect(DEFAULT_MAP_CONTROLS_STATE.radiusSelection).toBeNull();
    });
  });

  describe('getCountiesForBasins', () => {
    it('should return empty array for no basins', () => {
      expect(getCountiesForBasins([])).toEqual([]);
    });

    it('should return counties for single basin', () => {
      const counties = getCountiesForBasins(['permian']);
      expect(counties.length).toBeGreaterThan(0);
      expect(counties).toContain('MIDLAND');
      expect(counties).toContain('ECTOR');
    });

    it('should return combined counties for multiple basins', () => {
      const counties = getCountiesForBasins(['permian', 'eagleFord']);
      expect(counties).toContain('MIDLAND'); // Permian
      expect(counties).toContain('KARNES'); // Eagle Ford
    });

    it('should deduplicate counties', () => {
      // Granite Wash shares some counties with Anadarko
      const counties = getCountiesForBasins(['anadarko', 'granite_wash']);
      const uniqueCounties = [...new Set(counties)];
      expect(counties.length).toBe(uniqueCounties.length);
    });
  });

  describe('isCountyInBasin', () => {
    it('should return true for county in basin', () => {
      expect(isCountyInBasin('MIDLAND', 'permian')).toBe(true);
      expect(isCountyInBasin('midland', 'permian')).toBe(true); // Case insensitive
      expect(isCountyInBasin('KARNES', 'eagleFord')).toBe(true);
    });

    it('should return false for county not in basin', () => {
      expect(isCountyInBasin('HARRIS', 'permian')).toBe(false);
      expect(isCountyInBasin('MIDLAND', 'eagleFord')).toBe(false);
    });

    it('should handle invalid basin', () => {
      // @ts-expect-error Testing invalid basin
      expect(isCountyInBasin('MIDLAND', 'invalid')).toBe(false);
    });
  });

  describe('calculateDistanceMiles', () => {
    it('should return 0 for same point', () => {
      const distance = calculateDistanceMiles(31.5, -99.9, 31.5, -99.9);
      expect(distance).toBe(0);
    });

    it('should calculate distance correctly', () => {
      // Austin to Houston is approximately 146 miles (as the crow flies)
      const distance = calculateDistanceMiles(
        30.2672, -97.7431, // Austin
        29.7604, -95.3698  // Houston
      );
      expect(distance).toBeGreaterThan(140);
      expect(distance).toBeLessThan(160);
    });

    it('should return positive distance regardless of direction', () => {
      const d1 = calculateDistanceMiles(31.5, -99.9, 32.5, -98.9);
      const d2 = calculateDistanceMiles(32.5, -98.9, 31.5, -99.9);
      expect(d1).toBeCloseTo(d2, 5);
    });
  });
});
