# Task 701: Define Map Style Constants and Types

## Status
- **State**: Not Started
- **Priority**: High
- **Estimated Time**: 30 minutes
- **Assigned To**: TBD

## Objective

Create TypeScript type definitions and constants for map themes and Mapbox style URLs with full type safety and runtime validation.

## Requirements

### Functional
- Define `MapTheme` type for theme values
- Create constants for all available Mapbox style URLs
- Export theme validation utilities
- Update existing `DEFAULT_MAP_CONFIG` to support dynamic themes

### Technical
- Full TypeScript type safety
- Runtime validation with Zod
- Backwards compatible with existing code
- Follow SOLID, KISS, DRY principles

## Implementation Details

### File: `frontend/src/types/mapTheme.ts` (NEW)

```typescript
/**
 * Map theme type definitions and constants
 */
import { z } from 'zod';

/**
 * Available map themes
 */
export type MapTheme = 'dark' | 'light';

/**
 * Zod schema for runtime validation
 */
export const MapThemeSchema = z.enum(['dark', 'light']);

/**
 * Mapbox style URLs for each theme
 */
export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  // Future expansion ready
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

/**
 * Default theme
 */
export const DEFAULT_THEME: MapTheme = 'dark';

/**
 * Get style URL for a theme
 */
export function getMapStyleURL(theme: MapTheme): string {
  return MAP_STYLES[theme];
}

/**
 * Validate theme value with runtime type checking
 */
export function isValidMapTheme(value: unknown): value is MapTheme {
  return MapThemeSchema.safeParse(value).success;
}

/**
 * Safely parse theme from storage with fallback
 */
export function parseMapTheme(value: unknown): MapTheme {
  const result = MapThemeSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_THEME;
}
```

### File: `frontend/src/types/map.ts` (UPDATE)

Update existing file to use new theme system:

```typescript
import type { MapTheme } from './mapTheme';
import { getMapStyleURL, DEFAULT_THEME } from './mapTheme';

/**
 * Default map configuration
 * @deprecated Use getMapConfig(theme) instead
 */
export const DEFAULT_MAP_CONFIG = {
  style: getMapStyleURL(DEFAULT_THEME),
  center: [TEXAS_CENTER.longitude, TEXAS_CENTER.latitude] as const,
  zoom: 6,
} as const;

/**
 * Get map configuration for a specific theme
 */
export function getMapConfig(theme: MapTheme) {
  return {
    style: getMapStyleURL(theme),
    center: [TEXAS_CENTER.longitude, TEXAS_CENTER.latitude] as const,
    zoom: 6,
  } as const;
}
```

### File: `frontend/src/types/index.ts` (UPDATE)

Add exports:

```typescript
// Add to existing exports
export type { MapTheme } from './mapTheme';
export {
  MAP_STYLES,
  DEFAULT_THEME,
  getMapStyleURL,
  isValidMapTheme,
  parseMapTheme,
  MapThemeSchema,
} from './mapTheme';
export { getMapConfig } from './map';
```

## Test-Driven Development

### Test File: `frontend/src/types/mapTheme.test.ts` (NEW)

```typescript
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

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error Testing immutability
        MAP_STYLES.dark = 'different';
      }).toThrow();
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
```

## TDD Process

### Red Phase
1. Create test file with failing tests
2. Run `npm test` - should fail (files don't exist yet)

### Green Phase
1. Create `frontend/src/types/mapTheme.ts`
2. Implement minimal code to pass tests
3. Run `npm test` - should pass

### Refactor Phase
1. Optimize type definitions
2. Add JSDoc comments
3. Ensure code follows SOLID principles
4. Run `npm test` - should still pass

## Acceptance Criteria

- [ ] `mapTheme.ts` file created with all exports
- [ ] All TypeScript types compile without errors
- [ ] Runtime validation with Zod works correctly
- [ ] All unit tests passing (100% coverage)
- [ ] Backwards compatible with existing `DEFAULT_MAP_CONFIG`
- [ ] No ESLint warnings
- [ ] JSDoc documentation complete
- [ ] Exported from `types/index.ts`

## Dependencies

### Required
- `zod` v3.25.76 (already installed)

### Blocks
- Task 702 (needs theme types)
- Task 703 (needs style URLs)

## Notes

### Design Decisions

1. **Why Zod for validation?**
   - Already used in project (package.json:46)
   - Provides runtime type safety
   - Better than custom validation logic (DRY)

2. **Why separate mapTheme.ts file?**
   - Single Responsibility Principle
   - Theme types may grow with more styles
   - Easier to test in isolation

3. **Why keep DEFAULT_MAP_CONFIG?**
   - Backwards compatibility
   - Gradual migration path
   - Existing tests won't break

### Future Enhancements
- Add `streets`, `satellite`, `outdoors` to MapTheme type
- Theme-specific cluster colors
- Custom theme creation

## Resources

- [Zod documentation](https://zod.dev/)
- [TypeScript const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [Mapbox style URLs](https://docs.mapbox.com/api/maps/styles/)
