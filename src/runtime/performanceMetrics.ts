export interface RuntimePerformanceCounters {
  routeTransitions: number;
  reactCommits: number;
  editorHistoryCommits: number;
  completedGestures: number;
  draftSavesStarted: number;
  draftSavesSucceeded: number;
  draftSavesFailed: number;
  webglInvalidations: number;
  webglFrames: number;
}

export type RuntimePerformanceCounter = keyof RuntimePerformanceCounters;
export type RuntimePerformanceDuration = 'draftSave';

export interface RuntimeDurationSummary {
  samples: number;
  totalMs: number;
  maximumMs: number;
  lastMs: number;
}

export interface RuntimePerformanceSnapshot {
  version: 1;
  startedAt: number;
  counters: RuntimePerformanceCounters;
  durations: Record<RuntimePerformanceDuration, RuntimeDurationSummary>;
  milestones: Record<string, number>;
}

const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const createCounters = (): RuntimePerformanceCounters => ({
  routeTransitions: 0,
  reactCommits: 0,
  editorHistoryCommits: 0,
  completedGestures: 0,
  draftSavesStarted: 0,
  draftSavesSucceeded: 0,
  draftSavesFailed: 0,
  webglInvalidations: 0,
  webglFrames: 0,
});

const createDurationSummary = (): RuntimeDurationSummary => ({
  samples: 0,
  totalMs: 0,
  maximumMs: 0,
  lastMs: 0,
});

const createSnapshot = (): RuntimePerformanceSnapshot => ({
  version: 1,
  startedAt: now(),
  counters: createCounters(),
  durations: {
    draftSave: createDurationSummary(),
  },
  milestones: {},
});

export const isRuntimePerformanceMetricsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.__BGD_INK_RUNTIME_METRICS_ENABLED__ === true) return true;

  try {
    return new URLSearchParams(window.location.search).get('runtimeMetrics') === '1';
  } catch {
    return false;
  }
};

const getOrCreateSnapshot = (): RuntimePerformanceSnapshot | null => {
  if (!isRuntimePerformanceMetricsEnabled()) return null;
  window.__BGD_INK_RUNTIME__ ??= createSnapshot();
  return window.__BGD_INK_RUNTIME__;
};

export const resetRuntimePerformanceMetrics = (): RuntimePerformanceSnapshot | null => {
  if (!isRuntimePerformanceMetricsEnabled()) return null;
  const snapshot = createSnapshot();
  window.__BGD_INK_RUNTIME__ = snapshot;
  return snapshot;
};

export const installRuntimePerformanceMetrics = (): void => {
  if (!isRuntimePerformanceMetricsEnabled()) return;
  getOrCreateSnapshot();
  window.__BGD_INK_RUNTIME_RESET__ = resetRuntimePerformanceMetrics;
  markRuntimeMilestone('appStarted');
};

export const getRuntimePerformanceSnapshot = (): RuntimePerformanceSnapshot | null =>
  typeof window === 'undefined' ? null : (window.__BGD_INK_RUNTIME__ ?? null);

export const incrementRuntimeCounter = (
  counter: RuntimePerformanceCounter,
  amount = 1,
): void => {
  const snapshot = getOrCreateSnapshot();
  if (!snapshot) return;
  snapshot.counters[counter] += amount;
};

export const recordRuntimeDuration = (
  duration: RuntimePerformanceDuration,
  elapsedMs: number,
): void => {
  const snapshot = getOrCreateSnapshot();
  if (!snapshot || !Number.isFinite(elapsedMs) || elapsedMs < 0) return;

  const summary = snapshot.durations[duration];
  summary.samples += 1;
  summary.totalMs += elapsedMs;
  summary.maximumMs = Math.max(summary.maximumMs, elapsedMs);
  summary.lastMs = elapsedMs;
};

export const markRuntimeMilestone = (name: string): void => {
  const snapshot = getOrCreateSnapshot();
  if (!snapshot) return;
  snapshot.milestones[name] = now() - snapshot.startedAt;
};

declare global {
  interface Window {
    __BGD_INK_RUNTIME_METRICS_ENABLED__?: boolean;
    __BGD_INK_RUNTIME__?: RuntimePerformanceSnapshot;
    __BGD_INK_RUNTIME_RESET__?: () => RuntimePerformanceSnapshot | null;
  }
}
