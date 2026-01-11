/**
 * Integration tests for AI API Routes
 * Following TDD - tests written BEFORE implementation
 * Tests for POST /api/wells/:id/generate-report and GET /api/wells/:id/narrative
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { db } from '../config/database';
import { aiRouter } from './ai.routes';
import { AppError } from '../utils/errors';
import { ClaudeService } from '../services/claudeService';

// Mock ClaudeService
vi.mock('../services/claudeService');

describe('AI Routes - Integration Tests', () => {
  let app: Express;
  let testWellId: string;

  beforeAll(async () => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());

    // Mount routes
    app.use('/api', aiRouter);

    // Error handler
    app.use((err: Error | AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: err.message,
          statusCode: err.statusCode,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          statusCode: 500,
        });
      }
    });

    // Get a test well ID from database - ensure we have one
    let well = await db('wells').first();

    // If no wells exist, create a test well
    if (!well) {
      // First ensure we have an operator
      let operator = await db('operators').first();
      if (!operator) {
        [operator] = await db('operators')
          .insert({
            name: 'Test Operator',
          })
          .returning('*');
      }

      [well] = await db('wells')
        .insert({
          well_id: 'TEST-WELL-001',
          well_name: 'Test Well for AI Routes',
          operator_id: operator.id,
          status: 'active',
          county: 'Test',
          state: 'TX',
        })
        .returning('*');

      // Also insert a valuation for the test well
      await db('valuations').insert({
        well_id: well.id,
        npv_usd: 1000000,
        market_value_usd: 900000,
        discount_pct: 10,
        confidence: 0.85,
        remaining_reserves_bbl: 50000,
        calculated_at: new Date(),
      });
    }

    testWellId = well.id;
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/wells/:id/generate-report', () => {
    it('should return 404 if well not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post(`/api/wells/${fakeId}/generate-report`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Well not found');
    });

    it('should return 404 if valuation not found', async () => {
      // Create a well without valuation for this test
      const [testWell] = await db('wells')
        .insert({
          well_id: 'TEST-NO-VAL',
          well_name: 'Test Well No Valuation',
          operator_id: (await db('operators').first()).id,
          status: 'active',
          county: 'Test',
          state: 'TX',
        })
        .returning('*');

      const response = await request(app)
        .post(`/api/wells/${testWell.id}/generate-report`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('valuation not found');

      // Cleanup
      await db('wells').where({ id: testWell.id }).del();
    });

    it('should generate report and return markdown for valid well', async () => {
      // Mock ClaudeService response
      const mockReport = '# Investment Analysis\n\nThis is a test report.';
      vi.mocked(ClaudeService.prototype.generateInvestmentReport).mockResolvedValue(mockReport);

      const response = await request(app)
        .post(`/api/wells/${testWellId}/generate-report`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('wellId');
      expect(response.body).toHaveProperty('report');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body).toHaveProperty('format', 'markdown');
      expect(response.body.report).toContain('# Investment Analysis');
    });

    it('should handle ClaudeService errors gracefully', async () => {
      // Mock ClaudeService to throw error
      vi.mocked(ClaudeService.prototype.generateInvestmentReport).mockRejectedValue(
        new Error('Claude CLI failed')
      );

      const response = await request(app)
        .post(`/api/wells/${testWellId}/generate-report`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to generate report');
    });
  });

  describe('GET /api/wells/:id/narrative', () => {
    beforeEach(async () => {
      // Clean up any existing narratives for test well
      await db('well_narratives').where({ well_id: testWellId }).del();
    });

    it('should return 404 if well not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/wells/${fakeId}/narrative`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Well not found');
    });

    it('should generate new narrative if none exists', async () => {
      const mockNarrative = 'This is a test well narrative describing production history.';
      vi.mocked(ClaudeService.prototype.generateWellNarrative).mockResolvedValue(mockNarrative);

      const response = await request(app)
        .get(`/api/wells/${testWellId}/narrative`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('wellId', testWellId);
      expect(response.body).toHaveProperty('narrative');
      expect(response.body.narrative).toBe(mockNarrative);

      // Verify it was cached
      const cached = await db('well_narratives')
        .where({ well_id: testWellId })
        .first();
      expect(cached).toBeDefined();
      expect(cached.narrative).toBe(mockNarrative);
    });

    it('should return cached narrative if fresh (< 7 days)', async () => {
      const cachedNarrative = 'This is a cached narrative.';

      // Insert cached narrative
      await db('well_narratives').insert({
        well_id: testWellId,
        narrative: cachedNarrative,
        created_at: new Date(), // Fresh
      });

      const response = await request(app)
        .get(`/api/wells/${testWellId}/narrative`)
        .expect(200);

      expect(response.body.narrative).toBe(cachedNarrative);

      // ClaudeService should NOT have been called
      expect(vi.mocked(ClaudeService.prototype.generateWellNarrative)).not.toHaveBeenCalled();
    });

    it('should regenerate narrative if cache is stale (> 7 days)', async () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 8); // 8 days ago

      // Insert stale cached narrative
      await db('well_narratives').insert({
        well_id: testWellId,
        narrative: 'This is stale.',
        created_at: staleDate,
      });

      const newNarrative = 'This is a fresh narrative.';
      vi.mocked(ClaudeService.prototype.generateWellNarrative).mockResolvedValue(newNarrative);

      const response = await request(app)
        .get(`/api/wells/${testWellId}/narrative`)
        .expect(200);

      expect(response.body.narrative).toBe(newNarrative);

      // Verify ClaudeService was called
      expect(vi.mocked(ClaudeService.prototype.generateWellNarrative)).toHaveBeenCalled();
    });

    it('should handle ClaudeService errors gracefully', async () => {
      vi.mocked(ClaudeService.prototype.generateWellNarrative).mockRejectedValue(
        new Error('Claude CLI failed')
      );

      const response = await request(app)
        .get(`/api/wells/${testWellId}/narrative`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to generate narrative');
    });
  });
});
