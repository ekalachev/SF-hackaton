/**
 * Central export point for all application types
 */

// API types
export type {
  Operator,
  Location,
  Production,
  Valuation,
  Well,
  WellFilters,
  GetWellsResponse,
} from './api';

// Well types
export type { ValuationCategory } from './well';
export { getValuationCategory } from './well';

// Map types
export type {
  GeoJSONPoint,
  WellMarkerProperties,
  WellFeature,
  WellFeatureCollection,
} from './map';

export {
  wellToFeature,
  wellsToFeatureCollection,
  TEXAS_CENTER,
  DEFAULT_MAP_CONFIG,
  CLUSTER_CONFIG,
  getMapConfig,
} from './map';

// Map theme types and utilities
export type { MapTheme } from './mapTheme';
export {
  MAP_STYLES,
  DEFAULT_THEME,
  getMapStyleURL,
  isValidMapTheme,
  parseMapTheme,
  MapThemeSchema,
} from './mapTheme';

// Map controls types
export type {
  MapStyleOption,
  Basin,
  BasinConfig,
  HeatmapConfig,
  RadiusSelection,
  MapControlsState,
  MapControlsActions,
  MapControlsStore,
} from './mapControls';

export {
  MapStyleOptionSchema,
  MAP_STYLE_URLS,
  MAJOR_BASINS,
  DEFAULT_HEATMAP_CONFIG,
  DEFAULT_MAP_CONTROLS_STATE,
  HEATMAP_COLOR_STOPS,
  MAP_CONTROLS_STORAGE_KEY,
  getCountiesForBasins,
  isCountyInBasin,
  calculateDistanceMiles,
} from './mapControls';
