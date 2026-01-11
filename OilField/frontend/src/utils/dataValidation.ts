/**
 * Data Validation Utilities
 * Following SOLID principles:
 * - Single Responsibility: Only validates data completeness
 * - Open/Closed: Extensible for new validation rules
 */

import type { WellDetail, GetWellByIdResponse } from '../types/api';

/**
 * Result of data validation
 */
export interface ValidationResult {
  /** Whether all required fields are present */
  valid: boolean;
  /** List of missing required fields */
  missing: string[];
  /** List of missing optional but expected fields */
  warnings: string[];
}

/**
 * Validates well data for completeness
 * Checks both required fields (must be present) and optional fields (nice to have)
 *
 * @param well - Well data to validate
 * @returns Validation result with missing fields and warnings
 *
 * @example
 * ```typescript
 * const result = validateWellData(well);
 * if (!result.valid) {
 *   console.error('Missing required fields:', result.missing);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Missing optional fields:', result.warnings);
 * }
 * ```
 */
export function validateWellData(well: WellDetail): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
  };

  // Required fields - MUST be present for basic functionality
  if (!well.wellId) {
    result.missing.push('wellId');
  }
  if (!well.wellName) {
    result.missing.push('wellName');
  }
  if (!well.status) {
    result.missing.push('status');
  }

  // Optional but expected fields - UI sections may not render
  if (!well.location) {
    result.warnings.push('location');
  }
  if (!well.production) {
    result.warnings.push('production');
  }
  if (!well.valuation) {
    result.warnings.push('valuation');
  }
  if (!well.operator) {
    result.warnings.push('operator');
  }

  result.valid = result.missing.length === 0;
  return result;
}

/**
 * Validates GetWellByIdResponse for completeness
 * Checks the entire API response structure
 *
 * @param response - API response to validate
 * @returns Validation result with missing fields and warnings
 *
 * @example
 * ```typescript
 * const response = await getWellById(wellId);
 * const validation = validateGetWellByIdResponse(response);
 * if (!validation.valid) {
 *   logger.error('Invalid API response', validation);
 * }
 * ```
 */
export function validateGetWellByIdResponse(
  response: GetWellByIdResponse
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
  };

  // Validate well data
  if (!response.well) {
    result.missing.push('well');
    result.valid = false;
  } else {
    const wellValidation = validateWellData(response.well);
    result.missing.push(...wellValidation.missing);
    result.warnings.push(...wellValidation.warnings);
    if (!wellValidation.valid) {
      result.valid = false;
    }
  }

  // Check for production history
  if (!response.productionHistory || response.productionHistory.length === 0) {
    result.warnings.push('productionHistory');
  }

  // Check for valuation
  if (!response.latestValuation) {
    result.warnings.push('latestValuation');
  }

  // Check for operator
  if (!response.operator) {
    result.warnings.push('operator');
  }

  return result;
}
