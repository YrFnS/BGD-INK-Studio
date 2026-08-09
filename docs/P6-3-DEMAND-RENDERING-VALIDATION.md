# P6.3 — Demand-driven WebGL and adaptive rendering

## Status

**Complete and validated** on `agent/p6-runtime-stability`.

Validated implementation head:

```text
96ec05bd18f0de71a5bbbf25aeebe41ed56bf57b
test: fix visibility assertion ordering
```

P6.3 keeps the existing frontend-only and browser-local product boundary. It does not add a backend, accounts, remote artwork storage, inventory, payment, real order processing, new garment models, or new marketing features.

## Problem addressed

Before P6.3, the high rendering profile selected a continuous WebGL frame loop and permanent garment rotation. It also allowed device-pixel ratio 2, a 1024-pixel shadow map, high anisotropy, antialiasing, and shadows as an automatic desktop default.

Rendering capabilities were selected once when the customizer mounted. Changes to viewport size, orientation, reduced-motion preference, pointer capability, display scale, or Save-Data did not update the active profile.

This meant the editor could continue consuming GPU resources while visually idle and could retain an unsuitable profile after the environment changed.

## Implemented rendering architecture

### Demand-only visible rendering

The 3D canvas now uses:

```tsx
frameloop={isPageVisible ? 'demand' : 'never'}
```

A visible editor renders only after an explicit invalidation. A hidden document stops the React Three Fiber loop entirely.

The permanent idle garment rotation and its `useFrame` callback were removed. No rendering profile can restore a continuous `always` loop.

### Explicit invalidation boundaries

Frames are requested only for meaningful visual changes:

- Camera position and selected print-surface changes
- Orbit-control start, change, damping, and end events
- Live artwork movement, resizing, and rotation
- Committed layer, visibility, order, active-layer, colour, and theme changes
- Artwork texture readiness
- Canvas size changes
- Device-pixel-ratio and rendering-profile changes
- Shadow configuration changes
- WebGL context restoration
- Returning to a visible document

The existing P6.2 imperative artwork-transform path continues to update the matching Three.js object directly and then invalidates one demand frame.

### Hidden-document suspension

`visibilitychange` now controls the canvas frame-loop mode. Hidden documents use `never`; returning to the page refreshes the rendering environment and requests the required visible frame without resetting editor state.

## Rebalanced rendering profiles

P6.3 removes DPR 2 and 1024 shadow maps from all profiles.

| Profile | Selection boundary | Maximum DPR | Shadows | Shadow map | Anisotropy |
| --- | --- | ---: | --- | ---: | ---: |
| Low | Save-Data, reduced motion, compact viewport, two or fewer logical cores, or 2 GB-or-less reported memory | 1 | Off | 256 | 2 |
| Balanced | Ordinary desktop, tablet, touch-first, and mid-range conditions | 1.25 | Off | 256 | 4 |
| High | Fine pointer, large desktop viewport, at least 12 logical cores, and sufficient reported memory | 1.5 | On | 512 | 8 |

The ordinary capable desktop now starts at **balanced**, not high. High quality is reserved for measured high-capability desktop conditions.

The WebGL context itself remains stable while the active profile changes. Mutable renderer settings such as DPR and shadow behavior are updated in place, preserving the draft, active layer, history, live editor selection, and pending persistence state.

## Reactive rendering environment

The rendering profile now responds to:

- Window and visual-viewport resize
- Orientation changes
- Fine/coarse pointer media-query changes
- `prefers-reduced-motion` changes
- Save-Data connection changes where the browser exposes them
- Device-pixel-ratio/display changes through a rebound resolution media query
- Page restore through `pageshow`
- Visibility restoration

Rapid environment events are batched through one animation-frame refresh. Capability snapshots use typed equality so equivalent readings do not cause unnecessary React updates.

## Permanent regression coverage

P6.3 adds `scripts/check-demand-rendering.mjs` to the normal `npm run check` command.

The gate prevents:

- `frameloop="always"`
- `useFrame`-driven idle animation
- restoration of the removed `idleAnimation` profile field
- DPR 2 profiles
- 1024 shadow maps
- missing camera-control invalidation
- missing texture-readiness invalidation
- non-reactive viewport, pointer, reduced-motion, DPR, Save-Data, or visibility handling
- removal of the browser-observable adaptive quality state

A dedicated Chromium journey changes the environment through:

```text
low → balanced → high → low
```

It verifies that the profile changes in place while preserving:

- the uploaded artwork layer,
- the active-layer name,
- the committed artwork transform,
- autosave completion,
- and IndexedDB recovery after reload.

## Validation

Final CI run `31300205656` passed both jobs.

```text
89 unit/component/accessibility tests across 32 files
14 desktop, phone, tablet, Arabic, editor, recovery, export, runtime-shell,
gesture, rendering-resilience, and adaptive-profile Chromium journeys
1 production-only PWA Chromium journey
strict TypeScript
zero-warning ESLint
brand, architecture, asset, storefront, localization, responsive,
runtime-shell, editor-gesture, demand-rendering, bundle, and delivery gates
```

### Production bundle after P6.3

| Metric | P6.3 | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 74.25 KiB | 90 KiB |
| Initial CSS, gzip | 15.77 KiB | 17 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 382.29 KiB | 390 KiB |
| Total JavaScript, raw | 1,327.52 KiB | 1,350 KiB |
| Total CSS, gzip | 15.77 KiB | 17 KiB |

No JavaScript, CSS, image, GPU, or runtime budget was raised for P6.3.

## Acceptance criteria satisfied

- Every visible 3D profile uses demand rendering.
- Hidden documents stop the canvas frame loop.
- Permanent idle garment rotation is removed.
- Camera and artwork interactions explicitly request frames.
- Texture readiness, resizing, profile changes, and context restoration request frames.
- Ordinary devices use bounded DPR and no automatic shadows.
- High quality is capped at DPR 1.5 and a 512 shadow map.
- Rendering profiles react to meaningful environment changes.
- Profile transitions do not reset layers, selection, history, transforms, or persistence.
- Existing WebGL-loss and safe 2D-fallback behavior remains validated.

## Remaining P6 work

P6.4 and later phases still need to address:

1. removing the original-image WebGL texture fallback,
2. enforcing dimension and decoded pixel-area limits on every artwork path,
3. adding a shared reference-counted texture cache,
4. deterministic texture release and stale-decode cancellation,
5. dedicated runtime counters and production performance budgets,
6. constrained-device timing journeys,
7. and final repository, release, roadmap, branch, and troubleshooting reconciliation.
