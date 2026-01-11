/**
 * Mock Data Factories for Testing
 * Provides realistic test data for API responses
 *
 * Following SOLID principles:
 * - Single Responsibility: Each factory creates one type of data
 * - DRY: Reusable factory functions
 */

import type {
  Well,
  WellDetail,
  Operator,
  Location,
  Production,
  Valuation,
  ProductionHistoryEntry,
  SimilarWell,
  GetWellsResponse,
  GetWellByIdResponse,
  GetSimilarWellsResponse,
} from '../../types/api';

/**
 * Create a mock operator
 */
export function createMockOperator(overrides?: Partial<Operator>): Operator {
  return {
    id: 'op-123',
    name: 'Test Oil Company',
    operatorNumber: 'OP-001',
    address: '123 Main St, Houston, TX',
    ...overrides,
  };
}

/**
 * Create a mock location
 */
export function createMockLocation(overrides?: Partial<Location>): Location {
  return {
    latitude: 28.5,
    longitude: -99.5,
    county: 'WEBB',
    field: 'EAGLE FORD',
    ...overrides,
  };
}

/**
 * Create mock production data
 */
export function createMockProduction(overrides?: Partial<Production>): Production {
  return {
    currentOilBblDay: 100,
    currentGasMcfDay: 500,
    cumulativeOilBbl: 50000,
    lastProductionDate: '2024-01-15',
    peakOilBblDay: 250,
    peakDate: '2023-06-01',
    ...overrides,
  };
}

/**
 * Create mock valuation data
 */
export function createMockValuation(overrides?: Partial<Valuation>): Valuation {
  return {
    npvUsd: 500000,
    marketValueUsd: 450000,
    discountPct: 10,
    confidence: 0.85,
    remainingReservesBbl: 25000,
    ...overrides,
  };
}

/**
 * Create a mock well
 */
export function createMockWell(overrides?: Partial<Well>): Well {
  const id = overrides?.id || 'well-123';
  return {
    id,
    wellId: `W-${id}`,
    wellName: 'Test Well #1',
    apiNumber: 'API-12345',
    operator: createMockOperator(),
    location: createMockLocation(),
    status: 'active',
    production: createMockProduction(),
    valuation: createMockValuation(),
    nftTokenId: null,
    tags: ['high-production', 'premium'],
    ...overrides,
  };
}

/**
 * Create a mock well detail
 */
export function createMockWellDetail(overrides?: Partial<WellDetail>): WellDetail {
  return {
    ...createMockWell(overrides),
    completionDate: '2022-03-15',
    totalDepthFt: 12500,
    ...overrides,
  };
}

/**
 * Create mock production history entry
 */
export function createMockProductionHistoryEntry(
  overrides?: Partial<ProductionHistoryEntry>
): ProductionHistoryEntry {
  return {
    date: '2024-01-01',
    oilBbl: 3000,
    gasMcf: 15000,
    waterBbl: 500,
    daysProduced: 30,
    oilBblDay: 100,
    gasMcfDay: 500,
    ...overrides,
  };
}

/**
 * Create mock production history (6 months)
 */
export function createMockProductionHistory(count = 6): ProductionHistoryEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date('2024-01-01');
    date.setMonth(date.getMonth() - i);
    return createMockProductionHistoryEntry({
      date: date.toISOString().split('T')[0],
      oilBblDay: 100 - i * 5, // Declining production
    });
  });
}

/**
 * Create a mock similar well
 */
export function createMockSimilarWell(overrides?: Partial<SimilarWell>): SimilarWell {
  return {
    well: createMockWell({ id: 'similar-well-1', wellName: 'Similar Well #1' }),
    similarity: 0.85,
    reason: 'Similar production profile',
    matchReasons: ['Same county', 'Similar depth', 'Similar production'],
    ...overrides,
  };
}

/**
 * Create mock wells response
 */
export function createMockGetWellsResponse(
  overrides?: Partial<GetWellsResponse>
): GetWellsResponse {
  const wells = overrides?.wells || [
    createMockWell({ id: 'well-1', wellName: 'Well #1' }),
    createMockWell({ id: 'well-2', wellName: 'Well #2' }),
    createMockWell({ id: 'well-3', wellName: 'Well #3' }),
  ];

  return {
    wells,
    total: wells.length,
    limit: 10,
    offset: 0,
    hasMore: false,
    ...overrides,
  };
}

/**
 * Create mock well detail response
 */
export function createMockGetWellByIdResponse(
  overrides?: Partial<GetWellByIdResponse>
): GetWellByIdResponse {
  return {
    well: createMockWellDetail(),
    productionHistory: createMockProductionHistory(),
    latestValuation: createMockValuation(),
    operator: createMockOperator(),
    ...overrides,
  };
}

/**
 * Create mock similar wells response
 */
export function createMockGetSimilarWellsResponse(
  overrides?: Partial<GetSimilarWellsResponse>
): GetSimilarWellsResponse {
  return {
    targetWell: {
      id: 'well-123',
      wellId: 'W-well-123',
      wellName: 'Test Well #1',
    },
    similarWells: [
      createMockSimilarWell({ similarity: 0.95 }),
      createMockSimilarWell({
        well: createMockWell({ id: 'similar-well-2', wellName: 'Similar Well #2' }),
        similarity: 0.87,
      }),
      createMockSimilarWell({
        well: createMockWell({ id: 'similar-well-3', wellName: 'Similar Well #3' }),
        similarity: 0.75,
      }),
    ],
    ...overrides,
  };
}
