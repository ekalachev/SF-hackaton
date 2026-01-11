/**
 * MapThemeToggle Component
 *
 * A button component that toggles between light and dark map themes.
 * Displays a Sun icon when in dark mode (click to go light) and
 * Moon icon when in light mode (click to go dark).
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles theme toggle UI
 * - Open/Closed: Extensible through props (if needed later)
 * - Dependency Inversion: Depends on useMapTheme abstraction
 *
 * Accessibility:
 * - Proper ARIA labels for screen readers
 * - Keyboard accessible (native button element)
 * - Descriptive title attributes for tooltips
 * - High contrast icons with appropriate colors
 *
 * @module MapThemeToggle
 */

import { Sun, Moon } from 'lucide-react';
import { useMapTheme } from '@/stores/mapThemeStore';

/**
 * Theme toggle button component
 *
 * Displays in top-right corner of map with appropriate icon
 * based on current theme. Clicking toggles between light and dark modes.
 *
 * @returns JSX.Element - Rendered button component
 *
 * @example
 * ```tsx
 * <MapThemeToggle />
 * ```
 */
export function MapThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useMapTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Current: ${theme} mode. Click to switch.`}
      type="button"
      className="
        bg-white/90 dark:bg-gray-800/90
        backdrop-blur-sm
        p-3 rounded-lg
        shadow-lg hover:shadow-xl
        transition-all duration-200 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        cursor-pointer
        min-w-[48px] min-h-[48px]
        flex items-center justify-center
      "
    >
      {theme === 'dark' ? (
        <Sun
          size={20}
          className="text-yellow-500 transition-colors duration-200"
          strokeWidth={2}
        />
      ) : (
        <Moon
          size={20}
          className="text-blue-700 transition-colors duration-200"
          strokeWidth={2}
        />
      )}
    </button>
  );
}
