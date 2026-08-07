import { describe, expect, it } from 'vitest';
import type { PrintSurfaceDefinition } from '@/data/assets3d';
import {
  artworkWidthCmToScale,
  clampPositionToSurface,
  clampScaleToSurface,
  createDefaultSurfaceTransform,
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
  it('converts between centimeters and model scale', () => {
    const scale = artworkWidthCmToScale(15, frontSurface);

    expect(scale).toBeCloseTo(0.3);
    expect(scaleToArtworkWidthCm(scale, frontSurface)).toBeCloseTo(15);
  });

  it('clamps artwork size and position inside the safe area', () => {
    const limits = getSurfaceScaleLimits(frontSurface);
    const safeScale = clampScaleToSurface(100, frontSurface);
    const position = clampPositionToSurface([100, -100, 0.16], frontSurface, safeScale);

    expect(safeScale).toBeCloseTo(limits.maximum);
    expect(position[0]).toBeLessThanOrEqual(frontSurface.modelBounds.maxX);
    expect(position[0]).toBeGreaterThanOrEqual(frontSurface.modelBounds.minX);
    expect(position[1]).toBeLessThanOrEqual(frontSurface.modelBounds.maxY);
    expect(position[1]).toBeGreaterThanOrEqual(frontSurface.modelBounds.minY);
    expect(position[2]).toBe(0.16);
  });

  it('creates a surface-specific default transform and rejects the opposite garment side', () => {
    const transform = createDefaultSurfaceTransform(backSurface);

    expect(transform.position[2]).toBeLessThan(0);
    expect(transform.rotation[1]).toBe(Math.PI);
    expect(scaleToArtworkWidthCm(transform.scale, backSurface)).toBeCloseTo(12);
    expect(isPointOnSurfaceSide(-0.1, backSurface)).toBe(true);
    expect(isPointOnSurfaceSide(0.1, backSurface)).toBe(false);
  });
});
