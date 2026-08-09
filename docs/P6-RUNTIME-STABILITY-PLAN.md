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

- Remove `<Preloader />` from the normal application shell.
- Delete the artificial multi-stage startup timeline.
- Keep route content immediately interactive after React mounts.
- If a one-time brand reveal is retained later, it must be non-blocking, session-scoped, reduced-motion aware, and measured separately.

#### Full-screen noise removal

- Remove `<Noise />` from the shell.
- Delete the viewport-sized animated SVG turbulence filter and overlay blend layer.
- Do not replace it in P6.

#### Magnetic CTA removal

- Replace `Magnetic` with a layout-only wrapper or remove the wrapper entirely.
- Keep CSS hover and focus feedback.
- Remove every `mousemove`, `getBoundingClientRect`, and animation write from the CTA path.

#### Route-aware shell boundary

- Verify no decorative shell effect is mounted inside `/studio/:draftId`.
- Keep only required navigation, toast, PWA, and page content infrastructure globally mounted.

#### Page transition repair

- Transition only when the stable route key changes.
- Do not store or render stale `children` snapshots.
- Replace `transition-all` with explicit opacity and transform properties.
- Ignore descendant transition events.
- Respect reduced motion.
- Keep browser Back/Forward navigation deterministic.

### Acceptance criteria

- Native cursor is visible over links, buttons, fields, selects, text areas, and canvas-adjacent controls.
- No artificial full-screen startup gate remains.
- No animated viewport-sized SVG filter remains.
- Homepage pointer movement performs no layout reads for primary actions.
- Same-route rerenders do not start route transitions.
- Exactly one current route container exists after navigation.
- Browser Back/Forward preserves the correct route and content.
- Reduced-motion users receive no route-transition delay.

## Phase P6.2 — Editor gesture and state pipeline

### Goal

Separate high-frequency visual transforms from durable editor state, history, and persistence.

### Work

#### Two-layer editor state

Maintain two explicit layers:

1. **Live gesture state**
   - Mutable refs or Three.js object state
   - Position, scale, and rotation only
   - Updated during pointer movement
   - No history or persistence side effects
2. **Committed editor state**
   - React state and `DecalLayer[]`
   - Updated once when a logical action finishes
   - Drives history, autosave, export, checkout, and recovery

#### Gesture lifecycle

- Add explicit begin, update, commit, and cancel paths.
- Capture the initial transform once at gesture start.
- Update the selected Three.js decal imperatively during movement.
- Invalidate at most once per animation frame.
- Commit one normalized final transform on pointer-up.
- Treat pointer cancellation, lost capture, mode changes, active-layer changes, visibility changes, route changes, and unmount as explicit commit or rollback decisions.
- Keep multi-pointer resize and rotation coherent as the pointer count changes.

#### Slider lifecycle

- Keep local slider display state during continuous input.
- Commit one editor action on pointer-up, keyboard completion, or blur.
- Preserve accessible live values without rerendering the full customizer per input event.

#### History and cloning

- Remove `JSON.stringify` snapshot equality.
- Add typed equality for editor snapshots and decal layers, or introduce revision IDs.
- Clone only when creating a durable history entry.
- Keep one history entry per logical gesture.
- Preserve the history limit.

#### Persistence

- Autosave only committed state.
- Do not restart the autosave timer during every pointer move.
- Flush an active gesture before navigation or checkout.
- Failed writes must preserve the latest committed pending snapshot for retry.

### Acceptance criteria

- Pointer movement does not call React state setters for every transform sample.
- A three-second gesture creates one durable editor commit.
- A three-second gesture creates one undo action.
- A three-second gesture schedules one autosave cycle after commit.
- Undo restores the exact pre-gesture transform.
- Redo restores the exact final transform.
- Route navigation during a gesture does not lose the final intended state or persist an unbounded update stream.
- Existing layer rename, visibility, order, duplication, removal, export, and checkout behavior remains correct.

## Phase P6.3 — Demand-driven WebGL and adaptive rendering

### Goal

Stop rendering identical frames while the editor is idle and reduce default GPU pressure.

