import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Sparkles, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import logger from '@/lib/logger';
import { useSMTVerification } from '@/hooks/useSMTVerification';
import { generateVerificationText } from '@/lib/smtService';
import { VerificationBadge } from '@/components/reports/VerificationBadge';

/**
 * Props for the InvestmentReport component
 */
export interface InvestmentReportProps {
  /**
   * Unique identifier for the well
   */
  wellId: string;

  /**
   * Well name for display and verification text
   */
  wellName?: string;

  /**
   * Valuation data for verification constraints
   */
  valuation?: {
    npvUsd: number;
    marketValueUsd: number;
    discountPct: number;
    confidence: number;
    remainingReservesBbl?: number;
  };
}

/**
 * API response type for investment report generation
 */
export interface InvestmentReportResponse {
  /**
   * Markdown-formatted report content
   */
  report: string;

  /**
   * ISO timestamp when the report was generated
   */
  generatedAt: string;
}

/**
 * Extract section headings from markdown report
 * @param markdown - The markdown report text
 * @returns Array of section titles
 */
function extractSections(markdown: string): string[] {
  const sections = markdown.match(/^## .+$/gm) || [];
  return sections.map((s) => s.replace('## ', ''));
}

/**
 * Investment Report Component
 *
 * Generates and displays AI-powered investment analysis reports for oil wells.
 * Features:
 * - One-click report generation
 * - Loading state with spinner and progress indicator
 * - Markdown-formatted report display
 * - SMT verification of investment claims
 * - Optional PDF download functionality
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <InvestmentReport wellId="well-123" />
 * ```
 */
export function InvestmentReport({
  wellId,
  wellName = 'Unknown Well',
  valuation,
}: InvestmentReportProps): JSX.Element {
  const [showReport, setShowReport] = useState<boolean>(false);
  const { verificationState, verify, reset } = useSMTVerification();

  const { data, isLoading, error, refetch } = useQuery<InvestmentReportResponse>({
    queryKey: ['investment-report', wellId],
    queryFn: async (): Promise<InvestmentReportResponse> => {
      logger.info('api', `Generating AI report for well: ${wellId}`);
      const startTime = performance.now();

      try {
        const response = await fetch(`/api/wells/${wellId}/generate-report`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Failed to generate report');
        }

        const result = await response.json();
        const duration = performance.now() - startTime;

        logger.logPerformance('AI report generation', duration, 'ms');
        logger.info('state', 'AI report generated', {
          wellId,
          reportLength: result.report.length,
          sections: extractSections(result.report),
        });

        return result;
      } catch (error) {
        logger.error('api', 'AI report generation failed', {
          wellId,
          error: (error as Error).message,
        });
        throw error;
      }
    },
    enabled: showReport
  });

  const handleGenerateReport = (): void => {
    logger.info('ui', `User clicked "Generate AI Report" for well: ${wellId}`);
    setShowReport(true);
    reset(); // Reset any previous verification state
    void refetch();
  };

  const handleVerifyClaims = (): void => {
    if (!data?.report) {
      logger.warn('ui', 'Cannot verify claims: no report available');
      return;
    }

    logger.info('ui', `User clicked "Verify Claims" for well: ${wellId}`);

    // Generate verification text with valuation data and report
    const defaultValuation = {
      npvUsd: 0,
      marketValueUsd: 0,
      discountPct: 0,
      confidence: 0.85,
      remainingReservesBbl: 0,
    };

    const verificationText = generateVerificationText(
      wellName,
      valuation || defaultValuation,
      data.report
    );

    verify(verificationText);
  };

  return (
    <div className="space-y-4">
      {!showReport ? (
        <Button
          onClick={handleGenerateReport}
          size="lg"
          className="w-full gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate AI Investment Report
        </Button>
      ) : (
        <Card className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="space-y-4 text-center">
                <Sparkles className="w-12 h-12 animate-spin mx-auto text-emerald-500" />
                <p className="text-lg font-medium">
                  AI is analyzing this well and writing your report...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                Failed to generate report: {error.message}
              </div>
              <Button onClick={handleGenerateReport} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Investment Analysis Report
                  </h3>
                  <VerificationBadge state={verificationState} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleVerifyClaims}
                    disabled={verificationState.isVerifying}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {verificationState.isVerifying ? 'Verifying...' : 'Verify Claims'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown>{data?.report}</ReactMarkdown>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700 text-xs text-slate-400">
                Report generated {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : ''}
                {' • '}
                Powered by Claude AI
                {verificationState.result && (
                  <>
                    {' • '}
                    <span className={verificationState.result.is_satisfiable ? 'text-emerald-400' : 'text-red-400'}>
                      {verificationState.result.is_satisfiable ? 'Claims verified' : 'Claims unverified'}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
