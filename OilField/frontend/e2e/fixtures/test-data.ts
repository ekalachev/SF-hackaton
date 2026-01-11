/**
 * Test fixtures and data for E2E tests
 * Following DRY principle - centralized test data
 */

export const TEST_WELLS = {
  WELL_1: {
    id: 'well-001',
    wellName: 'Test Well #1',
    wellId: 'TX-12345',
    status: 'active',
    location: {
      county: 'Midland',
      field: 'Permian Basin',
      latitude: 31.9973,
      longitude: -102.0779,
    },
    production: {
      currentOilBblDay: 150,
      currentGasMcfDay: 300,
      peakOilBblDay: 200,
      cumulativeOilBbl: 50000,
    },
    valuation: {
      npvUsd: 2500000,
      marketValueUsd: 2000000,
      discountPct: 25,
      confidence: 85,
      remainingReservesBbl: 30000,
    },
  },
  WELL_2: {
    id: 'well-002',
    wellName: 'Test Well #2',
    wellId: 'TX-67890',
    status: 'active',
    location: {
      county: 'Midland',
      field: 'Permian Basin',
      latitude: 32.0,
      longitude: -102.1,
    },
  },
};

export const MOCK_PRODUCTION_HISTORY = [
  { month: '2023-01', oilBblDay: 180, gasMcfDay: 360 },
  { month: '2023-02', oilBblDay: 175, gasMcfDay: 350 },
  { month: '2023-03', oilBblDay: 170, gasMcfDay: 340 },
  { month: '2023-04', oilBblDay: 165, gasMcfDay: 330 },
  { month: '2023-05', oilBblDay: 160, gasMcfDay: 320 },
  { month: '2023-06', oilBblDay: 155, gasMcfDay: 310 },
  { month: '2023-07', oilBblDay: 150, gasMcfDay: 300 },
];

export const MOCK_SIMILAR_WELLS = {
  similarWells: [
    {
      well: {
        id: 'similar-001',
        wellName: 'Similar Well #1',
        wellId: 'TX-11111',
        production: {
          currentOilBblDay: 145,
        },
        valuation: {
          discountPct: 20,
        },
      },
      similarity: 0.92,
      matchReasons: [
        'Similar production profile',
        'Same geological formation',
        'Comparable well age',
      ],
    },
    {
      well: {
        id: 'similar-002',
        wellName: 'Similar Well #2',
        wellId: 'TX-22222',
        production: {
          currentOilBblDay: 140,
        },
        valuation: {
          discountPct: 22,
        },
      },
      similarity: 0.88,
      matchReasons: [
        'Similar decline curve',
        'Adjacent location',
      ],
    },
  ],
};

export const API_ENDPOINTS = {
  WELLS: '/api/wells',
  WELL_DETAIL: (id: string) => `/api/wells/${id}`,
  PRODUCTION_HISTORY: (id: string) => `/api/wells/${id}/production-history`,
  SIMILAR_WELLS: (id: string) => `/api/wells/${id}/similar`,
  VALUATIONS: (id: string) => `/api/wells/${id}/valuations`,
};

export const VIEWPORTS = {
  DESKTOP: { width: 1920, height: 1080 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
};

export const TIMEOUTS = {
  MAP_LOAD: 5000,
  API_RESPONSE: 3000,
  ANIMATION: 500,
  MODAL_OPEN: 2000,
};
