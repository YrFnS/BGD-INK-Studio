import type { ArtworkTextureLimits } from './artworkTextureBudget';
import {
  isArtworkTextureAbortError,
  type LoadedArtworkTexture,
} from './artworkTextureLoader';
import type * as THREE from 'three';

export interface ArtworkTextureCacheKeyOptions {
  sourceIdentity: string;
  sourceWidth?: number;
  sourceHeight?: number;
  limits: ArtworkTextureLimits;
  anisotropy: number;
}

export interface ArtworkTextureCacheLease {
  key: string;
  texture: Promise<THREE.Texture>;
  release: () => void;
}

export interface ArtworkTextureCacheSnapshot {
  entries: number;
  references: number;
  pending: number;
  ready: number;
  loadsStarted: number;
  texturesCreated: number;
  texturesDisposed: number;
  failedLoads: number;
  cancelledLoads: number;
  largestWidth: number;
  largestHeight: number;
  largestPixelArea: number;
}

interface ArtworkTextureCacheEntry {
  key: string;
  references: number;
  status: 'pending' | 'ready';
  controller: AbortController;
  resource: LoadedArtworkTexture | null;
  promise: Promise<LoadedArtworkTexture>;
}

const cache = new Map<string, ArtworkTextureCacheEntry>();
const counters = {
  loadsStarted: 0,
  texturesCreated: 0,
  texturesDisposed: 0,
  failedLoads: 0,
  cancelledLoads: 0,
};

const disposeResource = (resource: LoadedArtworkTexture): void => {
  resource.dispose();
  counters.texturesDisposed += 1;
};

export const createArtworkTextureCacheKey = ({
  sourceIdentity,
  sourceWidth,
  sourceHeight,
  limits,
  anisotropy,
}: ArtworkTextureCacheKeyOptions): string =>
  JSON.stringify([
    'bgd-ink-artwork-texture-v1',
    sourceIdentity,
    sourceWidth ?? 0,
    sourceHeight ?? 0,
    limits.maximumDimension,
    limits.maximumPixelArea,
    anisotropy,
    'srgb',
    'linear-mipmap-linear',
  ]);

export const getArtworkTextureCacheSnapshot = (): ArtworkTextureCacheSnapshot => {
  const entries = Array.from(cache.values());
  const readyResources = entries.flatMap((entry) =>
    entry.resource ? [entry.resource] : [],
  );

  return {
    entries: entries.length,
    references: entries.reduce((sum, entry) => sum + entry.references, 0),
    pending: entries.filter((entry) => entry.status === 'pending').length,
    ready: entries.filter((entry) => entry.status === 'ready').length,
    ...counters,
    largestWidth: readyResources.reduce((largest, resource) => Math.max(largest, resource.width), 0),
    largestHeight: readyResources.reduce(
      (largest, resource) => Math.max(largest, resource.height),
      0,
    ),
    largestPixelArea: readyResources.reduce(
      (largest, resource) => Math.max(largest, resource.width * resource.height),
      0,
    ),
  };
};

const publishDiagnostics = (): void => {
  if (typeof window === 'undefined') return;
  window.__BGD_INK_TEXTURE_CACHE__ = getArtworkTextureCacheSnapshot();
};

const removeEntry = (entry: ArtworkTextureCacheEntry): void => {
  if (cache.get(entry.key) === entry) cache.delete(entry.key);
};

export const acquireArtworkTexture = (
  key: string,
  load: (signal: AbortSignal) => Promise<LoadedArtworkTexture>,
): ArtworkTextureCacheLease => {
  let entry = cache.get(key);

  if (!entry) {
    const controller = new AbortController();
    const createdEntry: ArtworkTextureCacheEntry = {
      key,
      references: 0,
      status: 'pending',
      controller,
      resource: null,
      promise: Promise.resolve(null as unknown as LoadedArtworkTexture),
    };
    counters.loadsStarted += 1;

    createdEntry.promise = load(controller.signal)
      .then((resource) => {
        counters.texturesCreated += 1;
        if (
          controller.signal.aborted ||
          createdEntry.references === 0 ||
          cache.get(key) !== createdEntry
        ) {
          disposeResource(resource);
          throw Object.assign(new Error('The artwork texture is no longer in use.'), {
            name: 'AbortError',
          });
        }

        createdEntry.status = 'ready';
        createdEntry.resource = resource;
        publishDiagnostics();
        return resource;
      })
      .catch((error: unknown) => {
        removeEntry(createdEntry);
        if (isArtworkTextureAbortError(error)) counters.cancelledLoads += 1;
        else counters.failedLoads += 1;
        publishDiagnostics();
        throw error;
      });

    cache.set(key, createdEntry);
    entry = createdEntry;
  }

  entry.references += 1;
  publishDiagnostics();
  let released = false;

  return {
    key,
    texture: entry.promise.then((resource) => resource.texture),
    release: () => {
      if (released) return;
      released = true;
      entry.references = Math.max(0, entry.references - 1);

      if (entry.references === 0) {
        removeEntry(entry);
        entry.controller.abort();
        if (entry.resource) {
          disposeResource(entry.resource);
          entry.resource = null;
        }
      }

      publishDiagnostics();
    },
  };
};

export const resetArtworkTextureCacheForTests = (): void => {
  for (const entry of cache.values()) {
    entry.controller.abort();
    if (entry.resource) disposeResource(entry.resource);
  }
  cache.clear();
  counters.loadsStarted = 0;
  counters.texturesCreated = 0;
  counters.texturesDisposed = 0;
  counters.failedLoads = 0;
  counters.cancelledLoads = 0;
  publishDiagnostics();
};

publishDiagnostics();

declare global {
  interface Window {
    __BGD_INK_TEXTURE_CACHE__?: ArtworkTextureCacheSnapshot;
  }
}
