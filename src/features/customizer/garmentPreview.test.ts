import { describe, expect, it } from 'vitest';
import { getGarmentPreviewDefinition } from './garmentPreview';

describe('getGarmentPreviewDefinition', () => {
  it('uses different render assets and placement frames for front and back surfaces', () => {
    const front = getGarmentPreviewDefinition('tshirt-classic', 'front');
    const back = getGarmentPreviewDefinition('tshirt-classic', 'back');

    expect(front.assetPath).not.toBe(back.assetPath);
    expect(front.artworkFrame.top).not.toBe(back.artworkFrame.top);
  });

  it('keeps each garment family visually distinct', () => {
    const assetPaths = [
      getGarmentPreviewDefinition('tshirt-classic', 'front').assetPath,
      getGarmentPreviewDefinition('tee-oversized', 'front').assetPath,
      getGarmentPreviewDefinition('hoodie-premium', 'front').assetPath,
      getGarmentPreviewDefinition('vest-urban', 'front').assetPath,
    ];

    expect(new Set(assetPaths).size).toBe(4);
    assetPaths.forEach((assetPath) => {
      expect(assetPath).toMatch(/^\/brand\/products\/renders\/.+-front\.svg$/);
    });
  });

  it('provides owned front and back assets for every configured garment', () => {
    for (const productId of [
      'tshirt-classic',
      'tee-oversized',
      'hoodie-premium',
      'vest-urban',
    ]) {
      expect(getGarmentPreviewDefinition(productId, 'front').assetPath).toContain('-front.svg');
      expect(getGarmentPreviewDefinition(productId, 'back').assetPath).toContain('-back.svg');
    }
  });

  it('falls back to the classic garment for unknown product ids', () => {
    expect(getGarmentPreviewDefinition('unknown-product', 'front')).toEqual(
      getGarmentPreviewDefinition('tshirt-classic', 'front'),
    );
  });
});
