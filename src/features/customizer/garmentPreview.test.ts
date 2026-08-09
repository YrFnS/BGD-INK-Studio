import { describe, expect, it } from 'vitest';
import { getGarmentPreviewDefinition } from './garmentPreview';

describe('getGarmentPreviewDefinition', () => {
  it('uses different construction details for front and back surfaces', () => {
    const front = getGarmentPreviewDefinition('tshirt-classic', 'front');
    const back = getGarmentPreviewDefinition('tshirt-classic', 'back');

    expect(front.detailPaths).not.toEqual(back.detailPaths);
    expect(front.artworkFrame.top).not.toBe(back.artworkFrame.top);
  });

  it('keeps each garment family visually distinct', () => {
    const classic = getGarmentPreviewDefinition('tshirt-classic', 'front');
    const oversized = getGarmentPreviewDefinition('tee-oversized', 'front');
    const hoodie = getGarmentPreviewDefinition('hoodie-premium', 'front');
    const vest = getGarmentPreviewDefinition('vest-urban', 'front');

    expect(
      new Set([
        classic.silhouettePath,
        oversized.silhouettePath,
        hoodie.silhouettePath,
        vest.silhouettePath,
      ]).size,
    ).toBe(4);
    expect(hoodie.secondaryPath).toBeTruthy();
  });

  it('falls back to the classic garment for unknown product ids', () => {
    expect(getGarmentPreviewDefinition('unknown-product', 'front')).toEqual(
      getGarmentPreviewDefinition('tshirt-classic', 'front'),
    );
  });
});
