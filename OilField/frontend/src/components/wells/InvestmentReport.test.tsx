import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvestmentReport } from './InvestmentReport';

// Mock react-markdown to simplify testing
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    logPerformance: vi.fn(),
  },
}));

// Mock data
const mockReportData = {
  report: '# Investment Analysis\n\nThis is a test report with **bold** text.',
  generatedAt: '2024-10-31T10:00:00Z'
};

describe('InvestmentReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const renderComponent = (wellId = 'test-well-123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InvestmentReport wellId={wellId} />
      </QueryClientProvider>
    );
  };

  describe('Initial Render', () => {
    it('renders generate button initially', () => {
      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      expect(button).toBeInTheDocument();
    });

    it('button contains Sparkles icon', () => {
      renderComponent();

      // Lucide icons render as SVG elements
      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('does not show report card initially', () => {
      renderComponent();

      expect(screen.queryByText(/investment analysis report/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when generating report', async () => {
      const user = userEvent.setup();

      // Mock fetch to delay response
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        new Promise(() => {}) // Never resolves to keep loading state
      );

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/ai is analyzing this well/i)).toBeInTheDocument();
      });
    });

    it('displays loading message with time estimate', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        new Promise(() => {})
      );

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/this usually takes 3-5 seconds/i)).toBeInTheDocument();
      });
    });

    it('shows animated Sparkles icon during loading', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        new Promise(() => {})
      );

      const { container } = renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Report Display', () => {
    it('displays report after successful generation', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/investment analysis report/i)).toBeInTheDocument();
      });
    });

    it('renders markdown content using ReactMarkdown', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toBeInTheDocument();
        expect(markdownContent).toHaveTextContent(/investment analysis/i);
      });
    });

    it('displays generation timestamp', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/report generated/i)).toBeInTheDocument();
      });
    });

    it('shows "Powered by Claude AI" attribution', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/powered by claude ai/i)).toBeInTheDocument();
      });
    });
  });

  describe('Download PDF Button', () => {
    it('shows download PDF button after report is generated', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent();

      const generateButton = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(generateButton);

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download pdf/i });
        expect(downloadButton).toBeInTheDocument();
      });
    });

    it('download button contains Download icon', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent();

      const generateButton = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(generateButton);

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download pdf/i });
        expect(downloadButton.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls correct API endpoint with well ID', async () => {
      const user = userEvent.setup();
      const wellId = 'test-well-456';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      renderComponent(wellId);

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/wells/${wellId}/generate-report`,
          { method: 'POST' }
        );
      });
    });

    it('only makes API call when button is clicked', () => {
      renderComponent();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Animations', () => {
    it('applies proper card styling to report container', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      const { container } = renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        const card = container.querySelector('.rounded-lg');
        expect(card).toBeInTheDocument();
      });
    });

    it('makes report content scrollable with prose styling', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      const { container } = renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        const proseContainer = container.querySelector('.prose');
        expect(proseContainer).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when report generation fails', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate report/i)).toBeInTheDocument();
      });
    });

    it('shows try again button on error', async () => {
      const user = userEvent.setup();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();

      // First call fails
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate report/i)).toBeInTheDocument();
      });

      // Second call succeeds
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockReportData
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/investment analysis report/i)).toBeInTheDocument();
      });
    });
  });

  describe('Report Sections Validation', () => {
    it('validates report contains required sections', async () => {
      const user = userEvent.setup();

      const reportWithSections = {
        report: `## Executive Summary
Lorem ipsum dolor sit amet.

## Well Overview
Production data and well information.

## Production Analysis
Historical production trends.

## Economic Valuation
NPV and valuation metrics.`,
        generatedAt: '2024-10-31T10:00:00Z'
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => reportWithSections
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent.textContent).toContain('Executive Summary');
        expect(markdownContent.textContent).toContain('Well Overview');
        expect(markdownContent.textContent).toContain('Production Analysis');
        expect(markdownContent.textContent).toContain('Economic Valuation');
      });
    });
  });

  describe('Markdown Rendering', () => {
    it('renders markdown with proper formatting', async () => {
      const user = userEvent.setup();

      const reportWithMarkdown = {
        report: `## Executive Summary

This well shows **strong production** with *stable* decline curves.

- Key Point 1
- Key Point 2
- Key Point 3`,
        generatedAt: '2024-10-31T10:00:00Z'
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => reportWithMarkdown
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /generate ai investment report/i });
      await user.click(button);

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toBeInTheDocument();
        // Verify markdown content is passed to ReactMarkdown
        expect(markdownContent.textContent).toContain('Executive Summary');
        expect(markdownContent.textContent).toContain('strong production');
      });
    });
  });
});
