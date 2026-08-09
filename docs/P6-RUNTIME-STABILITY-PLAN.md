# P6 — Runtime stability and interaction performance

## Status

P6.1 through P6.4 are complete and validated on `agent/p6-runtime-stability`, branched from the authoritative `main` branch. P6.5 runtime-performance CI gates and P6.6 repository/release reconciliation remain open.

P6 addresses the runtime defects discovered after the P0–P5 merge: the unreliable custom cursor, artificial startup delay, excessive decorative compositing, route-transition instability, editor rerender pressure, continuous WebGL work, unsafe texture fallback behavior, and the absence of runtime-performance regression gates.

Validated phase records:

- `docs/P6-2-EDITOR-GESTURE-VALIDATION.md`
- `docs/P6-3-DEMAND-RENDERING-VALIDATION.md`
- `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md`

## Branch and delivery strategy

All P6 work stays on one branch and one draft pull request:

```text
main
└── agent/p6-runtime-stability
```

Do not create a separate branch for each P6 phase. Use focused commits on the same branch so the complete stabilization work remains easy to review and no later branch silently misses an earlier fix.

P6 must not be merged until the full existing validation suite and the new runtime-performance gates pass.

## Product boundary

P6 remains frontend-only and browser-local. It does not add:

- A backend or production database
- Accounts or cross-device synchronization
- Remote artwork storage
- Inventory, payment, real order acceptance, tracking, or fulfillment
- New garment models or physical print calibration
- New marketing sections or visual effects

The goal is to make the existing application reliable, responsive, and measurable before adding more product scope.

## Non-negotiable rules

- Do not hide failures by disabling tests.
- Do not raise JavaScript, CSS, GPU, image, or runtime budgets merely to make a check pass.
- Do not disable React Strict Mode as a performance workaround. Effects must be idempotent and clean up correctly.
- Do not weaken the local-draft persistence, undo/redo, WebGL recovery, accessibility, Arabic/RTL, or PWA guarantees completed in earlier phases.
- Do not restore the full GSAP dependency. Existing motion must use CSS, Web Animations, or small purpose-built requestAnimationFrame logic.
- Measure before and after each performance-sensitive phase.
- Prefer removing low-value work over adding more abstraction around it.

## Confirmed issue inventory

| ID | Severity | Area | Confirmed problem | Required disposition |
| --- | --- | --- | --- | --- |
| P6-01 | Critical | Cursor | The native cursor is globally hidden on fine pointers, including form controls, while a two-layer custom cursor performs work on every mouse movement. | Restore the native cursor and remove the current custom cursor implementation. |
| P6-02 | High | Startup | A full-screen animated preloader blocks access even though it is not connected to real application readiness. | Remove the blocking preloader from the normal application path. |
| P6-03 | High | Paint/compositing | A full-screen SVG turbulence filter and blend layer remain mounted across every route, including the 3D editor. | Remove it; any future texture must be static, local, optional, and excluded from constrained/editor modes. |
| P6-04 | Critical | Navigation | `PageTransition` reacts to changing child element identity as well as the route key, uses `transition-all`, and accepts bubbled transition events. | Rewrite transitions around the stable route key and explicit opacity/transform events only. |
| P6-05 | Medium | Homepage interaction | The magnetic CTA reads layout and writes animation state during every mouse movement. | Remove it initially; only restore a measured requestAnimationFrame implementation if it provides clear value. |
| P6-06 | High | Route architecture | Global decorative effects stay mounted inside the most performance-sensitive editor route. | Add a route-aware effects boundary and keep the editor free of unnecessary shell effects. |
| P6-07 | Critical | Editor interaction | Pointer movement clones editor snapshots, maps full layer arrays, applies multiple React states, rerenders the customizer tree, and restarts autosave scheduling. | Move live gestures to refs/Three.js objects and commit one logical state change per completed gesture. |
| P6-08 | High | Undo/redo | Snapshot equality uses `JSON.stringify`, and complete snapshots are repeatedly deep-cloned. | Replace with typed field comparison or revision-based equality and minimize cloning during live interaction. |
| P6-09 | Critical | WebGL | High-quality profiles use continuous rendering, idle rotation, DPR up to 2, antialiasing, shadows, and a 1024 shadow map while idle. | Use demand rendering for every profile and invalidate only for meaningful changes. |
| P6-10 | High | Rendering profiles | The rendering profile is selected only once and does not respond to viewport, orientation, media-query, or device-condition changes. | Make profile selection reactive and stable without repeatedly remounting the scene. |
| P6-11 | Critical | Artwork textures | The timeout/error fallback can load the unbounded original image directly into WebGL, bypassing configured texture limits. | Ensure every decode path resizes before GPU upload. No unbounded fallback is permitted. |
| P6-12 | High | GPU memory | Duplicate layers can create duplicate textures and texture ownership is distributed across components. | Add a shared, reference-counted texture cache keyed by artwork asset and rendering profile. |
| P6-13 | High | Quality gates | Existing checks enforce bundle sizes but do not detect long tasks, dropped frames, continuous idle rendering, or drag latency. | Add deterministic browser runtime-performance journeys and committed budgets. |
| P6-14 | Medium | Repository hygiene | Version/status counts and branch documentation are inconsistent, and the roadmap still describes the old stack as active. | Reconcile documentation and versioning when implementation reaches a validated state. |

