/**
 * API Client Tests
 * Following TDD - Tests written first
 *
 * Note: These are integration-style tests that verify the API client configuration
 * and function signatures. For full testing, use MSW or actual backend.
 */

import { describe, it, expect } from 'vitest';
import { apiClient } from './api';

describe('apiClient configuration', () => {
  it('should be configured with correct baseURL', () => {
    // Either from env var or default
    const expectedURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    expect(apiClient.defaults.baseURL).toBe(expectedURL);
  });

  it('should have json content type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have 10 second timeout', () => {
    expect(apiClient.defaults.timeout).toBe(10000);
  });
});

describe('API functions', () => {
  it('should export getWells function', async () => {
    const { getWells } = await import('./api');
    expect(typeof getWells).toBe('function');
  });

  it('should export getWellById function', async () => {
    const { getWellById } = await import('./api');
    expect(typeof getWellById).toBe('function');
  });

  it('should export getSimilarWells function', async () => {
    const { getSimilarWells } = await import('./api');
    expect(typeof getSimilarWells).toBe('function');
  });

  it('should throw error when getWellById called with empty ID', async () => {
    const { getWellById } = await import('./api');
    await expect(getWellById('')).rejects.toThrow('Well ID is required');
  });

  it('should throw error when getSimilarWells called with empty ID', async () => {
    const { getSimilarWells } = await import('./api');
    await expect(getSimilarWells('')).rejects.toThrow('Well ID is required');
  });
});
