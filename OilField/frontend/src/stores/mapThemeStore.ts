/**
 * Zustand store for map theme management with localStorage persistence
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only manages map theme state
 * - Open/Closed: Extensible through actions, closed for modification
 * - Dependency Inversion: Depends on abstractions (MapTheme type, logger)
 *
 * @module mapThemeStore
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type MapTheme, parseMapTheme, DEFAULT_THEME } from '@/types/mapTheme';
import logger from '@/lib/logger';

/**
 * Map theme store state interface
 *
 * Defines the shape of the store state and available actions.
 * Follows Interface Segregation Principle - focused and minimal.
 */
interface MapThemeState {
  /**
   * Current map theme (dark or light)
   */
  theme: MapTheme;

  /**
   * Set theme to specific value
   * @param theme - The theme to set ('dark' | 'light')
   */
  setTheme: (theme: MapTheme) => void;

  /**
   * Toggle between dark and light themes
   */
  toggleTheme: () => void;

  /**
   * Reset theme to system preference
   */
  resetTheme: () => void;
}

/**
 * Get initial theme from system preference
 *
 * @returns The system's preferred theme ('dark' | 'light')
 *
 * @example
 * ```typescript
 * const theme = getSystemTheme(); // 'dark' if user prefers dark mode
 * ```
 */
function getSystemTheme(): MapTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Custom storage engine with error handling and logging
 *
 * Wraps localStorage operations with try-catch blocks to handle:
 * - Storage quota exceeded errors
 * - Private browsing mode restrictions
 * - Security exceptions
 *
 * All errors are logged but don't crash the application.
 *
 * Note: Type parameter matches the partialized state (only theme property),
 * not the full MapThemeState (which includes action methods).
 */
const storage = createJSONStorage<Pick<MapThemeState, 'theme'>>(() => ({
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
 * This store automatically persists theme changes to localStorage and
 * restores the theme on page load. It uses Zustand's persist middleware
 * for automatic synchronization.
 *
 * Features:
 * - Automatic localStorage persistence
 * - Graceful error handling
 * - System theme detection
 * - Type-safe theme validation
 * - Comprehensive logging
 *
 * @example
 * ```typescript
 * // In a React component
 * function MyComponent() {
 *   const { theme, setTheme, toggleTheme } = useMapTheme();
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <button onClick={toggleTheme}>Toggle</button>
 *     </div>
 *   );
 * }
 * ```
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
      // Only persist theme value (not action functions)
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

/**
 * Get current theme without subscribing to changes
 *
 * Useful for one-off reads where you don't need reactivity.
 * This won't cause re-renders in React components.
 *
 * @returns The current theme value
 *
 * @example
 * ```typescript
 * // Outside React component
 * const currentTheme = getMapTheme();
 * console.log(`Current theme is: ${currentTheme}`);
 * ```
 */
export const getMapTheme = (): MapTheme => useMapTheme.getState().theme;

/**
 * Set theme without using React hook
 *
 * Useful for non-React contexts like event handlers, utilities,
 * or imperative code where hooks can't be used.
 *
 * @param theme - The theme to set ('dark' | 'light')
 *
 * @example
 * ```typescript
 * // In a utility function
 * function applyUserPreference(preference: string) {
 *   if (preference === 'dark' || preference === 'light') {
 *     setMapThemeDirectly(preference);
 *   }
 * }
 * ```
 */
export const setMapThemeDirectly = (theme: MapTheme): void => {
  useMapTheme.getState().setTheme(theme);
};
