/**
 * Filter Types for Search & Filtering System
 * Following SOLID principles - Single Responsibility for filter type definitions
 */

/**
 * Well status options for filtering
 */
export type WellStatus = 'active' | 'plugged' | 'depleted';

/**
 * Well type options for filtering
 */
export type WellType = 'horizontal' | 'vertical' | 'directional';

/**
 * Sort field options
 */
export type SortField = 'production' | 'age' | 'valuation' | 'discount' | 'name';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Production rate range filter
 */
export interface ProductionRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Complete filter criteria for wells
 */
export interface FilterCriteria {
  readonly searchQuery: string;
  readonly productionRange: ProductionRange;
  readonly wellAge: {
    readonly minYears: number;
    readonly maxYears: number;
  };
  readonly operators: readonly string[];
  readonly wellTypes: readonly WellType[];
  readonly statuses: readonly WellStatus[];
  readonly sortBy: SortField;
  readonly sortOrder: SortOrder;
}

/**
 * Saved filter preset
 */
export interface FilterPreset {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly criteria: FilterCriteria;
  readonly isDefault?: boolean;
  readonly createdAt: string;
}

/**
 * Search suggestion item
 */
export interface SearchSuggestion {
  readonly type: 'well' | 'operator' | 'location' | 'recent';
  readonly value: string;
  readonly label: string;
  readonly metadata?: {
    readonly id?: string;
    readonly county?: string;
    readonly operator?: string;
  };
}

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  readonly query: string;
  readonly timestamp: string;
}

/**
 * Default filter criteria
 */
export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  searchQuery: '',
  productionRange: { min: 0, max: 1000 },
  wellAge: { minYears: 0, maxYears: 50 },
  operators: [],
  wellTypes: [],
  statuses: [],
  sortBy: 'production',
  sortOrder: 'desc',
};

/**
 * Default presets for common scenarios
 */
export const DEFAULT_PRESETS: readonly FilterPreset[] = [
  {
    id: 'high-producers',
    name: 'High Producers',
    description: 'Wells with production > 100 bbl/day',
    criteria: {
      ...DEFAULT_FILTER_CRITERIA,
      productionRange: { min: 100, max: 1000 },
      statuses: ['active'],
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'undervalued',
    name: 'Undervalued',
    description: 'Active wells with high discount',
    criteria: {
      ...DEFAULT_FILTER_CRITERIA,
      statuses: ['active'],
      sortBy: 'discount',
      sortOrder: 'desc',
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'new-wells',
    name: 'New Wells',
    description: 'Wells less than 5 years old',
    criteria: {
      ...DEFAULT_FILTER_CRITERIA,
      wellAge: { minYears: 0, maxYears: 5 },
      statuses: ['active'],
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Filter store state
 */
export interface FilterState {
  readonly criteria: FilterCriteria;
  readonly presets: readonly FilterPreset[];
  readonly searchHistory: readonly SearchHistoryEntry[];
  readonly activePresetId: string | null;
}

/**
 * Filter store actions
 */
export interface FilterActions {
  // Search
  setSearchQuery: (query: string) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // Filters
  setProductionRange: (range: ProductionRange) => void;
  setWellAge: (minYears: number, maxYears: number) => void;
  setOperators: (operators: readonly string[]) => void;
  toggleOperator: (operator: string) => void;
  setWellTypes: (types: readonly WellType[]) => void;
  toggleWellType: (type: WellType) => void;
  setStatuses: (statuses: readonly WellStatus[]) => void;
  toggleStatus: (status: WellStatus) => void;

  // Sorting
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;

  // Presets
  savePreset: (name: string, description?: string) => string;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;

  // Reset
  resetFilters: () => void;
  resetToPreset: (presetId: string) => void;

  // URL state
  getUrlParams: () => URLSearchParams;
  applyFromUrl: (params: URLSearchParams) => void;
}

/**
 * Complete filter store type
 */
export type FilterStore = FilterState & FilterActions;

/**
 * Storage key for persisting filters
 */
export const FILTER_STORAGE_KEY = 'oilfield-filters';

/**
 * Maximum search history entries
 */
export const MAX_SEARCH_HISTORY = 10;
