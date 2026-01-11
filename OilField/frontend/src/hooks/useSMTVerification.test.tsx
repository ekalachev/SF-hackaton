/**
 * Tests for useSMTVerification Hook
 * Uses MSW for API mocking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { useSMTVerification } from './useSMTVerification';
import { SMT_SERVICE_CONFIG } from '../lib/smtService';
import type { SMTVerificationResult } from '../types/smt';
import type { ReactNode } from 'react';

describe('useSMTVerification', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    server.resetHandlers();
  });

  describe('initial state', () => {
    it('should return initial verification state', () => {
      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      expect(result.current.verificationState.isVerifying).toBe(false);
      expect(result.current.verificationState.result).toBeNull();
      expect(result.current.verificationState.error).toBeNull();
    });

    it('should provide verify function', () => {
      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      expect(typeof result.current.verify).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('verify function', () => {
    it('should update state with result on success', async () => {
      const mockResult: SMTVerificationResult = {
        status: 'success',
        formal_code: '(declare-const x Int)',
        solver_output: 'sat',
        is_satisfiable: true,
      };

      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return HttpResponse.json(mockResult);
        })
      );

      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      act(() => {
        result.current.verify('Test constraints');
      });

      await waitFor(() => {
        expect(result.current.verificationState.isVerifying).toBe(false);
        expect(result.current.verificationState.result).toEqual(mockResult);
        expect(result.current.verificationState.error).toBeNull();
      });
    });

    it('should update state with error on failure', async () => {
      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      act(() => {
        result.current.verify('Test');
      });

      await waitFor(() => {
        expect(result.current.verificationState.isVerifying).toBe(false);
        expect(result.current.verificationState.result).toBeNull();
        expect(result.current.verificationState.error).toBeTruthy();
      });
    });

    it('should handle unsatisfiable result', async () => {
      const mockResult: SMTVerificationResult = {
        status: 'success',
        formal_code: '(assert false)',
        solver_output: 'unsat',
        is_satisfiable: false,
      };

      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return HttpResponse.json(mockResult);
        })
      );

      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      act(() => {
        result.current.verify('Contradictory');
      });

      await waitFor(() => {
        expect(result.current.verificationState.result?.is_satisfiable).toBe(false);
      });
    });
  });

  describe('reset function', () => {
    it('should reset verification state', async () => {
      const mockResult: SMTVerificationResult = {
        status: 'success',
        formal_code: '(check-sat)',
        solver_output: 'sat',
        is_satisfiable: true,
      };

      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return HttpResponse.json(mockResult);
        })
      );

      const { result } = renderHook(() => useSMTVerification(), { wrapper });

      // First verify
      act(() => {
        result.current.verify('Test');
      });

      await waitFor(() => {
        expect(result.current.verificationState.result).not.toBeNull();
      });

      // Then reset
      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.verificationState.isVerifying).toBe(false);
        expect(result.current.verificationState.result).toBeNull();
        expect(result.current.verificationState.error).toBeNull();
      });
    });
  });
});
