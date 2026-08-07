import { describe, expect, it } from 'vitest';
import {
  calculateLocalDraftEstimate,
  MAX_DRAFT_QUANTITY,
  MIN_DRAFT_QUANTITY,
  normalizeDraftQuantity,
} from './draft';

describe('local draft quantity rules', () => {
  it('normalizes missing, fractional, and out-of-range quantities', () => {
    expect(normalizeDraftQuantity(undefined)).toBe(MIN_DRAFT_QUANTITY);
    expect(normalizeDraftQuantity(2.6)).toBe(3);
    expect(normalizeDraftQuantity(0)).toBe(MIN_DRAFT_QUANTITY);
    expect(normalizeDraftQuantity(500)).toBe(MAX_DRAFT_QUANTITY);
  });

  it('calculates a local configured-price estimate without negative totals', () => {
    expect(calculateLocalDraftEstimate(25_000, 4)).toBe(100_000);
    expect(calculateLocalDraftEstimate(-10, 4)).toBe(0);
  });
});
