/**
 * Integration tests for Wells API Routes
 * Following TDD - tests written BEFORE implementation
 * Using supertest for HTTP testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { db } from '../config/database';
import { WellService } from '../services/wellService';
import { wellsRouter } from './wells.routes';
import { AppError } from '../utils/errors';

describe('Wells Routes - Integration Tests', () => {
  let app: Express;
  let testWellId: string;

  beforeAll(async () => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());

    // Mount routes
    app.use('/api/wells', wellsRouter);

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

    // Get a test well ID from database
    const well = await db('wells').first();
    if (well) {
      testWellId = well.id;
    }
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('GET /api/wells', () => {
    it('should return 200 with wells list', async () => {
      const response = await request(app)
        .get('/api/wells')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('wells');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.wells)).toBe(true);
    });

    it('should accept limit query parameter', async () => {
      const response = await request(app)
        .get('/api/wells?limit=5')
        .expect(200);

      expect(response.body.limit).toBe(5);
      expect(response.body.wells.length).toBeLessThanOrEqual(5);
    });

    it('should accept offset query parameter', async () => {
      const response = await request(app)
        .get('/api/wells?offset=10')
        .expect(200);

      expect(response.body.offset).toBe(10);
    });

    it('should accept county filter', async () => {
      const response = await request(app)
        .get('/api/wells?county=Brazos')
        .expect(200);

      // All returned wells should have matching county (if they have location)
      response.body.wells.forEach((well: any) => {
        if (well.location) {
          expect(well.location.county).toBe('Brazos');
        }
      });
    });

    it('should accept status filter', async () => {
      const response = await request(app)
        .get('/api/wells?status=active')
        .expect(200);

      response.body.wells.forEach((well: any) => {
        expect(well.status).toBe('active');
      });
    });

    it('should accept minDiscount filter', async () => {
      const response = await request(app)
        .get('/api/wells?minDiscount=30')
        .expect(200);

      response.body.wells.forEach((well: any) => {
        if (well.valuation) {
          expect(well.valuation.discountPct).toBeGreaterThanOrEqual(30);
        }
      });
    });

    it('should accept sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/wells?sortBy=discount&limit=10')
        .expect(200);

      expect(response.body.wells).toBeDefined();
    });

    it('should accept sortOrder parameter', async () => {
      const response = await request(app)
        .get('/api/wells?sortBy=discount&sortOrder=asc&limit=10')
        .expect(200);

      // Verify ascending order
      const discounts = response.body.wells
        .filter((w: any) => w.valuation)
        .map((w: any) => w.valuation.discountPct);

      for (let i = 1; i < discounts.length; i++) {
        expect(discounts[i]).toBeGreaterThanOrEqual(discounts[i - 1]);
      }
    });

    it('should return 400 for invalid limit (negative)', async () => {
      const response = await request(app)
        .get('/api/wells?limit=-1')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .get('/api/wells?status=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid sortBy', async () => {
      const response = await request(app)
        .get('/api/wells?sortBy=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/wells/:id', () => {
    it('should return 200 with well details for valid ID', async () => {
      if (!testWellId) {
        console.warn('Skipping: No wells in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${testWellId}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('well');
      expect(response.body).toHaveProperty('productionHistory');
      expect(response.body).toHaveProperty('latestValuation');
      expect(response.body).toHaveProperty('operator');

      expect(response.body.well.id).toBe(testWellId);
      expect(Array.isArray(response.body.productionHistory)).toBe(true);
    });

    it('should return 404 for non-existent well ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/wells/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/wells/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept well_id string format', async () => {
      // Get a well with well_id
      const well = await db('wells').whereNotNull('well_id').first();

      if (!well) {
        console.warn('Skipping: No wells with well_id in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${well.well_id}`)
        .expect(200);

      expect(response.body.well.wellId).toBe(well.well_id);
    });
  });
});
