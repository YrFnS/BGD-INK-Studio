# P6 — Runtime stability and interaction performance

## Status

P6.1 through P6.5 are complete and validated on `agent/p6-runtime-stability`, branched from the authoritative `main` branch.

Only **P6.6 — repository and release reconciliation** remains open. PR #6 must remain draft and unmerged until that reconciliation and the final P6 exit suite are complete.

Validated phase records:

- `docs/P6-2-EDITOR-GESTURE-VALIDATION.md`
- `docs/P6-3-DEMAND-RENDERING-VALIDATION.md`
- `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md`
- `docs/P6-5-RUNTIME-PERFORMANCE-VALIDATION.md`

Validated P6.5 implementation head:

```text
35b5946240e7eef4bd47acf26ae582e6e80ac41b
perf: cache disabled runtime instrumentation checks
```

Validated P6.5 CI run:

```text
31305836004
```

## Branch and delivery strategy

All P6 work stays on one branch and one draft pull request:

```text
main
└── agent/p6-runtime-stability
```

Do not create a separate branch for each P6 phase. Use focused commits on the same branch so the complete stabilization work remains reviewable and no later branch silently misses an earlier repair.

P6 must not be merged until the full validation, production performance, documentation, deployment-reference, and release-state checks pass together.

## Product boundary

P6 remains frontend-only and browser-local. It does not add:

- a backend or production database,
- accounts or cross-device synchronization,
- remote artwork storage,
- inventory or payment processing,
- real order acceptance, tracking, or fulfillment,
- new garment models or physical print calibration,
- analytics collection,
- or new marketing sections and visual effects.

The purpose of P6 is to make the existing application reliable, responsive, measurable, and accurately documented before adding more product scope.

## Non-negotiable rules

- Do not hide failures by disabling tests.
- Do not raise JavaScript, CSS, GPU, image, or runtime budgets merely to make a check pass.
- Do not disable React Strict Mode as a performance workaround.
- Do not weaken local-draft persistence, Undo/Redo, WebGL recovery, accessibility, Iraqi Arabic/RTL, or PWA guarantees.
- Do not restore the full GSAP dependency.
- Runtime instrumentation must remain aggregate-only and explicitly enabled.
- Prefer removing low-value work over adding abstraction around it.
- Keep PR #6 draft until every P6 phase and the final exit suite are complete.

## Confirmed issue inventory and disposition

| ID | Area | Original problem | Current disposition |
| --- | --- | --- | --- |
| P6-01 | Cursor | Native cursor hidden while a custom cursor ran on every pointer movement. | Complete in P6.1. Native cursor restored and custom cursor removed. |
| P6-02 | Startup | Artificial full-screen preloader blocked access. | Complete in P6.1. Blocking preloader removed. |
| P6-03 | Paint/compositing | Permanent full-screen SVG turbulence stayed mounted across routes. | Complete in P6.1. Turbulence layer removed. |
| P6-04 | Navigation | Page transitions depended on changing child identity and bubbled transition events. | Complete in P6.1. Stable route-key transitions and browser history coverage added. |
| P6-05 | Homepage | Magnetic CTA performed layout work during pointer movement. | Complete in P6.1. Layout-reading interaction removed. |
| P6-06 | Route shell | Decorative effects remained inside the editor route. | Complete in P6.1. Performance-sensitive routes no longer carry the removed global effects. |
| P6-07 | Editor interaction | Pointer movement cloned snapshots and updated durable React state continuously. | Complete in P6.2. Live refs/Three.js previews with one final commit per gesture. |
| P6-08 | Undo/Redo | Snapshot equality serialized complete editor snapshots. | Complete in P6.2. Typed equality and bounded history work. |
| P6-09 | WebGL | Continuous rendering, idle animation, DPR 2, and 1024 shadow maps. | Complete in P6.3. Demand rendering and bounded profiles. |
| P6-10 | Rendering profiles | Capability profile selected only once. | Complete in P6.3. Reactive in-place profile selection. |
| P6-11 | Artwork textures | Timeout/error fallback could upload the unbounded original image. | Complete in P6.4. Every successful path is dimension- and pixel-area-bounded. |
| P6-12 | GPU memory | Compatible duplicate layers created duplicate textures. | Complete in P6.4. Reference-counted shared texture cache. |
| P6-13 | Runtime quality gates | Bundle checks could not detect idle rendering, commit/save amplification, long tasks, or frame gaps. | Complete in P6.5. Production runtime budgets and CI job added. |
| P6-14 | Repository hygiene | Version, branch, roadmap, validation, and release claims are inconsistent. | Open in P6.6. |

## Completed phases

### P6.1 — Shell and navigation stabilization

- Restored browser-native cursors.
- Removed the blocking preloader.
- Removed full-screen SVG turbulence and persistent decorative compositing.
- Removed layout-reading magnetic pointer work.
- Rebuilt transitions around stable route keys.
- Preserved keyboard focus and native control behavior.
- Added source and Chromium regression gates.

### P6.2 — Editor gesture and state pipeline

- Separated pointer-frequency Three.js previews from durable React, history, and IndexedDB state.
- One continuous gesture now produces one final editor commit, one history action, and one autosave cycle.
- Added typed transform and snapshot equality.
- Added navigation-safe and persistence-safe gesture finalization.
- Preserved Undo/Redo, recovery, export, checkout, Arabic/RTL, and 2D fallback behavior.

