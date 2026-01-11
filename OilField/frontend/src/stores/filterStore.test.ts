/**
 * Filter Store Tests
 * TDD - Tests written first following project guidelines
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore, getFilterStoreState } from './filterStore';
import { DEFAULT_FILTER_CRITERIA } from '@/types/filters';

describe('filterStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFilterStore.setState({
      criteria: DEFAULT_FILTER_CRITERIA,
      presets: [],
      searchHistory: [],
      activePresetId: null,
    });
  });

  describe('search', () => {
    it('should set search query', () => {
      useFilterStore.getState().setSearchQuery('test query');
      expect(useFilterStore.getState().criteria.searchQuery).toBe('test query');
    });

    it('should add to search history', () => {
      useFilterStore.getState().addToSearchHistory('first search');
      useFilterStore.getState().addToSearchHistory('second search');

      const history = useFilterStore.getState().searchHistory;
      expect(history).toHaveLength(2);
      expect(history[0].query).toBe('second search');
      expect(history[1].query).toBe('first search');
    });

    it('should not duplicate search history entries', () => {
      useFilterStore.getState().addToSearchHistory('same query');
      useFilterStore.getState().addToSearchHistory('same query');

      expect(useFilterStore.getState().searchHistory).toHaveLength(1);
    });

    it('should limit search history to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        useFilterStore.getState().addToSearchHistory(`query ${i}`);
      }

      expect(useFilterStore.getState().searchHistory).toHaveLength(10);
    });

    it('should clear search history', () => {
      useFilterStore.getState().addToSearchHistory('test');
      useFilterStore.getState().clearSearchHistory();

      expect(useFilterStore.getState().searchHistory).toHaveLength(0);
    });
  });

  describe('production range', () => {
    it('should set production range', () => {
      useFilterStore.getState().setProductionRange({ min: 50, max: 500 });

      const range = useFilterStore.getState().criteria.productionRange;
      expect(range.min).toBe(50);
      expect(range.max).toBe(500);
    });
  });

  describe('well age', () => {
    it('should set well age range', () => {
      useFilterStore.getState().setWellAge(5, 20);

      const age = useFilterStore.getState().criteria.wellAge;
      expect(age.minYears).toBe(5);
      expect(age.maxYears).toBe(20);
    });
  });

  describe('operators', () => {
    it('should set operators', () => {
      useFilterStore.getState().setOperators(['Op1', 'Op2']);
      expect(useFilterStore.getState().criteria.operators).toEqual(['Op1', 'Op2']);
    });

    it('should toggle operator on', () => {
      useFilterStore.getState().toggleOperator('TestOp');
      expect(useFilterStore.getState().criteria.operators).toContain('TestOp');
    });

    it('should toggle operator off', () => {
      useFilterStore.getState().setOperators(['TestOp']);
      useFilterStore.getState().toggleOperator('TestOp');
      expect(useFilterStore.getState().criteria.operators).not.toContain('TestOp');
    });
  });

  describe('well types', () => {
    it('should set well types', () => {
      useFilterStore.getState().setWellTypes(['horizontal', 'vertical']);
      expect(useFilterStore.getState().criteria.wellTypes).toEqual(['horizontal', 'vertical']);
    });

    it('should toggle well type', () => {
      useFilterStore.getState().toggleWellType('horizontal');
      expect(useFilterStore.getState().criteria.wellTypes).toContain('horizontal');

      useFilterStore.getState().toggleWellType('horizontal');
      expect(useFilterStore.getState().criteria.wellTypes).not.toContain('horizontal');
    });
  });

  describe('statuses', () => {
    it('should set statuses', () => {
      useFilterStore.getState().setStatuses(['active', 'plugged']);
      expect(useFilterStore.getState().criteria.statuses).toEqual(['active', 'plugged']);
    });

    it('should toggle status', () => {
      useFilterStore.getState().toggleStatus('active');
      expect(useFilterStore.getState().criteria.statuses).toContain('active');

      useFilterStore.getState().toggleStatus('active');
      expect(useFilterStore.getState().criteria.statuses).not.toContain('active');
    });
  });

  describe('sorting', () => {
    it('should set sort field', () => {
      useFilterStore.getState().setSortBy('valuation');
      expect(useFilterStore.getState().criteria.sortBy).toBe('valuation');
    });

    it('should set sort order', () => {
      useFilterStore.getState().setSortOrder('asc');
      expect(useFilterStore.getState().criteria.sortOrder).toBe('asc');
    });

    it('should toggle sort order', () => {
      expect(useFilterStore.getState().criteria.sortOrder).toBe('desc');

      useFilterStore.getState().toggleSortOrder();
      expect(useFilterStore.getState().criteria.sortOrder).toBe('asc');

      useFilterStore.getState().toggleSortOrder();
      expect(useFilterStore.getState().criteria.sortOrder).toBe('desc');
    });
  });

  describe('presets', () => {
    it('should save preset', () => {
      useFilterStore.getState().setSearchQuery('test');
      useFilterStore.getState().setStatuses(['active']);

      const id = useFilterStore.getState().savePreset('My Preset', 'Test description');

      const presets = useFilterStore.getState().presets;
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe(id);
      expect(presets[0].name).toBe('My Preset');
      expect(presets[0].criteria.searchQuery).toBe('test');
    });

    it('should apply preset', () => {
      const id = useFilterStore.getState().savePreset('Test Preset');
      useFilterStore.getState().setSearchQuery('new query');

      useFilterStore.getState().applyPreset(id);

      expect(useFilterStore.getState().activePresetId).toBe(id);
    });

    it('should delete preset', () => {
      const id = useFilterStore.getState().savePreset('To Delete');
      expect(useFilterStore.getState().presets).toHaveLength(1);

      useFilterStore.getState().deletePreset(id);
      expect(useFilterStore.getState().presets).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should reset filters to default', () => {
      useFilterStore.getState().setSearchQuery('test');
      useFilterStore.getState().setStatuses(['active']);

      useFilterStore.getState().resetFilters();

      expect(useFilterStore.getState().criteria).toEqual(DEFAULT_FILTER_CRITERIA);
      expect(useFilterStore.getState().activePresetId).toBeNull();
    });
  });

  describe('URL state', () => {
    it('should get URL params from current state', () => {
      useFilterStore.getState().setSearchQuery('test query');
      useFilterStore.getState().setStatuses(['active']);
      useFilterStore.getState().setSortBy('valuation');

      const params = useFilterStore.getState().getUrlParams();

      expect(params.get('q')).toBe('test query');
      expect(params.get('status')).toBe('active');
      expect(params.get('sort')).toBe('valuation');
    });

    it('should apply state from URL params', () => {
      const params = new URLSearchParams();
      params.set('q', 'url query');
      params.set('status', 'active,plugged');
      params.set('sort', 'discount');
      params.set('order', 'asc');

      useFilterStore.getState().applyFromUrl(params);

      expect(useFilterStore.getState().criteria.searchQuery).toBe('url query');
      expect(useFilterStore.getState().criteria.statuses).toEqual(['active', 'plugged']);
      expect(useFilterStore.getState().criteria.sortBy).toBe('discount');
      expect(useFilterStore.getState().criteria.sortOrder).toBe('asc');
    });
  });

  describe('getFilterStoreState', () => {
    it('should return current state without subscribing', () => {
      useFilterStore.getState().setSearchQuery('test');

      const state = getFilterStoreState();
      expect(state.criteria.searchQuery).toBe('test');
    });
  });
});
