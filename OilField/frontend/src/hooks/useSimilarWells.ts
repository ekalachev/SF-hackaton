/**
 * useSimilarWells Hook
 * React Query hook for fetching similar wells
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles similar wells fetching
 * - Dependency Inversion: Depends on getSimilarWells abstraction
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getSimilarWells } from '../lib/api';
import type { GetSimilarWellsResponse } from '../types/api';

/**
 * Options for similar wells query
 */
export interface SimilarWellsOptions {
  limit?: number;
  threshold?: number;
}

/**
 * Hook for fetching wells similar to a specific well
 *
 * @param wellId - Well ID to find similar wells for (null to disable query)
 * @param options - Optional parameters (limit, threshold)
 * @returns React Query result with similar wells data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSimilarWells('well-123', { limit: 5 });
 * ```
 */
export function useSimilarWells(
  wellId: string | null,
  options: SimilarWellsOptions = {}
): UseQueryResult<GetSimilarWellsResponse, Error> {
  return useQuery<GetSimilarWellsResponse, Error>({
    queryKey: ['similar-wells', wellId, options],
    queryFn: () => {
      if (!wellId) {
        throw new Error('Well ID is required');
      }
      return getSimilarWells(wellId, options);
    },
    enabled: !!wellId, // Only run query if wellId is provided
    staleTime: 10 * 60 * 1000, // 10 minutes - similarity data changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - cache time
  });
}