Detailed validation: `docs/P6-2-EDITOR-GESTURE-VALIDATION.md`.

### P6.3 — Demand-driven WebGL and adaptive rendering

- Every visible profile uses `frameloop="demand"`.
- Hidden documents use `frameloop="never"`.
- Removed permanent idle garment animation and continuous `useFrame` work.
- Added explicit invalidation for camera, artwork, texture, renderer, scene, profile, resize, and recovery changes.
- Rebalanced rendering profiles and removed DPR 2 plus 1024 shadow maps.
- Made capability selection reactive without resetting the active draft.

Detailed validation: `docs/P6-3-DEMAND-RENDERING-VALIDATION.md`.

### P6.4 — Bounded artwork decoding and shared texture lifecycle

- Removed the direct original-image `TextureLoader` fallback.
- Enforced maximum dimension and decoded pixel-area limits on every successful GPU path.
- Intersected profile limits with the WebGL hardware ceiling.
- Added resized `ImageBitmap` decoding and a bounded canvas compatibility path.
- Added stable asset/configuration cache keys and reference-counted texture sharing.
- Added deterministic release on layer hiding/deletion, profile replacement, 2D fallback, route navigation, failure, timeout, and cancellation.
- Prevented stale asynchronous decodes from installing resources.
- Added lifecycle diagnostics and focused unit/browser coverage.

Detailed validation: `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md`.

### P6.5 — Production runtime-performance budgets

- Added explicitly enabled aggregate runtime counters for route transitions, React/R3F commits, durable editor commits, completed gestures, draft saves, WebGL invalidations, and actual WebGL frames.
- Added save-duration and route-settled milestones.
- Kept instrumentation dormant for ordinary users and cached the disabled decision to avoid pointer-path URL parsing.
- Added a dedicated production Playwright project that builds and serves the application through Vite preview.
- Blocked service workers in performance journeys to avoid warmed-cache timing distortion.
- Added Long Tasks API and requestAnimationFrame-gap probes.
- Added deterministic visible/hidden document simulation.
- Added 4× Chromium CPU-throttled constrained-device coverage.
- Added committed timing and logical-count budgets.
- Added strict one-history-commit, one-draft-save, visible-idle, hidden-frame, texture-cleanup, and duplicate-sharing invariants.
- Added `check:runtime-performance` to the normal source gate.
- Added `test:performance` and a dedicated CI job.

Validated baseline:

```text
99 unit/component/accessibility tests across 35 files
16 functional Chromium journeys
1 production-only PWA Chromium journey
3 production runtime-performance Chromium journeys
strict TypeScript
zero-warning ESLint
all architecture, runtime, bundle, delivery, and performance gates
```

Production runtime budgets passed without raising any existing JavaScript, CSS, image, GPU, or runtime threshold.

Detailed validation: `docs/P6-5-RUNTIME-PERFORMANCE-VALIDATION.md`.

## Remaining phase

## P6.6 — Repository and release reconciliation

### Goal

Make the repository, package metadata, branch documentation, troubleshooting guidance, validation claims, and release state accurately describe the consolidated and measured application.

### Work

- Reconcile `package.json` versioning with the intended validated release.
- Update README status and branch documentation.
- Remove the obsolete active stacked-branch diagram.
- Replace stale hard-coded test counts with generated/current claims or intentionally omit volatile counts.
- Document:
  - `npm run check`,
  - `npm run test:e2e`,
  - `npm run test:pwa`,
  - `npm run test:performance`,
  - committed runtime budgets,
  - reduced-motion behavior,
  - safe 2D fallback,
  - WebGL context loss,
  - large artwork handling,
  - and performance-test troubleshooting.
- Verify Vercel, Netlify, and any other deployment target do not depend on obsolete phase branches.
- Review merged/superseded branches for later deletion only after deployment-reference verification.
- Reconcile PR #6 title, body, validation evidence, and remaining-risk statements.
- Run the final P6 exit suite from a clean installation.
- Keep PR #6 draft unless the full exit criteria are satisfied and the repository accurately reflects release readiness.

### Acceptance criteria

- README, roadmap, package metadata, deployment guidance, and PR status agree.
- Validation claims match current command output or are intentionally non-numeric.
- Runtime-performance commands and budgets are documented alongside existing checks.
- No deployment instruction points developers to an obsolete phase branch.
- Troubleshooting guidance covers the main runtime and recovery paths.
- The clean final exit suite passes without weakening tests or budgets.

## Required final commands

Before P6 can leave draft status, a clean checkout must pass:

```bash
npm ci --include=dev --no-audit --no-fund
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

## Final P6 definition of done

P6 is complete only when:

- P6.1 through P6.6 are implemented and documented,
- all source, unit, functional, PWA, production-performance, bundle, accessibility, localization, persistence, texture, and WebGL gates pass together,
- runtime instrumentation remains opt-in and privacy-safe,
- committed budgets are not weakened to obtain a pass,
- README, roadmap, package version, deployment references, troubleshooting, and PR status are reconciled,
- no unresolved stabilization work remains in PR #6,
- and the final branch is reviewed before any merge decision.
