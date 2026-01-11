/**
 * Map theme type definitions and constants
 *
 * This module provides type-safe map theming support with runtime validation.
 * It follows SOLID principles:
 * - Single Responsibility: Only handles theme definitions and validation
 * - Open/Closed: New themes can be added without modifying existing code
 * - Interface Segregation: Focused, specific functions for each use case
 *
 * @module mapTheme
 */
import { z } from 'zod';

/**
 * Available map themes for the application.
 *
 * Currently supports:
 * - `dark`: Dark theme for low-light environments
 * - `light`: Light theme for daylight viewing
 *
 * @example
 * ```typescript
 * const theme: MapTheme = 'dark';
 * ```
 */
export type MapTheme = 'dark' | 'light';

/**
 * Zod schema for runtime validation of MapTheme values.
 *
 * Use this when parsing user input or data from external sources
 * to ensure type safety at runtime.
 *
 * @example
 * ```typescript
 * const parsed = MapThemeSchema.parse('dark'); // 'dark'
 * MapThemeSchema.parse('invalid'); // throws ZodError
 * ```
 */
export const MapThemeSchema = z.enum(['dark', 'light']);

/**
 * Mapbox style URLs for each theme.
 *
 * This object is defined as const to ensure immutability and
 * provide precise TypeScript types. Additional styles (streets,
 * satellite, outdoors) are included for future expansion.
 *
 * @see https://docs.mapbox.com/api/maps/styles/
 *
 * @example
 * ```typescript
 * const darkUrl = MAP_STYLES.dark;
 * // 'mapbox://styles/mapbox/dark-v11'
 * ```
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
 * Default theme used when no preference is stored or an invalid
 * theme value is encountered.
 *
 * Set to 'dark' for better initial user experience in oil field
 * operations which often occur in various lighting conditions.
 */
export const DEFAULT_THEME: MapTheme = 'dark';

/**
 * Get the Mapbox style URL for a given theme.
 *
 * This function provides a type-safe way to retrieve style URLs,
 * ensuring only valid MapTheme values can be passed.
 *
 * @param theme - The map theme ('dark' | 'light')
 * @returns The Mapbox style URL for the specified theme
 *
 * @example
 * ```typescript
 * const url = getMapStyleURL('dark');
 * // Returns: 'mapbox://styles/mapbox/dark-v11'
 * ```
 */
export function getMapStyleURL(theme: MapTheme): string {
  return MAP_STYLES[theme];
}

/**
 * Validate if a value is a valid MapTheme with runtime type checking.
 *
 * This is a type guard function that performs runtime validation
 * using Zod, providing both type narrowing and validation.
 *
 * @param value - The value to validate (can be any type)
 * @returns True if value is a valid MapTheme, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidMapTheme(userInput)) {
 *   // userInput is now typed as MapTheme
 *   const url = getMapStyleURL(userInput);
 * }
 * ```
 */
export function isValidMapTheme(value: unknown): value is MapTheme {
  return MapThemeSchema.safeParse(value).success;
}

/**
 * Safely parse a theme value with automatic fallback to default.
 *
 * This function is ideal for parsing stored preferences or user input
 * where you want to gracefully handle invalid values without throwing
 * errors. Invalid values will return DEFAULT_THEME.
 *
 * @param value - The value to parse (typically from localStorage or user input)
 * @returns Valid MapTheme value, or DEFAULT_THEME if parsing fails
 *
 * @example
 * ```typescript
 * // From localStorage
 * const stored = localStorage.getItem('mapTheme');
 * const theme = parseMapTheme(stored); // Safe, returns 'dark' if invalid
 *
 * // From user input
 * const theme = parseMapTheme(userSelection); // Always returns valid theme
 * ```
 */
export function parseMapTheme(value: unknown): MapTheme {
  const result = MapThemeSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_THEME;
}
