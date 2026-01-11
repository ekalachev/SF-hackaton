/**
 * Data Validation Tests
 * Following TDD - tests written first
 */

import { describe, it, expect } from 'vitest';
import {
  validateWellData,
  validateGetWellByIdResponse,
} from './dataValidation';
import type { WellDetail, GetWellByIdResponse } from '../types/api';

describe('validateWellData', () => {
  describe('required fields validation', () => {
    it('should pass validation with all required fields', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      };

      const result = validateWellData(well);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should fail when wellId is missing', () => {
      const well = {
        id: 'well-123',
        wellName: 'Test Well',
        status: 'active',
      } as WellDetail;

      const result = validateWellData(well);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('wellId');
    });

    it('should fail when wellName is missing', () => {
      const well = {
        id: 'well-123',
        wellId: 'API-123',
        status: 'active',
      } as WellDetail;

      const result = validateWellData(well);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('wellName');
    });

    it('should fail when status is missing', () => {
      const well = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
      } as WellDetail;

      const result = validateWellData(well);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('status');
    });
  });

  describe('optional fields warnings', () => {
    it('should warn when location is missing', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      };

      const result = validateWellData(well);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('location');
    });

    it('should warn when production is missing', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      };

      const result = validateWellData(well);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('production');
    });

    it('should warn when valuation is missing', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      };

      const result = validateWellData(well);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('valuation');
    });

    it('should not warn when all optional fields are present', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
        operator: {
          id: 'op-1',
          name: 'Test Operator',
        },
        location: {
          latitude: 32.5,
          longitude: -99.5,
          county: 'Test County',
          field: 'Test Field',
        },
        production: {
          currentOilBblDay: 100,
          currentGasMcfDay: 500,
          cumulativeOilBbl: 10000,
          lastProductionDate: '2025-01-01',
          peakOilBblDay: 200,
          peakDate: '2024-01-01',
        },
        valuation: {
          npvUsd: 500000,
          marketValueUsd: 400000,
          discountPct: 20,
          confidence: 85,
        },
      };

      const result = validateWellData(well);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('operator validation', () => {
    it('should warn when operator is missing', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      };

      const result = validateWellData(well);

      expect(result.warnings).toContain('operator');
    });

    it('should not warn when operator is present', () => {
      const well: WellDetail = {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
        operator: {
          id: 'op-1',
          name: 'Test Operator',
        },
        location: {
          latitude: 32.5,
          longitude: -99.5,
          county: 'Test County',
          field: 'Test Field',
        },
        production: {
          currentOilBblDay: 100,
          currentGasMcfDay: 500,
          cumulativeOilBbl: 10000,
          lastProductionDate: '2025-01-01',
          peakOilBblDay: 200,
          peakDate: '2024-01-01',
        },
        valuation: {
          npvUsd: 500000,
          marketValueUsd: 400000,
          discountPct: 20,
          confidence: 85,
        },
      };

      const result = validateWellData(well);

      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('validateGetWellByIdResponse', () => {
  it('should pass validation with complete response', () => {
    const response: GetWellByIdResponse = {
      well: {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
        operator: {
          id: 'op-1',
          name: 'Test Operator',
        },
        location: {
          latitude: 32.5,
          longitude: -99.5,
          county: 'Test County',
          field: 'Test Field',
        },
        production: {
          currentOilBblDay: 100,
          currentGasMcfDay: 500,
          cumulativeOilBbl: 10000,
          lastProductionDate: '2025-01-01',
          peakOilBblDay: 200,
          peakDate: '2024-01-01',
        },
        valuation: {
          npvUsd: 500000,
          marketValueUsd: 400000,
          discountPct: 20,
          confidence: 85,
        },
      },
      productionHistory: [
        {
          date: '2025-01-01',
          oilBbl: 100,
          gasMcf: 500,
          waterBbl: 50,
          daysProduced: 30,
          oilBblDay: 3.33,
          gasMcfDay: 16.67,
        },
      ],
      latestValuation: {
        npvUsd: 500000,
        marketValueUsd: 400000,
        discountPct: 20,
        confidence: 85,
      },
      operator: {
        id: 'op-1',
        name: 'Test Operator',
      },
    };

    const result = validateGetWellByIdResponse(response);

    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should fail when well is missing', () => {
    const response = {
      productionHistory: [],
      latestValuation: null,
      operator: null,
    } as unknown as GetWellByIdResponse;

    const result = validateGetWellByIdResponse(response);

    expect(result.valid).toBe(false);
    expect(result.missing).toContain('well');
  });

  it('should warn when productionHistory is empty', () => {
    const response: GetWellByIdResponse = {
      well: {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      },
      productionHistory: [],
      latestValuation: null,
      operator: null,
    };

    const result = validateGetWellByIdResponse(response);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('productionHistory');
  });

  it('should warn when latestValuation is null', () => {
    const response: GetWellByIdResponse = {
      well: {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      },
      productionHistory: [
        {
          date: '2025-01-01',
          oilBbl: 100,
          gasMcf: 500,
          waterBbl: 50,
          daysProduced: 30,
          oilBblDay: 3.33,
          gasMcfDay: 16.67,
        },
      ],
      latestValuation: null,
      operator: null,
    };

    const result = validateGetWellByIdResponse(response);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('latestValuation');
  });

  it('should warn when operator is null', () => {
    const response: GetWellByIdResponse = {
      well: {
        id: 'well-123',
        wellId: 'API-123',
        wellName: 'Test Well',
        status: 'active',
      },
      productionHistory: [
        {
          date: '2025-01-01',
          oilBbl: 100,
          gasMcf: 500,
          waterBbl: 50,
          daysProduced: 30,
          oilBblDay: 3.33,
          gasMcfDay: 16.67,
        },
      ],
      latestValuation: {
        npvUsd: 500000,
        marketValueUsd: 400000,
        discountPct: 20,
        confidence: 85,
      },
      operator: null,
    };

    const result = validateGetWellByIdResponse(response);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('operator');
  });

  it('should accumulate well validation issues', () => {
    const response: GetWellByIdResponse = {
      well: {
        id: 'well-123',
        wellId: 'API-123',
        status: 'active',
      } as WellDetail,
      productionHistory: [],
      latestValuation: null,
      operator: null,
    };

    const result = validateGetWellByIdResponse(response);

    expect(result.valid).toBe(false);
    expect(result.missing).toContain('wellName');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
