import React from 'react'
import CountUp from 'react-countup'

/**
 * Type of value to display in the card
 */
export type ValuationCardType = 'currency' | 'percentage'

/**
 * Color scheme for the card value
 */
export type ValuationCardColorScheme = 'positive' | 'negative' | 'neutral'

/**
 * Props for ValuationCard component
 */
export interface ValuationCardProps {
  /**
   * Title displayed at the top of the card
   */
  title: string

  /**
   * Numeric value to display
   */
  value: number

  /**
   * Type of value (currency or percentage)
   */
  type: ValuationCardType

  /**
   * Color scheme for the value (optional, defaults to neutral)
   */
  colorScheme?: ValuationCardColorScheme

  /**
   * Duration of count-up animation in seconds (optional, defaults to 2)
   */
  duration?: number
}

/**
 * Gets the CSS class for value color based on color scheme
 * @param colorScheme - The color scheme to apply
 * @returns CSS class string
 */
const getColorClass = (colorScheme: ValuationCardColorScheme): string => {
  switch (colorScheme) {
    case 'positive':
      return 'text-green-600'
    case 'negative':
      return 'text-red-600'
    case 'neutral':
    default:
      return 'text-gray-900'
  }
}

/**
 * ValuationCard component displays a single valuation metric with animation
 *
 * Features:
 * - Animated number counting using react-countup
 * - Formatted numbers with comma separators
 * - Support for currency ($) and percentage (%) values
 * - Color-coded values (green for positive, red for negative)
 * - Responsive card layout
 *
 * @example
 * ```tsx
 * <ValuationCard
 *   title="AI Value"
 *   value={1850000}
 *   type="currency"
 * />
 * ```
 */
const ValuationCard: React.FC<ValuationCardProps> = ({
  title,
  value,
  type,
  colorScheme = 'neutral',
  duration = 2,
}) => {
  const prefix = type === 'currency' ? '$' : ''
  const suffix = type === 'percentage' ? '%' : ''
  const colorClass = getColorClass(colorScheme)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        {title}
      </h3>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {prefix}
        <CountUp
          end={value}
          duration={duration}
          separator=","
          decimals={0}
        />
        {suffix}
      </div>
    </div>
  )
}

export default ValuationCard
