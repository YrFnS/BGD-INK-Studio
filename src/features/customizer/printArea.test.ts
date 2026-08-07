import { describe, expect, it } from 'vitest';
import type { PrintSurfaceDefinition } from '@/data/assets3d';
import {
  artworkWidthCmToScale,
  clampPositionToSurface,
  clampScaleToSurface,
  createDefaultSurfaceTransform,
  getArtworkEdgeClearanceCm,
  getArtworkModelDimensions,
  getArtworkPhysicalDimensions,
  getSurfaceScaleLimits,
  isPointOnSurfaceSide,
  scaleToArtworkWidthCm,
} from './printArea';

const frontSurface = {
  id: 'front',
  labelKey: 'customizer.surface.front',
  side: 'front',
  physicalWidthCm: 30,
  physicalHeightCm: 40,
  safeMarginCm: 2,
  modelBounds: {
    minX: -0.3,
    maxX: 0.3,
    minY: -0.4,
    maxY: 0.4,
  },
  defaultPosition: [0, 0, 0.15],
  defaultRotation: [0, 0, 0],
  cameraPosition: [0, 0, 4],
  cameraTarget: [0, 0, 0],
  minimumArtworkWidthCm: 4,
  maximumArtworkWidthCm: 26,
  defaultArtworkWidthCm: 12,
} satisfies PrintSurfaceDefinition;

const backSurface = {
  ...frontSurface,
  id: 'back',
  side: 'back',
  labelKey: 'customizer.surface.back',
  defaultPosition: [0, 0, -0.15],
  defaultRotation: [0, Math.PI, 0],
  cameraPosition: [0, 0, -4],
} satisfies PrintSurfaceDefinition;

describe('print area calculations', () => {
  it('converts centimeters and preserves source aspect ratio', () => {
    const scale = artworkWidthCmToScale(15, frontSurface);
    const physical = getArtworkPhysicalDimensions(scale, frontSurface, 2);
    const model = getArtworkModelDimensions(scale, frontSurface, 2);

    expect(scale).toBeCloseTo(0.3);
    expect(scaleToArtworkWidthCm(scale, frontSurface)).toBeCloseTo(15);
    expect(physical).toEqual({ widthCm: 15, heightCm: 7.5 });
    expect(model.width).toBeCloseTo(0.3);
    expect(model.height).toBeCloseTo(0.15);
  });

  it('clamps wide and tall artwork inside the safe area', () => {
    const tallAspectRatio = 0.5;
    const limits = getSurfaceScaleLimits(frontSurface, tallAspectRatio);
    const safeScale = clampScaleToSurface(100, frontSurface, tallAspectRatio);
    const position = clampPositionToSurface(
      [100, -100, 0.16],
      frontSurface,
      safeScale,
      tallAspectRatio,
    );

    expect(safeScale).toBeCloseTo(limits.maximum);
    expect(position[0]).toBeLessThanOrEqual(frontSurface.modelBounds.maxX);
    expect(position[0]).toBeGreaterThanOrEqual(frontSurface.modelBounds.minX);
    expect(position[1]).toBeLessThanOrEqual(frontSurface.modelBounds.maxY);
    expect(position[1]).toBeGreaterThanOrEqual(frontSurface.modelBounds.minY);
    expect(position[2]).toBe(0.16);
    expect(
      getArtworkEdgeClearanceCm(position, frontSurface, safeScale, tallAspectRatio),
    ).toBeGreaterThanOrEqual(-0.001);
  });

  it('creates a surface-specific default transform and rejects the opposite garment side', () => {
    const transform = createDefaultSurfaceTransform(backSurface, 2);
    const dimensions = getArtworkPhysicalDimensions(transform.scale, backSurface, 2);

    expect(transform.position[2]).toBeLessThan(0);
    expect(transform.rotation[1]).toBe(Math.PI);
    expect(dimensions.widthCm).toBeCloseTo(12);
    expect(dimensions.heightCm).toBeCloseTo(6);
    expect(isPointOnSurfaceSide(-0.1, backSurface)).toBe(true);
    expect(isPointOnSurfaceSide(0.1, backSurface)).toBe(false);
  });
});
