import { DEFAULT_PRINT_SURFACE_ID, PrintSurfaceId } from '@/types';

export interface ModelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PrintSurfaceDefinition {
  id: PrintSurfaceId;
  labelKey: string;
  side: 'front' | 'back';
  physicalWidthCm: number;
  physicalHeightCm: number;
  safeMarginCm: number;
  modelBounds: ModelBounds;
  defaultPosition: [number, number, number];
  defaultRotation: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  minimumArtworkWidthCm: number;
  maximumArtworkWidthCm: number;
  defaultArtworkWidthCm: number;
}

interface BaseProductModelConfig {
  productId: string;
}

export interface ReadyProductModelConfig extends BaseProductModelConfig {
  status: 'ready';
  modelUrl: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  garmentMeshName: string;
  defaultSurfaceId: PrintSurfaceId;
  surfaces: readonly PrintSurfaceDefinition[];
}

export interface UnavailableProductModelConfig extends BaseProductModelConfig {
  status: 'unavailable';
  reason: 'model-not-provided';
}

export type ProductModelConfig = ReadyProductModelConfig | UnavailableProductModelConfig;

const STABLE_SHIRT_URL = '/basic_t-shirt.glb';
const ROTATION_CORRECTION: [number, number, number] = [-Math.PI / 2, 0, 0];
const SHIRT_PRINT_BOUNDS: ModelBounds = {
  minX: -0.31,
  maxX: 0.31,
  minY: -0.42,
  maxY: 0.34,
};

const CLASSIC_TSHIRT_SURFACES: readonly PrintSurfaceDefinition[] = [
  {
    id: 'front',
    labelKey: 'customizer.surface.front',
    side: 'front',
    physicalWidthCm: 30,
    physicalHeightCm: 38,
    safeMarginCm: 1.5,
    modelBounds: SHIRT_PRINT_BOUNDS,
    defaultPosition: [0, -0.04, 0.16],
    defaultRotation: [0, 0, 0],
    cameraPosition: [0, 0, 2.3],
    cameraTarget: [0, -0.05, 0],
    minimumArtworkWidthCm: 4,
    maximumArtworkWidthCm: 26,
    defaultArtworkWidthCm: 12,
  },
  {
    id: 'back',
    labelKey: 'customizer.surface.back',
    side: 'back',
    physicalWidthCm: 30,
    physicalHeightCm: 38,
    safeMarginCm: 1.5,
    modelBounds: SHIRT_PRINT_BOUNDS,
    defaultPosition: [0, -0.04, -0.16],
    defaultRotation: [0, Math.PI, 0],
    cameraPosition: [0, 0, -2.3],
    cameraTarget: [0, -0.05, 0],
    minimumArtworkWidthCm: 4,
    maximumArtworkWidthCm: 26,
    defaultArtworkWidthCm: 12,
  },
];

export const PRODUCT_MODEL_CONFIGS: Record<string, ProductModelConfig> = {
  'tshirt-classic': {
    productId: 'tshirt-classic',
    status: 'ready',
    modelUrl: STABLE_SHIRT_URL,
    scale: 1,
    position: [0, 0, 0],
    rotation: ROTATION_CORRECTION,
    garmentMeshName: 'Object_2',
    defaultSurfaceId: DEFAULT_PRINT_SURFACE_ID,
    surfaces: CLASSIC_TSHIRT_SURFACES,
  },
  'tee-oversized': {
    productId: 'tee-oversized',
    status: 'unavailable',
    reason: 'model-not-provided',
  },
  'hoodie-premium': {
    productId: 'hoodie-premium',
    status: 'unavailable',
    reason: 'model-not-provided',
  },
  'vest-urban': {
    productId: 'vest-urban',
    status: 'unavailable',
    reason: 'model-not-provided',
  },
};

export const getProductModelConfig = (productId: string): ProductModelConfig | null =>
  PRODUCT_MODEL_CONFIGS[productId] ?? null;

export const getReadyProductModelConfig = (
  productId: string,
): ReadyProductModelConfig | null => {
  const config = getProductModelConfig(productId);
  return config?.status === 'ready' ? config : null;
};

export const isProductCustomizerReady = (productId: string): boolean =>
  getReadyProductModelConfig(productId) !== null;

export const getPrintSurface = (
  config: ReadyProductModelConfig,
  surfaceId: PrintSurfaceId,
): PrintSurfaceDefinition =>
  config.surfaces.find((surface) => surface.id === surfaceId) ?? config.surfaces[0];