### Work

#### Demand rendering

- Use `frameloop="demand"` for every visible 3D profile.
- Use `frameloop="never"` when the document is hidden.
- Remove permanent garment idle rotation.
- Request frames only for:
  - Camera interaction and damping
  - Live artwork transform changes
  - Committed editor changes
  - Colour, surface, theme, and layer changes
  - Texture readiness
  - Canvas resize
  - Profile changes
  - WebGL restoration

#### Rendering profile rebalance

- Start ordinary capable desktops at balanced quality.
- Cap ordinary DPR below the old value of 2.
- Disable shadows by default unless profiling proves they fit the target budget.
- Reduce shadow-map size and anisotropy.
- Keep antialiasing and power preference profile-dependent.
- Preserve the low-power profile for constrained devices.

#### Reactive capabilities

- Recalculate profile inputs after:
  - Viewport resize
  - Orientation change
  - Pointer capability change
  - Reduced-motion change
  - Save-Data change where available
  - Display DPR change where detectable
  - Page visibility restoration
- Apply mutable renderer settings in place where safe.
- Do not reset the current draft, active layer, history, or pending save state when the profile changes.

### Acceptance criteria

- A visible idle editor does not render continuously.
- A hidden document renders no frames.
- Camera movement remains smooth and complete.
- Live artwork movement still receives a frame for every scheduled visual update.
- Texture readiness and profile changes become visible without manual interaction.
- Ordinary devices use bounded DPR and no automatic high-cost shadow profile.
- Rendering-profile changes do not lose draft state.
- WebGL context loss still moves safely to the 2D fallback, and retry still works.

## Phase P6.4 — Texture memory and artwork decoding

### Goal

Guarantee bounded GPU texture uploads, share compatible textures, and make resource cleanup deterministic.

### Work

#### Remove the unsafe fallback

- Delete the direct original-image `TextureLoader` fallback.
- Every successful path must:
  1. Decode the source.
  2. Calculate dimension and pixel-area limits.
  3. Resize before texture construction.
  4. Configure and upload only the bounded result.
- Prefer `createImageBitmap` resize options when supported.
- Use a bounded canvas path as the compatibility fallback.

#### Add a pixel-area guard

- Enforce both maximum dimension and maximum decoded pixel area.
- Intersect configured limits with the runtime WebGL maximum texture size.
- Preserve aspect ratio.
- Avoid upscaling artwork that already fits.

#### Shared texture cache

- Key the cache by stable artwork asset identity and effective texture configuration.
- Reuse one texture for duplicate layers with compatible settings.
- Reference-count every consumer.
- Keep source blobs separate from GPU previews.

#### Deterministic cleanup

- Release references when layers hide, delete, switch profile, enter 2D fallback, leave the route, or unmount.
- Abort pending decodes after the final consumer releases.
- Dispose ready resources exactly once after the final release.
- Remove failed entries so later attempts can retry.
- Prevent stale or cancelled asynchronous completions from installing textures.

#### Validation

- Add tests for large landscape, portrait, square, and transparent artwork.
- Add timeout, external abort, failure/retry, duplicate sharing, profile replacement, repeated upload/delete, and route-navigation cancellation coverage.
- Keep WebGL context-loss and safe 2D recovery coverage active.
- Add a permanent texture-lifecycle source gate.

### Acceptance criteria

- No path can upload the unbounded original image to WebGL.
- Every active texture satisfies both dimension and decoded pixel-area limits.
- Effective limits respect the runtime WebGL hardware ceiling.
- Compatible duplicate layers share one texture.
- Pending work is cancelled after final release.
- Stale results are disposed rather than installed.
- Ready textures are disposed exactly once after final release.
- Repeated add/remove cycles return the cache to baseline.
- Failed loads do not poison later retries.

### Status

Complete and validated. See `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md`.

## Phase P6.5 — Runtime-performance CI gates

### Goal

Convert the repaired source architecture into measured production-runtime release requirements.

### Work

- Add a production Playwright performance configuration.
- Add counters for:
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
