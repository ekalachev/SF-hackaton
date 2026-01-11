/**
 * Tests for MapControls component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapControls } from './MapControls';
import { useMapControls } from '@/stores/mapControlsStore';

// Mock the store
vi.mock('@/stores/mapControlsStore', () => ({
  useMapControls: vi.fn(),
}));

describe('MapControls', () => {
  const mockStore = {
    heatmapEnabled: false,
    toggleHeatmap: vi.fn(),
    selectedBasins: [],
    toggleBasin: vi.fn(),
    clearBasinFilters: vi.fn(),
    mapStyle: 'dark' as const,
    setMapStyle: vi.fn(),
    clusteringEnabled: true,
    toggleClustering: vi.fn(),
    radiusToolActive: false,
    toggleRadiusTool: vi.fn(),
    radiusSelection: null,
    clearRadiusSelection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMapControls as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
  });

  it('should render the component', () => {
    render(<MapControls />);
    expect(screen.getByText('Map Controls')).toBeInTheDocument();
  });

  it('should render all control sections', () => {
    render(<MapControls />);
    expect(screen.getByText('Production Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Basin Filters')).toBeInTheDocument();
    expect(screen.getByText('Map Style')).toBeInTheDocument();
    expect(screen.getByText('Distance Tool')).toBeInTheDocument();
  });

  describe('Heatmap Section', () => {
    it('should toggle heatmap when checkbox is clicked', () => {
      render(<MapControls />);

      const checkbox = screen.getByRole('checkbox', { name: /show production heatmap/i });
      fireEvent.click(checkbox);

      expect(mockStore.toggleHeatmap).toHaveBeenCalled();
    });

    it('should show legend when heatmap is enabled', () => {
      (useMapControls as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        heatmapEnabled: true,
      });

      render(<MapControls />);

      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('Basin Filters Section', () => {
    it('should render all basin options', () => {
      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Basin Filters'));

      expect(screen.getByText('Permian Basin')).toBeInTheDocument();
      expect(screen.getByText('Eagle Ford Shale')).toBeInTheDocument();
      expect(screen.getByText('Haynesville Shale')).toBeInTheDocument();
    });

    it('should toggle basin when checkbox is clicked', () => {
      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Basin Filters'));

      const permianCheckbox = screen.getByRole('checkbox', { name: /permian basin/i });
      fireEvent.click(permianCheckbox);

      expect(mockStore.toggleBasin).toHaveBeenCalledWith('permian');
    });

    it('should show clear button when basins are selected', () => {
      (useMapControls as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        selectedBasins: ['permian'],
      });

      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Basin Filters'));

      const clearButton = screen.getByText('Clear filters');
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(mockStore.clearBasinFilters).toHaveBeenCalled();
    });
  });

  describe('Map Style Section', () => {
    it('should render all style options', () => {
      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Map Style'));

      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Satellite')).toBeInTheDocument();
      expect(screen.getByText('Terrain')).toBeInTheDocument();
      expect(screen.getByText('Streets')).toBeInTheDocument();
    });

    it('should change map style when button is clicked', () => {
      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Map Style'));

      fireEvent.click(screen.getByText('Satellite'));
      expect(mockStore.setMapStyle).toHaveBeenCalledWith('satellite');
    });

    it('should toggle clustering when checkbox is clicked', () => {
      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Map Style'));

      const checkbox = screen.getByRole('checkbox', { name: /enable clustering/i });
      fireEvent.click(checkbox);

      expect(mockStore.toggleClustering).toHaveBeenCalled();
    });
  });

  describe('Distance Tool Section', () => {
    it('should toggle radius tool when button is clicked', () => {
      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Distance Tool'));

      const button = screen.getByText('Activate radius tool');
      fireEvent.click(button);

      expect(mockStore.toggleRadiusTool).toHaveBeenCalled();
    });

    it('should show stats when radius is selected', () => {
      (useMapControls as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        radiusSelection: {
          center: { longitude: -99.9, latitude: 31.5 },
          radiusMiles: 10,
          wellCount: 25,
          totalProduction: 5000,
          avgDiscount: 15.5,
        },
      });

      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Distance Tool'));

      expect(screen.getByText('10.0 mi')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('5,000 bbl/day')).toBeInTheDocument();
      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });

    it('should clear selection when clear button is clicked', () => {
      (useMapControls as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        radiusSelection: {
          center: { longitude: -99.9, latitude: 31.5 },
          radiusMiles: 10,
          wellCount: 25,
          totalProduction: 5000,
          avgDiscount: 15.5,
        },
      });

      render(<MapControls />);

      // Click to expand the section
      fireEvent.click(screen.getByText('Distance Tool'));

      const clearButton = screen.getByText('Clear selection');
      fireEvent.click(clearButton);

      expect(mockStore.clearRadiusSelection).toHaveBeenCalled();
    });
  });
});
