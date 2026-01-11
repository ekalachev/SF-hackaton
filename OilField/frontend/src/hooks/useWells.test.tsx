/**
 * useWells Hook Tests
 * Following TDD - Enhanced with real data flow testing
 *
 * Test Structure:
 * - Basic structure tests
 * - Data fetching tests (verify API calls and data)
 * - Loading state tests (verify state transitions)
 * - Error handling tests (verify error states)
 * - Data transformation tests (verify response processing)
 * - Query key tests (verify React Query cache keys)
 */

import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/mocks/server';
import { errorHandlers } from '../test/mocks/handlers';
import { http, HttpResponse } from 'msw';

describe('useWells', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create fresh QueryClient for each test to avoid state pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Basic Structure', () => {
    it('should be a function', async () => {
      const { useWells } = await import('./useWells');
      expect(typeof useWells).toBe('function');
    });

    it('should return query result with data, isLoading, and error properties', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should accept optional filters parameter', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells({ limit: 20 }), { wrapper });

      expect(result.current).toBeDefined();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch wells and update data', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells({ limit: 10 }), { wrapper });

      // Wait for data to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data structure
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('wells');
      expect(result.current.data).toHaveProperty('total');
      expect(result.current.data).toHaveProperty('limit');
      expect(result.current.data).toHaveProperty('offset');
      expect(result.current.data).toHaveProperty('hasMore');

      // Verify wells array
      expect(Array.isArray(result.current.data?.wells)).toBe(true);
      expect(result.current.data?.wells.length).toBe(10);
    });

    it('should fetch wells with default filters', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should have default pagination
      expect(result.current.data?.limit).toBe(10);
      expect(result.current.data?.offset).toBe(0);
    });

    it('should apply county filter when provided', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells({ county: 'WEBB' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // All wells should have WEBB county
      result.current.data?.wells.forEach((well) => {
        expect(well.location?.county).toBe('WEBB');
      });
    });

    it('should apply limit and offset filters', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells({ limit: 5, offset: 10 }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.limit).toBe(5);
      expect(result.current.data?.offset).toBe(10);
      expect(result.current.data?.wells.length).toBe(5);
    });

    it('should include well properties in response', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells({ limit: 1 }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const well = result.current.data?.wells[0];
      expect(well).toBeDefined();
      expect(well).toHaveProperty('id');
      expect(well).toHaveProperty('wellId');
      expect(well).toHaveProperty('wellName');
      expect(well).toHaveProperty('status');
      expect(well).toHaveProperty('operator');
      expect(well).toHaveProperty('location');
      expect(well).toHaveProperty('production');
      expect(well).toHaveProperty('valuation');
    });
  });

  describe('Loading States', () => {
    it('should start with isLoading true and transition to false', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

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
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      // Check isPending state
      expect(result.current.isPending).toBe(true);

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isFetching during data fetch', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      // Should be fetching initially
      expect(result.current.isFetching).toBe(true);

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Override handlers with error handlers
      server.use(...errorHandlers);

      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle server errors (500)', async () => {
      // Mock 500 error
      server.use(
        http.get('http://localhost:3001/api/wells', () => {
          return HttpResponse.json(
            { message: 'Internal server error', statusCode: 500 },
            { status: 500 }
          );
        })
      );

      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Query Keys', () => {
    it('should use correct query key with no filters', async () => {
      const { useWells } = await import('./useWells');
      renderHook(() => useWells(), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const wellsQuery = queries.find((q) => q.queryKey[0] === 'wells');
        expect(wellsQuery).toBeDefined();
        expect(wellsQuery?.queryKey).toEqual(['wells', {}]);
      });
    });

    it('should use correct query key with filters', async () => {
      const { useWells } = await import('./useWells');
      const filters = { limit: 10, county: 'WEBB' };
      renderHook(() => useWells(filters), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const wellsQuery = queries.find((q) => q.queryKey[0] === 'wells');
        expect(wellsQuery).toBeDefined();
        expect(wellsQuery?.queryKey).toEqual(['wells', filters]);
      });
    });

    it('should create separate cache entries for different filters', async () => {
      const { useWells } = await import('./useWells');

      // First hook with filters
      const { result: result1 } = renderHook(() => useWells({ limit: 5 }), { wrapper });
      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Second hook with different filters
      const { result: result2 } = renderHook(() => useWells({ limit: 10 }), { wrapper });
      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      // Should have 2 separate cache entries
      const queries = queryClient.getQueryCache().getAll();
      const wellsQueries = queries.filter((q) => q.queryKey[0] === 'wells');
      expect(wellsQueries.length).toBe(2);
    });
  });

  describe('Refetch', () => {
    it('should allow manual refetch', async () => {
      const { useWells } = await import('./useWells');
      const { result } = renderHook(() => useWells(), { wrapper });

      // Wait for initial data
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const initialData = result.current.data;

      // Refetch
      const refetchResult = await result.current.refetch();

      expect(refetchResult.isSuccess).toBe(true);
      expect(refetchResult.data).toBeDefined();
      // Data should be similar (from same mock)
      expect(refetchResult.data?.wells.length).toBe(initialData?.wells.length);
    });
  });
});
