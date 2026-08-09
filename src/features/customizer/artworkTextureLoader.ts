import {
  fitArtworkTextureDimensions,
  isArtworkTextureWithinLimits,
  type ArtworkTextureDimensions,
  type ArtworkTextureLimits,
} from './artworkTextureBudget';
import * as THREE from 'three';

const DEFAULT_DECODE_TIMEOUT_MS = 10_000;

export interface ArtworkTextureSource {
  identity: string;
  url: string;
  pixelWidth?: number;
  pixelHeight?: number;
}

export interface LoadBoundedArtworkTextureOptions {
  source: ArtworkTextureSource;
  limits: ArtworkTextureLimits;
  anisotropy: number;
  signal: AbortSignal;
  timeoutMs?: number;
}

export interface LoadedArtworkTexture extends ArtworkTextureDimensions {
  texture: THREE.Texture;
  dispose: () => void;
}

export type ArtworkTextureLoadFailure =
  | 'aborted'
  | 'timeout'
  | 'fetch-failed'
  | 'decode-failed'
  | 'canvas-unavailable';

export class ArtworkTextureLoadError extends Error {
  constructor(
    public readonly code: ArtworkTextureLoadFailure,
    message: string,
  ) {
    super(message);
    this.name = 'ArtworkTextureLoadError';
  }
}

const createAbortError = (): Error => {
  const error = new Error('The artwork texture decode was cancelled.');
  error.name = 'AbortError';
  return error;
};

export const isArtworkTextureAbortError = (error: unknown): boolean =>
  (error instanceof Error && error.name === 'AbortError') ||
  (error instanceof ArtworkTextureLoadError && error.code === 'aborted');

const hasKnownDimensions = (
  source: ArtworkTextureSource,
): source is ArtworkTextureSource & { pixelWidth: number; pixelHeight: number } =>
  typeof source.pixelWidth === 'number' &&
  Number.isFinite(source.pixelWidth) &&
  source.pixelWidth > 0 &&
  typeof source.pixelHeight === 'number' &&
  Number.isFinite(source.pixelHeight) &&
  source.pixelHeight > 0;

const waitForAbortableResult = <T>(
  promise: Promise<T>,
  signal: AbortSignal,
  disposeLateResult?: (value: T) => void,
): Promise<T> =>
  new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => signal.removeEventListener('abort', handleAbort);
    const handleAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(createAbortError());
    };

    if (signal.aborted) {
      handleAbort();
      return;
    }

    signal.addEventListener('abort', handleAbort, { once: true });
    promise.then(
      (value) => {
        if (settled) {
          disposeLateResult?.(value);
          return;
        }
        settled = true;
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });

const loadImageElement = (url: string, signal: AbortSignal): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', handleAbort);
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const handleAbort = () => {
      image.src = '';
      finish(() => reject(createAbortError()));
    };

    image.decoding = 'async';
    image.onload = () => finish(() => resolve(image));
    image.onerror = () =>
      finish(() =>
        reject(
          new ArtworkTextureLoadError('decode-failed', 'The artwork image could not be decoded.'),
        ),
      );

    if (signal.aborted) {
      handleAbort();
      return;
    }

    signal.addEventListener('abort', handleAbort, { once: true });
    image.src = url;
  });

const createBoundedCanvasTexture = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  limits: ArtworkTextureLimits,
  anisotropy: number,
  name: string,
): LoadedArtworkTexture => {
  const dimensions = fitArtworkTextureDimensions(
    sourceWidth,
    sourceHeight,
    limits.maximumDimension,
    limits.maximumPixelArea,
  );

  if (!isArtworkTextureWithinLimits(dimensions, limits)) {
    throw new ArtworkTextureLoadError(
      'decode-failed',
      'The bounded artwork texture exceeded its configured limits.',
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    throw new ArtworkTextureLoadError(
      'canvas-unavailable',
      'The artwork resize canvas is unavailable.',
    );
  }

  context.clearRect(0, 0, dimensions.width, dimensions.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, dimensions.width, dimensions.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, Math.floor(anisotropy));
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  let disposed = false;
  return {
    ...dimensions,
    texture,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      texture.dispose();
      canvas.width = 1;
      canvas.height = 1;
    },
  };
};

const fetchArtworkBlob = async (url: string, signal: AbortSignal): Promise<Blob> => {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new ArtworkTextureLoadError(
      'fetch-failed',
      `The artwork source returned HTTP ${response.status}.`,
    );
  }
  return response.blob();
};