## Completed stabilization phases

### P6.1 — Shell and navigation

- Restored browser-native cursors.
- Removed the blocking preloader, full-screen SVG noise, and layout-reading magnetic CTA behavior.
- Rebuilt page transitions around stable route keys with deterministic Back/Forward handling.
- Added source and Chromium regression gates.

### P6.2 — Editor gesture and state pipeline

- Separated live Three.js previews from durable React, history, and IndexedDB state.
- One continuous gesture now produces one final state commit, one history action, and one autosave cycle.
- Added typed snapshot equality and navigation-safe gesture finalization.
- Preserved Undo/Redo, export, checkout, recovery, Arabic/RTL, and 2D fallback behavior.

Detailed validation: `docs/P6-2-EDITOR-GESTURE-VALIDATION.md`.

### P6.3 — Demand-driven WebGL

- Every visible profile uses `frameloop="demand"`; hidden documents use `frameloop="never"`.
- Removed permanent garment rotation and idle `useFrame` work.
- Added explicit invalidation for meaningful camera, artwork, texture, renderer, and recovery changes.
- Rebalanced quality profiles and made capability selection reactive without resetting editor state.

Detailed validation: `docs/P6-3-DEMAND-RENDERING-VALIDATION.md`.

### P6.4 — Texture memory and artwork decoding

- Removed the direct original-image `TextureLoader` fallback.
- Enforced maximum dimension and decoded pixel-area limits on every successful GPU path.
- Intersected profile limits with the WebGL hardware ceiling.
- Added resized `ImageBitmap` decoding with a bounded canvas compatibility path.
- Added stable asset/configuration cache keys and reference-counted texture sharing.
- Added deterministic release on layer hiding/deletion, profile changes, 2D fallback, route navigation, failures, timeouts, and cancellation.
- Prevented stale asynchronous decodes from installing resources.
- Added lifecycle diagnostics, focused unit tests, repeated-cycle browser tests, large transparent artwork coverage, and slow-decode route cancellation.

Detailed validation: `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md`.

## Phase P6.5 — Runtime-performance CI gates

### Goal

Convert the repaired source architecture into measured production-runtime release requirements.

### Work

- Add a production Playwright performance configuration.
- Add test-only or near-zero-cost counters for:
  - React editor commits
  - Completed gestures
  - Durable save operations
  - WebGL invalidations and rendered frames
  - Long tasks and large frame gaps
  - Texture loads, creations, replacements, cancellations, and disposals
- Measure:
  - Homepage startup and navigation
  - Draft restoration
  - Long move and resize/rotate gestures
  - Visible idle editor
  - Hidden and restored document
  - Constrained-device profile
  - Large transparent artwork
  - Duplicate layers
  - Repeated upload/delete cycles
  - 3D fallback and retry
- Add `src/config/runtime-performance-budgets.json`.
- Use tolerant medians or percentiles for timing assertions.
- Keep hardware-independent count assertions strict.
- Keep existing bundle budgets unchanged.

### Acceptance criteria

- Performance journeys run against the production build.
- One gesture produces one durable commit and one save cycle.
- A visible idle editor produces no continuous frame stream.
- A hidden editor produces no frames.
- Constrained-device journeys remain usable under controlled throttling.
- Texture and memory counters return to baseline after repeated cycles.
- Runtime-budget violations fail CI.

## Phase P6.6 — Repository and release hygiene

### Goal

Reconcile the repository once runtime performance is fully validated.

### Work

- Correct package and release version claims.
- Update README branch documentation.
- Reconcile test counts and validation claims.
- Add runtime troubleshooting guidance.
- Record final measured budgets and fallback behavior.
- Confirm no deployment target depends on obsolete phase branches.
- Remove or archive superseded branches only after deployment verification.
- Complete final P6 exit checks before marking PR #6 ready.

## Final P6 definition of done

P6 is complete only when:

```bash
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

all pass without weakening tests or budgets, the production runtime journeys satisfy committed limits, documentation and versioning are reconciled, and PR #6 contains no unresolved stabilization work.
