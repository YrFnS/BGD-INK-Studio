import { describe, expect, it } from 'vitest';
import {
  fitArtworkTextureDimensions,
  getArtworkTextureDimensionLimit,
  getArtworkTextureLimits,
  getArtworkTexturePixelAreaLimit,
  isArtworkTextureWithinLimits,
} from './artworkTextureBudget';

describe('artwork texture budgets', () => {
  it('uses stricter dimension and decoded-pixel caps for balanced and low-power rendering', () => {
    expect(getArtworkTextureDimensionLimit('high')).toBe(2048);
    expect(getArtworkTextureDimensionLimit('balanced')).toBe(1536);
    expect(getArtworkTextureDimensionLimit('low')).toBe(1024);
    expect(getArtworkTexturePixelAreaLimit('high')).toBe(3_145_728);
    expect(getArtworkTexturePixelAreaLimit('balanced')).toBe(1_572_864);
    expect(getArtworkTexturePixelAreaLimit('low')).toBe(786_432);
  });

  it('preserves aspect ratio while reducing large landscape and portrait artwork', () => {
    expect(fitArtworkTextureDimensions(6000, 3000, 2048, 3_145_728)).toEqual({
      width: 2048,
      height: 1024,
    });
    expect(fitArtworkTextureDimensions(3000, 6000, 1024, 786_432)).toEqual({
      width: 512,
      height: 1024,
    });
  });

  it('uses the decoded pixel-area guard even when both dimensions fit independently', () => {
    const dimensions = fitArtworkTextureDimensions(6000, 6000, 2048, 3_145_728);

    expect(dimensions.width).toBe(dimensions.height);
    expect(dimensions.width).toBeLessThan(2048);
    expect(dimensions.width * dimensions.height).toBeLessThanOrEqual(3_145_728);
  });

  it('does not upscale artwork that already fits both budgets', () => {
    expect(fitArtworkTextureDimensions(800, 400, 2048, 3_145_728)).toEqual({
      width: 800,
      height: 400,
    });
  });

  it('combines configured and hardware limits before texture construction', () => {
    const limits = getArtworkTextureLimits('high', 1024);
    const dimensions = fitArtworkTextureDimensions(
      5000,
      5000,
      limits.maximumDimension,
      limits.maximumPixelArea,
    );

    expect(limits).toEqual({ maximumDimension: 1024, maximumPixelArea: 1_048_576 });
    expect(isArtworkTextureWithinLimits(dimensions, limits)).toBe(true);
  });
});
