import { useGLTF } from '@react-three/drei';

export interface ModelConfig {
  url: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  nodeName: string;
  materialName?: string;
}

const STABLE_SHIRT_URL = '/basic_t-shirt.glb';
const ROTATION_CORRECTION: [number, number, number] = [-Math.PI / 2, 0, 0];

export const ASSET_CONFIGS: Record<string, ModelConfig> = {
  'tshirt-classic': {
    url: STABLE_SHIRT_URL,
    scale: 1,
    position: [0, 0, 0],
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
    url: STABLE_SHIRT_URL,
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
  },
};

if (typeof window !== 'undefined') {
  const modelUrls = new Set(Object.values(ASSET_CONFIGS).map((config) => config.url));
  modelUrls.forEach((url) => useGLTF.preload(url));
}
