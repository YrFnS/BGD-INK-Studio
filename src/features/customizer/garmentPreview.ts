import type { PrintSurfaceDefinition } from '@/data/assets3d';

export interface GarmentArtworkFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

export interface GarmentPreviewDefinition {
  viewBox: string;
  silhouettePath: string;
  secondaryPath?: string;
  detailPaths: readonly string[];
  artworkFrame: GarmentArtworkFrame;
}

type GarmentPreviewPair = Record<PrintSurfaceDefinition['side'], GarmentPreviewDefinition>;

const CLASSIC_SILHOUETTE =
  'M170 92 84 143 28 255l82 42 45-84v326c0 27 22 49 49 49h92c27 0 49-22 49-49V213l45 84 82-42-56-112-86-51c-17 39-46 61-80 61s-63-22-80-61Z';

const OVERSIZED_SILHOUETTE =
  'M154 101 62 151 18 270l105 45 43-79v307c0 29 23 52 52 52h64c29 0 52-23 52-52V236l43 79 105-45-44-119-92-50c-22 35-54 53-96 53s-74-18-96-53Z';

const HOODIE_SILHOUETTE =
  'M167 153 76 205 24 330l92 40 49-92v270c0 25 20 45 45 45h80c25 0 45-20 45-45V278l49 92 92-40-52-125-91-52c-17 28-45 45-83 45s-66-17-83-45Z';

const VEST_SILHOUETTE =
  'M163 93c20 38 49 57 87 57s67-19 87-57l66 39-49 104v306c0 28-23 51-51 51H197c-28 0-51-23-51-51V236L97 132l66-39Z';

const PRODUCT_PREVIEWS: Record<string, GarmentPreviewPair> = {
  'tshirt-classic': {
    front: {
      viewBox: '0 0 500 620',
      silhouettePath: CLASSIC_SILHOUETTE,
      detailPaths: [
        'M184 92c7 45 31 70 66 70s59-25 66-70',
        'M108 296c22 8 40 11 56 12M336 308c17-1 35-4 56-12',
        'M165 539h170',
      ],
      artworkFrame: { left: 30.5, top: 29, width: 39, height: 49, radius: 3 },
    },
    back: {
      viewBox: '0 0 500 620',
      silhouettePath: CLASSIC_SILHOUETTE,
      detailPaths: [
        'M184 94c16 22 38 33 66 33s50-11 66-33',
        'M108 296c22 8 40 11 56 12M336 308c17-1 35-4 56-12',
        'M165 539h170',
        'M206 145c28 9 60 9 88 0',
      ],
      artworkFrame: { left: 30.5, top: 27.5, width: 39, height: 50, radius: 3 },
    },
  },
  'tee-oversized': {
    front: {
      viewBox: '0 0 500 620',
      silhouettePath: OVERSIZED_SILHOUETTE,
      detailPaths: [
        'M177 101c9 40 34 61 73 61s64-21 73-61',
        'M166 236c49 22 119 22 168 0',
        'M166 542h168',
      ],
      artworkFrame: { left: 28.5, top: 30.5, width: 43, height: 48, radius: 2 },
    },
    back: {
      viewBox: '0 0 500 620',
      silhouettePath: OVERSIZED_SILHOUETTE,
      detailPaths: [
        'M178 103c18 19 42 28 72 28s54-9 72-28',
        'M166 236c49 22 119 22 168 0',
        'M166 542h168',
      ],
      artworkFrame: { left: 28.5, top: 29, width: 43, height: 49, radius: 2 },
    },
  },
  'hoodie-premium': {
    front: {
      viewBox: '0 0 500 620',
      silhouettePath: HOODIE_SILHOUETTE,
      secondaryPath: 'M168 154c-5-79 30-124 82-124s87 45 82 124c-20 31-47 47-82 47s-62-16-82-47Z',
      detailPaths: [
        'M196 169c15 12 33 18 54 18s39-6 54-18',
        'M218 180 206 255M282 180l12 75',
        'M190 468c22-18 44-27 60-27s38 9 60 27v61H190v-61Z',
        'M165 548h170',
      ],
      artworkFrame: { left: 31, top: 34, width: 38, height: 39, radius: 4 },
    },
    back: {
      viewBox: '0 0 500 620',
      silhouettePath: HOODIE_SILHOUETTE,
      secondaryPath: 'M168 154c-5-79 30-124 82-124s87 45 82 124c-21 17-48 26-82 26s-61-9-82-26Z',
      detailPaths: ['M183 169c20 16 42 24 67 24s47-8 67-24', 'M165 548h170'],
      artworkFrame: { left: 31, top: 31.5, width: 38, height: 43, radius: 4 },
    },
  },
  'vest-urban': {
    front: {
      viewBox: '0 0 500 620',
      silhouettePath: VEST_SILHOUETTE,
      detailPaths: [
        'M163 94c4 58 28 91 87 112 59-21 83-54 87-112',
        'M250 206v330',
        'M173 374h66v70h-66zM261 374h66v70h-66z',
        'M146 542h208',
      ],
      artworkFrame: { left: 30.5, top: 31, width: 39, height: 47, radius: 3 },
    },
    back: {
      viewBox: '0 0 500 620',
      silhouettePath: VEST_SILHOUETTE,
      detailPaths: [
        'M167 96c12 35 39 53 83 53s71-18 83-53',
        'M146 542h208',
        'M183 164c43 16 91 16 134 0',
      ],
      artworkFrame: { left: 30.5, top: 28.5, width: 39, height: 50, radius: 3 },
    },
  },
};

export const getGarmentPreviewDefinition = (
  productId: string,
  side: PrintSurfaceDefinition['side'],
): GarmentPreviewDefinition =>
  (PRODUCT_PREVIEWS[productId] ?? PRODUCT_PREVIEWS['tshirt-classic'])[side];
