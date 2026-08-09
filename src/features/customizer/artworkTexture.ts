import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { DecalLayer } from '@/types';
import {
  acquireArtworkTexture,
  createArtworkTextureCacheKey,
} from './artworkTextureCache';
import { getArtworkTextureLimits } from './artworkTextureBudget';
import {
  isArtworkTextureAbortError,
  loadBoundedArtworkTexture,
  type ArtworkTextureSource,
} from './artworkTextureLoader';
import type { RenderingQuality } from './renderingCapabilities';
import type * as THREE from 'three';

type ArtworkTextureLayerSource = Pick<
  DecalLayer,
  'assetId' | 'url' | 'pixelWidth' | 'pixelHeight'
>;

const createSource = (layer: ArtworkTextureLayerSource): ArtworkTextureSource => ({
  identity: layer.assetId ? `asset:${layer.assetId}` : `url:${layer.url}`,
  url: layer.url,
  pixelWidth: layer.pixelWidth,
  pixelHeight: layer.pixelHeight,
});

export const useOptimizedArtworkTexture = (
  layer: ArtworkTextureLayerSource,
  quality: RenderingQuality,
  anisotropy: 2 | 4 | 8,
): THREE.Texture | null => {
  const { gl, invalidate } = useThree();
  const hardwareMaximumDimension = Math.max(1, gl.capabilities.maxTextureSize || 1);
  const hardwareMaximumAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy() || 1);
  const effectiveAnisotropy = Math.max(
    1,
    Math.min(anisotropy, hardwareMaximumAnisotropy),
  );
  const limits = useMemo(
    () => getArtworkTextureLimits(quality, hardwareMaximumDimension),
    [hardwareMaximumDimension, quality],
  );
  const source = useMemo(
    () => createSource(layer),
    [layer.assetId, layer.pixelHeight, layer.pixelWidth, layer.url],
  );
  const cacheKey = useMemo(
    () =>
      createArtworkTextureCacheKey({
        sourceIdentity: source.identity,
        sourceWidth: source.pixelWidth,
        sourceHeight: source.pixelHeight,
        limits,
        anisotropy: effectiveAnisotropy,
      }),
    [effectiveAnisotropy, limits, source.identity, source.pixelHeight, source.pixelWidth],
  );
  const [resolvedTexture, setResolvedTexture] = useState<{
    key: string;
    texture: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const lease = acquireArtworkTexture(cacheKey, (signal) =>
      loadBoundedArtworkTexture({
        source,
        limits,
        anisotropy: effectiveAnisotropy,
        signal,
      }),
    );

    lease.texture.then(
      (texture) => {
        if (!active) return;
        setResolvedTexture({ key: cacheKey, texture });
        invalidate();
      },
      (error: unknown) => {
        if (!active || isArtworkTextureAbortError(error)) return;
        setResolvedTexture((current) => (current?.key === cacheKey ? null : current));
        invalidate();
      },
    );

    return () => {
      active = false;
      lease.release();
    };
  }, [cacheKey, effectiveAnisotropy, invalidate, limits, source]);

  return resolvedTexture?.key === cacheKey ? resolvedTexture.texture : null;
};
