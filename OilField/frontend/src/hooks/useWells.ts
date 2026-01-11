/**
 * useWells Hook
 * React Query hook for fetching wells list
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles wells list fetching
 * - Dependency Inversion: Depends on getWells abstraction
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getWells } from '../lib/api';
import type { GetWellsResponse, WellFilters } from '../types/api';

/**
 * Hook for fetching wells with optional filters
 *
 * @param filters - Optional query parameters for filtering/sorting
 * @returns React Query result with wells data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWells({ limit: 10 });
 * ```
 */
export function useWells(
  filters: WellFilters = {}
): UseQueryResult<GetWellsResponse, Error> {
  return useQuery<GetWellsResponse, Error>({
    queryKey: ['wells', filters],
    queryFn: () => getWells(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
  });
}
