/**
 * Map control types for advanced map features
 *
 * This module defines types for:
 * - Production heatmap layer
 * - Basin/formation filters
 * - Custom map styles
 * - Distance/radius tool
 *
 * @module mapControls
 */

import { z } from 'zod';

/**
 * Available map style options
 */
export type MapStyleOption = 'satellite' | 'terrain' | 'streets' | 'dark' | 'light';

/**
 * Zod schema for MapStyleOption
 */
export const MapStyleOptionSchema = z.enum(['satellite', 'terrain', 'streets', 'dark', 'light']);

/**
 * Map style URLs for each option
 */
export const MAP_STYLE_URLS: Record<MapStyleOption, string> = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
  streets: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
} as const;

/**
 * Major oil/gas basins in Texas
 */
export type Basin =
  | 'permian'
  | 'eagleFord'
  | 'haynesville'
  | 'anadarko'
  | 'barnett'
  | 'granite_wash';

/**
 * Basin display configuration
 */
export interface BasinConfig {
  readonly id: Basin;
  readonly name: string;
  readonly counties: ReadonlyArray<string>;
}

/**
 * Major Texas basins with associated counties
 */
export const MAJOR_BASINS: ReadonlyArray<BasinConfig> = [
  {
    id: 'permian',
    name: 'Permian Basin',
    counties: [
      'ANDREWS', 'BORDEN', 'CRANE', 'DAWSON', 'ECTOR', 'GAINES', 'GLASSCOCK',
      'HOWARD', 'LOVING', 'MARTIN', 'MIDLAND', 'PECOS', 'REAGAN', 'REEVES',
      'UPTON', 'WARD', 'WINKLER', 'YOAKUM',
    ],
  },
  {
    id: 'eagleFord',
    name: 'Eagle Ford Shale',
    counties: [
      'ATASCOSA', 'DEWITT', 'DIMMIT', 'FRIO', 'GONZALES', 'KARNES', 'LASALLE',
      'LAVACA', 'LIVE OAK', 'MCMULLEN', 'MAVERICK', 'WEBB', 'WILSON', 'ZAVALA',
    ],
  },
  {
    id: 'haynesville',
    name: 'Haynesville Shale',
    counties: [
      'HARRISON', 'MARION', 'PANOLA', 'RUSK', 'SHELBY',
    ],
  },
  {
    id: 'anadarko',
    name: 'Anadarko Basin',
    counties: [
      'HANSFORD', 'HEMPHILL', 'HUTCHINSON', 'LIPSCOMB', 'MOORE', 'OCHILTREE',
      'ROBERTS', 'WHEELER',
    ],
  },
  {
    id: 'barnett',
    name: 'Barnett Shale',
    counties: [
      'DENTON', 'HOOD', 'JOHNSON', 'PARKER', 'TARRANT', 'WISE',
    ],
  },
  {
    id: 'granite_wash',
    name: 'Granite Wash',
    counties: [
      'HEMPHILL', 'ROBERTS', 'WHEELER',
    ],
  },
] as const;

/**
 * Heatmap layer configuration
 */
export interface HeatmapConfig {
  readonly enabled: boolean;
  readonly intensity: number;
  readonly radius: number;
  readonly opacity: number;
}

/**
 * Default heatmap configuration
 */
export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  enabled: false,
  intensity: 1,
  radius: 30,
  opacity: 0.7,
} as const;

/**
 * Radius selection state
 */
export interface RadiusSelection {
  readonly center: {
    readonly longitude: number;
    readonly latitude: number;
  };
  readonly radiusMiles: number;
  readonly wellCount: number;
  readonly totalProduction: number;
  readonly avgDiscount: number;
}

/**
 * Map controls state
 */
export interface MapControlsState {
  // Heatmap
  readonly heatmapEnabled: boolean;
  readonly heatmapConfig: HeatmapConfig;

  // Basin filters
  readonly selectedBasins: ReadonlyArray<Basin>;
  readonly selectedCounties: ReadonlyArray<string>;

  // Map style
  readonly mapStyle: MapStyleOption;
  readonly clusteringEnabled: boolean;

  // Radius tool
  readonly radiusToolActive: boolean;
  readonly radiusSelection: RadiusSelection | null;
}

/**
 * Default map controls state
 */
export const DEFAULT_MAP_CONTROLS_STATE: MapControlsState = {
  heatmapEnabled: false,
  heatmapConfig: DEFAULT_HEATMAP_CONFIG,
  selectedBasins: [],
  selectedCounties: [],
  mapStyle: 'dark',
  clusteringEnabled: true,
  radiusToolActive: false,
  radiusSelection: null,
} as const;

/**
 * Map controls actions
 */
export interface MapControlsActions {
  // Heatmap actions
  toggleHeatmap: () => void;
  setHeatmapConfig: (config: Partial<HeatmapConfig>) => void;

  // Basin filter actions
  toggleBasin: (basin: Basin) => void;
  setSelectedBasins: (basins: ReadonlyArray<Basin>) => void;
  clearBasinFilters: () => void;

  // Map style actions
  setMapStyle: (style: MapStyleOption) => void;
  toggleClustering: () => void;

  // Radius tool actions
  toggleRadiusTool: () => void;
  setRadiusSelection: (selection: RadiusSelection | null) => void;
  clearRadiusSelection: () => void;
}

/**
 * Full map controls store type
 */
export type MapControlsStore = MapControlsState & MapControlsActions;

/**
 * Heatmap color stops for production intensity
 * Format: [production_value, color]
 */
export const HEATMAP_COLOR_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, 'rgba(0, 0, 255, 0)'],      // No production - transparent
  [10, 'rgba(65, 105, 225, 0.5)'], // Low - royal blue
  [50, 'rgba(0, 255, 0, 0.6)'],   // Medium-low - green
  [100, 'rgba(255, 255, 0, 0.7)'], // Medium - yellow
  [200, 'rgba(255, 165, 0, 0.8)'], // Medium-high - orange
  [500, 'rgba(255, 0, 0, 0.9)'],  // High - red
] as const;

/**
 * LocalStorage key for map controls preferences
 */
export const MAP_CONTROLS_STORAGE_KEY = 'oilfield-map-controls';

/**
 * Get counties for selected basins
 */
export function getCountiesForBasins(basins: ReadonlyArray<Basin>): ReadonlyArray<string> {
  const counties = new Set<string>();

  for (const basin of basins) {
    const config = MAJOR_BASINS.find(b => b.id === basin);
    if (config) {
      for (const county of config.counties) {
        counties.add(county);
      }
    }
  }

  return Array.from(counties);
}

/**
 * Check if a county is in a basin
 */
export function isCountyInBasin(county: string, basin: Basin): boolean {
  const config = MAJOR_BASINS.find(b => b.id === basin);
  if (!config) return false;

  return config.counties.includes(county.toUpperCase());
}

/**
 * Calculate distance between two points in miles
 * Uses Haversine formula
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
