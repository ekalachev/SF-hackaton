/**
 * WellDetailModal Integration Tests
 * Tests the complete data flow from API to UI with logging validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WellDetailModal } from './WellDetailModal';
import type { GetWellByIdResponse, WellDetail } from '@/types/api';
import * as api from '@/lib/api';
import logger from '@/lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    logPerformance: vi.fn(),
  },
}));

// Complete mock data
const mockCompleteWellData: GetWellByIdResponse = {
  well: {
    id: '1',
    wellId: 'TX-2438',
    wellName: 'Smith County Well 47A',
    apiNumber: '42-123-12345',
    status: 'active',
    operator: {
      id: 'op1',
      name: 'Independent Oil Co',
    },
    location: {
      latitude: 32.5,
      longitude: -95.3,
      county: 'Smith County',
      field: 'East Texas Field',
    },
    production: {
      currentOilBblDay: 45,
      currentGasMcfDay: 150,
      cumulativeOilBbl: 125000,
      lastProductionDate: '2024-10-01',
      peakOilBblDay: 85,
      peakDate: '2023-01-15',
    },
    valuation: {
      npvUsd: 1850000,
      marketValueUsd: 2800000,
      discountPct: 34,
      confidence: 89,
      remainingReservesBbl: 85000,
    },
  },
  productionHistory: [
    {
      date: '2024-10-01',
      oilBbl: 1350,
      gasMcf: 4500,
      waterBbl: 200,
      daysProduced: 30,
      oilBblDay: 45,
      gasMcfDay: 150,
    },
  ],
  latestValuation: {
    npvUsd: 1850000,
    marketValueUsd: 2800000,
    discountPct: 34,
    confidence: 89,
    remainingReservesBbl: 85000,
  },
  operator: {
    id: 'op1',
    name: 'Independent Oil Co',
  },
};

// Incomplete mock data (missing optional fields)
const mockIncompleteWellData: GetWellByIdResponse = {
  well: {
    id: '2',
    wellId: 'TX-9999',
    wellName: 'Incomplete Well',
    status: 'active',
  } as WellDetail,
  productionHistory: [],
  latestValuation: null,
  operator: null,
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('WellDetailModal Data Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  describe('Complete Data Flow', () => {
    it('should log modal opening', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith(
          'ui',
          expect.stringContaining('WellDetailModal opened for well: 1')
        );
      });
    });

    it('should log API fetch request', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith(
          'api',
          expect.stringContaining('Fetching well details: 1')
        );
      });
    });

    it('should log performance metrics', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.logPerformance).toHaveBeenCalledWith(
          'Well detail fetch',
          expect.any(Number),
          'ms'
        );
      });
    });

    it('should log successful data load', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalledWith(
          'state',
          'Well detail loaded',
          expect.objectContaining({
            wellId: '1',
            hasProduction: true,
            hasValuation: true,
            hasOperator: true,
          })
        );
      });
    });

    it('should log modal data update', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalledWith(
          'state',
          'Modal data updated',
          expect.objectContaining({
            wellId: '1',
            hasProduction: true,
            hasValuation: true,
            hasOperator: true,
          })
        );
      });
    });

    it('should display all modal sections with complete data', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        // Header section
        expect(screen.getByTestId('well-name')).toHaveTextContent(
          'Smith County Well 47A'
        );
        expect(screen.getByTestId('well-id')).toBeInTheDocument();

        // Badges section
        expect(screen.getByTestId('well-badges')).toBeInTheDocument();

        // Production history section
        expect(screen.getByTestId('production-history-section')).toBeInTheDocument();

        // Valuation metrics section
        expect(screen.getByTestId('valuation-metrics')).toBeInTheDocument();
        expect(screen.getByTestId('ai-value-card')).toBeInTheDocument();
        expect(screen.getByTestId('market-value-card')).toBeInTheDocument();
        expect(screen.getByTestId('discount-card')).toBeInTheDocument();
      });
    });

    it('should not warn about missing data when all fields present', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Smith County Well 47A')).toBeInTheDocument();
      });

      // Should not have any warn logs for complete data
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Incomplete Data Handling', () => {
    it('should log warnings for missing optional fields', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockIncompleteWellData);

      renderWithProviders(<WellDetailModal wellId="2" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalledWith(
          'api',
          'Optional well data missing',
          expect.objectContaining({
            wellId: '2',
            warnings: expect.arrayContaining([
              'location',
              'production',
              'valuation',
              'operator',
            ]),
          })
        );
      });
    });

    it('should handle missing production history gracefully', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockIncompleteWellData);

      renderWithProviders(<WellDetailModal wellId="2" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete Well')).toBeInTheDocument();
      });

      // Production history section should not render
      expect(
        screen.queryByTestId('production-history-section')
      ).not.toBeInTheDocument();
    });

    it('should handle missing valuation gracefully', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockIncompleteWellData);

      renderWithProviders(<WellDetailModal wellId="2" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete Well')).toBeInTheDocument();
      });

      // Valuation metrics section should not render
      expect(screen.queryByTestId('valuation-metrics')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should log API errors', async () => {
      const error = new Error('API Error');
      vi.spyOn(api, 'getWellById').mockRejectedValue(error);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'api',
          expect.stringContaining('Failed to fetch well details: 1'),
          expect.objectContaining({
            error: 'API Error',
          })
        );
      });
    });

    it('should log UI errors', async () => {
      const error = new Error('Fetch failed');
      vi.spyOn(api, 'getWellById').mockRejectedValue(error);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'ui',
          'Error in WellDetailModal',
          expect.objectContaining({
            wellId: '1',
            error: 'Fetch failed',
          })
        );
      });
    });

    it('should display error state in UI', async () => {
      vi.spyOn(api, 'getWellById').mockRejectedValue(new Error('Failed'));

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/error loading well details/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Updates', () => {
    it('should log when switching wells', async () => {
      vi.spyOn(api, 'getWellById').mockResolvedValue(mockCompleteWellData);

      const { rerender } = renderWithProviders(
        <WellDetailModal wellId="1" onClose={vi.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('Smith County Well 47A')).toBeInTheDocument();
      });

      vi.clearAllMocks();

      // Switch to different well
      rerender(
        <QueryClientProvider client={queryClient}>
          <WellDetailModal wellId="2" onClose={vi.fn()} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith(
          'ui',
          expect.stringContaining('WellDetailModal opened for well: 2')
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should log loading state', async () => {
      let resolvePromise: (value: GetWellByIdResponse) => void;
      const promise = new Promise<GetWellByIdResponse>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(api, 'getWellById').mockReturnValue(promise);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalledWith(
          'ui',
          expect.stringContaining('Loading well details for: 1')
        );
      });

      resolvePromise!(mockCompleteWellData);

      await waitFor(() => {
        expect(screen.getByText('Smith County Well 47A')).toBeInTheDocument();
      });
    });

    it('should display loading state in UI', async () => {
      let resolvePromise: (value: GetWellByIdResponse) => void;
      const promise = new Promise<GetWellByIdResponse>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(api, 'getWellById').mockReturnValue(promise);

      renderWithProviders(<WellDetailModal wellId="1" onClose={vi.fn()} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText(/loading well details/i)).toBeInTheDocument();

      resolvePromise!(mockCompleteWellData);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      });
    });
  });
});
