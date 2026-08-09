import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => readFile(path.join(root, relative), 'utf8');
const files = {
  budgets: await read('src/config/runtime-performance-budgets.json'),
  metrics: await read('src/runtime/performanceMetrics.ts'),
  frameProbe: await read('src/runtime/RuntimeWebGLProbe.tsx'),
  main: await read('src/main.tsx'),
  pageTransition: await read('src/components/layout/PageTransition.tsx'),
  history: await read('src/features/customizer/editorHistory.ts'),
  drafts: await read('src/services/drafts/index.ts'),
  scene: await read('src/features/customizer/Scene.tsx'),
  configuration: await read('playwright.performance.config.ts'),
  harness: await read('e2e-performance/runtimeHarness.ts'),
  journey: await read('e2e-performance/runtime-performance.spec.ts'),
  package: await read('package.json'),
  typescript: await read('tsconfig.json'),
  workflow: await read('.github/workflows/ci.yml'),
};

const failures = [];
const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

let budgets;
try {
  budgets = JSON.parse(files.budgets);
} catch {
  failures.push('runtime performance budgets must be valid JSON');
}

if (budgets) {
  const requiredPositiveNumbers = [
    budgets.samples?.homepageStartup,
    budgets.samples?.routeNavigation,
    budgets.timingMs?.homepageInteractiveMedian,
    budgets.timingMs?.routeTransitionMedian,
    budgets.timingMs?.studioReady,
    budgets.timingMs?.largeArtworkReady,
    budgets.timingMs?.constrainedArtworkReady,
    budgets.counts?.editorHistoryCommitsPerGesture,
    budgets.counts?.draftSavesPerGesture,
    budgets.windowsMs?.idleSettle,
    budgets.throttling?.cpuRate,
  ];
  if (requiredPositiveNumbers.some((value) => typeof value !== 'number' || value <= 0)) {
    failures.push('runtime performance budgets must define positive timing, count, and sample limits');
  }
}

requirePattern(
  files.metrics,
  /editorHistoryCommits[\s\S]*draftSavesStarted[\s\S]*webglInvalidations[\s\S]*webglFrames/,
  'the runtime metrics snapshot must expose editor, save, invalidation, and rendered-frame counters',
);
requirePattern(
  files.metrics,
  /__BGD_INK_RUNTIME_METRICS_ENABLED__[\s\S]*__BGD_INK_RUNTIME_RESET__/,
  'runtime instrumentation must remain opt-in and resettable for deterministic journeys',
);
requirePattern(
  files.main,
  /installRuntimePerformanceMetrics\(\)/,
  'the opt-in runtime metrics layer must be installed before application startup',
);
requirePattern(
  files.pageTransition,
  /routeTransitions[\s\S]*routeSettled/,
  'route transitions must publish a stable aggregate counter and settle milestone',
);
requirePattern(
  files.history,
  /incrementRuntimeCounter\('editorHistoryCommits'\)/,
  'durable editor history commits must be counted at the history boundary',
);
requirePattern(
  files.drafts,
  /draftSavesStarted[\s\S]*draftSavesSucceeded[\s\S]*draftSavesFailed[\s\S]*recordRuntimeDuration/,
  'durable IndexedDB saves must expose start, success, failure, and duration metrics',
);
requirePattern(
  files.frameProbe,
  /useLayoutEffect[\s\S]*reactCommits[\s\S]*useFrame[\s\S]*webglFrames/,
  'the demand canvas must count React commits and actual rendered frames without invalidating itself',
);
requirePattern(
  files.scene,
  /isRuntimePerformanceMetricsEnabled[\s\S]*RuntimeWebGLProbe[\s\S]*completedGestures/,
  'the scene must mount the frame probe only when requested and count completed canvas gestures',
);
requirePattern(
  files.configuration,
  /testDir:\s*'\.\/e2e-performance'/,
  'performance journeys must use the dedicated performance test directory',
);
requirePattern(
  files.configuration,
  /serviceWorkers:\s*'block'/,
  'performance journeys must block service workers so samples are not warmed by a PWA cache',
);
requirePattern(
  files.configuration,
  /command:\s*'npm run build && npm run preview/,
  'performance journeys must run against a production build and preview server',
);
forbidPattern(
  files.configuration,
  /npm run dev/,
  'performance journeys must never run against the Vite development server',
);
requirePattern(
  files.harness,
  /PerformanceObserver[\s\S]*longtask[\s\S]*frameGaps[\s\S]*SET_TEST_VISIBILITY/,
  'the browser harness must collect long tasks and frame gaps while supporting deterministic visibility changes',
);
requirePattern(
  files.journey,
  /homepageInteractiveMedian[\s\S]*routeTransitionMedian[\s\S]*routeTransitions/,
  'the production journey must enforce repeated startup and route timing budgets',
);
requirePattern(
  files.journey,
  /editorHistoryCommitsPerGesture[\s\S]*draftSavesPerGesture[\s\S]*maximumVisibleIdleWebglFrames[\s\S]*hiddenWebglFrames/,
  'the editor journey must enforce one logical commit/save and zero continuous visible or hidden rendering',
);
requirePattern(
  files.journey,
  /setCPUThrottlingRate[\s\S]*constrainedArtworkReady[\s\S]*largestPixelArea[\s\S]*texturesCreated/,
  'a constrained Chromium journey must enforce large-artwork timing, texture bounds, and sharing',
);
forbidPattern(
  files.journey,
  /test\.skip|test\.fixme|\.skip\(/,
  'runtime performance journeys must not be skipped or marked as expected failures',
);
requirePattern(
  files.package,
  /"test:performance":\s*"playwright test --config playwright\.performance\.config\.ts"/,
  'package scripts must expose the production runtime performance suite',
);
requirePattern(
  files.package,
  /check:runtime-performance[\s\S]*check:texture-lifecycle[\s\S]*check:runtime-performance/,
  'the permanent runtime-performance source gate must run in the normal validation command',
);
requirePattern(
  files.typescript,
  /e2e-performance\/\*\*\/\*\.ts[\s\S]*playwright\.performance\.config\.ts/,
  'TypeScript validation must include the performance harness and configuration',
);
requirePattern(
  files.workflow,
  /name:\s*Production runtime performance budgets[\s\S]*npm run test:performance/,
  'CI must run the production runtime performance budgets after source validation',
);

if (failures.length > 0) {
  console.error('\nRuntime-performance validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Runtime-performance validation passed: opt-in counters, production timing budgets, idle and hidden frame invariants, constrained CPU coverage, and CI enforcement are present.',
);
