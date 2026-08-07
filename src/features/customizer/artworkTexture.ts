import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import assetBudgets from '@/config/asset-budgets.json';
import type { RenderingQuality } from './renderingCapabilities';
import * as THREE from 'three';

const IMAGE_LOAD_TIMEOUT_MS = 10_000;

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

const configureTexture = (
  texture: THREE.Texture,
  anisotropy: 2 | 4 | 8,
): THREE.Texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

export const useOptimizedArtworkTexture = (
  url: string,
  quality: RenderingQuality,
  anisotropy: 2 | 4 | 8,
): THREE.Texture | null => {
  const { gl, invalidate } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    setTexture(null);
    let disposed = false;
    let ownedTexture: THREE.Texture | null = null;
    let fallbackTexture: THREE.Texture | null = null;
    const image = new Image();

    const loadOriginalTexture = () => {
      if (disposed || fallbackTexture) return;
      image.src = '';
      fallbackTexture = new THREE.TextureLoader().load(url, (loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }
        ownedTexture = configureTexture(loaded, anisotropy);
        setTexture(ownedTexture);
        invalidate();
      });
    };

    const timer = window.setTimeout(loadOriginalTexture, IMAGE_LOAD_TIMEOUT_MS);

    image.decoding = 'async';
    image.onload = () => {
      window.clearTimeout(timer);
      if (disposed || fallbackTexture) return;

      const configuredLimit = getArtworkTextureDimensionLimit(quality);
      const hardwareLimit = Math.max(1, gl.capabilities.maxTextureSize || configuredLimit);
      const dimensions = fitArtworkTextureDimensions(
        image.naturalWidth,
        image.naturalHeight,
        Math.min(configuredLimit, hardwareLimit),
      );
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d');

      if (!context) {
        loadOriginalTexture();
        return;
      }

      context.clearRect(0, 0, dimensions.width, dimensions.height);
      context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
      ownedTexture = configureTexture(new THREE.CanvasTexture(canvas), anisotropy);
      setTexture(ownedTexture);
      invalidate();
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      loadOriginalTexture();
    };
    image.src = url;

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      image.src = '';
      ownedTexture?.dispose();
      if (fallbackTexture && fallbackTexture !== ownedTexture) fallbackTexture.dispose();
    };
  }, [anisotropy, gl.capabilities.maxTextureSize, invalidate, quality, url]);

  return texture;
};
