/**
 * Zustand store for search and filter state with localStorage persistence
 *
 * Following SOLID principles:
 * - Single Responsibility: Manages only filter state
 * - Open/Closed: Easily extendable with new filter types
 * - Dependency Inversion: Uses type abstractions
 *
 * @module filterStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  FilterStore,
  FilterState,
  FilterPreset,
  ProductionRange,
  WellType,
  WellStatus,
  SortField,
  SortOrder,
} from '@/types/filters';
import {
  DEFAULT_FILTER_CRITERIA,
  FILTER_STORAGE_KEY,
  MAX_SEARCH_HISTORY,
} from '@/types/filters';
import logger from '@/lib/logger';

/**
 * Generate unique ID for presets
 */
function generateId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Custom storage engine with error handling
 */
const storage = createJSONStorage<Partial<FilterState>>(() => ({
  getItem: (name: string): string | null => {
    try {
      const value = localStorage.getItem(name);
      logger.debug('state', 'Retrieved filters from localStorage');
      return value;
    } catch (error) {
      logger.error('system', 'Failed to read filters from localStorage', { error });
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
      logger.debug('state', 'Saved filters to localStorage');
    } catch (error) {
      logger.error('system', 'Failed to save filters to localStorage', { error });
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
      logger.debug('state', 'Removed filters from localStorage');
    } catch (error) {
      logger.error('system', 'Failed to remove filters from localStorage', { error });
    }
  },
}));

/**
 * Filter store with localStorage persistence
 */
