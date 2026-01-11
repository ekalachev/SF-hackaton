/**
 * Tests for well type utilities
 */

import { describe, it, expect } from 'vitest';
import { getValuationCategory } from './well';

describe('getValuationCategory', () => {
  it.each([
    [20, 'undervalued'],
    [25, 'undervalued'],
    [50, 'undervalued'],
    [100, 'undervalued'],
  ])('should return undervalued for discount >= 20% (discount: %d)', (discountPct, expected) => {
    expect(getValuationCategory(discountPct)).toBe(expected);
  });

  it.each([
    [-20, 'overvalued'],
    [-25, 'overvalued'],
    [-50, 'overvalued'],
    [-100, 'overvalued'],
  ])('should return overvalued for discount <= -20% (discount: %d)', (discountPct, expected) => {
    expect(getValuationCategory(discountPct)).toBe(expected);
  });

  it.each([
    [0, 'fair'],
    [10, 'fair'],
    [19, 'fair'],
    [-10, 'fair'],
    [-19, 'fair'],
    [19.9, 'fair'],
    [-19.9, 'fair'],
  ])('should return fair for discount between -20% and 20% (discount: %d)', (discountPct, expected) => {
    expect(getValuationCategory(discountPct)).toBe(expected);
  });
});
