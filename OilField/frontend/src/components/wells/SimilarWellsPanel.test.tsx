import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { SimilarWellsPanel } from './SimilarWellsPanel'
import * as api from '@/lib/api'
import type { GetSimilarWellsResponse } from '@/types/api'

// Mock the API module
vi.mock('@/lib/api')

// Mock the logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
}))

// Test data
const mockSimilarWellsResponse: GetSimilarWellsResponse = {
  targetWell: {
    id: 'target-123',
    wellId: 'TGT-001',
    wellName: 'Target Well',
  },
  similarWells: [
    {
      well: {
        id: 'similar-1',
        wellId: 'SIM-001',
        wellName: 'Similar Well 1',
        status: 'active',
        production: {
          currentOilBblDay: 150,
          currentGasMcfDay: 500,
          cumulativeOilBbl: 50000,
          lastProductionDate: '2024-01-15',
          peakOilBblDay: 200,
          peakDate: '2023-06-01',
        },
        valuation: {
          npvUsd: 1850000,
          marketValueUsd: 2800000,
          discountPct: 34,
          confidence: 0.85,
        },
      },
      similarity: 0.92,
      matchReasons: [
        'Similar production profile',
        'Same geological formation',
        'Comparable valuation metrics',
      ],
    },
    {
      well: {
        id: 'similar-2',
        wellId: 'SIM-002',
        wellName: 'Similar Well 2',
        status: 'active',
        production: {
          currentOilBblDay: 145,
          currentGasMcfDay: 480,
          cumulativeOilBbl: 48000,
          lastProductionDate: '2024-01-15',
          peakOilBblDay: 195,
          peakDate: '2023-05-15',
        },
        valuation: {
          npvUsd: 1800000,
          marketValueUsd: 2700000,
          discountPct: 33,
          confidence: 0.83,
        },
      },
      similarity: 0.88,
      matchReasons: [
        'Similar decline curve',
        'Geographic proximity',
      ],
    },
  ],
}

describe('SimilarWellsPanel', () => {
  const createQueryClient = (): QueryClient =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

  const renderWithQueryClient = (ui: React.ReactElement): ReturnType<typeof render> => {
    const queryClient = createQueryClient()
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    )
  }

  describe('Loading State', () => {
    it('displays loading message while fetching data', () => {
      vi.mocked(api.getSimilarWells).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      expect(screen.getByText(/Finding similar wells/i)).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('displays similar wells with similarity scores', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('Similar Well 1')).toBeInTheDocument()
      })

      expect(screen.getByText('SIM-001')).toBeInTheDocument()
      expect(screen.getByText('92% match')).toBeInTheDocument()
      expect(screen.getByText('Similar Well 2')).toBeInTheDocument()
      expect(screen.getByText('SIM-002')).toBeInTheDocument()
      expect(screen.getByText('88% match')).toBeInTheDocument()
    })

    it('displays production metrics for each well', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('150 bbl/day')).toBeInTheDocument()
      })

      expect(screen.getByText('145 bbl/day')).toBeInTheDocument()
    })

    it('displays valuation metrics with discount percentage', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('34% undervalued')).toBeInTheDocument()
      })

      expect(screen.getByText('33% undervalued')).toBeInTheDocument()
    })

    it('displays match reasons for each well', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('Similar production profile')).toBeInTheDocument()
      })

      expect(screen.getByText('Same geological formation')).toBeInTheDocument()
      expect(screen.getByText('Comparable valuation metrics')).toBeInTheDocument()
      expect(screen.getByText('Similar decline curve')).toBeInTheDocument()
      expect(screen.getByText('Geographic proximity')).toBeInTheDocument()
    })

    it('displays AI-Powered badge', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('AI-Powered')).toBeInTheDocument()
      })
    })

    it('displays Sparkles icon', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument()
      })
    })
  })

  describe('User Interaction', () => {
    it('makes well items clickable with hover effect', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      const { container } = renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('Similar Well 1')).toBeInTheDocument()
      })

      const wellItems = container.querySelectorAll('.cursor-pointer')
      expect(wellItems.length).toBeGreaterThan(0)
    })

    it('calls onClick handler when well is clicked', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)
      const onWellClick = vi.fn()

      renderWithQueryClient(
        <SimilarWellsPanel wellId="test-123" onWellClick={onWellClick} />
      )

      await waitFor(() => {
        expect(screen.getByText('Similar Well 1')).toBeInTheDocument()
      })

      const wellItem = screen.getByText('Similar Well 1').closest('div')
      if (wellItem) {
        await userEvent.click(wellItem)
      }

      expect(onWellClick).toHaveBeenCalledWith('similar-1')
    })
  })

  describe('Emerald Theme', () => {
    it('applies emerald theme styling to card border', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      const { container } = renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('Similar Wells')).toBeInTheDocument()
      })

      const card = container.querySelector('.border-emerald-500\\/20')
      expect(card).toBeInTheDocument()
    })

    it('applies emerald theme to match reasons', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      const { container } = renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText('Similar production profile')).toBeInTheDocument()
      })

      const matchReason = container.querySelector('.text-emerald-400')
      expect(matchReason).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('calls getSimilarWells with correct wellId and limit', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-well-123" />)

      await waitFor(() => {
        expect(api.getSimilarWells).toHaveBeenCalledWith('test-well-123', { limit: 5 })
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      vi.mocked(api.getSimilarWells).mockRejectedValue(new Error('API Error'))

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText(/Error loading similar wells/i)).toBeInTheDocument()
      })
    })

    it('displays error with specific error message', async () => {
      vi.mocked(api.getSimilarWells).mockRejectedValue(new Error('Network timeout'))

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        expect(screen.getByText(/Network timeout/i)).toBeInTheDocument()
      })
    })
  })

  describe('Similarity Score Validation', () => {
    it('displays similarity scores in 0-100% range', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        const scores = screen.getAllByText(/\d+% match/)
        scores.forEach((scoreElement) => {
          const match = scoreElement.textContent?.match(/(\d+)% match/)
          if (match) {
            const score = parseInt(match[1])
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
          }
        })
      })
    })
  })

  describe('Match Reasons Validation', () => {
    it('displays contextual match reasons', async () => {
      vi.mocked(api.getSimilarWells).mockResolvedValue(mockSimilarWellsResponse)

      renderWithQueryClient(<SimilarWellsPanel wellId="test-123" />)

      await waitFor(() => {
        const matchReasons = screen.getAllByTestId('match-reason')
        expect(matchReasons.length).toBeGreaterThan(0)

        // Verify match reasons are contextual (contain relevant keywords)
        const reasonText = matchReasons.map((el) => el.textContent || '')
        const hasContextualReasons = reasonText.some((text) =>
          /production|formation|valuation|decline|geographic/i.test(text)
        )
        expect(hasContextualReasons).toBe(true)
      })
    })
  })
})
