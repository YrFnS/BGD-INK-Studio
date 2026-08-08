import type { ArtworkSourceMetadata } from '@/types';

const MAX_ANALYSIS_DIMENSION = 512;
const CM_PER_INCH = 2.54;
const TRANSPARENT_ALPHA_THRESHOLD = 250;
const CONTENT_ALPHA_THRESHOLD = 8;

export type ArtworkDpiLevel = 'unknown' | 'excellent' | 'good' | 'acceptable' | 'low' | 'very-low';

export type ArtworkQualityWarning =
  | 'very-low-resolution'
  | 'low-resolution'
  | 'extreme-aspect-ratio'
  | 'transparent-padding'
  | 'near-print-edge';

export interface ArtworkQualityReport {
  dpi: number | null;
  level: ArtworkDpiLevel;
  warnings: ArtworkQualityWarning[];
}

export interface ArtworkPixelSample {
  pixelWidth: number;
  pixelHeight: number;
  sampleWidth: number;
  sampleHeight: number;
  data: Uint8ClampedArray;
}

interface ArtworkDimensions {
  pixelWidth: number;
  pixelHeight: number;
}

export const normalizeArtworkAspectRatio = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1;

export const analyzeArtworkPixels = ({
  pixelWidth,
  pixelHeight,
  sampleWidth,
  sampleHeight,
  data,
}: ArtworkPixelSample): ArtworkSourceMetadata => {
  const totalPixels = sampleWidth * sampleHeight;
  if (
    pixelWidth <= 0 ||
    pixelHeight <= 0 ||
    sampleWidth <= 0 ||
    sampleHeight <= 0 ||
    data.length < totalPixels * 4
  ) {
    throw new Error('Artwork pixel data is incomplete.');
  }

  let transparentPixels = 0;
  let contentPixels = 0;
  let minX = sampleWidth;
  let minY = sampleHeight;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < totalPixels; index += 1) {
    const alpha = data[index * 4 + 3] ?? 0;
    if (alpha < TRANSPARENT_ALPHA_THRESHOLD) transparentPixels += 1;

    if (alpha > CONTENT_ALPHA_THRESHOLD) {
      const x = index % sampleWidth;
      const y = Math.floor(index / sampleWidth);
      contentPixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const contentBoundsArea = contentPixels > 0 ? (maxX - minX + 1) * (maxY - minY + 1) : 0;

  return {
    pixelWidth,
    pixelHeight,
    aspectRatio: pixelWidth / pixelHeight,
    hasTransparency: transparentPixels > 0,
    transparentPixelRatio: transparentPixels / totalPixels,
    transparentPaddingRatio: 1 - contentBoundsArea / totalPixels,
  };
};

const analyzeCanvasSource = (
  source: CanvasImageSource,
  pixelWidth: number,
  pixelHeight: number,
): ArtworkSourceMetadata => {
  const sampleScale = Math.min(
    1,
    MAX_ANALYSIS_DIMENSION / pixelWidth,
    MAX_ANALYSIS_DIMENSION / pixelHeight,
  );
  const sampleWidth = Math.max(1, Math.round(pixelWidth * sampleScale));
  const sampleHeight = Math.max(1, Math.round(pixelHeight * sampleScale));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Artwork analysis canvas is unavailable.');

  context.clearRect(0, 0, sampleWidth, sampleHeight);
  context.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);

  return analyzeArtworkPixels({
    pixelWidth,
    pixelHeight,
    sampleWidth,
    sampleHeight,
    data: imageData.data,
  });
};

const loadImageElement = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The artwork image could not be decoded.'));
    image.src = url;
  });

const readUint24LittleEndian = (view: DataView, offset: number): number =>
  view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);

const readPngDimensions = (view: DataView): ArtworkDimensions | null => {
  if (view.byteLength < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((byte, index) => view.getUint8(index) === byte)) return null;

  const pixelWidth = view.getUint32(16, false);
  const pixelHeight = view.getUint32(20, false);
  return pixelWidth > 0 && pixelHeight > 0 ? { pixelWidth, pixelHeight } : null;
};

const isJpegStartOfFrameMarker = (marker: number): boolean =>
  [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);

const readJpegDimensions = (view: DataView): ArtworkDimensions | null => {
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 3 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < view.byteLength && view.getUint8(offset) === 0xff) offset += 1;
    if (offset >= view.byteLength) break;

    const marker = view.getUint8(offset);
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;
    if (offset + 1 >= view.byteLength) break;

    const segmentLength = view.getUint16(offset, false);
    if (segmentLength < 2 || offset + segmentLength > view.byteLength) break;

    if (isJpegStartOfFrameMarker(marker) && segmentLength >= 7) {
      const pixelHeight = view.getUint16(offset + 3, false);
      const pixelWidth = view.getUint16(offset + 5, false);
      return pixelWidth > 0 && pixelHeight > 0 ? { pixelWidth, pixelHeight } : null;
    }

    offset += segmentLength;
  }

  return null;
};

