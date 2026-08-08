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
  maximumDpr: number;
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: 256 | 512 | 1024;
  idleAnimation: boolean;
  textureAnisotropy: 2 | 4 | 8;
  powerPreference: WebGLPowerPreference;
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
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
};

export const selectRenderingProfile = (
  capabilities: RenderingCapabilities,
): RenderingProfile => {
  const smallestViewport = Math.min(capabilities.viewportWidth, capabilities.viewportHeight);
  const constrainedDevice =
    capabilities.saveData ||
    capabilities.reducedMotion ||
    capabilities.hardwareConcurrency <= 2 ||
    (capabilities.deviceMemoryGb !== null && capabilities.deviceMemoryGb <= 2);

  if (constrainedDevice) {
    return {
      quality: 'low',
      maximumDpr: 1,
      antialias: false,
      shadows: false,
      shadowMapSize: 256,
      idleAnimation: false,
      textureAnisotropy: 2,
      powerPreference: 'low-power',
    };
  }

  const balancedDevice =
    capabilities.coarsePointer ||
    smallestViewport < 900 ||
    capabilities.hardwareConcurrency <= 4 ||
    (capabilities.deviceMemoryGb !== null && capabilities.deviceMemoryGb <= 4);

  if (balancedDevice) {
    return {
      quality: 'balanced',
      maximumDpr: Math.min(1.5, capabilities.devicePixelRatio),
      antialias: true,
      shadows: true,
      shadowMapSize: 512,
      idleAnimation: false,
      textureAnisotropy: 4,
      powerPreference: 'high-performance',
    };
  }

  return {
    quality: 'high',
    maximumDpr: Math.min(2, capabilities.devicePixelRatio),
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    idleAnimation: true,
    textureAnisotropy: 8,
    powerPreference: 'high-performance',
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
