/**
 * SMT Verification Service
 * API client for interacting with the SMT verification service
 *
 * Following SOLID principles:
 * - Single Responsibility: Handles only SMT service communication
 * - Open/Closed: Easy to extend with new endpoints
 * - Dependency Inversion: Exports typed functions for consumers
 */

import type { SMTVerificationRequest, SMTVerificationResult, SMTServiceConfig } from '../types/smt';
import logger from './logger';

/**
 * SMT Service configuration
 * Uses backend proxy to avoid CORS issues
 */
export const SMT_SERVICE_CONFIG: SMTServiceConfig = {
  baseUrl: '/api/smt',
  timeout: 120000, // 2 minutes
};

/**
 * Verify claims using SMT solver
 *
 * @param informalText - Natural language text containing constraints to verify
 * @returns Promise with verification result
 * @throws Error if verification fails or service is unavailable
 *
 * @example
 * ```typescript
 * const result = await verifyClaims('NPV must be greater than 0');
 * if (result.is_satisfiable) {
 *   console.log('Constraints are satisfiable');
 * }
 * ```
 */
export async function verifyClaims(informalText: string): Promise<SMTVerificationResult> {
  // Validate input
  if (!informalText || informalText.trim() === '') {
    throw new Error('Informal text is required');
  }

  const startTime = performance.now();
  logger.info('api', 'Starting SMT verification');

  const request: SMTVerificationRequest = {
    informal_text: informalText,
  };

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SMT_SERVICE_CONFIG.timeout);

  try {
    const response = await fetch(`${SMT_SERVICE_CONFIG.baseUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`SMT verification failed: ${response.status} ${response.statusText}`);
    }

    const result: SMTVerificationResult = await response.json();
    const duration = performance.now() - startTime;

    logger.logPerformance('SMT verification', duration, 'ms');
    logger.info('state', 'SMT verification completed', {
      is_satisfiable: result.is_satisfiable,
      status: result.status,
      duration: `${Math.round(duration)}ms`,
    });

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = performance.now() - startTime;

    logger.error('api', 'SMT verification failed', {
      error: error instanceof Error ? error.message : String(error),
      duration: `${Math.round(duration)}ms`,
    });

    throw error;
  }
}

/**
 * Check SMT service health
 *
 * @returns Promise resolving to true if service is healthy, false otherwise
 *
 * @example
 * ```typescript
 * const isHealthy = await checkHealth();
 * if (!isHealthy) {
 *   console.warn('SMT service is unavailable');
 * }
 * ```
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

    const response = await fetch(`${SMT_SERVICE_CONFIG.baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response.ok;
  } catch (error) {
    logger.warn('api', 'SMT health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get example inputs from SMT service
 *
 * @returns Promise with array of example inputs
 * @throws Error if fetching examples fails
 *
 * @example
 * ```typescript
 * const examples = await getExamples();
 * console.log(examples);
 * ```
 */
export async function getExamples(): Promise<unknown[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/examples`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch examples: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Generate verification text from investment analysis data
 *
 * @param wellName - Name of the well
 * @param valuation - Valuation data object
 * @param markdownReport - AI-generated markdown report
 * @returns Formatted text for SMT verification
 */
export function generateVerificationText(
  wellName: string,
  valuation: {
    npvUsd: number;
    marketValueUsd: number;
    discountPct: number;
    confidence: number;
    remainingReservesBbl?: number;
  },
  _markdownReport: string
): string {
  // Note: We don't include the full markdown report as it's too long for SMT verification.
  // Instead, we verify the structured valuation data constraints.
  return `
Investment Analysis Verification for ${wellName}

Given values:
- NPV = ${valuation.npvUsd}
- MarketValue = ${valuation.marketValueUsd}
- Discount = ${valuation.discountPct}
- Confidence = ${valuation.confidence}
- RemainingReserves = ${valuation.remainingReservesBbl || 0}

Constraints to verify:
1. NPV >= 0 (non-negative)
2. MarketValue >= 0 (non-negative)
3. Confidence >= 0.75 AND Confidence <= 0.95
4. RemainingReserves >= 0
5. IF Discount > 0 THEN NPV > MarketValue (undervalued asset)
  `.trim();
}
