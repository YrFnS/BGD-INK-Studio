import type { PrintSurfaceDefinition } from '@/data/assets3d';
import { normalizeArtworkAspectRatio } from './artworkAnalysis';

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

const getHorizontalModelUnitsPerCm = (surface: PrintSurfaceDefinition): number =>
  (surface.modelBounds.maxX - surface.modelBounds.minX) / surface.physicalWidthCm;

const getVerticalModelUnitsPerCm = (surface: PrintSurfaceDefinition): number =>
  (surface.modelBounds.maxY - surface.modelBounds.minY) / surface.physicalHeightCm;

export const artworkWidthCmToScale = (widthCm: number, surface: PrintSurfaceDefinition): number =>
  widthCm * getHorizontalModelUnitsPerCm(surface);

export const scaleToArtworkWidthCm = (scale: number, surface: PrintSurfaceDefinition): number =>
  scale / getHorizontalModelUnitsPerCm(surface);

export const getArtworkPhysicalDimensions = (
  scale: number,
  surface: PrintSurfaceDefinition,
  aspectRatio = 1,
): { widthCm: number; heightCm: number } => {
  const widthCm = scaleToArtworkWidthCm(scale, surface);
  return {
    widthCm,
    heightCm: widthCm / normalizeArtworkAspectRatio(aspectRatio),
  };
};

export const getArtworkModelDimensions = (
  scale: number,
  surface: PrintSurfaceDefinition,
  aspectRatio = 1,
): { width: number; height: number } => {
  const physical = getArtworkPhysicalDimensions(scale, surface, aspectRatio);
  return {
    width: scale,
    height: physical.heightCm * getVerticalModelUnitsPerCm(surface),
  };
};

export interface ArtworkPlacementCm {
  centerXcm: number;
  centerYcm: number;
  leftCm: number;
  topCm: number;
  rightCm: number;
  bottomCm: number;
}

export const getArtworkPlacementCm = (
  position: [number, number, number],
  surface: PrintSurfaceDefinition,
  scale: number,
  aspectRatio = 1,
): ArtworkPlacementCm => {
  const horizontalUnitsPerCm = getHorizontalModelUnitsPerCm(surface);
  const verticalUnitsPerCm = getVerticalModelUnitsPerCm(surface);
  const dimensions = getArtworkModelDimensions(scale, surface, aspectRatio);
  const rawLeftCm =
    (position[0] - dimensions.width / 2 - surface.modelBounds.minX) / horizontalUnitsPerCm;
  const rawRightCm =
    (surface.modelBounds.maxX - (position[0] + dimensions.width / 2)) / horizontalUnitsPerCm;
  const leftCm = surface.side === 'front' ? rawLeftCm : rawRightCm;
  const rightCm = surface.side === 'front' ? rawRightCm : rawLeftCm;
  const topCm =
    (surface.modelBounds.maxY - (position[1] + dimensions.height / 2)) / verticalUnitsPerCm;
  const bottomCm =
    (position[1] - dimensions.height / 2 - surface.modelBounds.minY) / verticalUnitsPerCm;
  const physical = getArtworkPhysicalDimensions(scale, surface, aspectRatio);

  return {
    centerXcm: leftCm + physical.widthCm / 2 - surface.physicalWidthCm / 2,
    centerYcm: surface.physicalHeightCm / 2 - (topCm + physical.heightCm / 2),
    leftCm,
    topCm,
    rightCm,
    bottomCm,
  };
};

export const getSurfaceScaleLimits = (
  surface: PrintSurfaceDefinition,
  aspectRatio = 1,
): { minimum: number; maximum: number } => {
  const normalizedAspectRatio = normalizeArtworkAspectRatio(aspectRatio);
  const horizontalUnitsPerCm = getHorizontalModelUnitsPerCm(surface);
  const verticalUnitsPerCm = getVerticalModelUnitsPerCm(surface);
  const safeHorizontalMargin = surface.safeMarginCm * horizontalUnitsPerCm;
  const safeVerticalMargin = surface.safeMarginCm * verticalUnitsPerCm;
  const availableWidth =
    surface.modelBounds.maxX - surface.modelBounds.minX - safeHorizontalMargin * 2;
  const availableHeight =
    surface.modelBounds.maxY - surface.modelBounds.minY - safeVerticalMargin * 2;
  const availableHeightCm = availableHeight / verticalUnitsPerCm;
  const maximumWidthFromHeight = artworkWidthCmToScale(
    availableHeightCm * normalizedAspectRatio,
    surface,
  );
  const configuredMaximum = artworkWidthCmToScale(surface.maximumArtworkWidthCm, surface);
  const maximum = Math.max(
    0.001,
    Math.min(configuredMaximum, availableWidth, maximumWidthFromHeight),
  );
  const configuredMinimum = artworkWidthCmToScale(surface.minimumArtworkWidthCm, surface);

  return {
    minimum: Math.min(configuredMinimum, maximum),
    maximum,
  };
};

