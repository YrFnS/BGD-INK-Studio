import { beforeEach, describe, expect, it } from 'vitest';
import {
  getRuntimePerformanceSnapshot,
  incrementRuntimeCounter,
  installRuntimePerformanceMetrics,
  markRuntimeMilestone,
  recordRuntimeDuration,
  resetRuntimePerformanceMetrics,
} from './performanceMetrics';

describe('runtime performance metrics', () => {
  beforeEach(() => {
    delete window.__BGD_INK_RUNTIME__;
    delete window.__BGD_INK_RUNTIME_RESET__;
    delete window.__BGD_INK_RUNTIME_METRICS_ENABLED__;
  });

  it('does nothing unless the explicit performance flag is enabled', () => {
    installRuntimePerformanceMetrics();
    incrementRuntimeCounter('webglFrames');

    expect(getRuntimePerformanceSnapshot()).toBeNull();
  });

  it('records counters, durations, milestones, and deterministic resets', () => {
    window.__BGD_INK_RUNTIME_METRICS_ENABLED__ = true;
    installRuntimePerformanceMetrics();
    incrementRuntimeCounter('editorHistoryCommits');
    incrementRuntimeCounter('webglFrames', 3);
    recordRuntimeDuration('draftSave', 12.5);
    markRuntimeMilestone('ready');

    expect(getRuntimePerformanceSnapshot()).toMatchObject({
      version: 1,
      counters: {
        editorHistoryCommits: 1,
        webglFrames: 3,
      },
      durations: {
        draftSave: {
          samples: 1,
          totalMs: 12.5,
          maximumMs: 12.5,
          lastMs: 12.5,
        },
      },
    });
    expect(getRuntimePerformanceSnapshot()?.milestones.ready).toBeGreaterThanOrEqual(0);

    const reset = resetRuntimePerformanceMetrics();
    expect(reset?.counters.editorHistoryCommits).toBe(0);
    expect(reset?.durations.draftSave.samples).toBe(0);
    expect(window.__BGD_INK_RUNTIME_RESET__).toBe(resetRuntimePerformanceMetrics);
  });
});
