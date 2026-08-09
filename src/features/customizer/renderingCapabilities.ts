export type WebGLSupport = 'webgl2' | 'webgl1' | 'unsupported';
export type RenderingQuality = 'high' | 'balanced' | 'low';
export type PreviewMode = '3d' | '2d';
export type RenderingFallbackReason = 'manual' | 'unsupported' | 'context-lost' | 'model-error';

export interface RenderingCapabilities {
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemoryGb: number | null;
  coarsePointer: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  viewportWidth: number;
  viewportHeight: number;
}

export interface RenderingProfile {
  quality: RenderingQuality;
  maximumDpr: 1 | 1.25 | 1.5;
  shadows: boolean;
  shadowMapSize: 256 | 512;
  textureAnisotropy: 2 | 4 | 8;
}

interface NavigatorWithRenderingHints extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
  };
}

export const readRenderingCapabilities = (): RenderingCapabilities => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      devicePixelRatio: 1,
      hardwareConcurrency: 4,
      deviceMemoryGb: null,
      coarsePointer: false,
      reducedMotion: false,
      saveData: false,
      viewportWidth: 1280,
      viewportHeight: 720,
    };
  }

  const renderingNavigator = navigator as NavigatorWithRenderingHints;

  return {
    devicePixelRatio: Math.max(1, window.devicePixelRatio || 1),
    hardwareConcurrency: Math.max(1, navigator.hardwareConcurrency || 4),
    deviceMemoryGb:
      typeof renderingNavigator.deviceMemory === 'number'
        ? renderingNavigator.deviceMemory
        : null,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: renderingNavigator.connection?.saveData === true,
    viewportWidth: Math.max(1, window.innerWidth),
    viewportHeight: Math.max(1, window.innerHeight),
  };
};

export const areRenderingCapabilitiesEqual = (
  left: RenderingCapabilities,
  right: RenderingCapabilities,
): boolean =>
  left.devicePixelRatio === right.devicePixelRatio &&
  left.hardwareConcurrency === right.hardwareConcurrency &&
  left.deviceMemoryGb === right.deviceMemoryGb &&
  left.coarsePointer === right.coarsePointer &&
  left.reducedMotion === right.reducedMotion &&
  left.saveData === right.saveData &&
  left.viewportWidth === right.viewportWidth &&
  left.viewportHeight === right.viewportHeight;

export const selectRenderingProfile = (
  capabilities: RenderingCapabilities,
): RenderingProfile => {
  const smallestViewport = Math.min(capabilities.viewportWidth, capabilities.viewportHeight);
  const constrainedDevice =
    capabilities.saveData ||
    capabilities.reducedMotion ||
    smallestViewport < 600 ||
    capabilities.hardwareConcurrency <= 2 ||
    (capabilities.deviceMemoryGb !== null && capabilities.deviceMemoryGb <= 2);

  if (constrainedDevice) {
    return {
      quality: 'low',
      maximumDpr: 1,
      shadows: false,
      shadowMapSize: 256,
      textureAnisotropy: 2,
    };
  }

  const highCapabilityDesktop =
    !capabilities.coarsePointer &&
    capabilities.viewportWidth >= 1280 &&
    smallestViewport >= 900 &&
    capabilities.hardwareConcurrency >= 12 &&
    (capabilities.deviceMemoryGb === null || capabilities.deviceMemoryGb >= 8);

  if (highCapabilityDesktop) {
    return {
      quality: 'high',
      maximumDpr: 1.5,
      shadows: true,
      shadowMapSize: 512,
      textureAnisotropy: 8,
    };
  }

  return {
    quality: 'balanced',
    maximumDpr: 1.25,
    shadows: false,
    shadowMapSize: 256,
    textureAnisotropy: 4,
  };
};

export const detectWebGLSupport = (
  createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): WebGLSupport => {
  if (typeof document === 'undefined') return 'unsupported';

  try {
    const canvas = createCanvas();
    if (canvas.getContext('webgl2')) return 'webgl2';
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) return 'webgl1';
  } catch {
    return 'unsupported';
  }

  return 'unsupported';
};
