/**
 * MapView Component
 * Interactive Mapbox map showing Texas oil fields
 * Implements clustering and color-coded valuation markers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useWells } from '@/hooks/useWells';
import { useFilters } from '@/hooks/useFilters';
import { WellDetailModal } from '@/components/wells/WellDetailModal';
import { MapControls } from '@/components/map/MapControls';
import { SearchBar, FilterPanel } from '@/components/filters';
import { wellsToFeatureCollection, DEFAULT_MAP_CONFIG, CLUSTER_CONFIG } from '@/types';
import type { Well } from '@/types';
import logger from '@/lib/logger';
import { validateWellsForMap } from '@/utils/mapValidation';
import { categorizeWells } from '@/utils/wellColors';
import { useMapControls } from '@/stores/mapControlsStore';
import { MAP_STYLE_URLS, calculateDistanceMiles } from '@/types/mapControls';
import type { RadiusSelection } from '@/types/mapControls';

/**
 * Main MapView component
 * Displays interactive map with well markers and clustering
 */
export function MapView(): JSX.Element {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const wellsData = useRef<ReadonlyArray<Well> | null>(null);
  const radiusCircle = useRef<mapboxgl.Marker | null>(null);
  const radiusCenter = useRef<{ lng: number; lat: number } | null>(null);
  const radiusToolActiveRef = useRef<boolean>(false);
  const isDraggingRadius = useRef<boolean>(false);
  const heatmapEnabledRef = useRef<boolean>(false);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);

  // Get map controls state
  const {
    heatmapEnabled,
    selectedCounties,
    mapStyle,
    radiusToolActive,
    setRadiusSelection,
  } = useMapControls();

  // Fetch wells data
  const { data, isLoading, error } = useWells({
    limit: 500, // Load all wells for map display
  });

  // Use filters hook for search and filtering
  const {
    filteredWells,
    totalCount,
    filteredCount,
    criteria,
    availableOperators,
    hasActiveFilters,
    activeFilterCount,
    setSearchQuery,
    addToSearchHistory,
    getSuggestions,
  } = useFilters(data?.wells ?? []);

  // Log component lifecycle
  useEffect(() => {
    logger.info('ui', 'MapView mounted');
    return () => logger.info('ui', 'MapView unmounted');
  }, []);

  // Log wells data when loaded
  useEffect(() => {
    if (data?.wells) {
      // Store wells in ref for access in addWellsLayer
      wellsData.current = data.wells;

      logger.info('state', `Wells data loaded: ${data.wells.length} wells`);
      logger.debug('state', 'Wells data', { wellIds: data.wells.map((w) => w.id) });

      // Validate wells for map rendering
      const validationResult = validateWellsForMap(data.wells);

      if (!validationResult.valid) {
        logger.error('system', 'Wells data validation failed', {
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });
      }

      // Categorize wells by health
      categorizeWells(data.wells);
    }
  }, [data?.wells]);

  // Log loading and error states
  useEffect(() => {
    if (isLoading) {
      logger.info('state', 'Loading wells data...');
    }
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      logger.error('api', 'Failed to load wells', { error: error.message });
    }
  }, [error]);

  // Handle theme changes (from theme toggle)
  useEffect(() => {
    if (!map.current) return;

    const newStyleURL = MAP_STYLE_URLS[mapStyle];
    logger.info('ui', `Switching map style to ${mapStyle}`);
    map.current.setStyle(newStyleURL);
  }, [mapStyle]);

  // Handle heatmap toggle
  useEffect(() => {
    // Always sync the ref for use in closures
    heatmapEnabledRef.current = heatmapEnabled;

    if (!map.current) {
      logger.debug('ui', 'Heatmap toggle: map not initialized yet');
      return;
    }

    const heatmapLayerId = 'production-heatmap';

    // Function to update heatmap visibility
    const updateHeatmapVisibility = (): void => {
      if (!map.current) return;

      if (map.current.getLayer(heatmapLayerId)) {
        map.current.setLayoutProperty(
          heatmapLayerId,
          'visibility',
          heatmapEnabled ? 'visible' : 'none'
        );
        logger.info('ui', `Heatmap layer ${heatmapEnabled ? 'shown' : 'hidden'}`);
      } else {
        logger.debug('ui', 'Heatmap layer not found, will be set on next style load');
      }
    };

    // If map is already loaded, update immediately
    if (map.current.isStyleLoaded()) {
      updateHeatmapVisibility();
    } else {
      // Wait for style to load
      map.current.once('style.load', updateHeatmapVisibility);
    }
  }, [heatmapEnabled]);

  // Handle county/basin filters
  useEffect(() => {
    if (!map.current || !wellsData.current) return;

    // Filter wells by selected counties
    const filteredWells = selectedCounties.length > 0
      ? wellsData.current.filter(well =>
          well.location?.county &&
          selectedCounties.includes(well.location.county.toUpperCase())
        )
      : wellsData.current;

    updateWellMarkers(filteredWells);
    logger.info('ui', `Filtered to ${filteredWells.length} wells in selected basins`);
  }, [selectedCounties]);

  // Calculate wells within radius
  const calculateRadiusStats = useCallback((
    centerLng: number,
    centerLat: number,
    radiusMiles: number,
    wells: ReadonlyArray<Well>
  ): RadiusSelection => {
    const wellsInRadius = wells.filter(well => {
      if (!well.location) return false;
      const distance = calculateDistanceMiles(
        centerLat,
        centerLng,
        well.location.latitude,
        well.location.longitude
      );
      return distance <= radiusMiles;
    });

    const totalProduction = wellsInRadius.reduce(
      (sum, well) => sum + (well.production?.currentOilBblDay ?? 0),
      0
    );

    const avgDiscount = wellsInRadius.length > 0
      ? wellsInRadius.reduce(
          (sum, well) => sum + (well.valuation?.discountPct ?? 0),
          0
        ) / wellsInRadius.length
      : 0;

    return {
      center: { longitude: centerLng, latitude: centerLat },
      radiusMiles,
      wellCount: wellsInRadius.length,
      totalProduction,
      avgDiscount,
    };
  }, []);

  // Handle radius tool
  useEffect(() => {
    radiusToolActiveRef.current = radiusToolActive;

    if (!map.current) return;

    const canvas = map.current.getCanvas();

    if (radiusToolActive) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = '';
      // Clean up radius circle and selection
      if (radiusCircle.current) {
        radiusCircle.current.remove();
        radiusCircle.current = null;
      }
      radiusCenter.current = null;
      isDraggingRadius.current = false;

      // Clear the circle layer from map
      if (map.current.getLayer('radius-circle-fill')) {
        map.current.removeLayer('radius-circle-fill');
      }
      if (map.current.getLayer('radius-circle-line')) {
        map.current.removeLayer('radius-circle-line');
      }
      if (map.current.getSource('radius-circle')) {
        map.current.removeSource('radius-circle');
      }

      // Clear selection stats
      setRadiusSelection(null);
    }
  }, [radiusToolActive, setRadiusSelection]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current) return;

    logger.debug('ui', 'Initializing Mapbox map');

    // Set access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

    // Create map instance with persisted style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_URLS[mapStyle],
      center: [DEFAULT_MAP_CONFIG.center[0], DEFAULT_MAP_CONFIG.center[1]] as [number, number],
      zoom: DEFAULT_MAP_CONFIG.zoom,
    });

    // Add layers when map loads
    map.current.on('load', () => {
      logger.info('ui', 'Map loaded successfully');
      logger.debug('performance', 'Map load complete');
      addWellsLayer();
    });

    // Re-add layers when style changes (theme switching)
    map.current.on('style.load', () => {
      logger.info('ui', 'Map style changed, restoring custom layers');
      addWellsLayer();
    });

    // Log map errors
    map.current.on('error', (e) => {
      logger.error('ui', 'Map error occurred', { error: e.error?.message });
    });

    // Handle radius tool - click and drag behavior
    map.current.on('mousedown', (e) => {
      if (!radiusToolActiveRef.current || !map.current) return;

      const { lng, lat } = e.lngLat;

      // Clear previous selection
      if (radiusCircle.current) {
        radiusCircle.current.remove();
        radiusCircle.current = null;
      }

      // Set center point and start dragging
      radiusCenter.current = { lng, lat };
      isDraggingRadius.current = true;

      // Disable map dragging while drawing radius
      map.current.dragPan.disable();

      // Add center marker
      const el = document.createElement('div');
      el.className = 'radius-center-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.backgroundColor = '#8B5CF6';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';

      radiusCircle.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current);

      logger.info('ui', `Radius center set at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    });

    map.current.on('mousemove', (e) => {
      if (!isDraggingRadius.current || !radiusCenter.current || !map.current) return;

      const { lng, lat } = e.lngLat;

      // Calculate radius from center to current mouse position
      const radiusMiles = calculateDistanceMiles(
        radiusCenter.current.lat,
        radiusCenter.current.lng,
        lat,
        lng
      );

      // Draw/update circle on map
      if (map.current.getSource('radius-circle')) {
        (map.current.getSource('radius-circle') as mapboxgl.GeoJSONSource).setData(
          createCircleGeoJSON(radiusCenter.current.lng, radiusCenter.current.lat, radiusMiles)
        );
      } else {
        map.current.addSource('radius-circle', {
          type: 'geojson',
          data: createCircleGeoJSON(radiusCenter.current.lng, radiusCenter.current.lat, radiusMiles),
        });

        map.current.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': '#8B5CF6',
            'fill-opacity': 0.15,
          },
        });

        map.current.addLayer({
          id: 'radius-circle-line',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': '#8B5CF6',
            'line-width': 2,
          },
        });
      }
    });

    map.current.on('mouseup', (e) => {
      if (!isDraggingRadius.current || !radiusCenter.current || !map.current || !wellsData.current) return;

      const { lng, lat } = e.lngLat;

      // Calculate final radius
      const radiusMiles = calculateDistanceMiles(
        radiusCenter.current.lat,
        radiusCenter.current.lng,
        lat,
        lng
      );

      // Calculate stats
      const stats = calculateRadiusStats(
        radiusCenter.current.lng,
        radiusCenter.current.lat,
        radiusMiles,
        wellsData.current
      );

      setRadiusSelection(stats);

      // Re-enable map dragging
      map.current.dragPan.enable();
      isDraggingRadius.current = false;

      logger.info('ui', `Radius set to ${radiusMiles.toFixed(1)} miles`);
    });

    // Cleanup on unmount
    return () => {
      logger.debug('ui', 'Removing map instance');
      map.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateRadiusStats, setRadiusSelection]);

  /**
   * Create GeoJSON circle polygon
   */
  function createCircleGeoJSON(lng: number, lat: number, radiusMiles: number): GeoJSON.FeatureCollection {
    const points = 64;
    const radiusKm = radiusMiles * 1.60934;
    const coordinates: [number, number][] = [];

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle);
      const dy = radiusKm * Math.sin(angle);

      // Convert to degrees
      const dLat = dy / 111.32;
      const dLng = dx / (111.32 * Math.cos(lat * Math.PI / 180));

      coordinates.push([lng + dLng, lat + dLat]);
    }

    coordinates.push(coordinates[0]); // Close the polygon

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        properties: {},
      }],
    };
  }

  // Update well markers when filtered data changes
  useEffect(() => {
    if (filteredWells && map.current) {
      updateWellMarkers(filteredWells);
    }
  }, [filteredWells]);

  /**
   * Add GeoJSON source and layers for wells
   */
  function addWellsLayer(): void {
    if (!map.current) return;

    // Load custom pin images
    const loadImage = (url: string, name: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!map.current) {
          reject(new Error('Map not initialized'));
          return;
        }

        map.current.loadImage(url, (error, image) => {
          if (error) {
            logger.error('ui', `Failed to load image ${name}`, { error: error.message });
            reject(error);
            return;
          }
          if (image && map.current) {
            map.current.addImage(name, image);
            logger.debug('ui', `Loaded custom marker image: ${name}`);
            resolve();
          }
        });
      });
    };

    // Add GeoJSON source for wells first (with clustering)
    map.current.addSource('wells', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: true,
      clusterMaxZoom: CLUSTER_CONFIG.clusterMaxZoom,
      clusterRadius: CLUSTER_CONFIG.clusterRadius,
    });

    // Add separate non-clustered source for heatmap
    map.current.addSource('wells-heatmap', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    // Load both pin images, then add layers
    Promise.all([
      loadImage('/assets/unselected-pin.png', 'well-pin'),
      loadImage('/assets/selected-pin.png', 'well-pin-selected'),
    ])
      .then(() => {
        logger.info('ui', 'Custom pin images loaded successfully');

        if (!map.current) return;

        // Cluster circles layer
        map.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'wells',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#10b981', // Green for small clusters
              20,
              '#f59e0b', // Amber for medium
              50,
              '#ef4444', // Red for large
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              20,
              30,
              50,
              40,
            ],
          },
        });

        // Cluster count labels
        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'wells',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Individual well markers layer using custom image pins
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'wells',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'well-pin', // Default to unselected pin
            'icon-size': 0.25, // Scale down the image (2x smaller)
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        });

        // Add production heatmap layer (uses non-clustered source)
        map.current.addLayer({
          id: 'production-heatmap',
          type: 'heatmap',
          source: 'wells-heatmap',
          maxzoom: 15,
          paint: {
            // Increase weight based on production (scaled for low production values)
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'currentProduction'],
              0, 0,
              0.1, 0.3,
              0.2, 0.5,
              0.3, 0.7,
              0.4, 0.85,
              0.5, 1,
            ],
            // Intensity increases with zoom
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              10, 4,
              15, 5,
            ],
            // Color gradient from blue (low) to red (high)
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 255, 0)',
              0.2, 'rgba(65, 105, 225, 0.5)',
              0.4, 'rgba(0, 255, 0, 0.6)',
              0.6, 'rgba(255, 255, 0, 0.7)',
              0.8, 'rgba(255, 165, 0, 0.8)',
              1, 'rgba(255, 0, 0, 0.9)',
            ],
            // Radius adjusts with zoom
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 15,
              8, 30,
              15, 50,
            ],
            // Opacity decreases with zoom to show points
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 0.7,
              15, 0,
            ],
          },
          layout: {
            visibility: heatmapEnabledRef.current ? 'visible' : 'none',
          },
        });

        logger.debug('ui', 'Map layers added successfully after image load');

        // If wells data already loaded, update markers now
        if (wellsData.current) {
          logger.debug('ui', 'Updating markers with pre-loaded well data');
          updateWellMarkers(wellsData.current);
        }
      })
      .catch((error) => {
        logger.error('ui', 'Failed to load custom pin images', { error });
      });

    // Click handler for individual wells
    map.current.on('click', 'unclustered-point', (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (e.features && e.features[0]?.properties) {
        const wellId = e.features[0].properties.id;
        logger.debug('ui', `Well marker clicked: ${wellId}`);
        setSelectedWellId(wellId);

        // Update the icon for selected well
        if (map.current) {
          map.current.setLayoutProperty(
            'unclustered-point',
            'icon-image',
            ['case', ['==', ['get', 'id'], wellId], 'well-pin-selected', 'well-pin']
          );
        }
      }
    });

    // Cursor pointer on hover
    map.current.on('mouseenter', 'unclustered-point', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'unclustered-point', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });

    // Click handler for clusters to zoom in
    map.current.on('click', 'clusters', (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!map.current) return;

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });

      if (features.length > 0 && features[0].properties) {
        const clusterId = features[0].properties.cluster_id;
        const clusterCount = features[0].properties.point_count;
        logger.debug('ui', `Cluster clicked: ${clusterCount} wells`);

        const source = map.current.getSource('wells') as mapboxgl.GeoJSONSource;

        source.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
          if (err || !map.current) return;

          if (features[0].geometry.type === 'Point') {
            logger.debug('ui', `Zooming to cluster at zoom level ${zoom}`);
            map.current.easeTo({
              center: features[0].geometry.coordinates as [number, number],
              zoom: zoom ?? 10,
            });
          }
        });
      }
    });

    // Cursor pointer on cluster hover
    map.current.on('mouseenter', 'clusters', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'clusters', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });
  }

  /**
   * Update GeoJSON data with new wells
   */
  function updateWellMarkers(wells: ReadonlyArray<Well>): void {
    if (!map.current) return;

    logger.debug('ui', `Updating map with ${wells.length} wells`);

    const geojson = wellsToFeatureCollection(wells);
    logger.info('state', `Rendered ${geojson.features.length} well markers on map`);

    if (geojson.features.length < wells.length) {
      const skipped = wells.length - geojson.features.length;
      logger.warn('state', `${skipped} wells skipped due to missing location/valuation/production data`);
    }

    const source = map.current.getSource('wells') as mapboxgl.GeoJSONSource;
    const heatmapSource = map.current.getSource('wells-heatmap') as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData(geojson as unknown as GeoJSON.FeatureCollection);
      logger.debug('performance', 'Map data updated successfully');
    } else {
      logger.warn('ui', 'Wells source not found on map');
    }

    // Also update the heatmap source (non-clustered)
    if (heatmapSource) {
      heatmapSource.setData(geojson as unknown as GeoJSON.FeatureCollection);
      logger.debug('performance', 'Heatmap data updated successfully');
    }
  }

  // Handle search submission
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      addToSearchHistory(query);
    }
  }, [addToSearchHistory]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} data-testid="map-container" className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Search bar - positioned at top center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96 max-w-[calc(100%-2rem)]">
        <SearchBar
          value={criteria.searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          getSuggestions={getSuggestions}
        />
      </div>

      {/* Map controls panel - positioned in top-left corner */}
      <div className="absolute top-4 left-4 z-10">
        <MapControls />
      </div>

      {/* Filter panel - positioned below map controls */}
      <div className="absolute top-20 left-4 z-10 w-64">
        <FilterPanel
          availableOperators={availableOperators}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          filteredCount={filteredCount}
          totalCount={totalCount}
        />
      </div>

      {selectedWellId && (
        <WellDetailModal wellId={selectedWellId} onClose={() => setSelectedWellId(null)} />
      )}
    </div>
  );
}