const readWebpDimensions = (view: DataView): ArtworkDimensions | null => {
  if (view.byteLength < 30) return null;
  const text = (offset: number, length: number): string =>
    String.fromCharCode(...Array.from({ length }, (_, index) => view.getUint8(offset + index)));

  if (text(0, 4) !== 'RIFF' || text(8, 4) !== 'WEBP') return null;
  const chunkType = text(12, 4);

  if (chunkType === 'VP8X') {
    const pixelWidth = readUint24LittleEndian(view, 24) + 1;
    const pixelHeight = readUint24LittleEndian(view, 27) + 1;
    return { pixelWidth, pixelHeight };
  }

  if (chunkType === 'VP8L' && view.byteLength >= 25 && view.getUint8(20) === 0x2f) {
    const first = view.getUint8(21);
    const second = view.getUint8(22);
    const third = view.getUint8(23);
    const fourth = view.getUint8(24);
    const pixelWidth = 1 + first + ((second & 0x3f) << 8);
    const pixelHeight = 1 + (second >> 6) + (third << 2) + ((fourth & 0x0f) << 10);
    return { pixelWidth, pixelHeight };
  }

  if (
    chunkType === 'VP8 ' &&
    view.byteLength >= 30 &&
    view.getUint8(23) === 0x9d &&
    view.getUint8(24) === 0x01 &&
    view.getUint8(25) === 0x2a
  ) {
    const pixelWidth = view.getUint16(26, true) & 0x3fff;
    const pixelHeight = view.getUint16(28, true) & 0x3fff;
    return pixelWidth > 0 && pixelHeight > 0 ? { pixelWidth, pixelHeight } : null;
  }

  return null;
};

const readArtworkDimensions = async (file: File): Promise<ArtworkDimensions> => {
  const view = new DataView(await file.arrayBuffer());
  const dimensions =
    readPngDimensions(view) ?? readJpegDimensions(view) ?? readWebpDimensions(view);

  if (!dimensions) throw new Error('The artwork dimensions could not be read.');
  return dimensions;
};

const createDimensionOnlyMetadata = ({
  pixelWidth,
  pixelHeight,
}: ArtworkDimensions): ArtworkSourceMetadata => ({
  pixelWidth,
  pixelHeight,
  aspectRatio: pixelWidth / pixelHeight,
  hasTransparency: false,
  transparentPixelRatio: 0,
  transparentPaddingRatio: 0,
});

export const analyzeArtworkUrl = async (url: string): Promise<ArtworkSourceMetadata> => {
  const image = await loadImageElement(url);
  return analyzeCanvasSource(image, image.naturalWidth, image.naturalHeight);
};

export const analyzeArtworkFile = async (file: File): Promise<ArtworkSourceMetadata> => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        return analyzeCanvasSource(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    } catch {
      // Some browsers reject valid small or unusual images through createImageBitmap.
      // Continue with the ordinary image decoder before falling back to format headers.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    try {
      return await analyzeArtworkUrl(objectUrl);
    } catch {
      return createDimensionOnlyMetadata(await readArtworkDimensions(file));
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const estimateArtworkDpi = (
  pixelWidth: number | undefined,
  pixelHeight: number | undefined,
  physicalWidthCm: number,
  physicalHeightCm: number,
): number | null => {
  if (
    !pixelWidth ||
    !pixelHeight ||
    pixelWidth <= 0 ||
    pixelHeight <= 0 ||
    physicalWidthCm <= 0 ||
    physicalHeightCm <= 0
  ) {
    return null;
  }

  const horizontalDpi = pixelWidth / (physicalWidthCm / CM_PER_INCH);
  const verticalDpi = pixelHeight / (physicalHeightCm / CM_PER_INCH);
  return Math.min(horizontalDpi, verticalDpi);
};

export const getArtworkDpiLevel = (dpi: number | null): ArtworkDpiLevel => {
  if (dpi === null || !Number.isFinite(dpi)) return 'unknown';
  if (dpi >= 300) return 'excellent';
  if (dpi >= 200) return 'good';
  if (dpi >= 150) return 'acceptable';
  if (dpi >= 100) return 'low';
  return 'very-low';
};

export const createArtworkQualityReport = (
  metadata: Pick<
    ArtworkSourceMetadata,
    'pixelWidth' | 'pixelHeight' | 'aspectRatio' | 'transparentPaddingRatio'
  >,
  physicalWidthCm: number,
  physicalHeightCm: number,
  edgeClearanceCm: number,
): ArtworkQualityReport => {
  const dpi = estimateArtworkDpi(
    metadata.pixelWidth,
    metadata.pixelHeight,
    physicalWidthCm,
    physicalHeightCm,
  );
  const level = getArtworkDpiLevel(dpi);
  const warnings: ArtworkQualityWarning[] = [];

  if (level === 'very-low') warnings.push('very-low-resolution');
  else if (level === 'low') warnings.push('low-resolution');

  const aspectRatio = normalizeArtworkAspectRatio(metadata.aspectRatio);
  if (aspectRatio > 4 || aspectRatio < 0.25) warnings.push('extreme-aspect-ratio');
  if (metadata.transparentPaddingRatio > 0.45) warnings.push('transparent-padding');
  if (edgeClearanceCm < 0.75) warnings.push('near-print-edge');

  return { dpi, level, warnings };
};
