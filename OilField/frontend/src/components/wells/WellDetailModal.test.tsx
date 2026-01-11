import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WellDetailModal } from './WellDetailModal';
import type { GetWellByIdResponse } from '@/types/api';
import * as api from '@/lib/api';

// Mock data
const mockWellData: GetWellByIdResponse = {
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

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('WellDetailModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('should not render when wellId is null', () => {
    renderWithProviders(
      <WellDetailModal wellId={null} onClose={vi.fn()} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog when wellId is provided', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should display well name and ID in header', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Smith County Well 47A')).toBeInTheDocument();
      expect(screen.getByText(/TX-2438/)).toBeInTheDocument();
      expect(screen.getByText(/Independent Oil Co/)).toBeInTheDocument();
    });
  });

  it('should display status badges with correct values', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      const body = document.body.textContent || '';
      expect(body).toMatch(/Undervalued.*34%/i);
      expect(body).toMatch(/45.*bbl.*day/i);
      expect(body).toMatch(/Active/i);
    });
  });

  it('should display valuation metrics', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      const body = document.body.textContent || '';
      expect(body).toMatch(/1\.8[0-9]M|1,850,000/i);
      expect(body).toMatch(/2\.[0-9]M|2,800,000/i);
      expect(body).toMatch(/34%/);
    });
  });

  it('should display remaining reserves and confidence', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      const body = document.body.textContent || '';
      expect(body).toMatch(/85,000|85000/);
      expect(body).toMatch(/89%/);
    });
  });

  it('should close modal when close button is clicked', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    await user.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show loading state while fetching data', async () => {
    let resolvePromise: (value: GetWellByIdResponse) => void;
    const promise = new Promise<GetWellByIdResponse>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(api, 'getWellById').mockReturnValue(promise);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolvePromise!(mockWellData);

    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByText('Smith County Well 47A')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should show error state when fetch fails', async () => {
    vi.spyOn(api, 'getWellById').mockRejectedValue(new Error('Failed to fetch'));

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display production history chart when production data available', async () => {
    vi.spyOn(api, 'getWellById').mockResolvedValue(mockWellData);

    renderWithProviders(
      <WellDetailModal wellId="1" onClose={vi.fn()} />
    );

    await waitFor(() => {
      const body = document.body.textContent || '';
      expect(body).toMatch(/Production History/i);
    });
  });
});
