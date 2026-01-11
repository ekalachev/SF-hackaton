/**
 * MSW Request Handlers
 * Mock API endpoints for testing
 *
 * Following SOLID principles:
 * - Single Responsibility: Each handler mocks one endpoint
 * - Open/Closed: Easy to add new handlers
 */

import { http, HttpResponse } from 'msw';
import {
  createMockGetWellsResponse,
  createMockGetWellByIdResponse,
  createMockGetSimilarWellsResponse,
  createMockWell,
} from './mockData';
import type { WellFilters } from '../../types/api';

const BASE_URL = 'http://localhost:3001/api';

/**
 * API request handlers
 */
export const handlers = [
  /**
   * GET /api/wells - Fetch wells list with filters
   */
  http.get(`${BASE_URL}/wells`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const county = url.searchParams.get('county');
    const status = url.searchParams.get('status') as WellFilters['status'];

    // Generate mock wells based on filters
    let wells = Array.from({ length: limit }, (_, i) =>
      createMockWell({
        id: `well-${offset + i + 1}`,
        wellName: `Well #${offset + i + 1}`,
        ...(county && { location: { county, latitude: 28.5, longitude: -99.5, field: 'EAGLE FORD' } }),
        ...(status && { status }),
      })
    );

    // Filter by county if specified
    if (county) {
      wells = wells.filter((well) => well.location?.county === county);
    }

    return HttpResponse.json(
      createMockGetWellsResponse({
        wells,
        total: 100, // Mock total count
        limit,
        offset,
        hasMore: offset + limit < 100,
      })
    );
  }),

  /**
   * GET /api/wells/:id - Fetch well detail
   */
  http.get(`${BASE_URL}/wells/:id`, ({ params }) => {
    const { id } = params;

    // Simulate well not found
    if (id === 'not-found') {
      return HttpResponse.json(
        {
          message: 'Well not found',
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(
      createMockGetWellByIdResponse({
        well: {
          ...createMockGetWellByIdResponse().well,
          id: id as string,
          wellId: `W-${id}`,
        },
      })
    );
  }),

  /**
   * GET /api/wells/:id/similar - Fetch similar wells
   */
  http.get(`${BASE_URL}/wells/:id/similar`, ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.7');

    // Simulate well not found
    if (id === 'not-found') {
      return HttpResponse.json(
        {
          message: 'Well not found',
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    const response = createMockGetSimilarWellsResponse({
      targetWell: {
        id: id as string,
        wellId: `W-${id}`,
        wellName: `Well ${id}`,
      },
    });

    // Filter by threshold and limit
    response.similarWells = response.similarWells
      .filter((sw) => sw.similarity >= threshold)
      .slice(0, limit);

    return HttpResponse.json(response);
  }),
];

/**
 * Error handlers for testing error scenarios
 */
export const errorHandlers = [
  /**
   * GET /api/wells - Network error
   */
  http.get(`${BASE_URL}/wells`, () => {
    return HttpResponse.error();
  }),

  /**
   * GET /api/wells/:id - Server error
   */
  http.get(`${BASE_URL}/wells/:id`, () => {
    return HttpResponse.json(
      {
        message: 'Internal server error',
        statusCode: 500,
      },
      { status: 500 }
    );
  }),

  /**
   * GET /api/wells/:id/similar - Timeout simulation
   */
  http.get(`${BASE_URL}/wells/:id/similar`, () => {
    return HttpResponse.error();
  }),
];
