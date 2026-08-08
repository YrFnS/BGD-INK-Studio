import { describe, expect, it } from 'vitest';
import {
  detectWebGLSupport,
  selectRenderingProfile,
  type RenderingCapabilities,
} from './renderingCapabilities';

const capabilities = (overrides: Partial<RenderingCapabilities> = {}): RenderingCapabilities => ({
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
  it('selects a high-quality profile for capable desktop devices', () => {
    expect(selectRenderingProfile(capabilities())).toMatchObject({
      quality: 'high',
      maximumDpr: 2,
      shadows: true,
      idleAnimation: true,
      textureAnisotropy: 8,
    });
  });

  it('reduces rendering cost for constrained or data-saving devices', () => {
    expect(selectRenderingProfile(capabilities({ saveData: true }))).toMatchObject({
      quality: 'low',
      maximumDpr: 1,
      antialias: false,
      shadows: false,
      idleAnimation: false,
    });
  });

  it('uses a balanced profile for touch-first devices', () => {
    expect(selectRenderingProfile(capabilities({ coarsePointer: true }))).toMatchObject({
      quality: 'balanced',
      maximumDpr: 1.5,
      shadowMapSize: 512,
      idleAnimation: false,
    });
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
