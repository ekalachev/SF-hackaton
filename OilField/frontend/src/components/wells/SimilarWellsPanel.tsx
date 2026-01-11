/**
 * SimilarWellsPanel Component
 * Displays AI-powered similar wells with similarity scores and match reasons
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles displaying similar wells
 * - Open/Closed: Extensible through props (onWellClick callback)
 * - Dependency Inversion: Depends on useSimilarWells hook abstraction
 */

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { useSimilarWells } from '@/hooks/useSimilarWells'
import type { SimilarWell } from '@/types/api'
import logger from '@/lib/logger'

/**
 * Props for SimilarWellsPanel component
 */
export interface SimilarWellsPanelProps {
  /**
   * Well ID to find similar wells for
   */
  wellId: string

  /**
   * Optional callback when a similar well is clicked
   * Receives the well ID of the clicked well
   */
  onWellClick?: (wellId: string) => void
}

/**
 * Component displaying AI-powered similar wells
 *
 * Features:
 * - Fetches similar wells using useSimilarWells hook
 * - Displays 5 similar wells with similarity scores
 * - Shows match reasons for each well
 * - Clickable wells that trigger onWellClick callback
 * - Emerald theme styling for AI-powered features
 *
 * @example
 * ```tsx
 * <SimilarWellsPanel
 *   wellId="well-123"
 *   onWellClick={(id) => console.log('Clicked:', id)}
 * />
 * ```
 */
export function SimilarWellsPanel({ wellId, onWellClick }: SimilarWellsPanelProps): JSX.Element {
  const { data, isLoading, error } = useSimilarWells(wellId, { limit: 5 })

  // Log loading state
  useEffect(() => {
    if (isLoading) {
      logger.info('api', `Fetching similar wells for: ${wellId}`)
    }
  }, [isLoading, wellId])

  // Log successful data fetch
  useEffect(() => {
    if (data) {
      logger.info('state', `Similar wells loaded: ${data.similarWells.length}`, {
        wellId,
        count: data.similarWells.length,
        scores: data.similarWells.map((w) => Math.round(w.similarity * 100)),
      })
    }
  }, [data, wellId])

  // Log errors
  useEffect(() => {
    if (error) {
      logger.error('api', 'Failed to load similar wells', {
        wellId,
        error: error.message,
      })
    }
  }, [error, wellId])

  if (isLoading) {
    return <div className="animate-pulse" data-testid="similar-wells-loading">Finding similar wells...</div>
  }

  if (error) {
    return (
      <div className="text-red-400 p-4" data-testid="similar-wells-error">
        Error loading similar wells: {error.message}
      </div>
    )
  }

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/10" data-testid="similar-wells-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Similar Wells
          <Badge variant="outline" className="ml-auto">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.similarWells.map((item: SimilarWell) => (
          <div
            key={item.well.id}
            className="p-4 rounded-lg border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-colors"
            onClick={() => onWellClick?.(item.well.id)}
            role="button"
            tabIndex={0}
            data-testid={`similar-well-${item.well.id}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onWellClick?.(item.well.id)
              }
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white" data-testid="similar-well-name">{item.well.wellName}</h4>
                <p className="text-sm text-slate-400">{item.well.wellId}</p>
              </div>
              <Badge variant="secondary" data-testid="similarity-score">
                {Math.round(item.similarity * 100)}% match
              </Badge>
            </div>

            <div className="flex gap-2 mb-2">
              {item.well.production && (
                <Badge variant="outline" className="text-xs">
                  {item.well.production.currentOilBblDay} bbl/day
                </Badge>
              )}
              {item.well.valuation && (
                <Badge
                  variant={item.well.valuation.discountPct > 20 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {item.well.valuation.discountPct}% {item.well.valuation.discountPct > 0 ? 'undervalued' : 'overvalued'}
                </Badge>
              )}
            </div>

            {item.matchReasons && item.matchReasons.length > 0 && (
              <div className="space-y-1" data-testid="match-reasons">
                {item.matchReasons.map((reason: string, idx: number) => (
                  <p key={idx} className="text-xs text-emerald-400 flex items-center gap-1" data-testid="match-reason">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" aria-hidden="true"></span>
                    {reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
