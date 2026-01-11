/**
 * FilterPanel Component
 * Multi-criteria filter controls for wells
 *
 * Following SOLID principles:
 * - Single Responsibility: Handles filter UI only
 */

import { useState } from 'react';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUp,
  ArrowDown,
  Bookmark,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/filterStore';
import type { WellStatus, SortField } from '@/types/filters';

interface FilterPanelProps {
  readonly availableOperators: readonly string[];
  readonly hasActiveFilters: boolean;
  readonly activeFilterCount: number;
  readonly filteredCount: number;
  readonly totalCount: number;
  readonly className?: string;
}

export function FilterPanel({
  availableOperators,
  hasActiveFilters,
  activeFilterCount,
  filteredCount,
  totalCount,
  className,
}: FilterPanelProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  const {
    criteria,
    presets,
    setProductionRange,
    toggleStatus,
    toggleOperator,
    setSortBy,
    toggleSortOrder,
    resetFilters,
    savePreset,
    applyPreset,
    deletePreset,
  } = useFilterStore();

  const statusOptions: { value: WellStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'plugged', label: 'Plugged' },
    { value: 'depleted', label: 'Depleted' },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'production', label: 'Production' },
    { value: 'valuation', label: 'Value' },
    { value: 'discount', label: 'Discount' },
    { value: 'name', label: 'Name' },
  ];

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim());
      setPresetName('');
      setShowPresetModal(false);
    }
  };

  return (
    <div className={cn('bg-gray-800/90 backdrop-blur-sm rounded-lg border border-white/10', className)}>
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white hover:text-blue-400"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <div className="text-xs text-gray-400">
          {filteredCount} / {totalCount} wells
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4 border-t border-white/10 pt-3">
          {/* Sort options */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Sort by</label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={cn(
                      'px-2 py-1 text-xs rounded',
                      criteria.sortBy === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleSortOrder}
                className="p-1 rounded hover:bg-white/10"
                title={`Sort ${criteria.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              >
                {criteria.sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Production range */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">
              Production (bbl/day): {criteria.productionRange.min} - {criteria.productionRange.max}
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="500"
                value={criteria.productionRange.min}
                onChange={(e) =>
                  setProductionRange({
                    min: Number(e.target.value),
                    max: criteria.productionRange.max,
                  })
                }
                className="flex-1 accent-blue-500"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={criteria.productionRange.max}
                onChange={(e) =>
                  setProductionRange({
                    min: criteria.productionRange.min,
                    max: Number(e.target.value),
                  })
                }
                className="flex-1 accent-blue-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Status</label>
            <div className="flex flex-wrap gap-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatus(option.value)}
                  className={cn(
                    'px-2 py-1 text-xs rounded',
                    criteria.statuses.includes(option.value)
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operator filter */}
          {availableOperators.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 block mb-2">Operators</label>
              <div className="max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {availableOperators.slice(0, 10).map((operator) => (
                    <button
                      key={operator}
                      onClick={() => toggleOperator(operator)}
                      className={cn(
                        'px-2 py-1 text-xs rounded truncate max-w-[120px]',
                        criteria.operators.includes(operator)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      )}
                      title={operator}
                    >
                      {operator.length > 15 ? `${operator.slice(0, 15)}...` : operator}
                    </button>
                  ))}
                  {availableOperators.length > 10 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{availableOperators.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Presets */}
          {presets.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 block mb-2">Saved Presets</label>
              <div className="flex flex-wrap gap-1">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center gap-1">
                    <button
                      onClick={() => applyPreset(preset.id)}
                      className={cn(
                        'px-2 py-1 text-xs rounded',
                        'bg-white/10 text-gray-300 hover:bg-white/20'
                      )}
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="p-0.5 text-gray-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPresetModal(true)}
              className="text-xs"
            >
              <Bookmark className="w-3 h-3 mr-1" />
              Save Preset
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-red-400 hover:text-red-300"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Save preset modal */}
          {showPresetModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-4 w-80">
                <h3 className="text-sm font-medium text-white mb-3">Save Filter Preset</h3>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPresetModal(false);
                      setPresetName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
