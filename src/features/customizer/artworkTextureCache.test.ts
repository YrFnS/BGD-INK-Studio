import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acquireArtworkTexture,
  createArtworkTextureCacheKey,
  getArtworkTextureCacheSnapshot,
  resetArtworkTextureCacheForTests,
} from './artworkTextureCache';
import type { LoadedArtworkTexture } from './artworkTextureLoader';
import * as THREE from 'three';

const createResource = (width = 1024, height = 512) => {
  const texture = new THREE.Texture();
  const dispose = vi.spyOn(texture, 'dispose');
  const resource: LoadedArtworkTexture = {
    texture,
    width,
    height,
    dispose: () => texture.dispose(),
  };
  return { resource, texture, dispose };
};

const cacheKey = (quality: 'low' | 'balanced' | 'high' = 'balanced') =>
  createArtworkTextureCacheKey({
    sourceIdentity: 'asset:shared-artwork',
    sourceWidth: 4000,
    sourceHeight: 2000,
    limits:
      quality === 'low'
        ? { maximumDimension: 1024, maximumPixelArea: 786_432 }
        : quality === 'high'
          ? { maximumDimension: 2048, maximumPixelArea: 3_145_728 }
          : { maximumDimension: 1536, maximumPixelArea: 1_572_864 },
    anisotropy: quality === 'high' ? 8 : quality === 'low' ? 2 : 4,
  });

describe('artwork texture cache', () => {
  beforeEach(() => {
    resetArtworkTextureCacheForTests();
  });

  it('shares one compatible texture and disposes it after the final release', async () => {
    const { resource, texture, dispose } = createResource();
    const load = vi.fn(async () => resource);
    const first = acquireArtworkTexture(cacheKey(), load);
    const second = acquireArtworkTexture(cacheKey(), load);

    await expect(first.texture).resolves.toBe(texture);
    await expect(second.texture).resolves.toBe(texture);
    expect(load).toHaveBeenCalledTimes(1);
    expect(getArtworkTextureCacheSnapshot()).toMatchObject({
      entries: 1,
      references: 2,
      ready: 1,
      texturesCreated: 1,
      texturesDisposed: 0,
    });

    first.release();
    expect(dispose).not.toHaveBeenCalled();
    expect(getArtworkTextureCacheSnapshot().references).toBe(1);

    second.release();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(getArtworkTextureCacheSnapshot()).toMatchObject({
      entries: 0,
      references: 0,
      texturesDisposed: 1,
    });
  });

  it('aborts a pending decode and disposes a late result after navigation or unmount', async () => {
    let resolveLoad!: (resource: LoadedArtworkTexture) => void;
    let observedSignal!: AbortSignal;
    const { resource, dispose } = createResource();
    const lease = acquireArtworkTexture(cacheKey(), (signal) => {
      observedSignal = signal;
      return new Promise<LoadedArtworkTexture>((resolve) => {
        resolveLoad = resolve;
      });
    });
    const rejection = lease.texture.catch((error: unknown) => error);

    lease.release();
    expect(observedSignal.aborted).toBe(true);
    resolveLoad(resource);

    await expect(rejection).resolves.toMatchObject({ name: 'AbortError' });
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(getArtworkTextureCacheSnapshot()).toMatchObject({
      entries: 0,
      references: 0,
      cancelledLoads: 1,
      texturesCreated: 1,
      texturesDisposed: 1,
    });
  });

  it('removes failed decodes so a later acquisition can retry cleanly', async () => {
    const firstLoad = vi.fn(async () => {
      throw new Error('decode failed');
    });
    const first = acquireArtworkTexture(cacheKey(), firstLoad);

    await expect(first.texture).rejects.toThrow('decode failed');
    expect(getArtworkTextureCacheSnapshot()).toMatchObject({
      entries: 0,
      failedLoads: 1,
    });
    first.release();

    const { resource, texture } = createResource();
    const retry = acquireArtworkTexture(cacheKey(), async () => resource);
    await expect(retry.texture).resolves.toBe(texture);
    retry.release();
  });

  it('uses distinct entries when quality or sampling limits change', () => {
    expect(cacheKey('low')).not.toBe(cacheKey('balanced'));
    expect(cacheKey('balanced')).not.toBe(cacheKey('high'));
  });
});