export const clampScaleToSurface = (
  scale: number,
  surface: PrintSurfaceDefinition,
  aspectRatio = 1,
): number => {
  const limits = getSurfaceScaleLimits(surface, aspectRatio);
  return clamp(scale, limits.minimum, limits.maximum);
};

export const clampPositionToSurface = (
  position: [number, number, number],
  surface: PrintSurfaceDefinition,
  scale: number,
  aspectRatio = 1,
): [number, number, number] => {
  const safeScale = clampScaleToSurface(scale, surface, aspectRatio);
  const horizontalUnitsPerCm = getHorizontalModelUnitsPerCm(surface);
  const verticalUnitsPerCm = getVerticalModelUnitsPerCm(surface);
  const safeHorizontalMargin = surface.safeMarginCm * horizontalUnitsPerCm;
  const safeVerticalMargin = surface.safeMarginCm * verticalUnitsPerCm;
  const dimensions = getArtworkModelDimensions(safeScale, surface, aspectRatio);
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;
  const minimumX = surface.modelBounds.minX + safeHorizontalMargin + halfWidth;
  const maximumX = surface.modelBounds.maxX - safeHorizontalMargin - halfWidth;
  const minimumY = surface.modelBounds.minY + safeVerticalMargin + halfHeight;
  const maximumY = surface.modelBounds.maxY - safeVerticalMargin - halfHeight;

  return [
    minimumX <= maximumX ? clamp(position[0], minimumX, maximumX) : 0,
    minimumY <= maximumY ? clamp(position[1], minimumY, maximumY) : 0,
    position[2],
  ];
};

export const getArtworkEdgeClearanceCm = (
  position: [number, number, number],
  surface: PrintSurfaceDefinition,
  scale: number,
  aspectRatio = 1,
): number => {
  const horizontalUnitsPerCm = getHorizontalModelUnitsPerCm(surface);
  const verticalUnitsPerCm = getVerticalModelUnitsPerCm(surface);
  const safeHorizontalMargin = surface.safeMarginCm * horizontalUnitsPerCm;
  const safeVerticalMargin = surface.safeMarginCm * verticalUnitsPerCm;
  const dimensions = getArtworkModelDimensions(scale, surface, aspectRatio);
  const safeMinimumX = surface.modelBounds.minX + safeHorizontalMargin;
  const safeMaximumX = surface.modelBounds.maxX - safeHorizontalMargin;
  const safeMinimumY = surface.modelBounds.minY + safeVerticalMargin;
  const safeMaximumY = surface.modelBounds.maxY - safeVerticalMargin;
  const left = (position[0] - dimensions.width / 2 - safeMinimumX) / horizontalUnitsPerCm;
  const right = (safeMaximumX - (position[0] + dimensions.width / 2)) / horizontalUnitsPerCm;
  const bottom = (position[1] - dimensions.height / 2 - safeMinimumY) / verticalUnitsPerCm;
  const top = (safeMaximumY - (position[1] + dimensions.height / 2)) / verticalUnitsPerCm;

  return Math.min(left, right, bottom, top);
};

export const createDefaultSurfaceTransform = (
  surface: PrintSurfaceDefinition,
  aspectRatio = 1,
): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
} => {
  const scale = clampScaleToSurface(
    artworkWidthCmToScale(surface.defaultArtworkWidthCm, surface),
    surface,
    aspectRatio,
  );

  return {
    position: clampPositionToSurface(surface.defaultPosition, surface, scale, aspectRatio),
    rotation: [...surface.defaultRotation],
    scale,
  };
};

export const isPointOnSurfaceSide = (
  z: number,
  surface: PrintSurfaceDefinition,
  tolerance = 0.005,
): boolean => (surface.side === 'front' ? z >= -tolerance : z <= tolerance);
