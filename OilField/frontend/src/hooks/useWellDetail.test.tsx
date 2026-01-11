/**
 * useWellDetail Hook Tests
 * Following TDD - Enhanced with real data flow testing
 *
 * Test Structure:
 * - Basic structure tests
 * - Data fetching tests (verify API calls and complete well detail data)
 * - Loading state tests (verify state transitions)
 * - Error handling tests (verify error states)
 * - Query enablement tests (verify conditional fetching)
 * - Data completeness tests (verify production history, valuation, operator)
 * - Query key tests (verify React Query cache keys)
 */

import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/mocks/server';
import { errorHandlers } from '../test/mocks/handlers';
import { http, HttpResponse } from 'msw';

describe('useWellDetail', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Basic Structure', () => {
    it('should be a function', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      expect(typeof useWellDetail).toBe('function');
    });

    it('should return query result with data, isLoading, and error properties', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('test-id'), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should accept string wellId parameter', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      expect(result.current).toBeDefined();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch well detail and update data', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      // Wait for data to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data structure
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('well');
      expect(result.current.data).toHaveProperty('productionHistory');
      expect(result.current.data).toHaveProperty('latestValuation');
      expect(result.current.data).toHaveProperty('operator');
    });

    it('should include complete well information', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const well = result.current.data?.well;
      expect(well).toBeDefined();
      expect(well).toHaveProperty('id');
      expect(well).toHaveProperty('wellId');
      expect(well).toHaveProperty('wellName');
      expect(well).toHaveProperty('status');
      expect(well).toHaveProperty('operator');
      expect(well).toHaveProperty('location');
      expect(well).toHaveProperty('production');
      expect(well).toHaveProperty('valuation');

      // WellDetail specific fields
      expect(well).toHaveProperty('completionDate');
      expect(well).toHaveProperty('totalDepthFt');
    });

    it('should include production history array', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const productionHistory = result.current.data?.productionHistory;
      expect(productionHistory).toBeDefined();
      expect(Array.isArray(productionHistory)).toBe(true);
      expect(productionHistory!.length).toBeGreaterThan(0);

      // Verify production history entry structure
      const entry = productionHistory![0];
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('oilBbl');
      expect(entry).toHaveProperty('gasMcf');
      expect(entry).toHaveProperty('waterBbl');
      expect(entry).toHaveProperty('daysProduced');
      expect(entry).toHaveProperty('oilBblDay');
      expect(entry).toHaveProperty('gasMcfDay');
    });

    it('should include latest valuation data', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const valuation = result.current.data?.latestValuation;
      expect(valuation).toBeDefined();
      expect(valuation).toHaveProperty('npvUsd');
      expect(valuation).toHaveProperty('marketValueUsd');
      expect(valuation).toHaveProperty('discountPct');
      expect(valuation).toHaveProperty('confidence');
    });

    it('should include operator information', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const operator = result.current.data?.operator;
      expect(operator).toBeDefined();
      expect(operator).toHaveProperty('id');
      expect(operator).toHaveProperty('name');
    });

    it('should fetch different well when wellId changes', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result, rerender } = renderHook(
        ({ wellId }) => useWellDetail(wellId),
        { wrapper, initialProps: { wellId: 'well-1' } }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.well.id).toBe('well-1');

      // Change to different well
      rerender({ wellId: 'well-2' });

      await waitFor(() => expect(result.current.data?.well.id).toBe('well-2'));
    });
  });

  describe('Query Enablement', () => {
    it('should be disabled when wellId is null', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail(null), { wrapper });

      // Query should not run
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it('should enable query when wellId is provided', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      // Query should run
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should transition from disabled to enabled when wellId changes from null', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result, rerender } = renderHook(
        ({ wellId }) => useWellDetail(wellId),
        { wrapper, initialProps: { wellId: null as string | null } }
      );

      // Initially disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();

      // Update to valid wellId
      rerender({ wellId: 'well-123' });

      // Should now load data
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('Loading States', () => {
    it('should start with isLoading true and transition to false', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Should have data after loading
      expect(result.current.data).toBeDefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isPending during initial load', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      expect(result.current.isPending).toBe(true);

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isFetching during data fetch', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      // Should be fetching initially
      expect(result.current.isFetching).toBe(true);

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Override with error handlers
      server.use(...errorHandlers);

      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle 404 not found', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('not-found'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('should handle server errors (500)', async () => {
      server.use(
        http.get('http://localhost:3001/api/wells/:id', () => {
          return HttpResponse.json(
            { message: 'Internal server error', statusCode: 500 },
            { status: 500 }
          );
        })
      );

      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Query Keys', () => {
    it('should use correct query key', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const wellQuery = queries.find((q) => q.queryKey[0] === 'well');
        expect(wellQuery).toBeDefined();
        expect(wellQuery?.queryKey).toEqual(['well', 'well-123']);
      });
    });

    it('should create separate cache entries for different wells', async () => {
      const { useWellDetail } = await import('./useWellDetail');

      const { result: result1 } = renderHook(() => useWellDetail('well-1'), { wrapper });
      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      const { result: result2 } = renderHook(() => useWellDetail('well-2'), { wrapper });
      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      const queries = queryClient.getQueryCache().getAll();
      const wellQueries = queries.filter((q) => q.queryKey[0] === 'well');
      expect(wellQueries.length).toBe(2);
    });

    it('should use null in query key when wellId is null', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      renderHook(() => useWellDetail(null), { wrapper });

      // Query key is created even when disabled, but with null wellId
      const queries = queryClient.getQueryCache().getAll();
      const wellQueries = queries.filter((q) => q.queryKey[0] === 'well');

      if (wellQueries.length > 0) {
        // If cache entry exists, verify it has null wellId
        expect(wellQueries[0].queryKey).toEqual(['well', null]);
      }
    });
  });

  describe('Refetch', () => {
    it('should allow manual refetch', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const initialData = result.current.data;

      const refetchResult = await result.current.refetch();

      expect(refetchResult.isSuccess).toBe(true);
      expect(refetchResult.data).toBeDefined();
      expect(refetchResult.data?.well.id).toBe(initialData?.well.id);
    });
  });

  describe('Data Completeness', () => {
    it('should have valid production history dates in descending order', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const history = result.current.data?.productionHistory || [];
      expect(history.length).toBeGreaterThan(1);

      // Verify dates are valid and in descending order
      for (let i = 0; i < history.length - 1; i++) {
        const currentDate = new Date(history[i].date);
        const nextDate = new Date(history[i + 1].date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('should have valid production metrics', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const production = result.current.data?.well.production;
      expect(production).toBeDefined();
      expect(production!.currentOilBblDay).toBeGreaterThanOrEqual(0);
      expect(production!.currentGasMcfDay).toBeGreaterThanOrEqual(0);
      expect(production!.cumulativeOilBbl).toBeGreaterThanOrEqual(0);
    });

    it('should have valid valuation metrics', async () => {
      const { useWellDetail } = await import('./useWellDetail');
      const { result } = renderHook(() => useWellDetail('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const valuation = result.current.data?.latestValuation;
      expect(valuation).toBeDefined();
      expect(valuation!.npvUsd).toBeGreaterThan(0);
      expect(valuation!.confidence).toBeGreaterThan(0);
      expect(valuation!.confidence).toBeLessThanOrEqual(1);
    });
  });
});
