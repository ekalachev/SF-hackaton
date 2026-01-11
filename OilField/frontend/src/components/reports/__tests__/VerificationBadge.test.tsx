/**
 * Tests for VerificationBadge Component
 * TDD: Tests written before implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationBadge } from '../VerificationBadge';
import type { VerificationState } from '../../../types/smt';

describe('VerificationBadge', () => {
  describe('initial/idle state', () => {
    it('should render nothing when no verification has been attempted', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: null,
        error: null,
      };

      const { container } = render(<VerificationBadge state={state} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should render loading badge when verifying', () => {
      const state: VerificationState = {
        isVerifying: true,
        result: null,
        error: null,
      };

      render(<VerificationBadge state={state} />);
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
    });

    it('should have yellow/amber styling for loading state', () => {
      const state: VerificationState = {
        isVerifying: true,
        result: null,
        error: null,
      };

      render(<VerificationBadge state={state} />);
      const badge = screen.getByText('Verifying...');
      expect(badge.className).toMatch(/amber|yellow/i);
    });

    it('should show loading spinner', () => {
      const state: VerificationState = {
        isVerifying: true,
        result: null,
        error: null,
      };

      render(<VerificationBadge state={state} />);
      expect(screen.getByTestId('verification-spinner')).toBeInTheDocument();
    });
  });

  describe('success state - satisfiable', () => {
    it('should render verified badge when satisfiable', () => {
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

      render(<VerificationBadge state={state} />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('should have green styling for verified state', () => {
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

      render(<VerificationBadge state={state} />);
      const badge = screen.getByText('Verified');
      expect(badge.className).toMatch(/green|emerald/i);
    });

    it('should show check icon for verified', () => {
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

      render(<VerificationBadge state={state} />);
      expect(screen.getByTestId('verification-check')).toBeInTheDocument();
    });
  });

  describe('success state - unsatisfiable', () => {
    it('should render unverified badge when unsatisfiable', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: {
          status: 'success',
          formal_code: '(assert false)',
          solver_output: 'unsat',
          is_satisfiable: false,
        },
        error: null,
      };

      render(<VerificationBadge state={state} />);
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('should have red styling for unverified state', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: {
          status: 'success',
          formal_code: '(assert false)',
          solver_output: 'unsat',
          is_satisfiable: false,
        },
        error: null,
      };

      render(<VerificationBadge state={state} />);
      const badge = screen.getByText('Unverified');
      expect(badge.className).toMatch(/red/i);
    });

    it('should show X icon for unverified', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: {
          status: 'success',
          formal_code: '(assert false)',
          solver_output: 'unsat',
          is_satisfiable: false,
        },
        error: null,
      };

      render(<VerificationBadge state={state} />);
      expect(screen.getByTestId('verification-x')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should render error badge on failure', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: null,
        error: 'Service unavailable',
      };

      render(<VerificationBadge state={state} />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should have red styling for error state', () => {
      const state: VerificationState = {
        isVerifying: false,
        result: null,
        error: 'Service unavailable',
      };

      render(<VerificationBadge state={state} />);
      const badge = screen.getByText('Error');
      expect(badge.className).toMatch(/red/i);
    });
  });

  describe('tooltip/details', () => {
    it('should show formal code on hover/click', async () => {
      const state: VerificationState = {
        isVerifying: false,
        result: {
          status: 'success',
          formal_code: '(declare-const npv Real)\n(assert (>= npv 0))',
          solver_output: 'sat',
          is_satisfiable: true,
        },
        error: null,
      };

      render(<VerificationBadge state={state} />);

      const badge = screen.getByText('Verified');
      await userEvent.click(badge);

      expect(screen.getByText(/declare-const npv Real/)).toBeInTheDocument();
    });

    it('should show solver output in details', async () => {
      const state: VerificationState = {
        isVerifying: false,
        result: {
          status: 'success',
          formal_code: '(check-sat)',
          solver_output: 'sat\nModel found',
          is_satisfiable: true,
        },
        error: null,
      };

      render(<VerificationBadge state={state} />);

      const badge = screen.getByText('Verified');
      await userEvent.click(badge);

      // The solver output includes "sat\nModel found"
      expect(screen.getByText(/Model found/)).toBeInTheDocument();
    });

    it('should show error message in tooltip', async () => {
      const state: VerificationState = {
        isVerifying: false,
        result: null,
        error: 'Service unavailable',
      };

      render(<VerificationBadge state={state} />);

      const badge = screen.getByText('Error');
      await userEvent.click(badge);

      expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const state: VerificationState = {
        isVerifying: true,
        result: null,
        error: null,
      };

      render(<VerificationBadge state={state} className="custom-class" />);
      const wrapper = screen.getByTestId('verification-badge-wrapper');
      expect(wrapper.className).toContain('custom-class');
    });
  });
});
