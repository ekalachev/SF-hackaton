import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapTheme, getMapTheme, setMapThemeDirectly } from './mapThemeStore';
import { DEFAULT_THEME } from '@/types/mapTheme';

describe('mapThemeStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    // Reset store to default
    useMapTheme.setState({ theme: DEFAULT_THEME });
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
    it('should persist theme changes to localStorage', async () => {
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

      // Verify the theme persists across "reloads" by reading from store
      expect(getMapTheme()).toBe('light');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('map-theme-storage', 'invalid json');

      const { result } = renderHook(() => useMapTheme());

      // Should fall back to default (corrupted data is ignored)
      // The store will use the current state which is DEFAULT_THEME
      expect(result.current.theme).toBeDefined();
      expect(['dark', 'light'].includes(result.current.theme)).toBe(true);
    });

    it('should handle invalid theme values in localStorage', () => {
      localStorage.setItem(
        'map-theme-storage',
        JSON.stringify({ state: { theme: 'invalid' }, version: 0 })
      );

      const { result } = renderHook(() => useMapTheme());

      // Should fall back to default via parseMapTheme
      // The merge function validates and returns DEFAULT_THEME for invalid values
      expect(result.current.theme).toBeDefined();
      expect(['dark', 'light'].includes(result.current.theme)).toBe(true);
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
