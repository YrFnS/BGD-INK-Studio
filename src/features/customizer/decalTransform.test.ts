import { describe, expect, it } from 'vitest';
import { getPrintSurface, getReadyProductModelConfig } from '@/data/assets3d';
import { DEFAULT_PRINT_SURFACE_ID, type DecalLayer } from '@/types';
import {
  applyDecalTransform,
  areDecalTransformsEqual,
  normalizeDecalTransform,
  readDecalTransform,
} from './decalTransform';

const modelConfig = getReadyProductModelConfig('tshirt-classic');
if (!modelConfig) throw new Error('Classic T-shirt model configuration is missing.');
const surface = getPrintSurface(modelConfig, DEFAULT_PRINT_SURFACE_ID);

const layer: DecalLayer = {
  id: 'layer-1',
  name: 'Artwork',
  visible: true,
  url: 'blob:artwork',
  surfaceId: DEFAULT_PRINT_SURFACE_ID,
  position: [0, -0.04, 0.16],
  rotation: [0, 0, 0],
  userRotation: 0,
  scale: 0.2,
  aspectRatio: 1,
};

describe('decal transforms', () => {
  it('normalizes live updates without mutating the committed layer', () => {
    const current = readDecalTransform(layer);
    const next = normalizeDecalTransform(
      layer,
      current,
      {
        position: [99, 99, 0.16],
        scale: 99,
        userRotation: Math.PI / 2,
      },
      surface,
    );

    expect(next.scale).toBeLessThan(99);
    expect(next.position[0]).not.toBe(99);
    expect(next.position[1]).not.toBe(99);
    expect(layer.scale).toBe(0.2);
    expect(layer.position).toEqual([0, -0.04, 0.16]);
  });

  it('creates an immutable committed layer and compares transforms by typed fields', () => {
    const start = readDecalTransform(layer);
    const final = normalizeDecalTransform(
      layer,
      start,
      { scale: start.scale + 0.01, userRotation: 0.5 },
      surface,
    );
    const committed = applyDecalTransform(layer, final);

    expect(committed).not.toBe(layer);
    expect(committed.position).not.toBe(layer.position);
    expect(committed.rotation).not.toBe(layer.rotation);
    expect(areDecalTransformsEqual(start, final)).toBe(false);
    expect(areDecalTransformsEqual(final, readDecalTransform(committed))).toBe(true);
  });
});