export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      criteria: DEFAULT_FILTER_CRITERIA,
      presets: [],
      searchHistory: [],
      activePresetId: null,

      // Search actions
      setSearchQuery: (query: string) => {
        logger.debug('state', `Search query set: "${query}"`);
        set((state) => ({
          criteria: { ...state.criteria, searchQuery: query },
          activePresetId: null,
        }));
      },

      addToSearchHistory: (query: string) => {
        if (!query.trim()) return;

        set((state) => {
          const filtered = state.searchHistory.filter((h) => h.query !== query);
          const newHistory = [
            { query, timestamp: new Date().toISOString() },
            ...filtered,
          ].slice(0, MAX_SEARCH_HISTORY);

          logger.debug('state', `Added to search history: "${query}"`);
          return { searchHistory: newHistory };
        });
      },

      clearSearchHistory: () => {
        logger.info('ui', 'Search history cleared');
        set({ searchHistory: [] });
      },

      // Filter actions
      setProductionRange: (range: ProductionRange) => {
        logger.debug('state', `Production range set: ${range.min}-${range.max}`);
        set((state) => ({
          criteria: { ...state.criteria, productionRange: range },
          activePresetId: null,
        }));
      },

      setWellAge: (minYears: number, maxYears: number) => {
        logger.debug('state', `Well age range set: ${minYears}-${maxYears} years`);
        set((state) => ({
          criteria: {
            ...state.criteria,
            wellAge: { minYears, maxYears },
          },
          activePresetId: null,
        }));
      },

      setOperators: (operators: readonly string[]) => {
        logger.debug('state', `Operators set: ${operators.join(', ') || 'none'}`);
        set((state) => ({
          criteria: { ...state.criteria, operators },
          activePresetId: null,
        }));
      },

      toggleOperator: (operator: string) => {
        set((state) => {
          const current = state.criteria.operators;
          const isSelected = current.includes(operator);
          const operators = isSelected
            ? current.filter((o) => o !== operator)
            : [...current, operator];

          logger.debug('state', `Operator ${operator} ${isSelected ? 'removed' : 'added'}`);
          return {
            criteria: { ...state.criteria, operators },
            activePresetId: null,
          };
        });
      },

      setWellTypes: (types: readonly WellType[]) => {
        logger.debug('state', `Well types set: ${types.join(', ') || 'none'}`);
        set((state) => ({
          criteria: { ...state.criteria, wellTypes: types },
          activePresetId: null,
        }));
      },

      toggleWellType: (type: WellType) => {
        set((state) => {
          const current = state.criteria.wellTypes;
          const isSelected = current.includes(type);
          const wellTypes = isSelected
            ? current.filter((t) => t !== type)
            : [...current, type];

          logger.debug('state', `Well type ${type} ${isSelected ? 'removed' : 'added'}`);
          return {
            criteria: { ...state.criteria, wellTypes },
            activePresetId: null,
          };
        });
      },

      setStatuses: (statuses: readonly WellStatus[]) => {
        logger.debug('state', `Statuses set: ${statuses.join(', ') || 'none'}`);
        set((state) => ({
          criteria: { ...state.criteria, statuses },
          activePresetId: null,
        }));
      },

      toggleStatus: (status: WellStatus) => {
        set((state) => {
          const current = state.criteria.statuses;
          const isSelected = current.includes(status);
          const statuses = isSelected
            ? current.filter((s) => s !== status)
            : [...current, status];

          logger.debug('state', `Status ${status} ${isSelected ? 'removed' : 'added'}`);
          return {
            criteria: { ...state.criteria, statuses },
            activePresetId: null,
          };
        });
      },

      // Sorting actions
      setSortBy: (field: SortField) => {
        logger.debug('state', `Sort field set: ${field}`);
        set((state) => ({
          criteria: { ...state.criteria, sortBy: field },
          activePresetId: null,
        }));
      },

      setSortOrder: (order: SortOrder) => {
        logger.debug('state', `Sort order set: ${order}`);
        set((state) => ({
          criteria: { ...state.criteria, sortOrder: order },
          activePresetId: null,
        }));
      },

      toggleSortOrder: () => {
        set((state) => {
          const newOrder = state.criteria.sortOrder === 'asc' ? 'desc' : 'asc';
          logger.debug('state', `Sort order toggled to: ${newOrder}`);
          return {
            criteria: { ...state.criteria, sortOrder: newOrder },
            activePresetId: null,
          };
        });
      },

      // Preset actions
      savePreset: (name: string, description?: string): string => {
        const id = generateId();
        const criteria = get().criteria;

        const preset: FilterPreset = {
          id,
          name,
          description,
          criteria,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          presets: [...state.presets, preset],
        }));

        logger.info('ui', `Preset saved: "${name}"`);
        return id;
      },

      applyPreset: (presetId: string) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) {
          logger.warn('ui', `Preset not found: ${presetId}`);
          return;
        }

        set({
          criteria: preset.criteria,
          activePresetId: presetId,
        });

        logger.info('ui', `Preset applied: "${preset.name}"`);
      },

      deletePreset: (presetId: string) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== presetId),
          activePresetId: state.activePresetId === presetId ? null : state.activePresetId,
        }));

        logger.info('ui', `Preset deleted: ${presetId}`);
      },

      // Reset actions
      resetFilters: () => {
        logger.info('ui', 'Filters reset to default');
        set({
          criteria: DEFAULT_FILTER_CRITERIA,
          activePresetId: null,
        });
      },

      resetToPreset: (presetId: string) => {
        get().applyPreset(presetId);
      },

      // URL state actions
      getUrlParams: (): URLSearchParams => {
        const { criteria } = get();
        const params = new URLSearchParams();

        if (criteria.searchQuery) {
          params.set('q', criteria.searchQuery);
        }

        if (criteria.productionRange.min > 0 || criteria.productionRange.max < 1000) {
          params.set('prodMin', String(criteria.productionRange.min));
          params.set('prodMax', String(criteria.productionRange.max));
        }

        if (criteria.wellAge.minYears > 0 || criteria.wellAge.maxYears < 50) {
          params.set('ageMin', String(criteria.wellAge.minYears));
          params.set('ageMax', String(criteria.wellAge.maxYears));
        }

        if (criteria.operators.length > 0) {
          params.set('operators', criteria.operators.join(','));
        }

        if (criteria.wellTypes.length > 0) {
          params.set('types', criteria.wellTypes.join(','));
        }

        if (criteria.statuses.length > 0) {
          params.set('status', criteria.statuses.join(','));
        }

        if (criteria.sortBy !== 'production') {
          params.set('sort', criteria.sortBy);
        }

        if (criteria.sortOrder !== 'desc') {
          params.set('order', criteria.sortOrder);
        }

        return params;
      },

      applyFromUrl: (params: URLSearchParams) => {
        const criteria = { ...DEFAULT_FILTER_CRITERIA };

        const query = params.get('q');
        if (query) {
          criteria.searchQuery = query;
        }

        const prodMin = params.get('prodMin');
        const prodMax = params.get('prodMax');
        if (prodMin || prodMax) {
          criteria.productionRange = {
            min: prodMin ? Number(prodMin) : 0,
            max: prodMax ? Number(prodMax) : 1000,
          };
        }

        const ageMin = params.get('ageMin');
        const ageMax = params.get('ageMax');
        if (ageMin || ageMax) {
          criteria.wellAge = {
            minYears: ageMin ? Number(ageMin) : 0,
            maxYears: ageMax ? Number(ageMax) : 50,
          };
        }

        const operators = params.get('operators');
        if (operators) {
          criteria.operators = operators.split(',');
        }

        const types = params.get('types');
        if (types) {
          criteria.wellTypes = types.split(',') as WellType[];
        }

        const status = params.get('status');
        if (status) {
          criteria.statuses = status.split(',') as WellStatus[];
        }

        const sort = params.get('sort');
        if (sort) {
          criteria.sortBy = sort as SortField;
        }

        const order = params.get('order');
        if (order) {
          criteria.sortOrder = order as SortOrder;
        }

        set({ criteria, activePresetId: null });
        logger.info('ui', 'Filters applied from URL');
      },
    }),
    {
      name: FILTER_STORAGE_KEY,
      storage,
      partialize: (state) => ({
        criteria: state.criteria,
        presets: state.presets,
        searchHistory: state.searchHistory,
      }),
    }
  )
);

/**
 * Get current filter store state without subscribing
 */
export const getFilterStoreState = (): FilterState => {
  const state = useFilterStore.getState();
  return {
    criteria: state.criteria,
    presets: state.presets,
    searchHistory: state.searchHistory,
    activePresetId: state.activePresetId,
  };
};
