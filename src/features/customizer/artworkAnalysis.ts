import type { ArtworkSourceMetadata } from '@/types';

const MAX_ANALYSIS_DIMENSION = 512;
const CM_PER_INCH = 2.54;
const TRANSPARENT_ALPHA_THRESHOLD = 250;
const CONTENT_ALPHA_THRESHOLD = 8;

export type ArtworkDpiLevel =
  | 'unknown'
  | 'excellent'
  | 'good'
  | 'acceptable'
  | 'low'
  | 'very-low';

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

  const contentBoundsArea =
    contentPixels > 0 ? (maxX - minX + 1) * (maxY - minY + 1) : 0;

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
      // Some Chromium and mobile implementations expose createImageBitmap but reject
      // otherwise valid uploaded files. The HTML image path is slower but more compatible.
    }
  }

  const copiedBlob = file.slice(0, file.size, file.type);
  const objectUrl = URL.createObjectURL(copiedBlob);
  try {
    return await analyzeArtworkUrl(objectUrl);
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
