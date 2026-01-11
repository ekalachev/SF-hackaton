/**
 * Zustand store for map controls with localStorage persistence
 *
 * Manages:
 * - Production heatmap layer
 * - Basin/formation filters
 * - Map style selection
 * - Distance/radius tool
 *
 * @module mapControlsStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  MapControlsStore,
  MapControlsState,
  Basin,
  HeatmapConfig,
  RadiusSelection,
  MapStyleOption,
} from '@/types/mapControls';
import {
  DEFAULT_MAP_CONTROLS_STATE,
  MAP_CONTROLS_STORAGE_KEY,
  getCountiesForBasins,
} from '@/types/mapControls';
import logger from '@/lib/logger';

/**
 * Custom storage engine with error handling
 */
const storage = createJSONStorage<Partial<MapControlsState>>(() => ({
  getItem: (name: string): string | null => {
    try {
      const value = localStorage.getItem(name);
      logger.debug('state', `Retrieved map controls from localStorage`);
      return value;
    } catch (error) {
      logger.error('system', 'Failed to read map controls from localStorage', { error });
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
      logger.debug('state', `Saved map controls to localStorage`);
    } catch (error) {
      logger.error('system', 'Failed to save map controls to localStorage', { error });
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
      logger.debug('state', `Removed map controls from localStorage`);
    } catch (error) {
      logger.error('system', 'Failed to remove map controls from localStorage', { error });
    }
  },
}));

/**
 * Map controls store with localStorage persistence
 */
export const useMapControls = create<MapControlsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_MAP_CONTROLS_STATE,

      // Heatmap actions
      toggleHeatmap: () => {
        const current = get().heatmapEnabled;
        logger.info('ui', `Heatmap ${current ? 'disabled' : 'enabled'}`);
        set({ heatmapEnabled: !current });
      },

      setHeatmapConfig: (config: Partial<HeatmapConfig>) => {
        const currentConfig = get().heatmapConfig;
        const newConfig = { ...currentConfig, ...config };
        logger.debug('state', 'Heatmap config updated', newConfig);
        set({ heatmapConfig: newConfig });
      },

      // Basin filter actions
      toggleBasin: (basin: Basin) => {
        const current = get().selectedBasins;
        const isSelected = current.includes(basin);

        const newBasins = isSelected
          ? current.filter(b => b !== basin)
          : [...current, basin];

        const newCounties = getCountiesForBasins(newBasins);

        logger.info('ui', `Basin ${basin} ${isSelected ? 'deselected' : 'selected'}`);
        set({
          selectedBasins: newBasins,
          selectedCounties: newCounties,
        });
      },

      setSelectedBasins: (basins: ReadonlyArray<Basin>) => {
        const newCounties = getCountiesForBasins(basins);
        logger.info('ui', `Selected basins: ${basins.join(', ') || 'none'}`);
        set({
          selectedBasins: basins,
          selectedCounties: newCounties,
        });
      },

      clearBasinFilters: () => {
        logger.info('ui', 'Basin filters cleared');
        set({
          selectedBasins: [],
          selectedCounties: [],
        });
      },

      // Map style actions
      setMapStyle: (style: MapStyleOption) => {
        logger.info('ui', `Map style changed to: ${style}`);
        set({ mapStyle: style });
      },

      toggleClustering: () => {
        const current = get().clusteringEnabled;
        logger.info('ui', `Clustering ${current ? 'disabled' : 'enabled'}`);
        set({ clusteringEnabled: !current });
      },

      // Radius tool actions
      toggleRadiusTool: () => {
        const current = get().radiusToolActive;
        logger.info('ui', `Radius tool ${current ? 'deactivated' : 'activated'}`);
        set({
          radiusToolActive: !current,
          radiusSelection: current ? null : get().radiusSelection,
        });
      },

      setRadiusSelection: (selection: RadiusSelection | null) => {
        if (selection) {
          logger.info('ui', `Radius selection: ${selection.radiusMiles} miles, ${selection.wellCount} wells`);
        } else {
          logger.debug('ui', 'Radius selection cleared');
        }
        set({ radiusSelection: selection });
      },

      clearRadiusSelection: () => {
        logger.info('ui', 'Radius selection cleared');
        set({ radiusSelection: null });
      },
    }),
    {
      name: MAP_CONTROLS_STORAGE_KEY,
      storage,
      partialize: (state) => ({
        heatmapEnabled: state.heatmapEnabled,
        heatmapConfig: state.heatmapConfig,
        selectedBasins: state.selectedBasins,
        mapStyle: state.mapStyle,
        clusteringEnabled: state.clusteringEnabled,
      }),
    }
  )
);

/**
 * Get current map controls state without subscribing
 */
export const getMapControlsState = (): MapControlsState => {
  const state = useMapControls.getState();
  return {
    heatmapEnabled: state.heatmapEnabled,
    heatmapConfig: state.heatmapConfig,
    selectedBasins: state.selectedBasins,
    selectedCounties: state.selectedCounties,
    mapStyle: state.mapStyle,
    clusteringEnabled: state.clusteringEnabled,
    radiusToolActive: state.radiusToolActive,
    radiusSelection: state.radiusSelection,
  };
};
