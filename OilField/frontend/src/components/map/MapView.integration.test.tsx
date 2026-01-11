/**
 * MapView Integration Tests
 * Tests marker rendering with real GeoJSON data
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MapView } from './MapView';
import type { Well } from '@/types/api';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock mapbox-gl with realistic behavior
vi.mock('mapbox-gl', () => {
  const canvasStyle = { cursor: '' };
  const mockSource = {
    setData: vi.fn(),
    getClusterExpansionZoom: vi.fn(),
  };

  const mockMap = {
    on: vi.fn((event: string, layerOrCallback: unknown) => {
      if (typeof layerOrCallback === 'function' && event === 'load') {
        setTimeout(layerOrCallback as () => void, 0);
      }
    }),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn(() => mockSource),
    getCanvas: vi.fn(() => ({ style: canvasStyle })),
    queryRenderedFeatures: vi.fn(() => []),
    easeTo: vi.fn(),
    remove: vi.fn(),
  };

  return {
    default: {
      Map: vi.fn(() => mockMap),
      accessToken: '',
    },
  };
});

// Mock WellDetailModal
vi.mock('@/components/wells/WellDetailModal', () => ({
  WellDetailModal: vi.fn(() => <div data-testid="well-detail-modal">Modal</div>),
}));

// Create MSW server for API mocking
const mockWells: Well[] = [
  {
    id: 'well-1',
    wellId: 'W001',
    wellName: 'Healthy Well 1',
    status: 'active',
    location: {
      latitude: 32.4487,
      longitude: -95.301,
      county: 'Smith',
      field: 'East Texas',
    },
    production: {
      currentOilBblDay: 100,
      currentGasMcfDay: 200,
      cumulativeOilBbl: 500000,
      lastProductionDate: '2024-09-30',
      peakOilBblDay: 300,
      peakDate: '2023-01-01',
    },
    valuation: {
      npvUsd: 150000, // Healthy
      marketValueUsd: 180000,
      discountPct: 25,
      confidence: 0.8,
    },
  },
  {
    id: 'well-2',
    wellId: 'W002',
    wellName: 'Moderate Well 1',
    status: 'active',
    location: {
      latitude: 29.7604,
      longitude: -95.3698,
      county: 'Harris',
      field: 'Houston',
    },
    production: {
      currentOilBblDay: 50,
      currentGasMcfDay: 100,
      cumulativeOilBbl: 250000,
      lastProductionDate: '2024-09-30',
      peakOilBblDay: 150,
      peakDate: '2023-01-01',
    },
    valuation: {
      npvUsd: 75000, // Moderate
      marketValueUsd: 90000,
      discountPct: 15,
      confidence: 0.7,
    },
  },
  {
    id: 'well-3',
    wellId: 'W003',
    wellName: 'Concerning Well 1',
    status: 'active',
    location: {
      latitude: 31.0,
      longitude: -100.0,
      county: 'Midland',
      field: 'Permian Basin',
    },
    production: {
      currentOilBblDay: 20,
      currentGasMcfDay: 40,
      cumulativeOilBbl: 100000,
      lastProductionDate: '2024-09-30',
      peakOilBblDay: 80,
      peakDate: '2023-01-01',
    },
    valuation: {
      npvUsd: 25000, // Concerning
      marketValueUsd: 30000,
      discountPct: 10,
      confidence: 0.5,
    },
  },
];

const server = setupServer(
  http.get('http://localhost:3001/api/wells', () => {
    return HttpResponse.json({
      wells: mockWells,
      total: mockWells.length,
      limit: 500,
      offset: 0,
      hasMore: false,
    });
  })
);

describe('MapView Integration Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeAll(() => {
    server.listen();
    import.meta.env.VITE_MAPBOX_TOKEN = 'test-token';
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  it('should render all wells from API', async () => {
    render(<MapView />, { wrapper });

    // Wait for map container
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Wait for source to be updated with data
    const mapboxgl = await import('mapbox-gl');
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapInstance = (mapboxgl.default.Map as any).mock.results[0].value;
      const source = mapInstance.getSource('wells');
      expect(source.setData).toHaveBeenCalled();
    });
  });

  it('should handle wells without complete data gracefully', async () => {
    // Override mock to return well with missing data
    server.use(
      http.get('http://localhost:3001/api/wells', () => {
        return HttpResponse.json({
          wells: [
            {
              id: 'invalid-well',
              wellId: 'INV-001',
              wellName: 'Invalid Well - No Location',
              status: 'active',
              // Missing location, production, valuation
            },
            mockWells[0], // One valid well
          ],
          total: 2,
          limit: 500,
          offset: 0,
          hasMore: false,
        });
      })
    );

    render(<MapView />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Should still render map without crashing
    const mapboxgl = await import('mapbox-gl');
    await waitFor(() => {
      expect(mapboxgl.default.Map).toHaveBeenCalled();
    });
  });

  it('should apply correct color coding based on NPV', async () => {
    render(<MapView />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Wait for layers to be added
    const mapboxgl = await import('mapbox-gl');
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapInstance = (mapboxgl.default.Map as any).mock.results[0].value;
      expect(mapInstance.addLayer).toHaveBeenCalled();
    });

    // Verify unclustered-point layer has color coding
    const MapConstructor = mapboxgl.default.Map as unknown as { mock: { results: Array<{ value: ReturnType<typeof vi.fn> }> } };
    const mapInstance = MapConstructor.mock.results[0].value;
    const layerCalls = mapInstance.addLayer.mock.calls;
    const unclusteredLayer = layerCalls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0].id === 'unclustered-point'
    );

    expect(unclusteredLayer).toBeDefined();
    expect(unclusteredLayer[0].paint['circle-color']).toEqual([
      'match',
      ['get', 'valuationCategory'],
      'undervalued',
      '#10b981',
      'fair',
      '#f59e0b',
      'overvalued',
      '#ef4444',
      '#94a3b8',
    ]);
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get('http://localhost:3001/api/wells', () => {
        return HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    render(<MapView />, { wrapper });

    // Should still render map container
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Map should initialize even with error
    const mapboxgl = await import('mapbox-gl');
    await waitFor(() => {
      expect(mapboxgl.default.Map).toHaveBeenCalled();
    });
  });

  it('should handle empty wells array', async () => {
    server.use(
      http.get('http://localhost:3001/api/wells', () => {
        return HttpResponse.json({
          wells: [],
          total: 0,
          limit: 500,
          offset: 0,
          hasMore: false,
        });
      })
    );

    render(<MapView />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Should still render map with empty data
    const mapboxgl = await import('mapbox-gl');
    await waitFor(() => {
      const MapConstructor = mapboxgl.default.Map as unknown as { mock: { results: Array<{ value: ReturnType<typeof vi.fn> }> } };
      const mapInstance = MapConstructor.mock.results[0].value;
      const source = mapInstance.getSource('wells');
      expect(source.setData).toHaveBeenCalled();
    });
  });

  it('should categorize wells by health status', async () => {
    const logger = await import('@/lib/logger');

    render(<MapView />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Wait for categorization to be logged
    await waitFor(() => {
      expect(logger.default.info).toHaveBeenCalledWith(
        'state',
        'Wells categorized',
        expect.objectContaining({
          healthy: 1,
          moderate: 1,
          concerning: 1,
          total: 3,
        })
      );
    });
  });

  it('should validate wells data for map rendering', async () => {
    const logger = await import('@/lib/logger');

    render(<MapView />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Wait for validation logs
    await waitFor(() => {
      expect(logger.default.info).toHaveBeenCalledWith(
        'validation',
        'Map validation complete',
        expect.objectContaining({
          totalWells: 3,
          validCoordinates: 3,
          invalidCoordinates: 0,
        })
      );
    });
  });
});