const decodeWithImageBitmap = async (
  blob: Blob,
  source: ArtworkTextureSource & { pixelWidth: number; pixelHeight: number },
  limits: ArtworkTextureLimits,
  anisotropy: number,
  signal: AbortSignal,
): Promise<LoadedArtworkTexture> => {
  const dimensions = fitArtworkTextureDimensions(
    source.pixelWidth,
    source.pixelHeight,
    limits.maximumDimension,
    limits.maximumPixelArea,
  );
  const bitmap = await waitForAbortableResult(
    createImageBitmap(blob, {
      resizeWidth: dimensions.width,
      resizeHeight: dimensions.height,
      resizeQuality: 'high',
    }),
    signal,
    (lateBitmap) => lateBitmap.close(),
  );

  try {
    if (signal.aborted) throw createAbortError();
    return createBoundedCanvasTexture(
      bitmap,
      source.pixelWidth,
      source.pixelHeight,
      limits,
      anisotropy,
      `artwork:${source.identity}`,
    );
  } finally {
    bitmap.close();
  }
};

const decodeWithImageElement = async (
  url: string,
  source: ArtworkTextureSource,
  limits: ArtworkTextureLimits,
  anisotropy: number,
  signal: AbortSignal,
): Promise<LoadedArtworkTexture> => {
  const image = await loadImageElement(url, signal);
  if (signal.aborted) throw createAbortError();

  return createBoundedCanvasTexture(
    image,
    image.naturalWidth,
    image.naturalHeight,
    limits,
    anisotropy,
    `artwork:${source.identity}`,
  );
};

const readDevelopmentDelay = (): number => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 0;
  const delay = (
    window as Window & { __BGD_INK_TEXTURE_TEST_DELAY_MS__?: number }
  ).__BGD_INK_TEXTURE_TEST_DELAY_MS__;
  return typeof delay === 'number' && Number.isFinite(delay) && delay > 0 ? delay : 0;
};

const waitForDevelopmentDelay = (delay: number, signal: AbortSignal): Promise<void> =>
  delay <= 0
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          signal.removeEventListener('abort', handleAbort);
          resolve();
        }, delay);
        const handleAbort = () => {
          window.clearTimeout(timer);
          signal.removeEventListener('abort', handleAbort);
          reject(createAbortError());
        };
        signal.addEventListener('abort', handleAbort, { once: true });
      });

export const loadBoundedArtworkTexture = async ({
  source,
  limits,
  anisotropy,
  signal,
  timeoutMs = DEFAULT_DECODE_TIMEOUT_MS,
}: LoadBoundedArtworkTextureOptions): Promise<LoadedArtworkTexture> => {
  if (signal.aborted) throw createAbortError();

  const decodeController = new AbortController();
  let timedOut = false;
  const handleParentAbort = () => decodeController.abort(signal.reason);
  signal.addEventListener('abort', handleParentAbort, { once: true });
  const timeout = window.setTimeout(() => {
    timedOut = true;
    decodeController.abort();
  }, timeoutMs);

  try {
    await waitForDevelopmentDelay(readDevelopmentDelay(), decodeController.signal);

    let blob: Blob | null = null;
    try {
      blob = await fetchArtworkBlob(source.url, decodeController.signal);
    } catch (error: unknown) {
      if (decodeController.signal.aborted) throw error;
      blob = null;
    }

    if (
      blob &&
      hasKnownDimensions(source) &&
      typeof createImageBitmap === 'function'
    ) {
      try {
        const loaded = await decodeWithImageBitmap(
          blob,
          source,
          limits,
          anisotropy,
          decodeController.signal,
        );
        if (decodeController.signal.aborted) {
          loaded.dispose();
          throw createAbortError();
        }
        return loaded;
      } catch (error: unknown) {
        if (decodeController.signal.aborted) throw error;
        // Some browsers reject valid images through createImageBitmap. The ordinary image
        // decoder remains available, but it still resizes into the same bounded canvas.
      }
    }

    let temporaryUrl: string | null = null;
    try {
      const decodeUrl = blob ? (temporaryUrl = URL.createObjectURL(blob)) : source.url;
      const loaded = await decodeWithImageElement(
        decodeUrl,
        source,
        limits,
        anisotropy,
        decodeController.signal,
      );
      if (decodeController.signal.aborted) {
        loaded.dispose();
        throw createAbortError();
      }
      return loaded;
    } finally {
      if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    }
  } catch (error: unknown) {
    if (decodeController.signal.aborted) {
      if (timedOut) {
        throw new ArtworkTextureLoadError(
          'timeout',
          'The bounded artwork texture decode timed out.',
        );
      }
      throw createAbortError();
    }
    if (error instanceof ArtworkTextureLoadError) throw error;
    throw new ArtworkTextureLoadError(
      'decode-failed',
      error instanceof Error ? error.message : 'The artwork texture could not be decoded.',
    );
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', handleParentAbort);
  }
};

declare global {
  interface Window {
    __BGD_INK_TEXTURE_TEST_DELAY_MS__?: number;
  }
}
