/**
 * MapControls Component
 *
 * Provides UI controls for map features:
 * - Production heatmap toggle
 * - Basin/formation filters
 * - Map style selector
 * - Distance/radius tool
 *
 * @module MapControls
 */

import { useState } from 'react';
import {
  Flame,
  Layers,
  MapPin,
  Target,
  ChevronDown,
  ChevronUp,
  X,
  Map,
  Mountain,
  Satellite,
} from 'lucide-react';
import { useMapControls } from '@/stores/mapControlsStore';
import { MAJOR_BASINS, type MapStyleOption } from '@/types/mapControls';

/**
 * Map style options with icons
 */
const MAP_STYLE_OPTIONS: ReadonlyArray<{
  readonly value: MapStyleOption;
  readonly label: string;
  readonly icon: React.ReactNode;
}> = [
  { value: 'dark', label: 'Dark', icon: <Map size={16} /> },
  { value: 'light', label: 'Light', icon: <Map size={16} /> },
  { value: 'satellite', label: 'Satellite', icon: <Satellite size={16} /> },
  { value: 'terrain', label: 'Terrain', icon: <Mountain size={16} /> },
  { value: 'streets', label: 'Streets', icon: <MapPin size={16} /> },
];

/**
 * Control panel section component
 */
function ControlSection({
  title,
  icon,
  children,
  defaultExpanded = false,
}: {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
  readonly defaultExpanded?: boolean;
}): JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="
          w-full flex items-center justify-between
          px-3 py-2
          text-sm font-medium
          text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700/50
          transition-colors
        "
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Main MapControls component
 */
export function MapControls(): JSX.Element {
  const {
    heatmapEnabled,
    toggleHeatmap,
    selectedBasins,
    toggleBasin,
    clearBasinFilters,
    mapStyle,
    setMapStyle,
    clusteringEnabled,
    toggleClustering,
    radiusToolActive,
    toggleRadiusTool,
    radiusSelection,
    clearRadiusSelection,
  } = useMapControls();

  return (
    <div className="
      bg-white/95 dark:bg-gray-800/95
      backdrop-blur-sm
      rounded-lg shadow-lg
      w-64
      max-h-[calc(100vh-120px)]
      overflow-y-auto
      text-sm
    ">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers size={18} />
          Map Controls
        </h3>
      </div>

      {/* Heatmap Section */}
      <ControlSection
        title="Production Heatmap"
        icon={<Flame size={16} className={heatmapEnabled ? 'text-orange-500' : ''} />}
        defaultExpanded
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={heatmapEnabled}
              onChange={toggleHeatmap}
              className="
                w-4 h-4 rounded
                border-gray-300 dark:border-gray-600
                text-blue-600 focus:ring-blue-500
              "
            />
            <span className="text-gray-700 dark:text-gray-300">
              Show production heatmap
            </span>
          </label>
          {heatmapEnabled && (
            <div className="mt-2 pl-6">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded bg-blue-500"></span>
                <span>Low</span>
                <span className="w-3 h-3 rounded bg-green-500 ml-2"></span>
                <span className="w-3 h-3 rounded bg-yellow-500"></span>
                <span className="w-3 h-3 rounded bg-orange-500"></span>
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span>High</span>
              </div>
            </div>
          )}
        </div>
      </ControlSection>

      {/* Basin Filters Section */}
      <ControlSection
        title="Basin Filters"
        icon={<MapPin size={16} className={selectedBasins.length > 0 ? 'text-green-500' : ''} />}
      >
        <div className="space-y-2">
          {selectedBasins.length > 0 && (
            <button
              type="button"
              onClick={clearBasinFilters}
              className="
                text-xs text-blue-600 dark:text-blue-400
                hover:underline flex items-center gap-1
              "
            >
              <X size={12} />
              Clear filters
            </button>
          )}
          <div className="space-y-1">
            {MAJOR_BASINS.map((basin) => (
              <label
                key={basin.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBasins.includes(basin.id)}
                  onChange={() => toggleBasin(basin.id)}
                  className="
                    w-4 h-4 rounded
                    border-gray-300 dark:border-gray-600
                    text-blue-600 focus:ring-blue-500
                  "
                />
                <span className="text-gray-700 dark:text-gray-300 text-xs">
                  {basin.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </ControlSection>

      {/* Map Style Section */}
      <ControlSection
        title="Map Style"
        icon={<Map size={16} />}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {MAP_STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMapStyle(option.value)}
                className={`
                  flex items-center gap-1 px-2 py-1.5 rounded text-xs
                  transition-colors
                  ${mapStyle === option.value
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={clusteringEnabled}
              onChange={toggleClustering}
              className="
                w-4 h-4 rounded
                border-gray-300 dark:border-gray-600
                text-blue-600 focus:ring-blue-500
              "
            />
            <span className="text-gray-700 dark:text-gray-300 text-xs">
              Enable clustering
            </span>
          </label>
        </div>
      </ControlSection>

      {/* Radius Tool Section */}
      <ControlSection
        title="Distance Tool"
        icon={<Target size={16} className={radiusToolActive ? 'text-purple-500' : ''} />}
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={toggleRadiusTool}
            className={`
              w-full px-3 py-2 rounded text-xs font-medium
              transition-colors
              ${radiusToolActive
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {radiusToolActive ? 'Click & drag to draw radius' : 'Activate radius tool'}
          </button>

          {radiusSelection && (
            <div className="
              mt-2 p-2 rounded
              bg-gray-50 dark:bg-gray-700/50
              text-xs space-y-1
            ">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Radius:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {radiusSelection.radiusMiles.toFixed(1)} mi
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Wells:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {radiusSelection.wellCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Production:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {radiusSelection.totalProduction.toLocaleString()} bbl/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Avg Discount:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {radiusSelection.avgDiscount.toFixed(1)}%
                </span>
              </div>
              <button
                type="button"
                onClick={clearRadiusSelection}
                className="
                  w-full mt-1 px-2 py-1 rounded
                  text-xs text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  transition-colors
                "
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      </ControlSection>
    </div>
  );
}
