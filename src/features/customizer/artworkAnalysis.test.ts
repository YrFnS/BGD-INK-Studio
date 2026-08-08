import { describe, expect, it } from 'vitest';
import {
  analyzeArtworkPixels,
  createArtworkQualityReport,
  estimateArtworkDpi,
  getArtworkDpiLevel,
  normalizeArtworkAspectRatio,
} from './artworkAnalysis';

const createSample = (): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(4 * 2 * 4);

  for (let y = 0; y < 2; y += 1) {
    for (let x = 1; x <= 2; x += 1) {
      const offset = (y * 4 + x) * 4;
      data[offset] = 255;
      data[offset + 3] = 255;
    }
  }

  return data;
};

describe('artwork source analysis', () => {
  it('reads aspect ratio, transparency, and transparent outer padding', () => {
    const analysis = analyzeArtworkPixels({
      pixelWidth: 4000,
      pixelHeight: 2000,
      sampleWidth: 4,
      sampleHeight: 2,
      data: createSample(),
    });

    expect(analysis.aspectRatio).toBe(2);
    expect(analysis.hasTransparency).toBe(true);
    expect(analysis.transparentPixelRatio).toBeCloseTo(0.5);
    expect(analysis.transparentPaddingRatio).toBeCloseTo(0.5);
  });

  it('estimates print DPI from both physical dimensions', () => {
    const dpi = estimateArtworkDpi(4000, 2000, 20, 10);

    expect(dpi).toBeCloseTo(508, 0);
    expect(getArtworkDpiLevel(dpi)).toBe('excellent');
    expect(getArtworkDpiLevel(149)).toBe('low');
    expect(getArtworkDpiLevel(99)).toBe('very-low');
  });

  it('reports resolution, aspect-ratio, padding, and edge warnings', () => {
    const report = createArtworkQualityReport(
      {
        pixelWidth: 600,
        pixelHeight: 120,
        aspectRatio: 5,
        transparentPaddingRatio: 0.6,
      },
      30,
      6,
      0.5,
    );

    expect(report.level).toBe('very-low');
    expect(report.warnings).toEqual([
      'very-low-resolution',
      'extreme-aspect-ratio',
      'transparent-padding',
      'near-print-edge',
    ]);
  });

  it('normalizes missing or invalid legacy aspect ratios', () => {
    expect(normalizeArtworkAspectRatio(undefined)).toBe(1);
    expect(normalizeArtworkAspectRatio(0)).toBe(1);
    expect(normalizeArtworkAspectRatio(1.5)).toBe(1.5);
  });
});
