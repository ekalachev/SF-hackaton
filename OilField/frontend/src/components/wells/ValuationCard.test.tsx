import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ValuationCard from './ValuationCard'

interface CountUpProps {
  end: number
  separator?: string
  prefix?: string
  suffix?: string
}

// Mock react-countup to simplify testing
vi.mock('react-countup', () => ({
  default: ({ end, prefix = '', suffix = '' }: CountUpProps) => {
    const formatted = end.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return <span>{prefix}{formatted}{suffix}</span>
  }
}))

describe('ValuationCard', () => {
  describe('AI Value Card', () => {
    it('renders AI value with formatted number', () => {
      render(
        <ValuationCard
          title="AI Value"
          value={1850000}
          type="currency"
        />
      )

      expect(screen.getByText('AI Value')).toBeInTheDocument()
      expect(screen.getByText(/1,850,000/)).toBeInTheDocument()
    })

    it('displays dollar sign for currency type', () => {
      render(
        <ValuationCard
          title="AI Value"
          value={1850000}
          type="currency"
        />
      )

      expect(screen.getByText(/\$/)).toBeInTheDocument()
    })
  })

  describe('Market Value Card', () => {
    it('renders market value with formatted number', () => {
      render(
        <ValuationCard
          title="Market Value"
          value={2800000}
          type="currency"
        />
      )

      expect(screen.getByText('Market Value')).toBeInTheDocument()
      expect(screen.getByText(/2,800,000/)).toBeInTheDocument()
    })
  })

  describe('Discount Percentage Card', () => {
    it('renders positive discount percentage', () => {
      const { container } = render(
        <ValuationCard
          title="Discount"
          value={34}
          type="percentage"
        />
      )

      expect(screen.getByText('Discount')).toBeInTheDocument()
      expect(screen.getByText('34')).toBeInTheDocument()
      expect(container.textContent).toContain('%')
    })

    it('displays percent sign for percentage type', () => {
      const { container } = render(
        <ValuationCard
          title="Discount"
          value={34}
          type="percentage"
        />
      )

      expect(container.textContent).toContain('%')
    })

    it('applies green color for positive discount (undervalued)', () => {
      const { container } = render(
        <ValuationCard
          title="Discount"
          value={34}
          type="percentage"
          colorScheme="positive"
        />
      )

      const valueElement = container.querySelector('.text-green-600')
      expect(valueElement).toBeInTheDocument()
    })

    it('applies red color for negative discount (overvalued)', () => {
      const { container } = render(
        <ValuationCard
          title="Discount"
          value={-15}
          type="percentage"
          colorScheme="negative"
        />
      )

      const valueElement = container.querySelector('.text-red-600')
      expect(valueElement).toBeInTheDocument()
    })
  })

  describe('Number Formatting', () => {
    it('formats large numbers with commas', () => {
      const { container } = render(
        <ValuationCard
          title="Test"
          value={5000000}
          type="currency"
        />
      )

      expect(container.textContent).toContain('5,000,000')
    })

    it('formats small numbers correctly', () => {
      const { container } = render(
        <ValuationCard
          title="Test"
          value={100}
          type="percentage"
        />
      )

      expect(container.textContent).toContain('100')
    })
  })

  describe('Animation', () => {
    it('uses CountUp component for animation', () => {
      const { container } = render(
        <ValuationCard
          title="AI Value"
          value={1850000}
          type="currency"
        />
      )

      // CountUp wraps the value in a span
      const countUpElement = container.querySelector('span')
      expect(countUpElement).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('applies card styling for responsive grid', () => {
      const { container } = render(
        <ValuationCard
          title="AI Value"
          value={1850000}
          type="currency"
        />
      )

      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('rounded-lg')
    })
  })
})
