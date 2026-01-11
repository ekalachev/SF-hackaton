/**
 * useFilters Hook
 * React hook for filtering and searching wells
 *
 * Following SOLID principles:
 * - Single Responsibility: Handles filtering logic only
 * - Dependency Inversion: Depends on store abstraction
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import type { Well } from '@/types/api';
import type { FilterCriteria, SearchSuggestion } from '@/types/filters';

/**
 * Hook for filtering wells based on current filter criteria
 *
 * @param wells - Array of wells to filter
 * @returns Filtered and sorted wells with filter utilities
 */
export function useFilters(wells: readonly Well[]) {
  const {
    criteria,
    searchHistory,
    activePresetId,
    setSearchQuery,
    addToSearchHistory,
    setProductionRange,
    setWellAge,
    toggleOperator,
    toggleWellType,
    toggleStatus,
    setSortBy,
    toggleSortOrder,
    resetFilters,
    getUrlParams,
    applyFromUrl,
  } = useFilterStore();

  // Apply URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      applyFromUrl(params);
    }
  }, [applyFromUrl]);

  // Update URL when filters change
  useEffect(() => {
    const params = getUrlParams();
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [criteria, getUrlParams]);

  // Filter wells based on criteria
  const filteredWells = useMemo(() => {
    return filterWells(wells, criteria);
  }, [wells, criteria]);

  // Sort filtered wells
  const sortedWells = useMemo(() => {
    return sortWells(filteredWells, criteria.sortBy, criteria.sortOrder);
  }, [filteredWells, criteria.sortBy, criteria.sortOrder]);

  // Generate search suggestions
  const getSuggestions = useCallback(
    (query: string): SearchSuggestion[] => {
      if (!query || query.length < 2) return [];

      const lowerQuery = query.toLowerCase();
      const suggestions: SearchSuggestion[] = [];

      // Add recent searches
      searchHistory
        .filter((h) => h.query.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach((h) => {
          suggestions.push({
            type: 'recent',
            value: h.query,
            label: h.query,
          });
        });

      // Add matching wells
      wells
        .filter(
          (w) =>
            w.wellName.toLowerCase().includes(lowerQuery) ||
            w.wellId.toLowerCase().includes(lowerQuery) ||
            w.apiNumber?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .forEach((w) => {
          suggestions.push({
            type: 'well',
            value: w.wellId,
            label: w.wellName,
            metadata: {
              id: w.id,
              county: w.location?.county,
              operator: w.operator?.name,
            },
          });
        });

      // Add matching operators
      const operators = new Set<string>();
      wells.forEach((w) => {
        if (w.operator?.name.toLowerCase().includes(lowerQuery)) {
          operators.add(w.operator.name);
        }
      });

      Array.from(operators)
        .slice(0, 3)
        .forEach((op) => {
          suggestions.push({
            type: 'operator',
            value: op,
            label: op,
          });
        });

      // Add matching locations
      const locations = new Set<string>();
      wells.forEach((w) => {
        if (w.location?.county.toLowerCase().includes(lowerQuery)) {
          locations.add(w.location.county);
        }
      });

      Array.from(locations)
        .slice(0, 3)
        .forEach((loc) => {
          suggestions.push({
            type: 'location',
            value: loc,
            label: loc,
          });
        });

      return suggestions.slice(0, 10);
    },
    [wells, searchHistory]
  );

  // Get unique operators from wells
  const availableOperators = useMemo(() => {
    const operators = new Set<string>();
    wells.forEach((w) => {
      if (w.operator?.name) {
        operators.add(w.operator.name);
      }
    });
    return Array.from(operators).sort();
  }, [wells]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      criteria.searchQuery !== '' ||
      criteria.productionRange.min > 0 ||
      criteria.productionRange.max < 1000 ||
      criteria.wellAge.minYears > 0 ||
      criteria.wellAge.maxYears < 50 ||
      criteria.operators.length > 0 ||
      criteria.wellTypes.length > 0 ||
      criteria.statuses.length > 0
    );
  }, [criteria]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (criteria.searchQuery) count++;
    if (criteria.productionRange.min > 0 || criteria.productionRange.max < 1000) count++;
    if (criteria.wellAge.minYears > 0 || criteria.wellAge.maxYears < 50) count++;
    count += criteria.operators.length;
    count += criteria.wellTypes.length;
    count += criteria.statuses.length;
    return count;
  }, [criteria]);

  return {
    // Data
    filteredWells: sortedWells,
    totalCount: wells.length,
    filteredCount: sortedWells.length,
    criteria,
    searchHistory,
    activePresetId,
    availableOperators,
    hasActiveFilters,
    activeFilterCount,

    // Actions
    setSearchQuery,
    addToSearchHistory,
    setProductionRange,
    setWellAge,
    toggleOperator,
    toggleWellType,
    toggleStatus,
    setSortBy,
    toggleSortOrder,
    resetFilters,
    getSuggestions,
  };
}

/**
 * Filter wells based on criteria
 */
function filterWells(
  wells: readonly Well[],
  criteria: FilterCriteria
): Well[] {
  return wells.filter((well) => {
    // Search query filter
    if (criteria.searchQuery) {
      const query = criteria.searchQuery.toLowerCase();
      const matchesSearch =
        well.wellName.toLowerCase().includes(query) ||
        well.wellId.toLowerCase().includes(query) ||
        well.apiNumber?.toLowerCase().includes(query) ||
        well.operator?.name.toLowerCase().includes(query) ||
        well.location?.county.toLowerCase().includes(query) ||
        well.location?.field.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Production range filter
    const production = well.production?.currentOilBblDay ?? 0;
    if (
      production < criteria.productionRange.min ||
      production > criteria.productionRange.max
    ) {
      return false;
    }

    // Status filter
    if (criteria.statuses.length > 0) {
      const wellStatus = well.status.toLowerCase();
      if (!criteria.statuses.some((s) => s === wellStatus)) {
        return false;
      }
    }

    // Operator filter
    if (criteria.operators.length > 0) {
      if (!well.operator?.name || !criteria.operators.includes(well.operator.name)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort wells by specified field
 */
function sortWells(
  wells: Well[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Well[] {
  const sorted = [...wells].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'production':
        comparison =
          (a.production?.currentOilBblDay ?? 0) -
          (b.production?.currentOilBblDay ?? 0);
        break;

      case 'valuation':
        comparison =
          (a.valuation?.marketValueUsd ?? 0) - (b.valuation?.marketValueUsd ?? 0);
        break;

      case 'discount':
        comparison =
          (a.valuation?.discountPct ?? 0) - (b.valuation?.discountPct ?? 0);
        break;

      case 'name':
        comparison = a.wellName.localeCompare(b.wellName);
        break;

      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export default useFilters;
