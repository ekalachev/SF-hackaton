/**
 * useWellDetail Hook
 * React Query hook for fetching well detail data
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles well detail fetching
 * - Dependency Inversion: Depends on getWellById abstraction
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getWellById } from '../lib/api';
import type { GetWellByIdResponse } from '../types/api';
import logger from '../lib/logger';
import { validateGetWellByIdResponse } from '../utils/dataValidation';

/**
 * Hook for fetching well details by ID
 *
 * @param wellId - Well ID to fetch (null to disable query)
 * @returns React Query result with well detail data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWellDetail('well-123');
 * ```
 */
export function useWellDetail(
  wellId: string | null
): UseQueryResult<GetWellByIdResponse, Error> {
  return useQuery<GetWellByIdResponse, Error>({
    queryKey: ['well', wellId],
    queryFn: async () => {
      if (!wellId) {
        throw new Error('Well ID is required');
      }

      logger.info('api', `Fetching well details: ${wellId}`);
      const startTime = performance.now();

      try {
        const data = await getWellById(wellId);
        const duration = performance.now() - startTime;

        logger.logPerformance('Well detail fetch', duration, 'ms');
        logger.debug('state', 'Well detail loaded', {
          wellId,
          hasProduction: data.productionHistory?.length > 0,
          hasValuation: !!data.latestValuation,
          hasOperator: !!data.operator,
        });

        // Validate data completeness
        const validation = validateGetWellByIdResponse(data);
        if (!validation.valid) {
          logger.warn('api', 'Incomplete well data received', {
            wellId,
            missing: validation.missing,
          });
        }
        if (validation.warnings.length > 0) {
          logger.debug('api', 'Optional well data missing', {
            wellId,
            warnings: validation.warnings,
          });
        }

        return data;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error('api', `Failed to fetch well details: ${wellId}`, {
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
        });
        throw error;
      }
    },
    enabled: !!wellId, // Only run query if wellId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time
  });
}
