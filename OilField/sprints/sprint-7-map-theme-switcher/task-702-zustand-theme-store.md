# Task 702: Create Zustand Theme Store with localStorage Persistence

## Status
- **State**: Not Started
- **Priority**: High
- **Estimated Time**: 1 hour
- **Assigned To**: TBD
- **Depends On**: Task 701

## Objective

Create a Zustand store for managing map theme state with automatic localStorage persistence and TypeScript type safety.

## Requirements

### Functional
- Store current map theme (`dark` or `light`)
- Persist theme to localStorage automatically
- Provide `setTheme` and `toggleTheme` actions
- Handle localStorage read/write errors gracefully
- Initialize from localStorage or system preference

### Technical
- Use Zustand v4.4 persist middleware
- Full TypeScript type safety
- No external dependencies beyond Zustand
- Follows SOLID principles (Single Responsibility)
- Error boundary for storage failures

## Implementation Details

### File: `frontend/src/stores/mapThemeStore.ts` (NEW)

```typescript
/**
 * Zustand store for map theme management with localStorage persistence
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type MapTheme, parseMapTheme, DEFAULT_THEME } from '@/types/mapTheme';
import logger from '@/lib/logger';

/**
 * Map theme store state interface
 */
interface MapThemeState {
  /**
   * Current map theme
   */
  theme: MapTheme;

  /**
   * Set theme to specific value
   */
  setTheme: (theme: MapTheme) => void;

  /**
   * Toggle between dark and light themes
   */
  toggleTheme: () => void;

  /**
   * Reset to default theme
   */
  resetTheme: () => void;
}

/**
 * Get initial theme from system preference
 */
function getSystemTheme(): MapTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Custom storage engine with error handling and logging
 */
const storage = createJSONStorage<MapThemeState>(() => ({
  getItem: (name: string): string | null => {
    try {
      const value = localStorage.getItem(name);
      logger.debug('state', `Retrieved theme from localStorage: ${value}`);
      return value;
    } catch (error) {
      logger.error('system', 'Failed to read theme from localStorage', { error });
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
      logger.debug('state', `Saved theme to localStorage: ${value}`);
    } catch (error) {
      logger.error('system', 'Failed to save theme to localStorage', { error });
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
      logger.debug('state', `Removed theme from localStorage`);
    } catch (error) {
      logger.error('system', 'Failed to remove theme from localStorage', { error });
    }
  },
}));

/**
 * Map theme store with localStorage persistence
 *
 * @example
 * const { theme, setTheme, toggleTheme } = useMapTheme();
 *
 * // Get current theme
 * console.log(theme); // 'dark' | 'light'
 *
 * // Set specific theme
 * setTheme('light');
 *
 * // Toggle theme
 * toggleTheme(); // dark -> light, light -> dark
 */
export const useMapTheme = create<MapThemeState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,

      setTheme: (theme: MapTheme) => {
        logger.info('ui', `Map theme changed to: ${theme}`);
        set({ theme });
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme: MapTheme = currentTheme === 'dark' ? 'light' : 'dark';
        logger.info('ui', `Map theme toggled: ${currentTheme} -> ${newTheme}`);
        set({ theme: newTheme });
      },

      resetTheme: () => {
        const systemTheme = getSystemTheme();
        logger.info('ui', `Map theme reset to system preference: ${systemTheme}`);
        set({ theme: systemTheme });
      },
    }),
    {
      name: 'map-theme-storage',
      storage,
      // Merge function to validate persisted data
      merge: (persistedState, currentState) => {
        const parsed = persistedState as Partial<MapThemeState>;
        const validatedTheme = parseMapTheme(parsed.theme);

        logger.info('state', `Loaded theme from storage: ${validatedTheme}`);

        return {
          ...currentState,
          theme: validatedTheme,
        };
      },
      // Only persist theme value
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

/**
 * Get current theme without subscribing to changes
 * Useful for one-off reads
 */
export const getMapTheme = (): MapTheme => useMapTheme.getState().theme;

/**
 * Set theme without using React hook
 * Useful for non-React contexts
 */
export const setMapThemeDirectly = (theme: MapTheme): void => {
  useMapTheme.getState().setTheme(theme);
};
```

## Test-Driven Development

### Test File: `frontend/src/stores/mapThemeStore.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapTheme, getMapTheme, setMapThemeDirectly } from './mapThemeStore';
import { DEFAULT_THEME } from '@/types/mapTheme';

