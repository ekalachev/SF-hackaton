/**
 * ClaudeService - AI-powered investment report generation
 * Uses Claude CLI for generating comprehensive well analysis reports
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import * as path from 'path';
import type {
  WellReportData,
  ValuationReportData,
  ProductionHistoryData,
  ComparableWellData,
} from '../types/claude.types';
import { logInfo, logError, logDebug } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Service for generating AI-powered investment reports using Claude CLI
 */
export class ClaudeService {
  private readonly tempDir: string = '/tmp/oilfield-ai';

  constructor() {
    void this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists for storing prompt files
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
      console.error('Error ensuring temp directory:', error);
    }
  }

  /**
   * Generate comprehensive investment report for a well
   * @param well - Well data for report generation
   * @param valuation - Valuation data for report generation
   * @returns Markdown formatted investment report (2000-2500 words)
   */
  public async generateInvestmentReport(
    well: WellReportData,
    valuation: ValuationReportData
  ): Promise<string> {
    logInfo('ai', 'Generating investment report', { wellId: well.id });

    try {
      const prompt = this.buildReportPrompt(well, valuation);
      logDebug('ai', 'Report prompt built', { promptLength: prompt.length });

      // Write prompt to temp file (use timestamp for uniqueness)
      const promptFile = path.join(this.tempDir, `prompt-${well.id}-${Date.now()}.txt`);
      await writeFile(promptFile, prompt);

      // Call Claude CLI with the prompt file (use cat to pipe content to claude)
      const startTime = Date.now();
      const { stdout } = await execAsync(
        `cat "${promptFile}" | claude --print --model haiku`,
        { timeout: 180000 } // 3 minute timeout
      );
      const duration = Date.now() - startTime;

      // Clean up temp file
      await unlink(promptFile);

      logInfo('ai', 'Investment report generated', {
        wellId: well.id,
        reportLength: stdout.length,
        duration: `${duration}ms`,
      });

      return stdout;
    } catch (error) {
      logError('AI report generation failed', error as Error, { wellId: well.id });
      throw new Error('Failed to generate investment report');
    }
  }

  /**
   * Build comprehensive prompt for investment report generation
   * @param well - Well data
   * @param valuation - Valuation data
   * @returns Formatted prompt string
   */
  public buildReportPrompt(
    well: WellReportData,
    valuation: ValuationReportData
  ): string {
    const productionHistoryTable = this.formatProductionHistory(well.productionHistory);
    const comparablesTable = this.formatComparableWells(well.comparables);

    return `You are an experienced petroleum engineer and investment analyst specializing in oil & gas asset valuation.

Generate a comprehensive investment analysis report for the following oil well acquisition opportunity.

## Well Data
- Well ID: ${well.wellId}
- Name: ${well.wellName}
- Location: ${well.county} County, ${well.state}
- Formation: ${well.formation}
- Depth: ${well.totalDepthFt}ft
- Lateral Length: ${well.lateralLengthFt}ft

## Production Profile
- Current Rate: ${well.currentOilBblDay} bbl/day
- Peak Production: ${well.peakOilBblDay} bbl/day (on ${well.peakDate})
- Cumulative Production: ${well.cumulativeOilBbl.toLocaleString()} barrels
- Decline Rate: ${(well.declineRateAnnual * 100).toFixed(1)}% annually
- Decline Type: ${well.declineType}

## Valuation Summary
- AI NPV Estimate: $${valuation.npvUsd.toLocaleString()}
- Market Comparable Value: $${valuation.marketValueUsd.toLocaleString()}
- Discount: ${valuation.discountPct}%
- Remaining Reserves: ${valuation.remainingReservesBbl.toLocaleString()} bbl
- Confidence Score: ${(valuation.confidence * 100).toFixed(0)}%

## Economic Assumptions
- WTI Price: $${valuation.oilPriceUsd.toFixed(2)}/bbl
- Operating Cost: $${valuation.operatingCostPerBbl.toFixed(2)}/bbl
- Discount Rate: ${(valuation.discountRate * 100)}%
- Royalty Rate: ${(valuation.royaltyRate * 100)}%

## Production History (Last 6 Months)
${productionHistoryTable}

## Comparable Wells
${comparablesTable}

Generate a detailed investment analysis report with the following sections:
1. Executive Summary (3-4 paragraphs)
2. Well Performance Analysis (production trends, decline analysis, geological context)
3. Financial Analysis (valuation methodology, sensitivity analysis, recommended bid)
4. Risk Assessment (identify and score 5-6 key risks with mitigation strategies)
5. Comparable Transactions (analyze 3-5 recent similar deals)
6. ESG & Sustainability (environmental considerations)
7. Opportunity Summary (investment highlights, recommended action, next steps)

Format the report in clean Markdown with tables, bullet points, and clear section headers.
IMPORTANT: Always add a blank line before AND after every table for proper rendering.
Be specific, data-driven, and professional. Include both positive and negative factors.
The report should be suitable for presentation to senior investment committee.

Target length: 2000-2500 words.
`;
  }

  /**
   * Format production history as markdown table
   * @param history - Array of production history entries
   * @returns Markdown formatted table
   */
  private formatProductionHistory(history: ProductionHistoryData[]): string {
    if (!history || history.length === 0) {
      return 'No production history available.';
    }

    let table = '| Date | Oil (bbl) | Gas (mcf) | Water (bbl) |\n';
    table += '|------|-----------|-----------|-------------|\n';

    for (const entry of history) {
      table += `| ${entry.date} | ${entry.oilBbl.toLocaleString()} | ${entry.gasMcf.toLocaleString()} | ${entry.waterBbl.toLocaleString()} |\n`;
    }

    return table;
  }

  /**
   * Format comparable wells as markdown table
   * @param comparables - Array of comparable well data
   * @returns Markdown formatted table
   */
  private formatComparableWells(comparables: ComparableWellData[]): string {
    if (!comparables || comparables.length === 0) {
      return 'No comparable wells available.';
    }

    let table = '| Well Name | Location | Production Rate (bbl/day) | Sale Price | Sale Date |\n';
    table += '|-----------|----------|---------------------------|------------|------------|\n';

    for (const comp of comparables) {
      table += `| ${comp.wellName} | ${comp.location} | ${comp.productionRate} | $${comp.salePrice.toLocaleString()} | ${comp.saleDate} |\n`;
    }

    return table;
  }

  /**
   * Generate well narrative summary (cached for 7 days)
   * @param well - Well data for narrative generation
   * @returns Markdown formatted narrative (200-300 words)
   */
  public async generateWellNarrative(well: WellReportData): Promise<string> {
    logInfo('ai', 'Generating well narrative', { wellId: well.id });

    try {
      const prompt = this.buildNarrativePrompt(well);
      logDebug('ai', 'Narrative prompt built', { promptLength: prompt.length });

      // Write prompt to temp file
      const promptFile = path.join(this.tempDir, `narrative-${well.id}.txt`);
      await writeFile(promptFile, prompt);

      // Call Claude CLI with the prompt file
      const startTime = Date.now();
      const { stdout } = await execAsync(
        `claude -p "${promptFile}" --model claude-sonnet-4.5`
      );
      const duration = Date.now() - startTime;

      // Clean up temp file
      await unlink(promptFile);

      logInfo('ai', 'Well narrative generated', {
        wellId: well.id,
        narrativeLength: stdout.trim().length,
        duration: `${duration}ms`,
      });

      return stdout.trim();
    } catch (error) {
      logError('Well narrative generation failed', error as Error, { wellId: well.id });
      throw new Error('Failed to generate well narrative');
    }
  }

  /**
   * Build prompt for well narrative generation
   * @param well - Well data
   * @returns Formatted prompt string
   */
  private buildNarrativePrompt(well: WellReportData): string {
    return `You are a petroleum engineer writing a concise narrative about an oil well.

Generate a professional narrative (3-4 paragraphs) for the following well:

## Well Data
- Well ID: ${well.wellId}
- Name: ${well.wellName}
- Location: ${well.county} County, ${well.state}
- Formation: ${well.formation || 'Unknown'}
- Current Production: ${well.currentOilBblDay} bbl/day
- Cumulative Production: ${well.cumulativeOilBbl?.toLocaleString() || 'N/A'} barrels

Write a clear, professional narrative that describes:
1. Well location and geological context
2. Production performance and trends
3. Current operational status
4. Key technical characteristics

Format in Markdown. Be concise and data-driven. Target length: 200-300 words.
`;
  }
}
