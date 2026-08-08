import assetBudgets from '@/config/asset-budgets.json';
import type { RenderingQuality } from './renderingCapabilities';

export interface ArtworkTextureDimensions {
  width: number;
  height: number;
}

export const getArtworkTextureDimensionLimit = (
  quality: RenderingQuality,
): number => {
  if (quality === 'high') return assetBudgets.artworkTextures.highMaximumDimension;
  if (quality === 'balanced') {
    return assetBudgets.artworkTextures.balancedMaximumDimension;
  }
  return assetBudgets.artworkTextures.lowMaximumDimension;
};

export const fitArtworkTextureDimensions = (
  width: number,
  height: number,
  maximumDimension: number,
): ArtworkTextureDimensions => {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    maximumDimension <= 0
  ) {
    return { width: 1, height: 1 };
  }

  const scale = Math.min(1, maximumDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};
