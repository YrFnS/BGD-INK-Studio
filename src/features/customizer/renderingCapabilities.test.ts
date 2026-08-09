import { describe, expect, it } from 'vitest';
import {
  areRenderingCapabilitiesEqual,
  detectWebGLSupport,
  selectRenderingProfile,
  type RenderingCapabilities,
} from './renderingCapabilities';

const capabilities = (
  overrides: Partial<RenderingCapabilities> = {},
): RenderingCapabilities => ({
  devicePixelRatio: 2,
  hardwareConcurrency: 8,
  deviceMemoryGb: 8,
  coarsePointer: false,
  reducedMotion: false,
  saveData: false,
  viewportWidth: 1440,
  viewportHeight: 900,
  ...overrides,
});

describe('adaptive rendering capabilities', () => {
  it('defaults an ordinary capable desktop to the balanced profile', () => {
    expect(selectRenderingProfile(capabilities())).toEqual({
      quality: 'balanced',
      maximumDpr: 1.25,
      shadows: false,
      shadowMapSize: 256,
      textureAnisotropy: 4,
    });
  });

  it('reserves high quality for measured high-capability desktop conditions', () => {
    expect(
      selectRenderingProfile(
        capabilities({
          hardwareConcurrency: 16,
          viewportWidth: 1600,
          viewportHeight: 1000,
        }),
      ),
    ).toEqual({
      quality: 'high',
      maximumDpr: 1.5,
      shadows: true,
      shadowMapSize: 512,
      textureAnisotropy: 8,
    });
  });

  it('reduces rendering cost for constrained, motion-sensitive, or compact devices', () => {
    expect(selectRenderingProfile(capabilities({ saveData: true }))).toMatchObject({
      quality: 'low',
      maximumDpr: 1,
      shadows: false,
    });
    expect(selectRenderingProfile(capabilities({ reducedMotion: true }))).toMatchObject({
      quality: 'low',
      maximumDpr: 1,
      shadows: false,
    });
    expect(
      selectRenderingProfile(capabilities({ viewportWidth: 390, viewportHeight: 844 })),
    ).toMatchObject({
      quality: 'low',
      maximumDpr: 1,
      shadows: false,
    });
  });

  it('uses the balanced profile for touch-first devices', () => {
    expect(
      selectRenderingProfile(
        capabilities({
          coarsePointer: true,
          hardwareConcurrency: 16,
          viewportWidth: 1600,
          viewportHeight: 1000,
        }),
      ),
    ).toEqual({
      quality: 'balanced',
      maximumDpr: 1.25,
      shadows: false,
      shadowMapSize: 256,
      textureAnisotropy: 4,
    });
  });

  it('compares capability snapshots without serialization', () => {
    const current = capabilities();
    expect(areRenderingCapabilitiesEqual(current, capabilities())).toBe(true);
    expect(
      areRenderingCapabilitiesEqual(current, capabilities({ viewportWidth: 1024 })),
    ).toBe(false);
    expect(
      areRenderingCapabilitiesEqual(current, capabilities({ reducedMotion: true })),
    ).toBe(false);
  });

  it('detects WebGL2, WebGL1, and unsupported canvases', () => {
    const webgl2Canvas = {
      getContext: (name: string) => (name === 'webgl2' ? {} : null),
    } as unknown as HTMLCanvasElement;
    const webgl1Canvas = {
      getContext: (name: string) => (name === 'webgl' ? {} : null),
    } as unknown as HTMLCanvasElement;
    const unsupportedCanvas = {
      getContext: () => null,
    } as unknown as HTMLCanvasElement;

    expect(detectWebGLSupport(() => webgl2Canvas)).toBe('webgl2');
    expect(detectWebGLSupport(() => webgl1Canvas)).toBe('webgl1');
    expect(detectWebGLSupport(() => unsupportedCanvas)).toBe('unsupported');
  });
});
