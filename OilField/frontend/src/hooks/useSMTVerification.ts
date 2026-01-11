/**
 * useSMTVerification Hook
 * React Query hook for SMT verification requests
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles SMT verification state
 * - Dependency Inversion: Depends on verifyClaims abstraction
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { verifyClaims } from '../lib/smtService';
import type { VerificationState, SMTVerificationResult } from '../types/smt';
import logger from '../lib/logger';

/**
 * Return type for useSMTVerification hook
 */
export interface UseSMTVerificationReturn {
  /**
   * Current verification state
   */
  verificationState: VerificationState;

  /**
   * Trigger verification with given text
   */
  verify: (informalText: string) => void;

  /**
   * Reset verification state
   */
  reset: () => void;
}

/**
 * Hook for SMT verification of claims
 *
 * @returns Object with verification state and control functions
 *
 * @example
 * ```tsx
 * const { verificationState, verify, reset } = useSMTVerification();
 *
 * // Trigger verification
 * verify('NPV must be non-negative');
 *
 * // Check state
 * if (verificationState.isVerifying) {
 *   return <Spinner />;
 * }
 *
 * if (verificationState.result?.is_satisfiable) {
 *   return <Badge color="green">Verified</Badge>;
 * }
 * ```
 */
export function useSMTVerification(): UseSMTVerificationReturn {
  const queryClient = useQueryClient();
  const [currentText, setCurrentText] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SMTVerificationResult, Error>({
    queryKey: ['smt-verification', currentText],
    queryFn: async (): Promise<SMTVerificationResult> => {
      if (!currentText) {
        throw new Error('No text to verify');
      }

      logger.info('api', 'Starting SMT verification via hook');
      const startTime = performance.now();

      try {
        const result = await verifyClaims(currentText);
        const duration = performance.now() - startTime;

        logger.logPerformance('SMT verification (hook)', duration, 'ms');
        logger.info('state', 'SMT verification completed via hook', {
          is_satisfiable: result.is_satisfiable,
          status: result.status,
        });

        return result;
      } catch (err) {
        logger.error('api', 'SMT verification failed via hook', {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    enabled: !!currentText,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache results
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry on failure
  });

  const verify = useCallback((informalText: string): void => {
    logger.info('ui', 'User triggered SMT verification');
    setCurrentText(informalText);
    // If we already have this text set, force refetch
    if (currentText === informalText) {
      void refetch();
    }
  }, [currentText, refetch]);

  const reset = useCallback((): void => {
    logger.info('ui', 'User reset SMT verification');
    setCurrentText(null);
    // Invalidate all SMT verification queries
    void queryClient.invalidateQueries({ queryKey: ['smt-verification'] });
  }, [queryClient]);

  const verificationState: VerificationState = {
    isVerifying: isLoading,
    result: data ?? null,
    error: error?.message ?? null,
  };

  return {
    verificationState,
    verify,
    reset,
  };
}
