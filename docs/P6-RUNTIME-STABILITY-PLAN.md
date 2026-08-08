# P6 — Runtime stability and interaction performance

## Status

Planning baseline created on `agent/p6-runtime-stability`, branched from the authoritative `main` branch.

P6 addresses the runtime defects discovered after the P0–P5 merge: the unreliable custom cursor, artificial startup delay, excessive decorative compositing, route-transition instability, editor rerender pressure, continuous WebGL work, unsafe texture fallback behavior, and the absence of runtime-performance regression gates.

Implementation has not started yet. This document defines the order, boundaries, acceptance criteria, and validation required before P6 can be considered complete.

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

## Phase P6.0 — Reproducible baseline and instrumentation

### Goal

Create a repeatable baseline before changing behavior, then retain enough lightweight instrumentation to prevent regressions.

### Work

- Record the current production-build behavior for:
  - First interaction on the homepage
  - Homepage scroll and pointer movement
  - Home → Catalog → Guide route transitions
  - Catalog → Studio loading
  - Three-second artwork move gesture
  - Three-second resize/rotate gesture
  - Idle editor after all assets settle
  - One large artwork upload
  - Duplicate artwork layers
  - Repeated add/remove artwork cycles
- Add test-only runtime counters for:
  - Animation-frame intervals
  - Long tasks where Chromium exposes the Long Tasks API
  - Route-transition start and settled state
  - Editor logical commits per gesture
  - Editor save scheduling per gesture
  - WebGL frame invalidations and rendered frames
  - Created, shared, and disposed artwork textures
- Keep instrumentation excluded from ordinary production behavior unless it is effectively free and useful for diagnostics.
- Add `src/config/runtime-performance-budgets.json` once the baseline is captured.
- Document hardware-independent assertions separately from timing assertions so CI noise does not make the suite unreliable.

### Acceptance criteria

- Baseline results are committed or summarized in the P6 document before thresholds are finalized.
- Tests can distinguish one logical editor commit from many pointer-move updates.
- Tests can prove whether the editor continues rendering while idle.
- Runtime budgets use medians or tolerant percentiles over repeated samples instead of one fragile timing sample.

## Phase P6.1 — Immediate shell and navigation stabilization

### Goal

Remove the effects that make the whole application feel slow or unreliable before changing the editor architecture.

### Work

#### Native cursor restoration

- Remove `<Cursor />` from the application shell.
- Delete the global `cursor: none` rules.
- Remove `Cursor.tsx` and its tests or replace them with a native-cursor regression test.
- Verify pointer, text, resize, disabled, and form-control cursors remain browser-native.
- Preserve keyboard focus visibility.

#### Blocking startup removal

- Remove the full-screen preloader from the normal render path.
- Do not replace it with another artificial timer.
- Use existing route-level Suspense/loading states only when actual code or data is pending.
- Ensure the homepage is focusable and interactive immediately after React mounts.

#### Noise/compositing cleanup

- Remove the full-screen SVG turbulence filter.
- Do not retain a permanent blend-mode layer over WebGL.
- A future grain texture may only return as a tiny owned raster asset after profiling proves negligible cost; it must be disabled in the Studio, reduced-motion, Save-Data, and constrained rendering modes.

#### Page transition repair

- Make route changes depend only on the stable route path/key.
- Do not trigger exit state because the parent produced a new React child object.
- Replace `transition-all` with explicit opacity and transform properties.
- Ignore transition events from descendants by checking `event.target === event.currentTarget`.
- Handle reduced motion without a delayed invisible state.
- Prevent rapid navigation from leaving stale content mounted or trapping the route in `exit`.

#### Magnetic interaction removal

- Remove the current magnetic wrapper from primary actions.
- Preserve ordinary hover/focus feedback through CSS transforms that do not read layout on every pointer movement.

#### Route-aware effects

- Keep nonessential public-shell decoration outside `/studio/:draftId`.
- Confirm that opening the editor does not retain hidden cursor, noise, preloader, or homepage-only listeners.

### Acceptance criteria

- The browser cursor never disappears unexpectedly.
- The application has no timer-based blocking overlay during startup.
- No full-viewport SVG filter remains mounted.
- Route content transitions exactly once per route change and never because unrelated state rerendered.
- Rapid Back/Forward and header navigation do not flash old content or leave the page transparent.
- Existing accessibility, mobile navigation, Arabic/RTL, and PWA tests continue to pass.

## Phase P6.2 — Editor gesture and state pipeline

### Goal

Make artwork movement, resizing, and rotation responsive by separating high-frequency visual updates from durable React state.

### Target architecture

Use two state layers:

1. **Live gesture state** in refs and Three.js objects for pointer-frequency updates.
2. **Committed editor state** in React/IndexedDB for durable snapshots, undo/redo, controls, and recovery.

### Work

- Create a typed live transform object for the active layer.
- During a gesture:
  - Update the decal/mesh through refs.
  - Batch screen-driven updates to at most one requestAnimationFrame callback.
  - Avoid cloning complete editor snapshots.
  - Avoid replacing the full `decals` array for each pointer event.
  - Avoid restarting the autosave timer for each pointer event.
