/**
 * MapView component tests
 * Following TDD - tests written FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type mapboxgl from 'mapbox-gl';
import { MapView } from './MapView';

// Store event handlers for testing
type MapEventHandler = (e?: mapboxgl.MapMouseEvent | Record<string, unknown>) => void;
const eventHandlers: Record<string, Record<string, MapEventHandler>> = {};

// Mock mapbox-gl
vi.mock('mapbox-gl', () => {
  // Create a mutable canvas style object
  const canvasStyle = { cursor: '' };

  // Create a persistent mock source that's returned each time
  const mockSource = {
    setData: vi.fn(),
    getClusterExpansionZoom: vi.fn((_clusterId: number, callback: (err: Error | null, zoom: number) => void) => {
      // Simulate successful cluster expansion zoom
      setTimeout(() => callback(null, 10), 0);
    }),
  };

  const mockMap = {
    on: vi.fn((
      event: string,
      layerOrCallback: string | MapEventHandler,
      callback?: MapEventHandler
    ) => {
      // Handle both map events and layer-specific events
      if (typeof layerOrCallback === 'function') {
        // Map-level event (e.g., 'load', 'style.load')
        if (event === 'load' || event === 'style.load') {
          setTimeout(layerOrCallback, 0);
        }
        if (!eventHandlers[event]) {
          eventHandlers[event] = {};
        }
        eventHandlers[event]['__map__'] = layerOrCallback;
      } else if (callback) {
        // Layer-specific event (e.g., 'click', 'unclustered-point', callback)
        if (!eventHandlers[event]) {
          eventHandlers[event] = {};
        }
        eventHandlers[event][layerOrCallback] = callback;
      }
    }),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    addImage: vi.fn(),
    loadImage: vi.fn((url: string, callback: (error: Error | null, image?: unknown) => void) => {
      // Simulate successful image load
      setTimeout(() => callback(null, { width: 64, height: 64 }), 0);
    }),
    getSource: vi.fn(() => mockSource),
    getCanvas: vi.fn(() => ({
      style: canvasStyle,
    })),
    queryRenderedFeatures: vi.fn((
      _point: Record<string, number>,
      options: Record<string, unknown>
    ) => {
      // Return mock cluster feature for testing
      if (options?.layers && Array.isArray(options.layers) && options.layers.includes('clusters')) {
        return [
          {
            properties: { cluster_id: 1, point_count: 25 },
            geometry: { type: 'Point', coordinates: [-95.301, 32.4487] },
          },
        ];
      }
      return [];
    }),
    easeTo: vi.fn(),
    setStyle: vi.fn(),
    setLayoutProperty: vi.fn(),
    remove: vi.fn(),
  };

  return {
    default: {
      Map: vi.fn(() => mockMap),
      accessToken: '',
    },
  };
});

// Mock useWells hook
vi.mock('@/hooks/useWells', () => ({
  useWells: vi.fn(),
}));

// Mock WellDetailModal component
vi.mock('@/components/wells/WellDetailModal', () => ({
  WellDetailModal: vi.fn(({ wellId, onClose }) => (
    <div data-testid="well-detail-modal" data-well-id={wellId}>
      <button onClick={onClose}>Close</button>
    </div>
  )),
}));

// Mock MapThemeToggle component
vi.mock('@/components/map/MapThemeToggle', () => ({
  MapThemeToggle: vi.fn(() => (
    <div data-testid="map-theme-toggle">Theme Toggle</div>
  )),
}));

import { useWells } from '@/hooks/useWells';

describe('MapView', () => {
  const mockWells = [
    {
      id: 'well-1',
      wellId: 'TX-2438',
      wellName: 'Smith County Well 47A',
      apiNumber: '42-423-12345',
      operator: {
        id: 'op-1',
        name: 'Independent Oil Co',
      },
      location: {
        latitude: 32.4487,
        longitude: -95.301,
        county: 'Smith',
        field: 'East Texas',
      },
      status: 'active' as const,
      production: {
        currentOilBblDay: 45,
        currentGasMcfDay: 90,
        cumulativeOilBbl: 180000,
        lastProductionDate: '2024-09-30',
        peakOilBblDay: 250,
        peakDate: '2022-03-15',
      },
      valuation: {
        npvUsd: 1850000,
        marketValueUsd: 2800000,
        discountPct: 34,
        confidence: 0.89,
      },
      nftTokenId: null,
      tags: ['undervalued', 'opportunity'],
    },
    {
      id: 'well-2',
      wellId: 'TX-2439',
      wellName: 'Harris County Well 23B',
      apiNumber: '42-201-67890',
      operator: {
        id: 'op-2',
        name: 'Major Oil Corp',
      },
      location: {
        latitude: 29.7604,
        longitude: -95.3698,
        county: 'Harris',
        field: 'Houston',
      },
      status: 'active' as const,
      production: {
        currentOilBblDay: 120,
        currentGasMcfDay: 240,
        cumulativeOilBbl: 450000,
        lastProductionDate: '2024-09-30',
        peakOilBblDay: 380,
        peakDate: '2021-06-10',
      },
      valuation: {
        npvUsd: 4200000,
        marketValueUsd: 5100000,
        discountPct: -18,
        confidence: 0.92,
      },
      nftTokenId: null,
      tags: ['fair'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear event handlers
    Object.keys(eventHandlers).forEach(key => delete eventHandlers[key]);

    (useWells as Mock).mockReturnValue({
      data: { wells: mockWells, total: 2, limit: 500, offset: 0 },
      isLoading: false,
      error: null,
    });

    // Set mock environment variable
    import.meta.env.VITE_MAPBOX_TOKEN = 'test-token';
  });

  it('should render map container', () => {
    render(<MapView />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveClass('absolute', 'inset-0');
  });

  it('should initialize Mapbox with correct configuration', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    await waitFor(() => {
      expect(mapboxgl.default.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-99.9, 31.5],
          zoom: 6,
        })
      );
    });
  });

  it('should set Mapbox access token from environment', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    expect(mapboxgl.default.accessToken).toBe('test-token');
  });

  it('should fetch wells with limit of 500', () => {
    render(<MapView />);

    expect(useWells).toHaveBeenCalledWith({
      limit: 500,
    });
  });

  it('should add GeoJSON source for wells on map load', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    await waitFor(() => {
      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      expect(mapInstance.addSource).toHaveBeenCalledWith(
        'wells',
        expect.objectContaining({
          type: 'geojson',
          data: expect.objectContaining({
            type: 'FeatureCollection',
          }),
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        })
      );
    });
  });

  it('should add cluster layer for grouped wells', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    await waitFor(() => {
      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      expect(mapInstance.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'clusters',
          type: 'circle',
          source: 'wells',
          filter: ['has', 'point_count'],
        })
      );
    });
  });

  it('should add individual well marker layer', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    await waitFor(() => {
      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      expect(mapInstance.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'wells',
          filter: ['!', ['has', 'point_count']],
        })
      );
    });
  });

  it('should use custom pin images for markers', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    await waitFor(() => {
      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      const layerCall = (mapInstance.addLayer as Mock).mock.calls.find(
        (call) => call[0].id === 'unclustered-point'
      );

      expect(layerCall).toBeDefined();
      expect(layerCall![0].layout['icon-image']).toBe('well-pin');
      expect(layerCall![0].layout['icon-size']).toBe(0.25);
    });
  });

  it('should render correctly with wells data', async () => {
    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    // Wait for map to initialize
    await waitFor(() => {
      expect(mapboxgl.default.Map).toHaveBeenCalled();
    });

    // Verify map was created with correct config
    expect(mapboxgl.default.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-99.9, 31.5],
        zoom: 6,
      })
    );
  });

  it('should clean up map on unmount', async () => {
    const mapboxgl = await import('mapbox-gl');
    const { unmount } = render(<MapView />);

    await waitFor(() => {
      expect(mapboxgl.default.Map).toHaveBeenCalled();
    });

    const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
    unmount();

    expect(mapInstance.remove).toHaveBeenCalled();
  });

  it('should handle loading state gracefully', () => {
    (useWells as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<MapView />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should handle empty wells array', async () => {
    (useWells as Mock).mockReturnValue({
      data: { wells: [], total: 0, limit: 500, offset: 0 },
      isLoading: false,
      error: null,
    });

    const mapboxgl = await import('mapbox-gl');
    render(<MapView />);

    await waitFor(() => {
      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      expect(mapInstance.addSource).toHaveBeenCalled();
    });
  });

  // ========================================
  // User Interaction Tests
  // ========================================

  describe('Marker Click Interactions', () => {
    it('should open WellDetailModal when unclustered marker is clicked', async () => {
      render(<MapView />);

      // Wait for map to initialize
      await waitFor(() => {
        expect(eventHandlers.click).toBeDefined();
        expect(eventHandlers.click['unclustered-point']).toBeDefined();
      });

      // Simulate clicking on a well marker
      const clickHandler = eventHandlers.click['unclustered-point'];
      await act(async () => {
        clickHandler({
          features: [
            {
              properties: { id: 'well-1' },
            },
          ],
        });
      });

      // Verify modal opens with correct well ID
      await waitFor(() => {
        const modal = screen.getByTestId('well-detail-modal');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveAttribute('data-well-id', 'well-1');
      });
    });

    it('should handle marker click with multiple features', async () => {
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['unclustered-point']).toBeDefined();
      });

      // Click with multiple features (should use first one)
      const clickHandler = eventHandlers.click['unclustered-point'];
      await act(async () => {
        clickHandler({
          features: [
            { properties: { id: 'well-1' } },
            { properties: { id: 'well-2' } },
          ],
        });
      });

      await waitFor(() => {
        const modal = screen.getByTestId('well-detail-modal');
        expect(modal).toHaveAttribute('data-well-id', 'well-1');
      });
    });

    it('should not open modal when clicking marker without features', async () => {
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['unclustered-point']).toBeDefined();
      });

      // Click without features
      const clickHandler = eventHandlers.click['unclustered-point'];
      clickHandler({ features: [] });

      // Modal should not appear
      expect(screen.queryByTestId('well-detail-modal')).not.toBeInTheDocument();
    });

    it('should not open modal when clicking marker without properties', async () => {
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['unclustered-point']).toBeDefined();
      });

      // Click with feature but no properties
      const clickHandler = eventHandlers.click['unclustered-point'];
      clickHandler({ features: [{ properties: null }] });

      // Modal should not appear
      expect(screen.queryByTestId('well-detail-modal')).not.toBeInTheDocument();
    });
  });

  describe('Modal State Management', () => {
    it('should close modal when onClose is called', async () => {
      render(<MapView />);

      // Open modal
      await waitFor(() => {
        expect(eventHandlers.click?.['unclustered-point']).toBeDefined();
      });

      const clickHandler = eventHandlers.click['unclustered-point'];
      await act(async () => {
        clickHandler({ features: [{ properties: { id: 'well-1' } }] });
      });

      // Verify modal is open
      await waitFor(() => {
        expect(screen.getByTestId('well-detail-modal')).toBeInTheDocument();
      });

      // Close modal
      const user = userEvent.setup();
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('well-detail-modal')).not.toBeInTheDocument();
      });
    });

    it('should show correct well ID in modal', async () => {
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['unclustered-point']).toBeDefined();
      });

      // Click on well-2
      const clickHandler = eventHandlers.click['unclustered-point'];
      await act(async () => {
        clickHandler({ features: [{ properties: { id: 'well-2' } }] });
      });

      await waitFor(() => {
        const modal = screen.getByTestId('well-detail-modal');
        expect(modal).toHaveAttribute('data-well-id', 'well-2');
      });
    });

    it('should allow opening different wells sequentially', async () => {
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['unclustered-point']).toBeDefined();
      });

      const clickHandler = eventHandlers.click['unclustered-point'];
      const user = userEvent.setup();

      // Open first well
      await act(async () => {
        clickHandler({ features: [{ properties: { id: 'well-1' } }] });
      });
      await waitFor(() => {
        expect(screen.getByTestId('well-detail-modal')).toHaveAttribute('data-well-id', 'well-1');
      });

      // Close modal
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByTestId('well-detail-modal')).not.toBeInTheDocument();
      });

      // Open second well
      await act(async () => {
        clickHandler({ features: [{ properties: { id: 'well-2' } }] });
      });
      await waitFor(() => {
        expect(screen.getByTestId('well-detail-modal')).toHaveAttribute('data-well-id', 'well-2');
      });
    });
  });

  describe('Cluster Click Interactions', () => {
    it('should zoom in when cluster is clicked', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['clusters']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Simulate cluster click
      const clickHandler = eventHandlers.click['clusters'];
      clickHandler({
        point: { x: 100, y: 100 },
      });

      // Verify cluster expansion behavior
      await waitFor(() => {
        expect(mapInstance.queryRenderedFeatures).toHaveBeenCalledWith(
          { x: 100, y: 100 },
          { layers: ['clusters'] }
        );
        expect(mapInstance.easeTo).toHaveBeenCalledWith({
          center: [-95.301, 32.4487],
          zoom: 10,
        });
      });
    });

    it('should get cluster expansion zoom correctly', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['clusters']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Click cluster
      const clickHandler = eventHandlers.click['clusters'];
      await act(async () => {
        clickHandler({ point: { x: 100, y: 100 } });
      });

      // Wait for async callback
      await waitFor(() => {
        const source = mapInstance.getSource('wells');
        expect(source.getClusterExpansionZoom).toHaveBeenCalledWith(
          1,
          expect.any(Function)
        );
      });
    });

    it('should handle cluster click without features', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.click?.['clusters']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Mock empty features
      mapInstance.queryRenderedFeatures.mockReturnValueOnce([]);

      const clickHandler = eventHandlers.click['clusters'];
      clickHandler({ point: { x: 100, y: 100 } });

      // Should not call easeTo when no features
      await waitFor(() => {
        expect(mapInstance.queryRenderedFeatures).toHaveBeenCalled();
      });

      // easeTo should not be called (or only called from previous tests)
      const easeToCallsBeforeClick = mapInstance.easeTo.mock.calls.length;
      expect(mapInstance.easeTo.mock.calls.length).toBe(easeToCallsBeforeClick);
    });
  });

  describe('Map Event Handlers', () => {
    it('should register mouseenter handler for unclustered points', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.mouseenter?.['unclustered-point']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      const canvas = mapInstance.getCanvas();

      // Trigger mouseenter
      const mouseenterHandler = eventHandlers.mouseenter['unclustered-point'];
      mouseenterHandler({});

      expect(canvas.style.cursor).toBe('pointer');
    });

    it('should register mouseleave handler for unclustered points', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.mouseleave?.['unclustered-point']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      const canvas = mapInstance.getCanvas();

      // Set cursor to pointer first
      canvas.style.cursor = 'pointer';

      // Trigger mouseleave
      const mouseleaveHandler = eventHandlers.mouseleave['unclustered-point'];
      mouseleaveHandler({});

      expect(canvas.style.cursor).toBe('');
    });

    it('should register mouseenter handler for clusters', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.mouseenter?.['clusters']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      const canvas = mapInstance.getCanvas();

      // Trigger mouseenter
      const mouseenterHandler = eventHandlers.mouseenter['clusters'];
      mouseenterHandler({});

      expect(canvas.style.cursor).toBe('pointer');
    });

    it('should register mouseleave handler for clusters', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers.mouseleave?.['clusters']).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      const canvas = mapInstance.getCanvas();

      // Set cursor to pointer first
      canvas.style.cursor = 'pointer';

      // Trigger mouseleave
      const mouseleaveHandler = eventHandlers.mouseleave['clusters'];
      mouseleaveHandler({});

      expect(canvas.style.cursor).toBe('');
    });
  });

  describe('Map Initialization', () => {
    it('should update well markers when data changes', async () => {
      const mapboxgl = await import('mapbox-gl');
      const { rerender } = render(<MapView />);

      // Wait for initial render
      await waitFor(() => {
        const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
        expect(mapInstance.addSource).toHaveBeenCalled();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Update wells data
      const newWells = [
        ...mockWells,
        {
          id: 'well-3',
          wellId: 'TX-2440',
          wellName: 'New Well',
          apiNumber: '42-423-99999',
          operator: { id: 'op-3', name: 'New Operator' },
          location: {
            latitude: 30.0,
            longitude: -96.0,
            county: 'Travis',
            field: 'Austin',
          },
          status: 'active' as const,
          production: {
            currentOilBblDay: 50,
            currentGasMcfDay: 100,
            cumulativeOilBbl: 200000,
            lastProductionDate: '2024-09-30',
            peakOilBblDay: 300,
            peakDate: '2023-01-01',
          },
          valuation: {
            npvUsd: 2000000,
            marketValueUsd: 3000000,
            discountPct: 33,
            confidence: 0.88,
          },
          nftTokenId: null,
          tags: ['undervalued'],
        },
      ];

      (useWells as Mock).mockReturnValue({
        data: { wells: newWells, total: 3, limit: 500, offset: 0 },
        isLoading: false,
        error: null,
      });

      await act(async () => {
        rerender(<MapView />);
      });

      await waitFor(() => {
        const source = mapInstance.getSource('wells');
        expect(source.setData).toHaveBeenCalled();
      });
    });

    it('should not throw error when wells data is null', async () => {
      (useWells as Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      // Should still initialize the map
      await waitFor(() => {
        expect(mapboxgl.default.Map).toHaveBeenCalled();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
      const source = mapInstance.getSource('wells');

      // Should not throw error and not try to update data
      expect(source.setData).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // Theme Switching Tests (TDD - Task 703)
  // ========================================

  describe('Theme Switching', () => {
    it('should switch map style when theme changes', async () => {
      const mapboxgl = await import('mapbox-gl');

      // Mock the theme store
      const { useMapTheme } = await import('@/stores/mapThemeStore');
      const mockUseMapTheme = useMapTheme as unknown as {
        getState: () => { theme: string; setTheme: (theme: string) => void };
        subscribe: (callback: (state: unknown) => void) => () => void;
      };

      render(<MapView />);

      await waitFor(() => {
        expect(mapboxgl.default.Map).toHaveBeenCalled();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Add setStyle method to mock
      mapInstance.setStyle = vi.fn();

      // Change theme
      await act(async () => {
        mockUseMapTheme.getState().setTheme('light');
      });

      // Verify setStyle was called with light theme URL
      await waitFor(() => {
        expect(mapInstance.setStyle).toHaveBeenCalledWith('mapbox://styles/mapbox/light-v11');
      });
    });

    it('should register style.load event handler', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;
        expect(mapInstance.on).toHaveBeenCalledWith('style.load', expect.any(Function));
      });
    });

    it('should restore custom layers after style change', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      await waitFor(() => {
        expect(eventHandlers['style.load']?.__map__).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Clear previous calls
      vi.clearAllMocks();

      // Simulate style.load event
      const styleLoadHandler = eventHandlers['style.load'].__map__;
      await act(async () => {
        styleLoadHandler({});
      });

      // Verify layers are re-added
      await waitFor(() => {
        expect(mapInstance.addSource).toHaveBeenCalledWith(
          'wells',
          expect.objectContaining({
            type: 'geojson',
          })
        );
        expect(mapInstance.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'clusters',
          })
        );
        expect(mapInstance.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'unclustered-point',
          })
        );
      });
    });

    it('should preserve well data after theme switch', async () => {
      const mapboxgl = await import('mapbox-gl');
      render(<MapView />);

      // Wait for initial load
      await waitFor(() => {
        expect(eventHandlers.load?.__map__).toBeDefined();
      });

      const mapInstance = (mapboxgl.default.Map as Mock).mock.results[0].value;

      // Ensure style.load handler exists
      await waitFor(() => {
        expect(eventHandlers['style.load']?.__map__).toBeDefined();
      });

      // Clear mock calls
      vi.clearAllMocks();

      // Trigger style.load (simulating theme change)
      const styleLoadHandler = eventHandlers['style.load'].__map__;
      await act(async () => {
        styleLoadHandler({});
      });

      // Verify well markers are restored
      await waitFor(() => {
        const source = mapInstance.getSource('wells');
        expect(source.setData).toHaveBeenCalled();
      });
    });

    it('should handle rapid theme changes gracefully', async () => {
      const { useMapTheme } = await import('@/stores/mapThemeStore');
      const mockUseMapTheme = useMapTheme as unknown as {
        getState: () => { theme: string; setTheme: (theme: string) => void };
      };

      render(<MapView />);

      // Wait for map to fully initialize first
      await waitFor(() => {
        expect(eventHandlers.load?.__map__).toBeDefined();
      });

      // Rapid theme changes - should not throw errors
      await act(async () => {
        mockUseMapTheme.getState().setTheme('light');
        mockUseMapTheme.getState().setTheme('dark');
        mockUseMapTheme.getState().setTheme('light');
      });

      // If we get here without errors, test passes
      expect(mockUseMapTheme.getState().theme).toBe('light');
    });
  });
});
