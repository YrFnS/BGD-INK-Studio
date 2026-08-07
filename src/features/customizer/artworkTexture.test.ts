import { describe, expect, it } from 'vitest';
import {
  fitArtworkTextureDimensions,
  getArtworkTextureDimensionLimit,
} from './artworkTextureBudget';

describe('artwork texture budgets', () => {
  it('uses stricter caps for balanced and low-power rendering', () => {
    expect(getArtworkTextureDimensionLimit('high')).toBe(2048);
    expect(getArtworkTextureDimensionLimit('balanced')).toBe(1536);
    expect(getArtworkTextureDimensionLimit('low')).toBe(1024);
  });

  it('preserves aspect ratio while reducing oversized artwork', () => {
    expect(fitArtworkTextureDimensions(6000, 3000, 2048)).toEqual({
      width: 2048,
      height: 1024,
    });
    expect(fitArtworkTextureDimensions(3000, 6000, 1024)).toEqual({
      width: 512,
      height: 1024,
    });
  });

  it('does not upscale artwork that already fits the budget', () => {
    expect(fitArtworkTextureDimensions(800, 400, 2048)).toEqual({
      width: 800,
      height: 400,
    });
  });
});
