/**
 * useDynamicValuation Hook
 * React Query hook for fetching dynamically calculated well valuations
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles dynamic valuation fetching
 * - Dependency Inversion: Depends on getDynamicValuation abstraction
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getDynamicValuation } from '../lib/api';
import type { DynamicValuationResponse } from '../types/api';
import logger from '../lib/logger';

/**
 * Hook for fetching dynamically calculated valuation for a well
 *
 * @param wellId - Well ID to fetch valuation for (null to disable query)
 * @returns React Query result with dynamic valuation data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDynamicValuation('well-123');
 * if (data) {
 *   console.log(data.valuation.npvUsd);
 * }
 * ```
 */
export function useDynamicValuation(
  wellId: string | null
): UseQueryResult<DynamicValuationResponse, Error> {
  return useQuery<DynamicValuationResponse, Error>({
    queryKey: ['dynamic-valuation', wellId],
    queryFn: async () => {
      if (!wellId) {
        throw new Error('Well ID is required');
      }

      logger.info('api', `Fetching dynamic valuation: ${wellId}`);
      const startTime = performance.now();

      try {
        const data = await getDynamicValuation(wellId);
        const duration = performance.now() - startTime;

        logger.logPerformance('Dynamic valuation fetch', duration, 'ms');
        logger.debug('state', 'Dynamic valuation loaded', {
          wellId,
          npvUsd: data.valuation.npvUsd,
          confidence: data.valuation.confidence,
        });

        return data;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error('api', `Failed to fetch dynamic valuation: ${wellId}`, {
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
        });
        throw error;
      }
    },
    enabled: !!wellId, // Only run query if wellId is provided
    staleTime: 1 * 60 * 1000, // 1 minute - dynamic valuations are fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - cache time
  });
}
