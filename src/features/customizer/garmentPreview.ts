import type { PrintSurfaceDefinition } from '@/data/assets3d';

export interface GarmentArtworkFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

export interface GarmentPreviewDefinition {
  assetPath: string;
  artworkFrame: GarmentArtworkFrame;
}

type GarmentSide = PrintSurfaceDefinition['side'];
type GarmentPreviewPair = Record<GarmentSide, GarmentPreviewDefinition>;

const CLASSIC_PREVIEW: GarmentPreviewPair = {
  front: {
    assetPath: '/brand/products/renders/classic-tshirt-front.svg',
    artworkFrame: { left: 31, top: 28.5, width: 38, height: 44, radius: 3 },
  },
  back: {
    assetPath: '/brand/products/renders/classic-tshirt-back.svg',
    artworkFrame: { left: 31, top: 26.5, width: 38, height: 47, radius: 3 },
  },
};

const PRODUCT_PREVIEWS: Record<string, GarmentPreviewPair> = {
  'tshirt-classic': CLASSIC_PREVIEW,
  'tee-oversized': {
    front: {
      assetPath: '/brand/products/renders/oversized-tee-front.svg',
      artworkFrame: { left: 29.5, top: 29.5, width: 41, height: 43, radius: 3 },
    },
    back: {
      assetPath: '/brand/products/renders/oversized-tee-back.svg',
      artworkFrame: { left: 29.5, top: 27.5, width: 41, height: 46, radius: 3 },
    },
  },
  'hoodie-premium': {
    front: {
      assetPath: '/brand/products/renders/premium-hoodie-front.svg',
      artworkFrame: { left: 31.5, top: 31, width: 37, height: 31, radius: 4 },
    },
    back: {
      assetPath: '/brand/products/renders/premium-hoodie-back.svg',
      artworkFrame: { left: 31.5, top: 29, width: 37, height: 39, radius: 4 },
    },
  },
  'vest-urban': {
    front: {
      assetPath: '/brand/products/renders/urban-vest-front.svg',
      artworkFrame: { left: 31.5, top: 28.5, width: 37, height: 39, radius: 3 },
    },
    back: {
      assetPath: '/brand/products/renders/urban-vest-back.svg',
      artworkFrame: { left: 31.5, top: 27, width: 37, height: 45, radius: 3 },
    },
  },
};

export const getGarmentPreviewDefinition = (
  productId: string,
  side: GarmentSide,
): GarmentPreviewDefinition =>
  PRODUCT_PREVIEWS[productId]?.[side] ?? CLASSIC_PREVIEW[side];