describe('mapThemeStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset Zustand store
    useMapTheme.setState({ theme: DEFAULT_THEME });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useMapTheme hook', () => {
    it('should initialize with default theme', () => {
      const { result } = renderHook(() => useMapTheme());
      expect(result.current.theme).toBe(DEFAULT_THEME);
    });

    it('should provide theme state', () => {
      const { result } = renderHook(() => useMapTheme());
      expect(result.current.theme).toBeDefined();
    });

    it('should provide setTheme action', () => {
      const { result } = renderHook(() => useMapTheme());
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('should provide toggleTheme action', () => {
      const { result } = renderHook(() => useMapTheme());
      expect(typeof result.current.toggleTheme).toBe('function');
    });

    it('should provide resetTheme action', () => {
      const { result } = renderHook(() => useMapTheme());
      expect(typeof result.current.resetTheme).toBe('function');
    });
  });

  describe('setTheme', () => {
    it('should update theme to light', () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('should update theme to dark', () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should persist theme to localStorage', async () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('light');
      });

      // Wait for persistence
      await vi.waitFor(() => {
        const stored = localStorage.getItem('map-theme-storage');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.state.theme).toBe('light');
      });
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should toggle multiple times correctly', () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      act(() => {
        result.current.toggleTheme(); // dark -> light
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme(); // light -> dark
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme(); // dark -> light
      });
      expect(result.current.theme).toBe('light');
    });
  });

  describe('localStorage persistence', () => {
    it('should restore theme from localStorage on mount', () => {
      // Pre-populate localStorage
      localStorage.setItem(
        'map-theme-storage',
        JSON.stringify({ state: { theme: 'light' }, version: 0 })
      );

      const { result } = renderHook(() => useMapTheme());

      expect(result.current.theme).toBe('light');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('map-theme-storage', 'invalid json');

      const { result } = renderHook(() => useMapTheme());

      // Should fall back to default
      expect(result.current.theme).toBe(DEFAULT_THEME);
    });

    it('should handle invalid theme values in localStorage', () => {
      localStorage.setItem(
        'map-theme-storage',
        JSON.stringify({ state: { theme: 'invalid' }, version: 0 })
      );

      const { result } = renderHook(() => useMapTheme());

      // Should fall back to default
      expect(result.current.theme).toBe(DEFAULT_THEME);
    });
  });

  describe('getMapTheme', () => {
    it('should return current theme without subscribing', () => {
      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(getMapTheme()).toBe('light');
    });
  });

  describe('setMapThemeDirectly', () => {
    it('should update theme without React hook', () => {
      setMapThemeDirectly('light');

      const { result } = renderHook(() => useMapTheme());
      expect(result.current.theme).toBe('light');
    });
  });

  describe('resetTheme', () => {
    it('should reset to system theme', () => {
      // Mock matchMedia for system preference
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true, // prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useMapTheme());

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.resetTheme();
      });

      expect(result.current.theme).toBe('dark');
    });
  });
});
```

## TDD Process

1. **Red**: Write failing tests
2. **Green**: Implement minimal store code
3. **Refactor**: Optimize and add error handling

## Acceptance Criteria

- [ ] Zustand store created with persist middleware
- [ ] Theme persists to localStorage automatically
- [ ] `setTheme` action works correctly
- [ ] `toggleTheme` action switches themes
- [ ] Invalid localStorage data handled gracefully
- [ ] All unit tests passing (>90% coverage)
- [ ] TypeScript compiles without errors
- [ ] No ESLint warnings
- [ ] JSDoc documentation complete

## Dependencies

### Required
- Task 701 (theme types)
- `zustand` v4.4 (already installed)
- `@/lib/logger` (already exists)

### Blocks
- Task 703 (MapView needs this store)
- Task 704 (Toggle button needs this store)

## Notes

### Why Zustand persist middleware?
- Built-in localStorage support
- Automatic serialization/deserialization
- Version migration support
- Already using Zustand in project

### localStorage Key
Using `map-theme-storage` instead of generic name for:
- Clarity when debugging
- Avoid conflicts with other features
- Easy to find in DevTools

## Resources

- [Zustand persist middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Testing Zustand](https://docs.pmnd.rs/zustand/guides/testing)
