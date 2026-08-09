import assetBudgets from '@/config/asset-budgets.json';
import type { RenderingQuality } from './renderingCapabilities';

export interface ArtworkTextureDimensions {
  width: number;
  height: number;
}

export interface ArtworkTextureLimits {
  maximumDimension: number;
  maximumPixelArea: number;
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

export const getArtworkTexturePixelAreaLimit = (
  quality: RenderingQuality,
): number => {
  if (quality === 'high') return assetBudgets.artworkTextures.highMaximumPixelArea;
  if (quality === 'balanced') {
    return assetBudgets.artworkTextures.balancedMaximumPixelArea;
  }
  return assetBudgets.artworkTextures.lowMaximumPixelArea;
};

export const getArtworkTextureLimits = (
  quality: RenderingQuality,
  hardwareMaximumDimension: number,
): ArtworkTextureLimits => {
  const configuredDimension = getArtworkTextureDimensionLimit(quality);
  const maximumDimension = Math.max(
    1,
    Math.min(configuredDimension, Math.floor(hardwareMaximumDimension || configuredDimension)),
  );

  return {
    maximumDimension,
    maximumPixelArea: Math.max(
      1,
      Math.min(getArtworkTexturePixelAreaLimit(quality), maximumDimension * maximumDimension),
    ),
  };
};

export const fitArtworkTextureDimensions = (
  width: number,
  height: number,
  maximumDimension: number,
  maximumPixelArea = Number.POSITIVE_INFINITY,
): ArtworkTextureDimensions => {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(maximumDimension) ||
    maximumDimension <= 0 ||
    maximumPixelArea <= 0
  ) {
    return { width: 1, height: 1 };
  }

  const sourcePixelArea = width * height;
  const dimensionScale = maximumDimension / Math.max(width, height);
  const pixelAreaScale = Number.isFinite(maximumPixelArea)
    ? Math.sqrt(maximumPixelArea / sourcePixelArea)
    : 1;
  const scale = Math.min(1, dimensionScale, pixelAreaScale);

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
};

export const isArtworkTextureWithinLimits = (
  dimensions: ArtworkTextureDimensions,
  limits: ArtworkTextureLimits,
): boolean =>
  dimensions.width > 0 &&
  dimensions.height > 0 &&
  Math.max(dimensions.width, dimensions.height) <= limits.maximumDimension &&
  dimensions.width * dimensions.height <= limits.maximumPixelArea;
