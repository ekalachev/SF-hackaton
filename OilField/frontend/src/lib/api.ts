/**
 * API Client
 * Axios instance and API functions for the OilField application
 *
 * Following SOLID principles:
 * - Single Responsibility: Each function handles one API endpoint
 * - Open/Closed: Easy to extend with new endpoints
 * - Dependency Inversion: Export configured client for testing
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import logger from './logger';
import type {
  GetWellsResponse,
  GetWellByIdResponse,
  GetSimilarWellsResponse,
  WellFilters,
  DynamicValuationResponse,
} from '../types/api';

/**
 * Configured Axios instance
 * Base URL from environment variable (VITE_API_URL)
 * Default: http://localhost:3001/api (backend API server)
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

/**
 * Request interceptor - Log all API requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';

    // Store request start time for duration calculation
    config.metadata = { startTime: performance.now() };

    logger.logApiRequest(method, url);
    return config;
  },
  (error) => {
    logger.error('api', 'Request interceptor error', { error: error.message });
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Log API responses and errors
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const duration = config.metadata?.startTime
      ? Math.round(performance.now() - config.metadata.startTime)
      : 0;

    logger.logApiResponse(method, url, response.status, duration);
    logger.logPerformance('API call', duration, 'ms');

    return response;
  },
  (error) => {
    const config = error.config as InternalAxiosRequestConfig;
    const method = config?.method?.toUpperCase() || 'UNKNOWN';
    const url = config?.url || 'UNKNOWN';

    logger.logApiError(method, url, error);
    return Promise.reject(error);
  }
);

// Extend InternalAxiosRequestConfig to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

/**
 * Fetch wells with optional filtering, sorting, and pagination
 *
 * @param filters - Optional query parameters for filtering/sorting
 * @returns Promise with wells list and pagination info
 */
export async function getWells(filters: WellFilters = {}): Promise<GetWellsResponse> {
  const response = await apiClient.get<GetWellsResponse>('/wells', {
    params: filters,
  });
  return response.data;
}

/**
 * Fetch detailed information for a specific well
 *
 * @param id - Well ID (UUID or well_id string)
 * @returns Promise with well details, production history, and valuation
 * @throws Error if ID is empty
 */
export async function getWellById(id: string): Promise<GetWellByIdResponse> {
  if (!id || id.trim() === '') {
    throw new Error('Well ID is required');
  }

  const response = await apiClient.get<GetWellByIdResponse>(`/wells/${id}`);
  return response.data;
}

/**
 * Fetch wells similar to a specific well
 *
 * @param id - Well ID to find similar wells for
 * @param options - Optional parameters (limit, threshold)
 * @returns Promise with target well and similar wells list
 * @throws Error if ID is empty
 */
export async function getSimilarWells(
  id: string,
  options: { limit?: number; threshold?: number } = {}
): Promise<GetSimilarWellsResponse> {
  if (!id || id.trim() === '') {
    throw new Error('Well ID is required');
  }

  const response = await apiClient.get<GetSimilarWellsResponse>(`/wells/${id}/similar`, {
    params: options,
  });
  return response.data;
}

/**
 * Fetch dynamically calculated valuation for a specific well
 *
 * @param id - Well ID (UUID or well_id string)
 * @returns Promise with dynamic valuation calculation
 * @throws Error if ID is empty
 */
export async function getDynamicValuation(id: string): Promise<DynamicValuationResponse> {
  if (!id || id.trim() === '') {
    throw new Error('Well ID is required');
  }

  const response = await apiClient.get<DynamicValuationResponse>(`/wells/${id}/valuation`);
  return response.data;
}
