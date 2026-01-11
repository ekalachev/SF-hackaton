/**
 * Tests for SMT Verification Service
 * Uses MSW for API mocking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { verifyClaims, checkHealth, getExamples, SMT_SERVICE_CONFIG, generateVerificationText } from './smtService';
import type { SMTVerificationResult } from '../types/smt';

describe('SMT Service', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('SMT_SERVICE_CONFIG', () => {
    it('should have correct base URL', () => {
      expect(SMT_SERVICE_CONFIG.baseUrl).toBe(
        'https://verticalslice-smt-service-d5hf3.ondigitalocean.app'
      );
    });

    it('should have 30 second timeout', () => {
      expect(SMT_SERVICE_CONFIG.timeout).toBe(30000);
    });
  });

  describe('verifyClaims', () => {
    it('should send POST request and return verification result', async () => {
      const mockResult: SMTVerificationResult = {
        status: 'success',
        formal_code: '(declare-const npv Real)\n(assert (>= npv 0))',
        solver_output: 'sat',
        is_satisfiable: true,
      };

      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return HttpResponse.json(mockResult);
        })
      );

      const result = await verifyClaims('NPV must be non-negative');

      expect(result).toEqual(mockResult);
      expect(result.is_satisfiable).toBe(true);
    });

    it('should return unsatisfiable result when constraints contradict', async () => {
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

      const result = await verifyClaims('Contradictory constraints');

      expect(result.is_satisfiable).toBe(false);
    });

    it('should throw error on network failure', async () => {
      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return HttpResponse.error();
        })
      );

      await expect(verifyClaims('Test')).rejects.toThrow();
    });

    it('should throw error on non-OK response', async () => {
      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      await expect(verifyClaims('Test')).rejects.toThrow(
        'SMT verification failed: 500 Internal Server Error'
      );
    });

    it('should throw error on 400 bad request', async () => {
      server.use(
        http.post(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/process`, () => {
          return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
        })
      );

      await expect(verifyClaims('Invalid input')).rejects.toThrow(
        'SMT verification failed: 400 Bad Request'
      );
    });

    it('should handle empty informal text', async () => {
      await expect(verifyClaims('')).rejects.toThrow('Informal text is required');
    });

    it('should handle whitespace-only informal text', async () => {
      await expect(verifyClaims('   ')).rejects.toThrow('Informal text is required');
    });
  });

  describe('checkHealth', () => {
    it('should return true when service is healthy', async () => {
      server.use(
        http.get(`${SMT_SERVICE_CONFIG.baseUrl}/health`, () => {
          return HttpResponse.json({ status: 'healthy' });
        })
      );

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(true);
    });

    it('should return false when service is unhealthy', async () => {
      server.use(
        http.get(`${SMT_SERVICE_CONFIG.baseUrl}/health`, () => {
          return new HttpResponse(null, { status: 503 });
        })
      );

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(false);
    });

    it('should return false on network error', async () => {
      server.use(
        http.get(`${SMT_SERVICE_CONFIG.baseUrl}/health`, () => {
          return HttpResponse.error();
        })
      );

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(false);
    });
  });

  describe('getExamples', () => {
    it('should fetch example inputs', async () => {
      const mockExamples = [
        { id: 1, text: 'Example 1' },
        { id: 2, text: 'Example 2' },
      ];

      server.use(
        http.get(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/examples`, () => {
          return HttpResponse.json(mockExamples);
        })
      );

      const examples = await getExamples();

      expect(examples).toEqual(mockExamples);
    });

    it('should throw error on failure', async () => {
      server.use(
        http.get(`${SMT_SERVICE_CONFIG.baseUrl}/pipeline/examples`, () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      await expect(getExamples()).rejects.toThrow(
        'Failed to fetch examples: 500 Internal Server Error'
      );
    });
  });

  describe('generateVerificationText', () => {
    it('should generate formatted verification text', () => {
      const result = generateVerificationText(
        'Test Well',
        {
          npvUsd: 1000000,
          marketValueUsd: 900000,
          discountPct: 10,
          confidence: 0.85,
          remainingReservesBbl: 50000,
        },
        '# Test Report\n\nRecommendation: Buy'
      );

      expect(result).toContain('Test Well');
      expect(result).toContain('1000000');
      expect(result).toContain('900000');
      expect(result).toContain('10%');
      expect(result).toContain('0.85');
      expect(result).toContain('50000');
      expect(result).toContain('Test Report');
    });

    it('should handle missing remaining reserves', () => {
      const result = generateVerificationText(
        'Test Well',
        {
          npvUsd: 1000000,
          marketValueUsd: 900000,
          discountPct: 10,
          confidence: 0.85,
        },
        '# Report'
      );

      expect(result).toContain('0 barrels');
    });
  });
});
