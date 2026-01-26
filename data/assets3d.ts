
import { ProductType } from '../types';

export interface ModelConfig {
  url: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number]; // Initial rotation corrections
  nodeName: string; // The name of the specific mesh in the GLTF to apply color/decals to
  materialName?: string;
}

// SOURCE OF TRUTH FOR 3D ASSETS
// Using the local t-shirt.glb file provided in the public directory.
const STABLE_SHIRT_URL = '/public/basic_t-shirt.glb';

// Rotation Correction: The model is Z-up. 
// -Math.PI / 2 (-90 deg) on X-axis is required to orient it upright correctly.
const ROTATION_CORRECTION: [number, number, number] = [-Math.PI / 2, 0, 0];

export const ASSET_CONFIGS: Record<string, ModelConfig> = {
  'tshirt-classic': {
    url: STABLE_SHIRT_URL,
    scale: 1,
    position: [0, 0, 0], // Center component handles centering
    rotation: ROTATION_CORRECTION,
    nodeName: 'T_Shirt_male',
  },
  'tee-oversized': {
    url: STABLE_SHIRT_URL,
    scale: 1.15,
    position: [0, 0, 0],
    rotation: ROTATION_CORRECTION,
    nodeName: 'T_Shirt_male',
  },
  'hoodie-premium': {
    url: STABLE_SHIRT_URL, // Using shirt as placeholder for hoodie in this demo version
    scale: 1,
    position: [0, 0, 0],
    rotation: ROTATION_CORRECTION,
    nodeName: 'T_Shirt_male',
  },
  'vest-urban': {
    url: STABLE_SHIRT_URL,
    scale: 1,
    position: [0, 0, 0],
    rotation: ROTATION_CORRECTION,
    nodeName: 'T_Shirt_male',
  }
};

// Preload assets to prevent pop-in, with error safety
Object.values(ASSET_CONFIGS).forEach(config => {
  // @ts-ignore - r3f specific preload
  if (typeof window !== 'undefined') {
    import('@react-three/drei').then(({ useGLTF }) => {
      try {
        useGLTF.preload(config.url);
      } catch (e) {
        console.warn('Failed to preload 3D asset:', e);
      }
    });
  }
});
