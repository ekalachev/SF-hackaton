/**
 * Well Color Coding Utilities
 * Color codes wells based on NPV (Net Present Value) thresholds
 * Following SOLID principles - Single Responsibility for color logic
 */

import type { Well } from '@/types/api';
import logger from '@/lib/logger';

/**
 * Configuration for well color coding thresholds
 */
export interface WellColorConfig {
  healthy: { threshold: number; color: string };
  moderate: { threshold: number; color: string };
  concerning: { color: string };
}

/**
 * Default color configuration based on NPV
 * - Green: NPV >= $100k (healthy)
 * - Yellow: NPV >= $50k (moderate)
 * - Red: NPV < $50k (concerning)
 */
export const defaultColorConfig: WellColorConfig = {
  healthy: { threshold: 100000, color: '#10b981' }, // green-500
  moderate: { threshold: 50000, color: '#f59e0b' }, // amber-500
  concerning: { color: '#ef4444' }, // red-500
};

/**
 * Get color for a well based on its NPV
 *
 * @param well - Well to get color for
 * @param config - Optional custom color configuration
 * @returns Hex color code
 *
 * @example
 * ```ts
 * const color = getWellColor(well); // '#10b981' for healthy well
 * ```
 */
export function getWellColor(
  well: Well,
  config: WellColorConfig = defaultColorConfig
): string {
  const npv = well.valuation?.npvUsd ?? 0;

  let color: string;
  if (npv >= config.healthy.threshold) {
    color = config.healthy.color;
  } else if (npv >= config.moderate.threshold) {
    color = config.moderate.color;
  } else {
    color = config.concerning.color;
  }

  logger.debug('ui', `Well ${well.id} color: ${color}`, { npv, wellId: well.wellId });

  return color;
}

/**
 * Categorized wells by NPV health status
 */
export interface CategorizedWells {
  healthy: Well[];
  moderate: Well[];
  concerning: Well[];
}

/**
 * Categorize wells into healthy, moderate, and concerning groups
 *
 * @param wells - Array of wells to categorize
 * @returns Object with categorized well arrays
 *
 * @example
 * ```ts
 * const { healthy, moderate, concerning } = categorizeWells(wells);
 * console.log(`${healthy.length} healthy wells`);
 * ```
 */
export function categorizeWells(wells: Well[]): CategorizedWells {
  const categorized: CategorizedWells = {
    healthy: wells.filter((w) => (w.valuation?.npvUsd ?? 0) >= 100000),
    moderate: wells.filter((w) => {
      const npv = w.valuation?.npvUsd ?? 0;
      return npv >= 50000 && npv < 100000;
    }),
    concerning: wells.filter((w) => (w.valuation?.npvUsd ?? 0) < 50000),
  };

  logger.info('state', 'Wells categorized', {
    healthy: categorized.healthy.length,
    moderate: categorized.moderate.length,
    concerning: categorized.concerning.length,
    total: wells.length,
  });

  return categorized;
}
