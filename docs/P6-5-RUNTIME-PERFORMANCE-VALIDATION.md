# P6.5 — Production runtime-performance budgets

## Status

**Complete and validated** on `agent/p6-runtime-stability`.

Validated implementation head:

```text
35b5946240e7eef4bd47acf26ae582e6e80ac41b
perf: cache disabled runtime instrumentation checks
```

Validated CI run:

```text
31305836004
```

All three jobs passed on the same branch head:

```text
Typecheck, lint, unit tests, build, and budgets
Desktop, mobile, and production PWA journeys
Production runtime performance budgets
```

P6.5 keeps the existing frontend-only and browser-local product boundary. It does not add a backend, accounts, remote artwork storage, inventory, payment, order processing, new garment models, analytics collection, or customer telemetry.

## Goal achieved

P6.1 through P6.4 repaired the major runtime architecture defects. P6.5 converts those repairs into enforced production-runtime requirements so responsiveness cannot silently regress later.

The repository now measures and protects:

- production homepage startup,
- repeated client-side route navigation,
- Studio opening and settling,
- continuous artwork transforms,
- durable editor commits,
- IndexedDB save operations,
- actual WebGL rendered frames,
- explicit WebGL invalidations,
- visible-idle rendering,
- hidden-document rendering,
- large artwork decoding,
- duplicate texture sharing,
- repeated texture creation and cleanup,
- long tasks where Chromium exposes the Long Tasks API,
- requestAnimationFrame gaps,
- and constrained-device behavior under controlled CPU throttling.

## Opt-in runtime instrumentation

Runtime instrumentation is disabled during ordinary product use.

It is enabled only when one of these explicit test/debug switches is present before application startup:

```text
window.__BGD_INK_RUNTIME_METRICS_ENABLED__ = true
?runtimeMetrics=1
```

The disabled decision is cached, so pointer-frequency editor work does not repeatedly parse the current URL. Normal users pay only a small disabled branch check.

When enabled, aggregate metrics are available through:

```text
window.__BGD_INK_RUNTIME__
window.__BGD_INK_RUNTIME_RESET__
```

The snapshot includes only counters, elapsed durations, and milestones. It does not contain artwork bytes, object URLs, file names, customer details, draft contents, addresses, or order information.

## App-owned logical counters

P6.5 instruments the exact architectural boundaries rather than arbitrary UI events.

### Route transitions

`PageTransition` increments one route-transition counter when the stable route key commits and records a route-settled milestone.

### Durable editor history

`commitEditorHistory` increments `editorHistoryCommits` only when the next typed snapshot differs from the committed present snapshot. Live pointer and range-input previews do not increment the durable history count.

### Draft saves

The public draft service wraps the IndexedDB save boundary and records:

- save attempts,
- successful saves,
- failed saves,
- and save duration.

This distinguishes logical editor work from actual durable persistence.

### WebGL rendering

An opt-in React Three Fiber probe records:

- actual React/R3F commits through `useLayoutEffect`,
- actual rendered WebGL frames through `useFrame`,
- and explicit frame invalidations at camera, texture, renderer, scene, and interaction boundaries.

The probe never invalidates the canvas itself and therefore cannot create a continuous render loop.

### Completed gestures

Canvas move/transform interactions increment `completedGestures` only when a real interaction ends. The performance journey also exercises the continuous range-input path and checks its durable history and save results directly.

## Browser-owned measurements

The dedicated Playwright harness installs before application code and records:

- Long Tasks API entries when supported,
- requestAnimationFrame gaps of at least 50 ms,
- deterministic visible/hidden document changes,
- constrained navigator capability hints,
- and controlled Chromium CPU throttling through CDP.

Long-task timing is treated as an additional browser signal. Hardware-independent count invariants remain mandatory even when a browser does not expose Long Tasks entries.

## Production-only Playwright configuration

P6.5 adds:

```bash
npm run test:performance
```

The suite uses `playwright.performance.config.ts` and:

- runs serially with one worker,
- builds the production bundle,
- serves it through Vite preview on a dedicated port,
- blocks service workers so samples are not warmed by a previous PWA cache,
- uses the repository-pinned Chromium build,
- uploads a performance report only when the job fails,
- and never runs against the Vite development server.

## Committed runtime budgets

The source of truth is:

```text
src/config/runtime-performance-budgets.json
```

### Repeated samples

| Journey | Samples |
| --- | ---: |
| Homepage startup | 3 |
| Client-side route navigation | 6 |

### Timing ceilings

| Metric | Budget |
| --- | ---: |
| Homepage interactive median | 2,500 ms |
| Route-transition median | 1,250 ms |
| Studio ready | 9,000 ms |
| Large artwork ready | 7,000 ms |
| Constrained large artwork ready | 15,000 ms |
| Maximum normal long task | 600 ms |
| Total normal long-task duration | 1,800 ms |
| Maximum constrained long task | 1,200 ms |
| Total constrained long-task duration | 4,000 ms |
| Maximum normal frame gap | 550 ms |
| Maximum constrained frame gap | 1,000 ms |

The absolute timing ceilings are intentionally tolerant of shared CI hardware while remaining strict enough to catch multi-hundred-millisecond stalls, failed route settling, decode regressions, and unusable constrained-device behavior.

### Strict logical invariants

| Invariant | Budget |
| --- | ---: |
| Durable history commits per continuous gesture | 1 |
| Durable draft saves per continuous gesture | 1 |
| Maximum measured React/R3F commits per gesture | 8 |
| Additional WebGL frames during 1,200 ms visible idle window | 2 |
| WebGL frames during 700 ms hidden window | 0 |
| Texture entries after cleanup | 0 |
| Texture references after cleanup | 0 |
| Constrained CPU throttling | 4× |

