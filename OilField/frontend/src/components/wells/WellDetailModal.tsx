import { ExternalLink, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import texasTokenImage from '@/assets/texas-token.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useWellDetail } from '@/hooks/useWellDetail';
import { useDynamicValuation } from '@/hooks/useDynamicValuation';
import { ProductionChart } from './ProductionChart';
import { InvestmentReport } from './InvestmentReport';
import numeral from 'numeral';
import logger from '@/lib/logger';
import { validateWellData } from '@/utils/dataValidation';

export interface WellDetailModalProps {
  wellId: string | null;
  onClose: () => void;
}

export const WellDetailModal: React.FC<WellDetailModalProps> = ({
  wellId,
  onClose,
}) => {
  const { data, isLoading, isError, error } = useWellDetail(wellId);
  const { data: dynamicValuationData } = useDynamicValuation(wellId);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string): void => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Log modal lifecycle
  useEffect(() => {
    if (wellId) {
      logger.info('ui', `WellDetailModal opened for well: ${wellId}`);
    }
    return () => {
      if (wellId) {
        logger.debug('ui', `WellDetailModal closed for well: ${wellId}`);
      }
    };
  }, [wellId]);

  // Log data state changes
  useEffect(() => {
    if (data) {
      logger.debug('state', 'Modal data updated', {
        wellId,
        hasProduction: data.productionHistory?.length > 0,
        hasValuation: !!data.latestValuation,
        hasOperator: !!data.operator,
      });
    }
  }, [data, wellId]);

  // Log loading state
  useEffect(() => {
    if (isLoading && wellId) {
      logger.debug('ui', `Loading well details for: ${wellId}`);
    }
  }, [isLoading, wellId]);

  // Log errors
  useEffect(() => {
    if (isError && error) {
      logger.error('ui', 'Error in WellDetailModal', {
        wellId,
        error: error.message,
      });
    }
  }, [isError, error, wellId]);

  // Validate data completeness when loaded
  useEffect(() => {
    if (data?.well && !isLoading) {
      const validation = validateWellData(data.well);
      if (!validation.valid) {
        logger.warn('ui', 'Incomplete well data in modal', {
          wellId,
          missing: validation.missing,
        });
      }
      if (validation.warnings.length > 0) {
        logger.debug('ui', 'Optional well data missing in modal', {
          wellId,
          warnings: validation.warnings,
        });
      }
    }
  }, [data, isLoading, wellId]);

  if (!wellId) {
    return null;
  }

  const well = data?.well;
  // Prefer dynamic valuation (calculated on-demand) over stored values
  const valuation = dynamicValuationData?.valuation || data?.latestValuation || well?.valuation;
  const operator = data?.operator || well?.operator;

  return (
    <Dialog open={!!wellId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="well-detail-modal">
        {isLoading && (
          <div className="p-8 text-center" data-testid="loading-state">
            <p>Loading well details...</p>
          </div>
        )}

        {isError && (
          <div className="p-8 text-center text-red-600" data-testid="error-state">
            <p>Error loading well details. Please try again.</p>
          </div>
        )}

        {well && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" data-testid="well-name">
                {well.wellName}
              </DialogTitle>
              <div className="text-sm text-muted-foreground" data-testid="well-id">
                {well.wellId}
                {operator && (
                  <>
                    {' '}
                    • {operator.name}
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4" data-testid="well-badges">
                {valuation && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="valuation-badge">
                    Undervalued {Math.round(valuation.discountPct)}%
                  </Badge>
                )}
                {well.production && (
                  <Badge variant="secondary" data-testid="production-badge">
                    ⚡ {well.production.currentOilBblDay} bbl/day
                  </Badge>
                )}
                <Badge
                  variant={well.status === 'active' ? 'default' : 'secondary'}
                  className={
                    well.status === 'active'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }
                  data-testid="status-badge"
                >
                  📍 {well.status.charAt(0).toUpperCase() + well.status.slice(1)}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {data?.productionHistory && data.productionHistory.length > 0 && (
                <div data-testid="production-history-section">
                  <h3 className="font-semibold mb-4">Production History (24 months)</h3>
                  <ProductionChart history={data.productionHistory} />
                </div>
              )}

              {valuation && (
                <>
                  <div className="grid grid-cols-3 gap-4" data-testid="valuation-metrics">
                    <div className="p-4 border rounded-lg" data-testid="ai-value-card">
                      <div className="text-sm text-muted-foreground mb-1">
                        AI Value
                      </div>
                      <div className="text-xl font-bold">
                        {numeral(valuation.npvUsd).format('$0.00a').toUpperCase()}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg" data-testid="market-value-card">
                      <div className="text-sm text-muted-foreground mb-1">
                        Market
                      </div>
                      <div className="text-xl font-bold">
                        {numeral(valuation.marketValueUsd).format('$0.0a').toUpperCase()}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg" data-testid="discount-card">
                      <div className="text-sm text-muted-foreground mb-1">
                        Discount
                      </div>
                      <div className="text-xl font-bold">
                        {Math.round(valuation.discountPct)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {valuation.remainingReservesBbl && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Remaining Reserves:
                        </span>
                        <span className="font-semibold">
                          {numeral(valuation.remainingReservesBbl).format('0,0')} bbl
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Confidence Score:
                      </span>
                      <span className="font-semibold">
                        {Math.round(valuation.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {well.production && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Production Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Oil:</span>
                      <span className="ml-2 font-medium">
                        {well.production.currentOilBblDay} bbl/day
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Gas:</span>
                      <span className="ml-2 font-medium">
                        {well.production.currentGasMcfDay} mcf/day
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Peak Oil:</span>
                      <span className="ml-2 font-medium">
                        {well.production.peakOilBblDay} bbl/day
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cumulative:</span>
                      <span className="ml-2 font-medium">
                        {numeral(well.production.cumulativeOilBbl).format('0,0')} bbl
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {well.location && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">County:</span>
                      <span className="ml-2">{well.location.county}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Field:</span>
                      <span className="ml-2">{well.location.field}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset on Chain - OpenSea Style */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Asset on Chain: {well.wellName}</h3>
                  <a
                    href="https://sepolia.etherscan.io/token/0x61c759EeF966996ce54Ad4822d5acD324813BF5F?a=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on Etherscan"
                  >
                    <img
                      src="https://sepolia.etherscan.io/assets/svg/logos/logo-etherscan.svg?v=0.0.5"
                      alt="Etherscan"
                      className="h-24 w-24"
                    />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* NFT Image */}
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={texasTokenImage}
                      alt="OilField NFT"
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* Token Details */}
                  <div className="space-y-3 text-sm">

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Owner:</span>
                      <div className="flex items-center gap-1">
                        <a
                          href="https://sepolia.etherscan.io/address/0x59E7f79b16dbf54A1cB51D84acD46B96a60c2015"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          0x59E7...2015
                        </a>
                        <button
                          onClick={() => copyToClipboard('0x59E7f79b16dbf54A1cB51D84acD46B96a60c2015', 'owner')}
                          className="p-1 hover:bg-muted rounded"
                          aria-label="Copy owner address"
                        >
                          {copiedField === 'owner' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contract:</span>
                      <div className="flex items-center gap-1">
                        <a
                          href="https://sepolia.etherscan.io/address/0x61c759EeF966996ce54Ad4822d5acD324813BF5F"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          0x61c7...BF5F
                        </a>
                        <button
                          onClick={() => copyToClipboard('0x61c759EeF966996ce54Ad4822d5acD324813BF5F', 'contract')}
                          className="p-1 hover:bg-muted rounded"
                          aria-label="Copy contract address"
                        >
                          {copiedField === 'contract' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Oracle:</span>
                      <div className="flex items-center gap-1">
                        <a
                          href="https://sepolia.etherscan.io/address/0x495c16046E077EA4E6A71463De905BD8379eA49A"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          0x495c...A49A
                        </a>
                        <button
                          onClick={() => copyToClipboard('0x495c16046E077EA4E6A71463De905BD8379eA49A', 'oracle')}
                          className="p-1 hover:bg-muted rounded"
                          aria-label="Copy oracle address"
                        >
                          {copiedField === 'oracle' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Creator:</span>
                      <div className="flex items-center gap-1">
                        <a
                          href="https://sepolia.etherscan.io/address/0x59E7f79b16dbf54A1cB51D84acD46B96a60c2015"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          0x59E7...2015
                        </a>
                        <button
                          onClick={() => copyToClipboard('0x59E7f79b16dbf54A1cB51D84acD46B96a60c2015', 'creator')}
                          className="p-1 hover:bg-muted rounded"
                          aria-label="Copy creator address"
                        >
                          {copiedField === 'creator' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Token ID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">1</span>
                        <button
                          onClick={() => copyToClipboard('1', 'tokenId')}
                          className="p-1 hover:bg-muted rounded"
                          aria-label="Copy token ID"
                        >
                          {copiedField === 'tokenId' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Token Standard:</span>
                      <span className="font-medium">ERC-721</span>
                    </div>

                    <div className="pt-2">
                      <a
                        href="https://sepolia.etherscan.io/token/0x61c759EeF966996ce54Ad4822d5acD324813BF5F?a=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        View on Etherscan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Investment Report */}
              <div className="border-t pt-4">
                <InvestmentReport
                  wellId={well.id}
                  wellName={well.wellName}
                  valuation={valuation}
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
