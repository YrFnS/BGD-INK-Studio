import { PrintSurfaceDefinition } from '@/data/assets3d';

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

const getHorizontalModelUnitsPerCm = (surface: PrintSurfaceDefinition): number =>
  (surface.modelBounds.maxX - surface.modelBounds.minX) / surface.physicalWidthCm;

const getVerticalModelUnitsPerCm = (surface: PrintSurfaceDefinition): number =>
  (surface.modelBounds.maxY - surface.modelBounds.minY) / surface.physicalHeightCm;

export const artworkWidthCmToScale = (
  widthCm: number,
  surface: PrintSurfaceDefinition,
): number => widthCm * getHorizontalModelUnitsPerCm(surface);

export const scaleToArtworkWidthCm = (
  scale: number,
  surface: PrintSurfaceDefinition,
): number => scale / getHorizontalModelUnitsPerCm(surface);

export const getSurfaceScaleLimits = (
  surface: PrintSurfaceDefinition,
): { minimum: number; maximum: number } => {
  const horizontalUnitsPerCm = getHorizontalModelUnitsPerCm(surface);
  const verticalUnitsPerCm = getVerticalModelUnitsPerCm(surface);
  const safeHorizontalMargin = surface.safeMarginCm * horizontalUnitsPerCm;
  const safeVerticalMargin = surface.safeMarginCm * verticalUnitsPerCm;
  const availableWidth =
    surface.modelBounds.maxX - surface.modelBounds.minX - safeHorizontalMargin * 2;
  const availableHeight =
    surface.modelBounds.maxY - surface.modelBounds.minY - safeVerticalMargin * 2;
  const configuredMaximum = artworkWidthCmToScale(surface.maximumArtworkWidthCm, surface);

  return {
    minimum: artworkWidthCmToScale(surface.minimumArtworkWidthCm, surface),
    maximum: Math.min(configuredMaximum, availableWidth, availableHeight),
  };
};

export const clampScaleToSurface = (
  scale: number,
  surface: PrintSurfaceDefinition,
): number => {
  const limits = getSurfaceScaleLimits(surface);
  return clamp(scale, limits.minimum, limits.maximum);
};

export const clampPositionToSurface = (
  position: [number, number, number],
  surface: PrintSurfaceDefinition,
  scale: number,
): [number, number, number] => {
  const safeScale = clampScaleToSurface(scale, surface);
  const horizontalUnitsPerCm = getHorizontalModelUnitsPerCm(surface);
  const verticalUnitsPerCm = getVerticalModelUnitsPerCm(surface);
  const safeHorizontalMargin = surface.safeMarginCm * horizontalUnitsPerCm;
  const safeVerticalMargin = surface.safeMarginCm * verticalUnitsPerCm;
  const halfScale = safeScale / 2;
  const minimumX = surface.modelBounds.minX + safeHorizontalMargin + halfScale;
  const maximumX = surface.modelBounds.maxX - safeHorizontalMargin - halfScale;
  const minimumY = surface.modelBounds.minY + safeVerticalMargin + halfScale;
  const maximumY = surface.modelBounds.maxY - safeVerticalMargin - halfScale;

  return [
    minimumX <= maximumX ? clamp(position[0], minimumX, maximumX) : 0,
    minimumY <= maximumY ? clamp(position[1], minimumY, maximumY) : 0,
    position[2],
  ];
};

export const createDefaultSurfaceTransform = (
  surface: PrintSurfaceDefinition,
): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
} => {
  const scale = clampScaleToSurface(
    artworkWidthCmToScale(surface.defaultArtworkWidthCm, surface),
    surface,
  );

  return {
    position: clampPositionToSurface(surface.defaultPosition, surface, scale),
    rotation: [...surface.defaultRotation],
    scale,
  };
};

export const isPointOnSurfaceSide = (
  z: number,
  surface: PrintSurfaceDefinition,
  tolerance = 0.005,
): boolean => (surface.side === 'front' ? z >= -tolerance : z <= tolerance);
