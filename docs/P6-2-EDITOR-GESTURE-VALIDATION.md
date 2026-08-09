# P6.2 — Editor gesture and state pipeline

## Status

**Complete and validated** on `agent/p6-runtime-stability`.

Validated implementation commit:

```text
701b74f3b5a9846a7472464a47010e9fbfd13607
P6.2: commit editor gestures once
```

P6.2 keeps the existing frontend-only and browser-local product boundary. It does not add a backend, accounts, remote artwork storage, inventory, payment, real order processing, or new garment models.

## Problem addressed

Before P6.2, every pointer-frequency artwork movement, resize, or rotation flowed through durable React editor state. Each update could:

- clone the current editor snapshot,
- map and replace the complete decal array,
- update several React states,
- rerender the customizer tree,
- restart the autosave effect,
- and repeat typed history work before the gesture was complete.

That architecture made long gestures unnecessarily expensive and coupled visual responsiveness to persistence and undo/redo bookkeeping.

## Implemented architecture

P6.2 separates the editor into two state layers.

### Live gesture state

The active artwork gesture stores only a typed transform containing:

- position,
- surface orientation,
- user rotation,
- and scale.

During pointer or range-input movement, that transform stays in refs. The scene exposes an imperative preview boundary, and the matching Three.js decal object is updated directly. The canvas is invalidated without replacing the durable React decal collection.

### Committed editor state

When the pointer, keyboard gesture, cancellation path, blur, navigation flush, or persistence flush completes the gesture, the final normalized transform is committed once to React state.

That single commit:

- updates the active layer once,
- creates one undo/redo history action,
- schedules one durable autosave cycle,
- and remains recoverable through the existing IndexedDB and navigation-flush pipeline.

## Main changes

- Added `decalTransform.ts` as the shared typed transform boundary.
- Added typed transform equality instead of serialized comparison.
- Centralized transform normalization, surface clamping, immutable layer application, and imperative Three.js application.
- Added an imperative `SceneHandle.previewDecalTransform` boundary.
- Added per-layer Three.js mesh references in `ShirtModel`.
- Removed the pointer-frequency `applyLiveEditorChange` snapshot path.
- Replaced the full-snapshot gesture-start reference with a lightweight active-layer transform reference.
- Made artwork width and rotation range inputs locally responsive with `defaultValue` and `onInput`.
- Kept finalization on pointer-up, pointer-cancel, keyboard completion, blur, route flushing, and persistence flushing.
- Prevented the final gesture commit from causing a duplicate autosave schedule.
- Replaced `JSON.stringify` editor-history equality with typed field comparison.

## Safety and recovery behavior retained

- One continuous move, resize, or rotate gesture creates one undo action.
- Undo restores the exact committed pre-gesture transform.
- Redo restores the exact committed final transform.
- A pending gesture is committed before navigation or persistence flushing.
- Failed writes retain their pending snapshot through the existing persistence coordinator.
- Artwork placement remains constrained to the configured print surface.
- WebGL context recovery and the safe 2D fallback remain intact.
- Language changes do not reset the active editor.
- Original artwork blobs remain browser-local and separate from GPU previews.

## Permanent regression coverage

P6.2 adds:

- transform normalization and immutable-commit unit tests,
- typed transform equality tests,
- typed editor-snapshot equality coverage,
- a permanent `check:editor-gesture` source gate,
- and a Chromium journey that emits several `input` events inside one pointer gesture, then verifies Undo, Redo, autosave, reload, and IndexedDB recovery.

The source gate prevents the removed pointer-frequency durable-state path, controlled continuous range inputs, serialized history equality, and missing imperative scene boundary from returning.

## Validation

The guarded migration applied the refactor only after the complete repository suite passed:

```text
87 unit/component/accessibility tests across 32 files
13 desktop, phone, tablet, Arabic, editor, recovery, export, runtime-shell, and gesture Chromium journeys
1 production-only PWA Chromium journey
strict TypeScript
zero-warning ESLint
brand, architecture, asset, storefront, localization, responsive, runtime-shell, editor-gesture, bundle, and delivery gates
```

No JavaScript, CSS, image, GPU, or runtime budget was raised for P6.2.

## Remaining P6 work

P6.3 and later phases still need to address:

1. demand-driven WebGL rendering for every profile,
2. removal of continuous idle GPU work,
3. reactive rendering-profile selection,
4. bounded artwork decoding on every path,
5. shared reference-counted GPU textures,
6. production runtime-performance budgets and dedicated performance journeys,
7. and final repository, release, branch, and documentation reconciliation.
