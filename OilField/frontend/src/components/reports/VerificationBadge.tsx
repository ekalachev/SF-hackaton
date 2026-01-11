/**
 * VerificationBadge Component
 * Displays SMT verification status with visual feedback
 *
 * Following SOLID principles:
 * - Single Responsibility: Only displays verification status
 * - Open/Closed: Easily extensible for new states
 */

import { useState } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationBadgeProps } from '../../types/smt';

/**
 * VerificationBadge displays the current verification state
 *
 * @param state - Current verification state
 * @param className - Optional additional CSS classes
 *
 * @example
 * ```tsx
 * <VerificationBadge
 *   state={{
 *     isVerifying: false,
 *     result: { is_satisfiable: true, ... },
 *     error: null
 *   }}
 * />
 * ```
 */
export function VerificationBadge({
  state,
  className,
}: VerificationBadgeProps): JSX.Element | null {
  const [showDetails, setShowDetails] = useState(false);

  // Don't render anything if no verification has been attempted
  if (!state.isVerifying && !state.result && !state.error) {
    return null;
  }

  // Determine badge state and styling
  const getBadgeConfig = () => {
    if (state.isVerifying) {
      return {
        label: 'Verifying...',
        colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: (
          <Loader2
            className="w-3 h-3 animate-spin"
            data-testid="verification-spinner"
          />
        ),
      };
    }

    if (state.error) {
      return {
        label: 'Error',
        colorClass: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <AlertCircle className="w-3 h-3" data-testid="verification-error" />,
      };
    }

    if (state.result?.is_satisfiable) {
      return {
        label: 'Verified',
        colorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: <Check className="w-3 h-3" data-testid="verification-check" />,
      };
    }

    return {
      label: 'Unverified',
      colorClass: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: <X className="w-3 h-3" data-testid="verification-x" />,
    };
  };

  const config = getBadgeConfig();

  return (
    <div className={cn('relative inline-block', className)} data-testid="verification-badge-wrapper">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer hover:opacity-80',
          config.colorClass
        )}
        aria-expanded={showDetails}
        aria-label={`Verification status: ${config.label}. Click for details.`}
      >
        {config.icon}
        {config.label}
      </button>

      {/* Details dropdown */}
      {showDetails && (state.result || state.error) && (
        <div
          className="absolute z-50 mt-2 w-80 max-h-96 overflow-auto rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-xl"
          role="tooltip"
        >
          {state.error ? (
            <div>
              <h4 className="font-semibold text-red-400 mb-2">Verification Error</h4>
              <p className="text-sm text-slate-300">{state.error}</p>
            </div>
          ) : state.result ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Status</h4>
                <p className="text-sm">
                  {state.result.is_satisfiable ? (
                    <span className="text-emerald-400">Constraints are satisfiable - all conditions met</span>
                  ) : (
                    <span className="text-red-400">Constraints are unsatisfiable - conditions conflict</span>
                  )}
                </p>
              </div>

              {state.result.metrics && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">Metrics</h4>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Total time: {state.result.metrics.total_time_seconds.toFixed(2)}s</p>
                    <p>Formalization: {(state.result.metrics.final_formalization_similarity * 100).toFixed(1)}% similarity</p>
                    <p>Extraction: {(state.result.metrics.final_extraction_degradation * 100).toFixed(1)}% degradation</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Solver Output</h4>
                <pre className="text-xs bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
                  {state.result.solver_output}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Formal SMT-LIB Code</h4>
                <pre className="text-xs bg-slate-900 p-2 rounded overflow-x-auto text-slate-300 max-h-48">
                  {state.result.formal_code}
                </pre>
              </div>
            </div>
          ) : null}

          <button
            onClick={() => setShowDetails(false)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default VerificationBadge;
