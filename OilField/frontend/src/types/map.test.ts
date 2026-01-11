/**
 * Tests for map type utilities
 */

import { describe, it, expect } from 'vitest';
import { wellToFeature, wellsToFeatureCollection } from './map';
import type { Well } from './well';

describe('wellToFeature', () => {
  const mockWell: Well = {
    id: 'well-1',
    wellId: 'TX-2438',
    wellName: 'Smith County Well 47A',
    apiNumber: '42-423-12345',
    operator: {
      id: 'op-1',
      name: 'Independent Oil Co',
    },
    location: {
      latitude: 32.4487,
      longitude: -95.301,
      county: 'Smith',
      field: 'East Texas',
    },
    status: 'active',
    production: {
      currentOilBblDay: 45,
      currentGasMcfDay: 90,
      cumulativeOilBbl: 180000,
      lastProductionDate: '2024-09-30',
      peakOilBblDay: 250,
      peakDate: '2022-03-15',
    },
    valuation: {
      npvUsd: 1850000,
      marketValueUsd: 2800000,
      discountPct: 34,
      confidence: 0.89,
    },
    nftTokenId: null,
    tags: ['undervalued', 'opportunity'],
  };

  it('should convert well to GeoJSON feature', () => {
    const feature = wellToFeature(mockWell);

    expect(feature).toEqual({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-95.301, 32.4487],
      },
      properties: {
        id: 'well-1',
        wellId: 'TX-2438',
        name: 'Smith County Well 47A',
        valuationCategory: 'undervalued',
        discountPct: 34,
        currentProduction: 45,
      },
    });
  });

  it('should use correct longitude/latitude order', () => {
    const feature = wellToFeature(mockWell);
    expect(feature).not.toBeNull();
    const [lng, lat] = feature!.geometry.coordinates;

    expect(lng).toBe(-95.301);
    expect(lat).toBe(32.4487);
  });

  it.each([
    [30, 'undervalued'],
    [0, 'fair'],
    [-30, 'overvalued'],
  ])('should categorize valuation correctly (discount: %d -> %s)', (discountPct, category) => {
    const well: Well = {
      ...mockWell,
      valuation: mockWell.valuation ? { ...mockWell.valuation, discountPct } : undefined,
    };

    const feature = wellToFeature(well);
    expect(feature?.properties.valuationCategory).toBe(category);
  });
});

describe('wellsToFeatureCollection', () => {
  const mockWells: Well[] = [
    {
      id: 'well-1',
      wellId: 'TX-2438',
      wellName: 'Smith County Well 47A',
      apiNumber: '42-423-12345',
      operator: { id: 'op-1', name: 'Independent Oil Co' },
      location: {
        latitude: 32.4487,
        longitude: -95.301,
        county: 'Smith',
        field: 'East Texas',
      },
      status: 'active',
      production: {
        currentOilBblDay: 45,
        currentGasMcfDay: 90,
        cumulativeOilBbl: 180000,
        lastProductionDate: '2024-09-30',
        peakOilBblDay: 250,
        peakDate: '2022-03-15',
      },
      valuation: {
        npvUsd: 1850000,
        marketValueUsd: 2800000,
        discountPct: 34,
        confidence: 0.89,
      },
      nftTokenId: null,
      tags: ['undervalued'],
    },
    {
      id: 'well-2',
      wellId: 'TX-2439',
      wellName: 'Harris County Well 23B',
      apiNumber: '42-201-67890',
      operator: { id: 'op-2', name: 'Major Oil Corp' },
      location: {
        latitude: 29.7604,
        longitude: -95.3698,
        county: 'Harris',
        field: 'Houston',
      },
      status: 'active',
      production: {
        currentOilBblDay: 120,
        currentGasMcfDay: 240,
        cumulativeOilBbl: 450000,
        lastProductionDate: '2024-09-30',
        peakOilBblDay: 380,
        peakDate: '2021-06-10',
      },
      valuation: {
        npvUsd: 4200000,
        marketValueUsd: 5100000,
        discountPct: -18,
        confidence: 0.92,
      },
      nftTokenId: null,
      tags: ['fair'],
    },
  ];

  it('should convert wells array to FeatureCollection', () => {
    const collection = wellsToFeatureCollection(mockWells);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(2);
  });

  it('should include all well features', () => {
    const collection = wellsToFeatureCollection(mockWells);

    expect(collection.features[0].properties.id).toBe('well-1');
    expect(collection.features[1].properties.id).toBe('well-2');
  });

  it('should handle empty array', () => {
    const collection = wellsToFeatureCollection([]);

    expect(collection).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });
});
