import { performance } from 'node:perf_hooks';
import type { Page } from '@playwright/test';
import type { ArtworkTextureCacheSnapshot } from '../src/features/customizer/artworkTextureCache';
import type { RuntimePerformanceSnapshot } from '../src/runtime/performanceMetrics';

export interface BrowserPerformanceSnapshot {
  longTaskCount: number;
  longTaskTotalMs: number;
  maximumLongTaskMs: number;
  p95LongTaskMs: number;
  frameGapCount: number;
  maximumFrameGapMs: number;
  p95FrameGapMs: number;
}

interface BrowserProbeState {
  longTasks: number[];
  frameGaps: number[];
}

export const enableRuntimePerformanceHarness = async (
  page: Page,
  options: { constrained?: boolean } = {},
): Promise<void> => {
  await page.addInitScript(
    ({ constrained }) => {
      window.__BGD_INK_RUNTIME_METRICS_ENABLED__ = true;

      if (constrained) {
        const connection = new EventTarget() as EventTarget & { saveData: boolean };
        connection.saveData = true;
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          configurable: true,
          get: () => 2,
        });
        Object.defineProperty(navigator, 'deviceMemory', {
          configurable: true,
          get: () => 2,
        });
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          get: () => connection,
        });
      }

      let visibilityState: DocumentVisibilityState = 'visible';
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => visibilityState,
      });
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => visibilityState === 'hidden',
      });
      window.__BGD_INK_SET_TEST_VISIBILITY__ = (state) => {
        visibilityState = state;
        document.dispatchEvent(new Event('visibilitychange'));
      };

      const probe: BrowserProbeState = {
        longTasks: [],
        frameGaps: [],
      };
      window.__BGD_INK_BROWSER_PERFORMANCE__ = probe;
      window.__BGD_INK_BROWSER_PERFORMANCE_RESET__ = () => {
        probe.longTasks.length = 0;
        probe.frameGaps.length = 0;
      };

      if (typeof PerformanceObserver === 'function') {
        try {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => probe.longTasks.push(entry.duration));
          });
          observer.observe({ type: 'longtask', buffered: true });
        } catch {
          // The Long Tasks API is optional. Count and frame invariants remain mandatory.
        }
      }

      let lastFrame: number | null = null;
      const sampleFrame = (timestamp: number) => {
        if (document.visibilityState === 'hidden') {
          lastFrame = null;
        } else {
          if (lastFrame !== null) {
            const gap = timestamp - lastFrame;
            if (gap >= 50) probe.frameGaps.push(gap);
          }
          lastFrame = timestamp;
        }
        window.requestAnimationFrame(sampleFrame);
      };
      window.requestAnimationFrame(sampleFrame);
    },
    { constrained: options.constrained === true },
  );
};

export const measureMilliseconds = async (operation: () => Promise<void>): Promise<number> => {
  const startedAt = performance.now();
  await operation();
  return performance.now() - startedAt;
};

export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
};

const percentile = (values: number[], percentileValue: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
};

export const resetRuntimePerformance = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    window.__BGD_INK_RUNTIME_RESET__?.();
    window.__BGD_INK_BROWSER_PERFORMANCE_RESET__?.();
  });
};

export const readRuntimePerformance = async (
  page: Page,
): Promise<RuntimePerformanceSnapshot> =>
  page.evaluate(() => {
    if (!window.__BGD_INK_RUNTIME__) {
      throw new Error('Runtime performance metrics were not installed.');
    }
    return structuredClone(window.__BGD_INK_RUNTIME__);
  });

export const readTexturePerformance = async (
  page: Page,
): Promise<ArtworkTextureCacheSnapshot> =>
  page.evaluate(() => {
    if (!window.__BGD_INK_TEXTURE_CACHE__) {
      throw new Error('Texture lifecycle metrics were not installed.');
    }
    return structuredClone(window.__BGD_INK_TEXTURE_CACHE__);
  });

export const readBrowserPerformance = async (
  page: Page,
): Promise<BrowserPerformanceSnapshot> => {
  const probe = await page.evaluate(() => {
    if (!window.__BGD_INK_BROWSER_PERFORMANCE__) {
      throw new Error('Browser performance probe was not installed.');
    }
    return structuredClone(window.__BGD_INK_BROWSER_PERFORMANCE__);
  });

  return {
    longTaskCount: probe.longTasks.length,
    longTaskTotalMs: probe.longTasks.reduce((sum, duration) => sum + duration, 0),
    maximumLongTaskMs: Math.max(0, ...probe.longTasks),
    p95LongTaskMs: percentile(probe.longTasks, 95),
    frameGapCount: probe.frameGaps.length,
    maximumFrameGapMs: Math.max(0, ...probe.frameGaps),
    p95FrameGapMs: percentile(probe.frameGaps, 95),
  };
};

export const setTestVisibility = async (
  page: Page,
  state: DocumentVisibilityState,
): Promise<void> => {
  await page.evaluate((nextState) => {
    window.__BGD_INK_SET_TEST_VISIBILITY__?.(nextState);
  }, state);
};

export const createTransparentPng = async (
  page: Page,
  width: number,
  height: number,
): Promise<Buffer> => {
  const bytes = await page.evaluate(
    async ({ imageWidth, imageHeight }) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      context.clearRect(0, 0, imageWidth, imageHeight);
      context.fillStyle = '#ef4444';
      context.fillRect(
        Math.floor(imageWidth * 0.1),
        Math.floor(imageHeight * 0.1),
        Math.floor(imageWidth * 0.8),
        Math.floor(imageHeight * 0.8),
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error('PNG generation failed.'))),
          'image/png',
        );
      });
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { imageWidth: width, imageHeight: height },
  );

  return Buffer.from(bytes);
};

declare global {
  interface Navigator {
    deviceMemory?: number;
  }

  interface Window {
    __BGD_INK_BROWSER_PERFORMANCE__?: BrowserProbeState;
    __BGD_INK_BROWSER_PERFORMANCE_RESET__?: () => void;
    __BGD_INK_SET_TEST_VISIBILITY__?: (state: DocumentVisibilityState) => void;
  }
}