- On gesture completion:
  - Normalize and clamp the final transform once.
  - Commit one React snapshot.
  - Create one undo history entry.
  - Schedule one debounced durable save.
- On pointer cancellation, route exit, context loss, or component unmount:
  - End or roll back the gesture deterministically.
  - Preserve the last valid committed state.
  - Flush pending durable state through the existing persistence coordinator.
- Keep immediate discrete actions—rename, visibility, order, delete, colour, and size—as normal committed state updates.
- Replace `JSON.stringify` snapshot equality with a typed comparator or stable revision system.
- Clone only the data required for a bounded history entry.
- Audit callback identity and memoization only after the gesture pipeline is corrected; do not use memoization to conceal high-frequency state architecture problems.

### Acceptance criteria

- A move, resize, or rotate gesture creates exactly one undoable history action.
- Pointer movement does not perform one durable React commit per event.
- Autosave does not restart for every pointer event.
- Undo and redo reproduce the exact final transform.
- A failed save retains the pending snapshot and keeps the user on the current route.
- Context loss, pointer cancellation, and route navigation do not leave `isDragging` or gesture refs stuck.
- Arabic language changes do not remount or reset the active editor.

## Phase P6.3 — Demand-driven WebGL and adaptive rendering

### Goal

Stop continuous GPU work and make the 3D editor scale predictably across devices.

### Work

- Use `frameloop="demand"` for every rendering profile.
- Remove permanent idle garment rotation.
- Explicitly invalidate the canvas for:
  - Camera control changes
  - Live gesture frames
  - Committed layer, colour, size, surface, or theme changes
  - Texture readiness
  - Canvas resize
  - WebGL restoration
- Pause all rendering while the document is hidden.
- Consider pausing when the canvas is fully outside the viewport, provided recovery is reliable.
- Rebalance profile defaults:
  - Start desktop at balanced quality unless measured capability justifies high quality.
  - Cap ordinary DPR at 1.5.
  - Avoid 1024 shadow maps as an automatic default.
  - Disable shadows where they do not materially improve print placement.
  - Keep anisotropy proportional to the actual texture and device budget.
- Make rendering capability selection respond to:
  - Viewport and orientation changes
  - Pointer capability changes
  - reduced-motion changes
  - Save-Data changes where available
  - Device-pixel-ratio/display changes where practical
- Apply profile changes without unnecessary draft reloads or scene remounts.
- Preserve WebGL support detection, context-loss recovery, retry, and safe 2D fallback.

### Acceptance criteria

- After the Studio settles, the canvas does not sustain a continuous render loop while idle.
- Camera and artwork interactions still render immediately.
- Hidden-page rendering stops.
- Profile changes do not lose layers, history, selection, or pending saves.
- Low-power mode uses bounded DPR, textures, lighting, and shadows.
- The existing WebGL-loss and 2D-fallback journeys remain passing.

## Phase P6.4 — Bounded artwork decoding, texture sharing, and cleanup

### Goal

Guarantee that uploaded artwork cannot bypass GPU limits and that repeated layers do not leak or duplicate texture memory unnecessarily.

### Work

- Remove the direct original-image `TextureLoader` timeout fallback.
- Ensure every successful path follows:
  1. Decode the browser-local artwork.
  2. Calculate the configured dimension and pixel-area limit.
  3. Resize before texture construction.
  4. Configure colour space, mipmaps, filtering, and anisotropy.
  5. Upload only the bounded result to WebGL.
- Prefer `createImageBitmap` with resize options where supported; retain a canvas-based fallback that obeys the same limits.
- Add a maximum decoded pixel-area guard in addition to per-dimension limits.
- Create a shared texture cache keyed by at least:
  - Artwork asset ID or stable source identity
  - Rendering quality/size limit
  - Colour-space and sampling configuration when relevant
- Reference-count cache entries.
- Dispose a texture only after its final consumer releases it.
- Release cache entries on draft unload, permanent layer deletion, profile replacement, and failed decode.
- Prevent a slow decode from installing a texture after the component/draft was disposed.
- Keep original IndexedDB blobs unchanged; only derived GPU previews are bounded.

### Tests

- Large landscape image
- Large portrait image
- Transparent PNG
- Slow decode/timeout path
- Decode failure
- Duplicate layers using one artwork asset
- Quality-profile change
- Repeated add/remove cycles
- Draft navigation during decode
- WebGL context loss and restoration

### Acceptance criteria

- No GPU texture exceeds `min(profile limit, hardware limit)`.
- No fallback path uploads the original unbounded image.
- Duplicate layers share the same compatible texture.
- Every created owned texture has a deterministic release path.
- Repeated upload/delete cycles do not produce unbounded cache growth.

## Phase P6.5 — Runtime-performance regression gates

### Goal

Turn responsiveness into a maintained quality requirement rather than a one-time manual observation.

### Work