The count invariants are not percentile-based. A regression fails the suite directly.

## Production journeys

### 1. Startup and navigation

The first journey:

1. Opens the production homepage three times.
2. Waits for the accessible primary navigation.
3. evaluates the median interactive time.
4. Resets app and browser counters.
5. Navigates between Catalog and Guide six times.
6. Verifies the stable `data-page-transition-key` after every route change.
7. Checks the route-transition median.
8. Confirms exactly six route transitions were committed.
9. Enforces normal long-task and frame-gap ceilings.

### 2. Editor commit, idle rendering, and texture cleanup

The second journey:

1. Opens the Classic T-shirt Studio from the production catalog.
2. Generates and uploads a 2,400 × 1,200 transparent PNG.
3. Waits for the bounded GPU texture and local autosave.
4. Emits 24 live artwork-width updates inside one pointer gesture.
5. Verifies one durable history commit.
6. Verifies one durable IndexedDB save attempt and success.
7. Verifies zero save failures.
8. Enforces the React/R3F commit ceiling.
9. Confirms the gesture requested WebGL frames.
10. Measures visible idle rendering for 1,200 ms.
11. Simulates a hidden document and verifies zero rendered frames for 700 ms.
12. Duplicates the artwork and confirms one shared texture entry with two references.
13. Removes both layers and confirms the cache returns to zero.
14. Repeats upload/delete cycles.
15. Confirms every created texture has been disposed after final cleanup.
16. Enforces normal long-task and frame-gap ceilings.

### 3. Constrained-device journey

The third journey:

1. Installs low-memory, two-core, Save-Data, reduced-motion, phone-sized capability hints before startup.
2. Generates a 2,000 × 2,000 transparent PNG.
3. Applies 4× Chromium CPU throttling.
4. Opens the production Studio.
5. Verifies the low-power rendering profile.
6. Uploads and decodes the large artwork within the constrained timing ceiling.
7. Confirms the resulting texture is no larger than 1,024 × 1,024 and 786,432 decoded pixels.
8. Duplicates the layer.
9. Confirms one load, one created texture, one cache entry, and two references.
10. Removes both layers and confirms zero remaining entries.
11. Enforces constrained long-task and frame-gap ceilings.
12. Restores normal CPU throttling in cleanup.

## Permanent source gate

P6.5 adds:

```bash
npm run check:runtime-performance
```

The gate is part of the normal `npm run check` chain and prevents:

- removal of the opt-in metrics layer,
- loss of editor, save, invalidation, or rendered-frame counters,
- loss of stable route instrumentation,
- loss of durable history or IndexedDB save instrumentation,
- removal of production build/preview testing,
- running the performance suite against the development server,
- enabling service-worker cache warming in timing journeys,
- removal of long-task, frame-gap, or visibility probes,
- removal of startup or route budgets,
- removal of one-commit/one-save and idle/hidden frame invariants,
- removal of the constrained CPU-throttled journey,
- skipped or expected-failure performance tests,
- removal of the package command,
- omission from TypeScript validation,
- or omission from CI.

## CI enforcement

The normal GitHub Actions workflow now has three independent jobs:

```text
Typecheck, lint, unit tests, build, and budgets
Desktop, mobile, and production PWA journeys
Production runtime performance budgets
```

The performance job runs after source validation and uploads `playwright-report-performance` plus test results only when it fails.

Validated run `31305836004` completed successfully with:

```text
99 unit/component/accessibility tests across 35 files
16 desktop, phone, tablet, Arabic, editor, recovery, export, runtime-shell,
gesture, rendering-resilience, adaptive-profile, and texture-lifecycle Chromium journeys
1 production-only PWA Chromium journey
3 production runtime-performance Chromium journeys
strict TypeScript
zero-warning ESLint
brand, architecture, asset, storefront, localization, responsive,
runtime-shell, editor-gesture, demand-rendering, texture-lifecycle,
runtime-performance, bundle, and delivery gates
```

The dedicated production performance suite completed all three journeys in 19.7 seconds on the validated CI runner.

## Production bundle after P6.5

| Metric | P6.5 | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 74.79 KiB | 90 KiB |
| Initial CSS, gzip | 15.77 KiB | 17 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 385.00 KiB | 390 KiB |
| Total JavaScript, raw | 1,335.48 KiB | 1,350 KiB |
| Total CSS, gzip | 15.77 KiB | 17 KiB |

No JavaScript, CSS, image, GPU, or runtime budget was raised for P6.5.

## Acceptance criteria satisfied

- Performance journeys run against a production build.
- Instrumentation is explicitly enabled and dormant during ordinary product use.
- One continuous editor gesture creates one durable history commit.
- One continuous editor gesture schedules one durable draft save.
- The visible demand-rendered editor does not produce a continuous frame stream after settling.
- A hidden editor produces zero frames during the measured hidden window.
- Large artwork remains bounded and responsive.
- Compatible duplicate layers share one texture.
- Repeated upload/delete cycles return texture ownership to zero.
- A constrained low-power profile remains usable under 4× CPU throttling.
- Timing, long-task, frame-gap, logical-count, texture, bundle, functional, accessibility, localization, persistence, recovery, and PWA gates all pass together.

## Remaining P6 work

Only P6.6 remains:

1. reconcile package and release version claims,
2. update README and roadmap branch status,
3. remove or generate stale validation-count claims,
4. document runtime-performance commands and troubleshooting,
5. verify deployment targets do not depend on obsolete phase branches,
6. reconcile final release and branch documentation,
7. run the final P6 exit suite,
8. and only then decide whether PR #6 is ready to leave draft status.
