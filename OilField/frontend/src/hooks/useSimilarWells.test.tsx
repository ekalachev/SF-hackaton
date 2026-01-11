/**
 * useSimilarWells Hook Tests
 * Following TDD - Enhanced with real data flow testing
 *
 * Test Structure:
 * - Basic structure tests
 * - Data fetching tests (verify API calls and data)
 * - Loading state tests (verify state transitions)
 * - Error handling tests (verify error states)
 * - Query enablement tests (verify conditional fetching)
 * - Parameter filtering tests (verify limit/threshold)
 * - Query key tests (verify React Query cache keys)
 */

import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/mocks/server';
import { errorHandlers } from '../test/mocks/handlers';
import { http, HttpResponse } from 'msw';

describe('useSimilarWells', () => {
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
      const { useSimilarWells } = await import('./useSimilarWells');
      expect(typeof useSimilarWells).toBe('function');
    });

    it('should return query result with data, isLoading, and error properties', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('test-id'), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should accept optional parameters', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(
        () => useSimilarWells('well-123', { limit: 5, threshold: 0.8 }),
        { wrapper }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch similar wells and update data', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      // Wait for data to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data structure
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('targetWell');
      expect(result.current.data).toHaveProperty('similarWells');

      // Verify target well
      expect(result.current.data?.targetWell).toHaveProperty('id');
      expect(result.current.data?.targetWell).toHaveProperty('wellId');
      expect(result.current.data?.targetWell).toHaveProperty('wellName');

      // Verify similar wells array
      expect(Array.isArray(result.current.data?.similarWells)).toBe(true);
      expect(result.current.data?.similarWells.length).toBeGreaterThan(0);
    });

    it('should include similarity scores in response', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const similarWell = result.current.data?.similarWells[0];
      expect(similarWell).toBeDefined();
      expect(similarWell).toHaveProperty('well');
      expect(similarWell).toHaveProperty('similarity');
      expect(typeof similarWell?.similarity).toBe('number');
      expect(similarWell?.similarity).toBeGreaterThanOrEqual(0);
      expect(similarWell?.similarity).toBeLessThanOrEqual(1);
    });

    it('should include well details in similar wells', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const similarWell = result.current.data?.similarWells[0];
      const well = similarWell?.well;
      expect(well).toBeDefined();
      expect(well).toHaveProperty('id');
      expect(well).toHaveProperty('wellId');
      expect(well).toHaveProperty('wellName');
      expect(well).toHaveProperty('status');
    });

    it('should include match reasons when available', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const similarWell = result.current.data?.similarWells[0];
      expect(similarWell).toHaveProperty('matchReasons');
      if (similarWell?.matchReasons) {
        expect(Array.isArray(similarWell.matchReasons)).toBe(true);
      }
    });
  });

  describe('Query Enablement', () => {
    it('should be disabled when wellId is null', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells(null), { wrapper });

      // Query should not run
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it('should enable query when wellId is provided', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      // Query should run
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should transition from disabled to enabled when wellId changes from null', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result, rerender } = renderHook(
        ({ wellId }) => useSimilarWells(wellId),
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

  describe('Parameter Filtering', () => {
    it('should apply limit parameter', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(
        () => useSimilarWells('well-123', { limit: 2 }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should respect limit
      expect(result.current.data?.similarWells.length).toBeLessThanOrEqual(2);
    });

    it('should apply threshold parameter', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(
        () => useSimilarWells('well-123', { threshold: 0.9 }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // All similarities should be >= threshold
      result.current.data?.similarWells.forEach((sw) => {
        expect(sw.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should apply both limit and threshold', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(
        () => useSimilarWells('well-123', { limit: 5, threshold: 0.8 }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const similarWells = result.current.data?.similarWells || [];
      expect(similarWells.length).toBeLessThanOrEqual(5);
      similarWells.forEach((sw) => {
        expect(sw.similarity).toBeGreaterThanOrEqual(0.8);
      });
    });
  });

  describe('Loading States', () => {
    it('should start with isLoading true and transition to false', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Should have data after loading
      expect(result.current.data).toBeDefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isFetching during data fetch', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

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

      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle 404 not found', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('not-found'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('should handle server errors (500)', async () => {
      server.use(
        http.get('http://localhost:3001/api/wells/:id/similar', () => {
          return HttpResponse.json(
            { message: 'Internal server error', statusCode: 500 },
            { status: 500 }
          );
        })
      );

      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Query Keys', () => {
    it('should use correct query key with wellId only', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const similarQuery = queries.find((q) => q.queryKey[0] === 'similar-wells');
        expect(similarQuery).toBeDefined();
        expect(similarQuery?.queryKey).toEqual(['similar-wells', 'well-123', {}]);
      });
    });

    it('should use correct query key with options', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const options = { limit: 5, threshold: 0.8 };
      renderHook(() => useSimilarWells('well-123', options), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const similarQuery = queries.find((q) => q.queryKey[0] === 'similar-wells');
        expect(similarQuery).toBeDefined();
        expect(similarQuery?.queryKey).toEqual(['similar-wells', 'well-123', options]);
      });
    });

    it('should create separate cache entries for different wells', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');

      const { result: result1 } = renderHook(() => useSimilarWells('well-1'), { wrapper });
      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      const { result: result2 } = renderHook(() => useSimilarWells('well-2'), { wrapper });
      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      const queries = queryClient.getQueryCache().getAll();
      const similarQueries = queries.filter((q) => q.queryKey[0] === 'similar-wells');
      expect(similarQueries.length).toBe(2);
    });
  });

  describe('Refetch', () => {
    it('should allow manual refetch', async () => {
      const { useSimilarWells } = await import('./useSimilarWells');
      const { result } = renderHook(() => useSimilarWells('well-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const initialData = result.current.data;

      const refetchResult = await result.current.refetch();

      expect(refetchResult.isSuccess).toBe(true);
      expect(refetchResult.data).toBeDefined();
      expect(refetchResult.data?.targetWell.id).toBe(initialData?.targetWell.id);
    });
  });
});
