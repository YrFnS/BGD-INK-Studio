import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import {
  fitArtworkTextureDimensions,
  getArtworkTextureDimensionLimit,
} from './artworkTextureBudget';
import type { RenderingQuality } from './renderingCapabilities';
import * as THREE from 'three';

const IMAGE_LOAD_TIMEOUT_MS = 10_000;

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
