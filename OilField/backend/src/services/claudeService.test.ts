/**
 * Tests for ClaudeService
 * Following TDD approach - tests written first
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClaudeService } from './claudeService';
import type { WellReportData, ValuationReportData } from '../types/claude.types';
import * as fs from 'fs/promises';
import * as childProcess from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
}));

describe('ClaudeService', () => {
  let service: ClaudeService;
  let mockWell: WellReportData;
  let mockValuation: ValuationReportData;

  beforeEach(() => {
    service = new ClaudeService();

    mockWell = {
      id: 'test-well-1',
      wellId: 'API-12345',
      wellName: 'Test Well Alpha',
      county: 'Reeves',
      state: 'TX',
      formation: 'Wolfcamp A',
      totalDepthFt: 15000,
      lateralLengthFt: 8500,
      currentOilBblDay: 145,
      peakOilBblDay: 450,
      peakDate: '2022-06-15',
      cumulativeOilBbl: 125000,
      declineRateAnnual: 0.35,
      declineType: 'Hyperbolic',
      productionHistory: [
        { date: '2024-10-01', oilBbl: 4350, gasMcf: 12500, waterBbl: 850 },
        { date: '2024-09-01', oilBbl: 4425, gasMcf: 12750, waterBbl: 820 },
        { date: '2024-08-01', oilBbl: 4500, gasMcf: 13000, waterBbl: 800 },
      ],
      comparables: [
        {
          wellName: 'Comparable Well 1',
          location: 'Reeves County, TX',
          productionRate: 150,
          salePrice: 2500000,
          saleDate: '2024-08-15',
        },
        {
          wellName: 'Comparable Well 2',
          location: 'Reeves County, TX',
          productionRate: 140,
          salePrice: 2350000,
          saleDate: '2024-07-20',
        },
      ],
    };

    mockValuation = {
      npvUsd: 2250000,
      marketValueUsd: 2800000,
      discountPct: 19.6,
      remainingReservesBbl: 85000,
      confidence: 0.87,
      oilPriceUsd: 75.50,
      operatingCostPerBbl: 18.25,
      discountRate: 0.10,
      royaltyRate: 0.20,
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default temp directory', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ClaudeService);
    });
  });

  describe('buildReportPrompt', () => {
    it('should generate a complete prompt with all well data', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      // Verify prompt contains key well information
      expect(prompt).toContain('Test Well Alpha');
      expect(prompt).toContain('API-12345');
      expect(prompt).toContain('Reeves');
      expect(prompt).toContain('TX');
      expect(prompt).toContain('Wolfcamp A');
    });

    it('should include production metrics in prompt', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('145'); // current rate
      expect(prompt).toContain('450'); // peak rate
      expect(prompt).toContain('125,000'); // cumulative (formatted)
      expect(prompt).toContain('35.0%'); // decline rate
    });

    it('should include valuation data in prompt', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('2,250,000'); // NPV
      expect(prompt).toContain('2,800,000'); // Market value
      expect(prompt).toContain('19.6%'); // Discount
      expect(prompt).toContain('87%'); // Confidence
    });

    it('should include economic assumptions in prompt', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('75.50'); // Oil price
      expect(prompt).toContain('18.25'); // Operating cost
      expect(prompt).toContain('10%'); // Discount rate
      expect(prompt).toContain('20%'); // Royalty rate
    });

    it('should include production history section', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('Production History');
      expect(prompt).toContain('2024-10-01');
      expect(prompt).toContain('4,350'); // Oil bbl formatted
    });

    it('should include comparable wells section', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('Comparable Wells');
      expect(prompt).toContain('Comparable Well 1');
      expect(prompt).toContain('2,500,000'); // Sale price formatted
    });

    it('should request specific report sections', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('Executive Summary');
      expect(prompt).toContain('Well Performance Analysis');
      expect(prompt).toContain('Financial Analysis');
      expect(prompt).toContain('Risk Assessment');
      expect(prompt).toContain('Comparable Transactions');
      expect(prompt).toContain('ESG & Sustainability');
      expect(prompt).toContain('Opportunity Summary');
    });

    it('should specify target word count', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('2000-2500 words');
    });

    it('should request Markdown format', () => {
      const prompt = service.buildReportPrompt(mockWell, mockValuation);

      expect(prompt).toContain('Markdown');
    });
  });

  describe('generateInvestmentReport', () => {
    it('should write prompt to temp file', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: '# Investment Report\n\nTest report', stderr: '' });
      });
      (childProcess.exec as any).mockImplementation(mockExec);

      await service.generateInvestmentReport(mockWell, mockValuation);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('prompt-test-well-1.txt'),
        expect.any(String)
      );
    });

    it('should call Claude CLI with correct parameters', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: '# Investment Report\n\nTest report', stderr: '' });
      });
      (childProcess.exec as any).mockImplementation(mockExec);

      await service.generateInvestmentReport(mockWell, mockValuation);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('claude'),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('claude-sonnet-4'),
        expect.any(Function)
      );
    });

    it('should return markdown report from Claude CLI', async () => {
      const expectedReport = '# Investment Analysis Report\n\nThis is a comprehensive report with over 2000 words of analysis.';
      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: expectedReport, stderr: '' });
      });
      (childProcess.exec as any).mockImplementation(mockExec);

      const result = await service.generateInvestmentReport(mockWell, mockValuation);

      expect(result).toBe(expectedReport);
    });

    it('should clean up temp file after successful generation', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: '# Report', stderr: '' });
      });
      (childProcess.exec as any).mockImplementation(mockExec);

      await service.generateInvestmentReport(mockWell, mockValuation);

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('prompt-test-well-1.txt')
      );
    });

    it('should throw error if Claude CLI fails', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(new Error('Claude CLI not found'), { stdout: '', stderr: 'command not found' });
      });
      (childProcess.exec as any).mockImplementation(mockExec);

      await expect(
        service.generateInvestmentReport(mockWell, mockValuation)
      ).rejects.toThrow('Failed to generate investment report');
    });

    it('should clean up temp file even if Claude CLI fails', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(new Error('Claude CLI error'), { stdout: '', stderr: 'error' });
      });
      (childProcess.exec as any).mockImplementation(mockExec);

      await expect(
        service.generateInvestmentReport(mockWell, mockValuation)
      ).rejects.toThrow();

      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('helper methods', () => {
    describe('formatProductionHistory', () => {
      it('should format production history as markdown table', () => {
        const formatted = service['formatProductionHistory'](mockWell.productionHistory);

        expect(formatted).toContain('Date');
        expect(formatted).toContain('Oil (bbl)');
        expect(formatted).toContain('Gas (mcf)');
        expect(formatted).toContain('Water (bbl)');
        expect(formatted).toContain('2024-10-01');
        expect(formatted).toContain('4,350');
      });
    });

    describe('formatComparableWells', () => {
      it('should format comparable wells as markdown table', () => {
        const formatted = service['formatComparableWells'](mockWell.comparables);

        expect(formatted).toContain('Well Name');
        expect(formatted).toContain('Location');
        expect(formatted).toContain('Production Rate');
        expect(formatted).toContain('Sale Price');
        expect(formatted).toContain('Comparable Well 1');
        expect(formatted).toContain('$2,500,000');
      });
    });
  });
});
