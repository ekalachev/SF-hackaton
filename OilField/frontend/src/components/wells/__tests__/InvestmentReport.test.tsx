/**
 * Tests for InvestmentReport Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvestmentReport } from '../InvestmentReport';
import * as smtService from '../../../lib/smtService';
import type { ReactNode } from 'react';

// Mock the SMT service
vi.mock('../../../lib/smtService', () => ({
  verifyClaims: vi.fn(),
  generateVerificationText: vi.fn(),
}));

// Mock fetch for report generation
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('InvestmentReport', () => {
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
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should render generate button initially', () => {
      render(<InvestmentReport wellId="well-123" />, { wrapper });
      expect(screen.getByText('Generate AI Investment Report')).toBeInTheDocument();
    });
  });

  describe('report generation', () => {
    it('should show loading state when generating report', async () => {
      // Create a pending promise
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText(/AI is analyzing/)).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!(new Response(JSON.stringify({
        report: '# Test Report',
        generatedAt: new Date().toISOString(),
      })));
    });

    it('should display report after generation', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            report: '# Investment Analysis\n\nThis is a test report.',
            generatedAt: new Date().toISOString(),
          })
        )
      );

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText('Investment Analysis Report')).toBeInTheDocument();
      });
    });
  });

  describe('SMT verification', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            report: '# Test Report\n\nRecommendation: Buy',
            generatedAt: new Date().toISOString(),
          })
        )
      );
    });

    it('should show verify button after report is generated', async () => {
      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText('Verify Claims')).toBeInTheDocument();
      });
    });

    it('should call verifyClaims when verify button is clicked', async () => {
      vi.mocked(smtService.verifyClaims).mockResolvedValueOnce({
        status: 'success',
        formal_code: '(check-sat)',
        solver_output: 'sat',
        is_satisfiable: true,
      });

      vi.mocked(smtService.generateVerificationText).mockReturnValueOnce('Test verification text');

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText('Verify Claims')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Verify Claims'));

      await waitFor(() => {
        expect(smtService.verifyClaims).toHaveBeenCalled();
      });
    });

    it('should show verification badge after verification', async () => {
      vi.mocked(smtService.verifyClaims).mockResolvedValueOnce({
        status: 'success',
        formal_code: '(declare-const npv Real)',
        solver_output: 'sat',
        is_satisfiable: true,
      });

      vi.mocked(smtService.generateVerificationText).mockReturnValueOnce('Test text');

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText('Verify Claims')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Verify Claims'));

      await waitFor(() => {
        expect(screen.getByText('Verified')).toBeInTheDocument();
      });
    });

    it('should show unverified badge when constraints are unsatisfiable', async () => {
      vi.mocked(smtService.verifyClaims).mockResolvedValueOnce({
        status: 'success',
        formal_code: '(assert false)',
        solver_output: 'unsat',
        is_satisfiable: false,
      });

      vi.mocked(smtService.generateVerificationText).mockReturnValueOnce('Test text');

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText('Verify Claims')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Verify Claims'));

      await waitFor(() => {
        expect(screen.getByText('Unverified')).toBeInTheDocument();
      });
    });

    it('should show error badge on verification failure', async () => {
      vi.mocked(smtService.verifyClaims).mockRejectedValueOnce(new Error('Service unavailable'));

      vi.mocked(smtService.generateVerificationText).mockReturnValueOnce('Test text');

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText('Verify Claims')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Verify Claims'));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message on report generation failure', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('', { status: 500, statusText: 'Internal Server Error' })
      );

      render(<InvestmentReport wellId="well-123" />, { wrapper });

      await userEvent.click(screen.getByText('Generate AI Investment Report'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate report/)).toBeInTheDocument();
      });
    });
  });
});
