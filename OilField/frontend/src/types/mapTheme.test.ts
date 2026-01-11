import { describe, it, expect } from 'vitest';
import {
  type MapTheme,
  MAP_STYLES,
  DEFAULT_THEME,
  getMapStyleURL,
  isValidMapTheme,
  parseMapTheme,
  MapThemeSchema,
} from './mapTheme';

describe('mapTheme', () => {
  describe('MapTheme type', () => {
    it('should accept valid theme values', () => {
      const dark: MapTheme = 'dark';
      const light: MapTheme = 'light';
      expect(dark).toBe('dark');
      expect(light).toBe('light');
    });
  });

  describe('MAP_STYLES', () => {
    it('should have dark theme URL', () => {
      expect(MAP_STYLES.dark).toBe('mapbox://styles/mapbox/dark-v11');
    });

    it('should have light theme URL', () => {
      expect(MAP_STYLES.light).toBe('mapbox://styles/mapbox/light-v11');
    });

    it('should be a const object with additional style options', () => {
      // Verify TypeScript treats this as const (compile-time check)
      // Runtime check: verify the object has expected keys
      expect(MAP_STYLES).toHaveProperty('dark');
      expect(MAP_STYLES).toHaveProperty('light');
      expect(MAP_STYLES).toHaveProperty('streets');
      expect(MAP_STYLES).toHaveProperty('satellite');
      expect(MAP_STYLES).toHaveProperty('outdoors');
    });
  });

  describe('DEFAULT_THEME', () => {
    it('should be dark', () => {
      expect(DEFAULT_THEME).toBe('dark');
    });
  });

  describe('getMapStyleURL', () => {
    it('should return correct URL for dark theme', () => {
      expect(getMapStyleURL('dark')).toBe('mapbox://styles/mapbox/dark-v11');
    });

    it('should return correct URL for light theme', () => {
      expect(getMapStyleURL('light')).toBe('mapbox://styles/mapbox/light-v11');
    });
  });

  describe('isValidMapTheme', () => {
    it('should return true for valid themes', () => {
      expect(isValidMapTheme('dark')).toBe(true);
      expect(isValidMapTheme('light')).toBe(true);
    });

    it('should return false for invalid themes', () => {
      expect(isValidMapTheme('invalid')).toBe(false);
      expect(isValidMapTheme('')).toBe(false);
      expect(isValidMapTheme(null)).toBe(false);
      expect(isValidMapTheme(undefined)).toBe(false);
      expect(isValidMapTheme(123)).toBe(false);
      expect(isValidMapTheme({})).toBe(false);
    });
  });

  describe('parseMapTheme', () => {
    it('should parse valid theme strings', () => {
      expect(parseMapTheme('dark')).toBe('dark');
      expect(parseMapTheme('light')).toBe('light');
    });

    it('should return default for invalid values', () => {
      expect(parseMapTheme('invalid')).toBe(DEFAULT_THEME);
      expect(parseMapTheme(null)).toBe(DEFAULT_THEME);
      expect(parseMapTheme(undefined)).toBe(DEFAULT_THEME);
      expect(parseMapTheme(123)).toBe(DEFAULT_THEME);
    });

    it('should handle localStorage string values', () => {
      // Simulate localStorage getString
      const storedValue = 'light';
      expect(parseMapTheme(storedValue)).toBe('light');
    });
  });

  describe('MapThemeSchema', () => {
    it('should validate correct theme values', () => {
      expect(MapThemeSchema.parse('dark')).toBe('dark');
      expect(MapThemeSchema.parse('light')).toBe('light');
    });

    it('should throw on invalid values', () => {
      expect(() => MapThemeSchema.parse('invalid')).toThrow();
      expect(() => MapThemeSchema.parse(123)).toThrow();
    });
  });
});
