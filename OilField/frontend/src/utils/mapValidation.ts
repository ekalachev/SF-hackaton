/**
 * Map Validation Utilities
 * Validates well data for map rendering
 * Following SOLID principles - Single Responsibility for validation logic
 */

import type { Well } from '@/types/api';
import logger from '@/lib/logger';

/**
 * Result of map validation
 */
export interface MapValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalWells: number;
    validCoordinates: number;
    invalidCoordinates: number;
    duplicatePositions: number;
  };
}

/**
 * Texas geographic bounds for validation
 * Based on approximate state boundaries
 */
const TEXAS_BOUNDS = {
  minLatitude: 25, // Southern tip
  maxLatitude: 37, // Northern panhandle
  minLongitude: -107, // Western border
  maxLongitude: -93, // Eastern border
};

/**
 * Validate wells for map rendering
 * Checks coordinates, detects duplicates, and validates bounds
 *
 * @param wells - Array of wells to validate
 * @returns Validation result with errors, warnings, and statistics
 *
 * @example
 * ```ts
 * const result = validateWellsForMap(wells);
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateWellsForMap(wells: Well[]): MapValidationResult {
  const result: MapValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalWells: wells.length,
      validCoordinates: 0,
      invalidCoordinates: 0,
      duplicatePositions: 0,
    },
  };

  const positionSet = new Set<string>();

  wells.forEach((well, index) => {
    const latitude = well.location?.latitude;
    const longitude = well.location?.longitude;

    // Check if coordinates exist
    if (latitude === undefined || longitude === undefined) {
      result.errors.push(`Well ${well.id} (index ${index}) missing coordinates`);
      result.stats.invalidCoordinates++;
      result.valid = false;
    } else {
      result.stats.validCoordinates++;

      // Check for duplicate positions
      const posKey = `${latitude},${longitude}`;
      if (positionSet.has(posKey)) {
        result.warnings.push(`Well ${well.id} has duplicate position: ${posKey}`);
        result.stats.duplicatePositions++;
      }
      positionSet.add(posKey);

      // Validate latitude bounds
      if (latitude < TEXAS_BOUNDS.minLatitude || latitude > TEXAS_BOUNDS.maxLatitude) {
        result.warnings.push(
          `Well ${well.id} latitude ${latitude} outside Texas range (${TEXAS_BOUNDS.minLatitude}-${TEXAS_BOUNDS.maxLatitude})`
        );
      }

      // Validate longitude bounds
      if (longitude < TEXAS_BOUNDS.minLongitude || longitude > TEXAS_BOUNDS.maxLongitude) {
        result.warnings.push(
          `Well ${well.id} longitude ${longitude} outside Texas range (${TEXAS_BOUNDS.minLongitude}-${TEXAS_BOUNDS.maxLongitude})`
        );
      }
    }
  });

  // Log validation results
  logger.info('system', 'Map validation complete', result.stats);

  if (result.errors.length > 0) {
    logger.error('system', `Map validation failed: ${result.errors.length} errors`, {
      errors: result.errors,
    });
  }

  if (result.warnings.length > 0) {
    logger.warn('system', `Map validation warnings: ${result.warnings.length}`, {
      warnings: result.warnings,
    });
  }

  return result;
}
