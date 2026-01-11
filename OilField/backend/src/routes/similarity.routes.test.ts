/**
 * Integration tests for Similarity API Routes
 * Following TDD - tests written BEFORE implementation
 * Using supertest for HTTP testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { db } from '../config/database';
import { similarityRouter } from './similarity.routes';
import { AppError } from '../utils/errors';

describe('Similarity Routes - Integration Tests', () => {
  let app: Express;
  let testWellId: string;

  beforeAll(async () => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());

    // Mount routes
    app.use('/api', similarityRouter);

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

    // Get a test well ID with embedding from database
    const well = await db('wells').whereNotNull('embedding').first();
    if (well) {
      testWellId = well.id;
    }
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('GET /api/wells/:id/similar', () => {
    it('should return 200 with similar wells for valid ID', async () => {
      if (!testWellId) {
        console.warn('Skipping: No wells with embeddings in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${testWellId}/similar`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('targetWell');
      expect(response.body).toHaveProperty('similarWells');
      expect(response.body.targetWell.id).toBe(testWellId);
      expect(Array.isArray(response.body.similarWells)).toBe(true);

      // Each similar well should have well, similarity, and matchReasons
      response.body.similarWells.forEach((item: any) => {
        expect(item).toHaveProperty('well');
        expect(item).toHaveProperty('similarity');
        expect(item).toHaveProperty('matchReasons');
        expect(typeof item.similarity).toBe('number');
        expect(item.similarity).toBeGreaterThanOrEqual(0);
        expect(item.similarity).toBeLessThanOrEqual(1);
      });
    });

    it('should accept limit query parameter', async () => {
      if (!testWellId) {
        console.warn('Skipping: No wells with embeddings in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${testWellId}/similar?limit=3`)
        .expect(200);

      expect(response.body.similarWells.length).toBeLessThanOrEqual(3);
    });

    it('should accept threshold query parameter', async () => {
      if (!testWellId) {
        console.warn('Skipping: No wells with embeddings in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${testWellId}/similar?threshold=0.8`)
        .expect(200);

      // All results should have similarity >= threshold
      response.body.similarWells.forEach((item: any) => {
        expect(item.similarity).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should return 404 for non-existent well ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/wells/${fakeId}/similar`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/wells/invalid-id/similar')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid limit', async () => {
      if (!testWellId) {
        console.warn('Skipping: No wells with embeddings in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${testWellId}/similar?limit=-1`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid threshold', async () => {
      if (!testWellId) {
        console.warn('Skipping: No wells with embeddings in database');
        return;
      }

      const response = await request(app)
        .get(`/api/wells/${testWellId}/similar?threshold=1.5`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/search/semantic', () => {
    it('should return 200 with search results for valid query', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: 'high producing oil wells in Brazos county' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(response.body).toHaveProperty('searchTime');
      expect(Array.isArray(response.body.results)).toBe(true);

      // Each result should have well and relevanceScore
      response.body.results.forEach((item: any) => {
        expect(item).toHaveProperty('well');
        expect(item).toHaveProperty('relevanceScore');
        expect(typeof item.relevanceScore).toBe('number');
        expect(item.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(item.relevanceScore).toBeLessThanOrEqual(1);
      });
    });

    it('should accept limit parameter', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: 'oil wells', limit: 5 })
        .expect(200);

      expect(response.body.results.length).toBeLessThanOrEqual(5);
    });

    it('should accept threshold parameter', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: 'oil wells', threshold: 0.8 })
        .expect(200);

      // All results should have relevanceScore >= threshold
      response.body.results.forEach((item: any) => {
        expect(item.relevanceScore).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should accept filters parameter', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({
          query: 'oil wells',
          filters: {
            county: 'Brazos',
            status: 'active',
          },
        })
        .expect(200);

      // All results should match filters
      response.body.results.forEach((item: any) => {
        if (item.well.location) {
          expect(item.well.location.county).toBe('Brazos');
        }
        expect(item.well.status).toBe('active');
      });
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for query too long', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: 'a'.repeat(1001) })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: 'oil wells', limit: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid filters', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({ query: 'oil wells', filters: { status: 'invalid' } })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
