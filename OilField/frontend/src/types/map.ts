/**
 * Map-related type definitions for Mapbox GL JS
 */

import type { Well } from './api';
import type { ValuationCategory } from './well';
import type { MapTheme } from './mapTheme';
import { getMapStyleURL, DEFAULT_THEME } from './mapTheme';

/**
 * GeoJSON Point geometry
 */
export interface GeoJSONPoint {
  readonly type: 'Point';
  readonly coordinates: readonly [number, number]; // [longitude, latitude]
}

/**
 * Well marker properties for GeoJSON features
 */
export interface WellMarkerProperties {
  readonly id: string;
  readonly wellId: string;
  readonly name: string;
  readonly valuationCategory: ValuationCategory;
  readonly discountPct: number;
  readonly currentProduction: number;
}

/**
 * GeoJSON Feature for a well marker
 */
export interface WellFeature {
  readonly type: 'Feature';
  readonly geometry: GeoJSONPoint;
  readonly properties: WellMarkerProperties;
}

/**
 * GeoJSON FeatureCollection for wells
 */
export interface WellFeatureCollection {
  readonly type: 'FeatureCollection';
  readonly features: ReadonlyArray<WellFeature>;
}

/**
 * Convert Well to GeoJSON Feature
 * Only converts wells with location, valuation, and production data
 */
export function wellToFeature(well: Well): WellFeature | null {
  if (!well.location || !well.valuation || !well.production) {
    return null;
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [well.location.longitude, well.location.latitude],
    },
    properties: {
      id: well.id,
      wellId: well.wellId,
      name: well.wellName,
      valuationCategory: getValuationCategory(well.valuation.discountPct),
      discountPct: well.valuation.discountPct,
      currentProduction: well.production.currentOilBblDay,
    },
  };
}

/**
 * Convert wells array to GeoJSON FeatureCollection
 * Filters out wells without complete location/valuation/production data
 */
export function wellsToFeatureCollection(wells: ReadonlyArray<Well>): WellFeatureCollection {
  const features = wells
    .map(wellToFeature)
    .filter((f): f is WellFeature => f !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Helper to get valuation category (re-export for convenience)
 */
function getValuationCategory(discountPct: number): ValuationCategory {
  if (discountPct >= 20) return 'undervalued';
  if (discountPct <= -20) return 'overvalued';
  return 'fair';
}

/**
 * Texas center coordinates
 */
export const TEXAS_CENTER = {
  longitude: -99.9,
  latitude: 31.5,
} as const;

/**
 * Default map configuration.
 *
 * @deprecated Use getMapConfig(theme) instead for theme-aware configuration.
 * This constant is maintained for backwards compatibility with existing code.
 *
 * @example
 * ```typescript
 * // Old way (still works)
 * const config = DEFAULT_MAP_CONFIG;
 *
 * // New way (preferred)
 * const config = getMapConfig('dark');
 * ```
 */
export const DEFAULT_MAP_CONFIG = {
  style: getMapStyleURL(DEFAULT_THEME),
  center: [TEXAS_CENTER.longitude, TEXAS_CENTER.latitude] as const,
  zoom: 6,
} as const;

/**
 * Get map configuration for a specific theme.
 *
 * This function provides theme-aware map configuration, allowing
 * the application to switch between different Mapbox styles dynamically.
 *
 * @param theme - The map theme to use ('dark' | 'light')
 * @returns Map configuration object with style, center, and zoom
 *
 * @example
 * ```typescript
 * const darkConfig = getMapConfig('dark');
 * const lightConfig = getMapConfig('light');
 * ```
 */
export function getMapConfig(theme: MapTheme) {
  return {
    style: getMapStyleURL(theme),
    center: [TEXAS_CENTER.longitude, TEXAS_CENTER.latitude] as const,
    zoom: 6,
  } as const;
}

/**
 * Cluster configuration
 */
export const CLUSTER_CONFIG = {
  clusterMaxZoom: 14,
  clusterRadius: 50,
} as const;
