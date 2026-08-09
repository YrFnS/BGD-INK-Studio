import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadBoundedArtworkTexture,
  type ArtworkTextureSource,
} from './artworkTextureLoader';

const source: ArtworkTextureSource = {
  identity: 'asset:timeout-test',
  url: 'blob:timeout-test',
  pixelWidth: 4000,
  pixelHeight: 2000,
};

const createAbortableFetch = () =>
  vi.fn(
    (_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        const rejectAbort = () => {
          const error = new Error('The mocked fetch was aborted.');
          error.name = 'AbortError';
          reject(error);
        };

        if (!signal) return;
        if (signal.aborted) {
          rejectAbort();
          return;
        }
        signal.addEventListener('abort', rejectAbort, { once: true });
      }),
  );

describe('bounded artwork texture loader cancellation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts a slow bounded decode into an explicit timeout failure', async () => {
    vi.stubGlobal('fetch', createAbortableFetch());

    await expect(
      loadBoundedArtworkTexture({
        source,
        limits: { maximumDimension: 1024, maximumPixelArea: 786_432 },
        anisotropy: 2,
        signal: new AbortController().signal,
        timeoutMs: 5,
      }),
    ).rejects.toMatchObject({
      name: 'ArtworkTextureLoadError',
      code: 'timeout',
    });
  });

  it('propagates an external cancellation without installing a texture', async () => {
    vi.stubGlobal('fetch', createAbortableFetch());
    const controller = new AbortController();
    const loading = loadBoundedArtworkTexture({
      source,
      limits: { maximumDimension: 1536, maximumPixelArea: 1_572_864 },
      anisotropy: 4,
      signal: controller.signal,
      timeoutMs: 10_000,
    });

    controller.abort();

    await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
  });
});
