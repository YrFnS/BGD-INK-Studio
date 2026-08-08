import { describe, expect, it } from 'vitest';
import type { PrintSurfaceDefinition, ReadyProductModelConfig } from '@/data/assets3d';
import { ProductType, Size, type DecalLayer, type Product } from '@/types';
import { artworkWidthCmToScale } from './printArea';
import {
  buildProductionSpecification,
  createProductionSpecificationBlob,
  getProductionExportFileNames,
  type ProductionExportInput,
} from './productionExport';

const createSurface = (id: 'front' | 'back'): PrintSurfaceDefinition => ({
  id,
  labelKey: `customizer.surface.${id}`,
  side: id,
  physicalWidthCm: 30,
  physicalHeightCm: 38,
  safeMarginCm: 1.5,
  modelBounds: {
    minX: -0.31,
    maxX: 0.31,
    minY: -0.42,
    maxY: 0.34,
  },
  defaultPosition: [0, -0.04, id === 'front' ? 0.16 : -0.16],
  defaultRotation: [0, id === 'front' ? 0 : Math.PI, 0],
  cameraPosition: [0, 0, id === 'front' ? 4 : -4],
  cameraTarget: [0, -0.05, 0],
  minimumArtworkWidthCm: 4,
  maximumArtworkWidthCm: 26,
  defaultArtworkWidthCm: 12,
});

const frontSurface = createSurface('front');
const backSurface = createSurface('back');

const modelConfig: ReadyProductModelConfig = {
  productId: 'tshirt-classic',
  status: 'ready',
  modelUrl: '/basic_t-shirt.glb',
  scale: 1,
  position: [0, 0, 0],
  rotation: [-Math.PI / 2, 0, 0],
  garmentMeshName: 'T_Shirt_male',
  defaultSurfaceId: 'front',
  surfaces: [frontSurface, backSurface],
};

const product: Product = {
  id: 'tshirt-classic',
  name: 'products.classic.name',
  type: ProductType.TSHIRT,
  basePrice: 15_000,
  colors: ['#000000'],
  image: '/shirt.png',
  inStock: true,
};

const createLayer = (overrides: Partial<DecalLayer> = {}): DecalLayer => ({
  id: 'layer-primary',
  name: 'Primary logo',
  visible: true,
  url: 'blob:temporary-preview-url',
  assetId: 'asset-primary',
  fileName: 'logo.png',
  mimeType: 'image/png',
  surfaceId: 'front',
  position: [0, -0.04, 0.16],
  rotation: [0, 0, 0],
  userRotation: Math.PI / 6,
  scale: artworkWidthCmToScale(12, frontSurface),
  pixelWidth: 2400,
  pixelHeight: 1200,
  aspectRatio: 2,
  hasTransparency: true,
  transparentPixelRatio: 0.2,
  transparentPaddingRatio: 0.1,
  ...overrides,
});

const createInput = (decals: DecalLayer[]): ProductionExportInput => ({
  draftId: 'draft-export-123',
  draftName: 'Launch shirts',
  product,
  productName: 'Classic T-Shirt',
  size: Size.L,
  color: '#000000',
  notes: 'Print the primary logo on the front.',
  modelConfig,
  decals,
  language: 'en',
  surfaceLabels: {
    front: 'Front',
    back: 'Back',
  },
  generatedAt: new Date('2026-08-07T12:00:00.000Z'),
});

describe('local production exports', () => {
  it('builds a URL-free specification with physical placement and quality data', async () => {
    const specification = buildProductionSpecification(createInput([createLayer()]));
    const front = specification.surfaces[0];
    const layer = front.layers[0];

    expect(specification.format).toBe('bgd-ink-production-specification');
    expect(specification.generatedAt).toBe('2026-08-07T12:00:00.000Z');
    expect(specification.calibration).toMatchObject({
      status: 'unverified',
      requiresPhysicalConfirmation: true,
    });
    expect(layer.placement).toMatchObject({
      centerXcm: 0,
      centerYcm: 0,
      leftCm: 9,
      topCm: 16,
      widthCm: 12,
      heightCm: 6,
      rotationDegrees: 30,
    });
    expect(layer.quality.level).toBe('excellent');
    expect(layer.quality.estimatedDpi).toBeCloseTo(508, 0);
    expect(layer.source).toMatchObject({
      fileName: 'logo.png',
      pixelWidth: 2400,
      pixelHeight: 1200,
      hasTransparency: true,
    });

    const serialized = JSON.stringify(specification);
    expect(serialized).not.toContain('blob:');
    expect(serialized).not.toContain('temporary-preview-url');

    const blob = createProductionSpecificationBlob(specification);
    expect(blob.type).toContain('application/json');
    expect(await blob.text()).toContain('"draft-export-123"');
  });

  it('uses viewer-facing horizontal coordinates for back-surface artwork', () => {
    const offsetX = 0.1033333333;
    const frontLayer = createLayer({ position: [offsetX, -0.04, 0.16] });
    const backLayer = createLayer({
      id: 'layer-back',
      surfaceId: 'back',
      position: [offsetX, -0.04, -0.16],
      scale: artworkWidthCmToScale(12, backSurface),
    });
    const specification = buildProductionSpecification(createInput([frontLayer, backLayer]));

    expect(specification.surfaces[0].layers[0].placement.centerXcm).toBeCloseTo(5, 2);
    expect(specification.surfaces[1].layers[0].placement.centerXcm).toBeCloseTo(-5, 2);
  });

  it('creates stable readable file names without exposing object URLs', () => {
    expect(getProductionExportFileNames('draft-1234567890', 'Launch Shirts / Baghdad')).toEqual({
      proof: 'bgd-ink-launch-shirts-baghdad-draft-1234567890-proof.png',
      specification: 'bgd-ink-launch-shirts-baghdad-draft-1234567890-specification.json',
    });
  });
});
