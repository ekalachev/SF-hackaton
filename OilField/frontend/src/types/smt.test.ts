/**
 * Tests for SMT types
 * Validates type structure and compile-time safety
 */

import { describe, it, expect } from 'vitest';
import type {
  SMTVerificationRequest,
  SMTVerificationResult,
  VerificationState,
  VerificationBadgeProps,
  SMTServiceConfig,
} from './smt';

describe('SMT Types', () => {
  describe('SMTVerificationRequest', () => {
    it('should have correct structure', () => {
      const request: SMTVerificationRequest = {
        informal_text: 'Test constraints',
      };

      expect(request.informal_text).toBe('Test constraints');
    });
  });

  describe('SMTVerificationResult', () => {
    it('should have correct structure for successful result', () => {
      const result: SMTVerificationResult = {
        status: 'success',
        formal_code: '(declare-const x Int)',
        solver_output: 'sat',
        is_satisfiable: true,
      };

      expect(result.status).toBe('success');
      expect(result.formal_code).toBe('(declare-const x Int)');
      expect(result.solver_output).toBe('sat');
      expect(result.is_satisfiable).toBe(true);
    });

    it('should have correct structure for unsatisfiable result', () => {
      const result: SMTVerificationResult = {
        status: 'success',
        formal_code: '(assert false)',
        solver_output: 'unsat',
        is_satisfiable: false,
      };

      expect(result.is_satisfiable).toBe(false);
    });
  });

  describe('VerificationState', () => {
    it('should represent initial state', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: null,
        error: null,
      };

      expect(state.isVerifying).toBe(false);
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should represent loading state', () => {
      const state: VerificationState = {
        isVerifying: true,
        result: null,
        error: null,
      };

      expect(state.isVerifying).toBe(true);
    });

    it('should represent success state', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: {
          status: 'success',
          formal_code: '(check-sat)',
          solver_output: 'sat',
          is_satisfiable: true,
        },
        error: null,
      };

      expect(state.result).not.toBeNull();
      expect(state.result?.is_satisfiable).toBe(true);
    });

    it('should represent error state', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: null,
        error: 'Service unavailable',
      };

      expect(state.error).toBe('Service unavailable');
    });
  });

  describe('VerificationBadgeProps', () => {
    it('should have required state prop', () => {
      const props: VerificationBadgeProps = {
        state: {
          isVerifying: false,
          result: null,
          error: null,
        },
      };

      expect(props.state).toBeDefined();
    });

    it('should have optional className prop', () => {
      const props: VerificationBadgeProps = {
        state: {
          isVerifying: false,
          result: null,
          error: null,
        },
        className: 'custom-class',
      };

      expect(props.className).toBe('custom-class');
    });
  });

  describe('SMTServiceConfig', () => {
    it('should have correct structure', () => {
      const config: SMTServiceConfig = {
        baseUrl: 'https://example.com',
        timeout: 30000,
      };

      expect(config.baseUrl).toBe('https://example.com');
      expect(config.timeout).toBe(30000);
    });
  });
});