- Add a dedicated Playwright runtime-performance configuration or project.
- Test a production build rather than the development server.
- Run deterministic journeys for:
  - Homepage startup and immediate interaction
  - Homepage scroll
  - Repeated route navigation
  - Studio open and settle
  - Scripted move gesture
  - Scripted resize/rotate gesture
  - Idle Studio rendering
  - Large artwork upload
  - Duplicate layer creation
  - Repeated layer add/remove
- Use Chromium CDP CPU throttling for at least one constrained-device journey where it is stable in CI.
- Sample requestAnimationFrame gaps and long-task duration.
- Expose test-only logical counters for editor commits, saves, render frames, and texture lifecycle.
- Run each noisy timing journey more than once and evaluate median/p95 results.
- Store thresholds in `src/config/runtime-performance-budgets.json` or a dedicated test configuration file.
- Add the runtime journey to CI after the existing validation job.
- Upload the performance report only on failure.

### Initial invariant gates

These are required regardless of final timing numbers:

- Zero artificial preloader delay.
- Zero custom-cursor animation work.
- Zero continuous editor frames after idle settle.
- One history commit per completed continuous gesture.
- No per-pointer-event durable save scheduling.
- No texture above the configured/hardware limit.
- Compatible duplicate layers share one texture entry.
- Route transitions occur once per route change.
- Existing bundle limits are not raised.

### Timing-budget policy

Final absolute thresholds must be selected from the P6.0 production baseline and then tightened after the architectural fixes. Thresholds must be tolerant of normal CI variance but strict enough to catch:

- Main-thread stalls visible to the user
- Multi-hundred-millisecond frame gaps
- Route transitions that fail to settle
- Editor drag regressions
- Continuous idle rendering
- Large-image decode regressions

## Phase P6.6 — Repository and release hygiene

### Goal

Make the repository accurately describe the consolidated application and its validated state.

### Work

- Update the README and roadmap to state that `main` contains P0–P5 and P6 is the only active development branch.
- Remove the obsolete active stacked-branch diagram.
- Reconcile hard-coded test counts with actual command output, or remove counts that are likely to become stale.
- Align `package.json` versioning with the next validated release only when P6 is complete.
- Document the new runtime budgets and commands.
- Add troubleshooting guidance for:
  - Reduced-motion behavior
  - 2D fallback
  - Context loss
  - Large artwork
  - Performance test failures
- Review obsolete merged branches for deletion after confirming no deployment target references them. Branch deletion is a repository-maintenance decision and is not required for the P6 code merge.

### Acceptance criteria

- Documentation matches the actual branch and release state.
- Validation counts or claims are generated from current results or intentionally omitted.
- Runtime-performance commands are documented alongside existing checks.
- No deployment or README instruction points developers to an obsolete phase branch.

## Validation matrix

P6 must cover the following combinations where relevant:

| Dimension | Required coverage |
| --- | --- |
| Pointer | Fine pointer/mouse and coarse pointer/touch |
| Motion | Normal motion and `prefers-reduced-motion: reduce` |
| Language | English/LTR and Iraqi Arabic/RTL |
| Viewport | Desktop, Pixel 5-sized phone, iPhone 13-sized phone, iPad Mini-sized tablet, short landscape |
| Renderer | WebGL 2, WebGL unavailable, context lost, safe 2D fallback |
| Quality | High-capability desktop, balanced device, constrained/save-data profile |
| Artwork | Small, large, transparent, failed decode, duplicate layers |
| Navigation | Header navigation, browser Back/Forward, route change with pending save |
| Lifecycle | Visible, hidden, pagehide, unmount during decode/gesture |

## Required commands before completion

The final branch must pass:

```bash
npm ci --include=dev --no-audit --no-fund
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

`test:performance` will be added during P6.5. Existing validation remains mandatory throughout implementation.

## Definition of done

P6 is complete only when all of the following are true:

- The native cursor is restored and the current custom cursor is removed.
- The application no longer blocks startup with an artificial preloader.
- The full-screen SVG turbulence layer is removed.
- Page transitions are route-keyed, reduced-motion-safe, and immune to descendant transition events.
- The magnetic pointer effect no longer performs layout work on every mouse movement.
- Editor gestures use a live ref/rAF path and produce one durable commit/history entry per gesture.
- Undo/redo no longer depends on serializing complete snapshots for every equality check.
- The WebGL canvas uses demand rendering and becomes idle after settling.
- Rendering profiles react safely to meaningful environment changes.
- Every artwork decode path enforces dimension and pixel-area limits before GPU upload.
- Compatible duplicate layers share textures and all owned textures have deterministic cleanup.
- Runtime-performance budgets are committed and enforced in CI.
- Existing bundle budgets are preserved or tightened.
- Existing accessibility, localization, persistence, WebGL recovery, PWA, and browser journeys pass.
- README, roadmap, release status, and troubleshooting documentation reflect the actual repository state.

## Implementation order

Execute the work in this order:

1. P6.0 baseline and instrumentation
2. P6.1 shell and navigation stabilization
3. P6.2 editor gesture/state pipeline
4. P6.3 demand-driven WebGL
5. P6.4 bounded texture lifecycle
6. P6.5 runtime-performance CI gates
7. P6.6 repository and release hygiene

Do not begin new visual features until this sequence is complete and validated.
