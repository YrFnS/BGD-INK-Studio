# P6.4 — Bounded artwork decoding and shared texture lifecycle

## Status

**Complete and validated** on `agent/p6-runtime-stability`.

Validated implementation head:

```text
7ad7533e250f704774a81eb2ea508d302848f968
test: require texture timeout and abort coverage
```

Final implementation CI run:

```text
31302352671
```

P6.4 keeps the existing frontend-only and browser-local product boundary. It does not add a backend, accounts, remote artwork storage, inventory, payment, real order processing, new garment models, or new marketing features.

## Problem addressed

Before P6.4, the normal artwork path resized uploaded images before constructing a GPU texture, but a ten-second timeout or decode failure switched to `THREE.TextureLoader().load(url)`. That fallback could upload the original image directly to WebGL, bypassing the configured profile and hardware texture limits.

Every visible decal also owned its own texture. Duplicating one artwork layer therefore decoded and uploaded another compatible GPU texture, while navigation, profile changes, failed decodes, and stale asynchronous completions relied on component-local cleanup rather than one shared lifecycle owner.

## Implemented texture architecture

### Every successful GPU preview is bounded

The original-image `TextureLoader` fallback is removed.

Every successful path now follows the same sequence:

1. Resolve the active rendering-profile budget.
2. Intersect that budget with `gl.capabilities.maxTextureSize`.
3. Calculate both a maximum dimension and a maximum decoded pixel area.
4. Decode through an abortable operation.
5. Resize before constructing the Three.js texture.
6. Verify the final dimensions against both limits.
7. Construct a bounded `CanvasTexture` with the selected sampling configuration.

Supported browsers first use `createImageBitmap` with explicit `resizeWidth`, `resizeHeight`, and `resizeQuality: "high"`. Browsers that reject or do not expose that path use the ordinary image decoder, but the decoded image is still drawn into the same bounded canvas before GPU upload.

There is no path that turns the original source directly into a WebGL texture.

### Dimension and decoded-pixel budgets

| Rendering profile | Maximum dimension | Maximum decoded pixel area |
| --- | ---: | ---: |
| Low power | 1,024 px | 786,432 pixels |
| Balanced | 1,536 px | 1,572,864 pixels |
| High | 2,048 px | 3,145,728 pixels |

The effective maximum dimension is always:

```text
min(profile limit, WebGL hardware limit)
```

The resize calculation preserves aspect ratio and applies the stricter of the dimension scale and square-root pixel-area scale. Large square artwork can therefore be reduced even when each individual side would otherwise fit the dimension ceiling.

### Stable shared cache identity

Each texture entry is keyed by:

- stable artwork asset identity, with URL identity as the legacy fallback,
- source pixel dimensions,
- effective maximum dimension,
- effective decoded pixel area,
- effective anisotropy,
- colour-space and filter configuration version.

Layers that use the same artwork and compatible rendering configuration acquire one shared texture lease. Duplicating a layer increases the reference count rather than starting another decode or GPU upload.

A rendering-profile change creates a new compatible entry and releases the old one. It does not reset the draft, layer selection, transforms, history, autosave, or IndexedDB state.

### Reference counting and deterministic release

The cache owns each texture resource.

- Every mounted visible decal acquires one lease.
- Hiding or deleting a layer releases its lease.
- Switching to the 2D fallback releases all 3D consumers.
- Changing profile configuration releases the replaced texture.
- Leaving the studio route releases every remaining consumer.
- The final release aborts a pending decode or disposes a ready texture exactly once.
- Repeated add/remove cycles return the cache to zero entries and zero references.

A failed entry is removed so a later acquisition can retry cleanly instead of reusing a permanently rejected promise.

### Cancellation and stale-result protection

Artwork loading is controlled by an `AbortController` and an explicit decode timeout.

Cancellation is propagated for:

- final consumer release,
- component unmount,
- route navigation,
- rendering-profile replacement,
- and external abort requests.

If a browser decode completes after its cache entry was removed or replaced, the late result is closed or disposed and is never installed into the active cache. Timeout failures are reported as a typed `ArtworkTextureLoadError` with code `timeout`; ordinary external cancellation remains an `AbortError`.

## Runtime diagnostics

The cache publishes non-sensitive lifecycle counters for regression and future performance gates:

```text
window.__BGD_INK_TEXTURE_CACHE__
```

The snapshot contains only aggregate resource data:

- entry and reference counts,
- pending and ready counts,
- loads started,
- textures created and disposed,
- failed and cancelled loads,
- and the largest active bounded dimensions and pixel area.

It does not expose artwork bytes, draft contents, file names, customer information, or object URLs.

## Permanent regression coverage

P6.4 adds `scripts/check-texture-lifecycle.mjs` to the normal `npm run check` command.

The gate prevents:

- restoration of the direct `TextureLoader` fallback,
- removal of pixel-area budgets,
- construction of a texture outside the bounded canvas path,
- loss of abort, timeout, or late-result disposal behavior,
- removal of reference counting or final-consumer cleanup,
- stale decode installation,
- loss of stable asset identity in the React hook,
- and removal of focused unit or browser lifecycle coverage.

### Unit coverage

The new tests verify:

- large landscape and portrait fitting,
- square artwork constrained by pixel area,
- no upscaling of already-safe artwork,
- profile and hardware limit intersection,
- one shared texture for compatible duplicate consumers,
- no disposal while another reference remains,
- exactly one disposal after final release,
- pending-decode abort with late-result disposal,
- failed-entry removal and successful retry,
- distinct cache entries for incompatible profile configurations,
- explicit decode timeout behavior,
- and external abort propagation without texture installation.

### Chromium lifecycle coverage

A dedicated browser journey:

1. Generates and uploads a 2,400 × 1,200 transparent PNG.
2. Verifies the low-power preview remains inside both active limits.
3. Duplicates the layer and verifies one cache entry, two references, one load, and one created texture.
4. Changes from low power to balanced and verifies the replaced texture is disposed while both duplicate consumers share the new entry.
5. Removes both layers and verifies zero entries and references.
6. Repeats add/remove cycles and verifies created and disposed counts converge.
7. Starts an intentionally slow decode, navigates to the Guide route, and verifies the pending entry is cancelled and removed.

The existing rendering-resilience journey continues to cover WebGL context loss, safe 2D fallback, retry, autosave, and draft recovery.

## Validation

Final CI run `31302352671` passed both jobs.

```text
97 unit/component/accessibility tests across 34 files
16 desktop, phone, tablet, Arabic, editor, recovery, export, runtime-shell,
gesture, rendering-resilience, adaptive-profile, and texture-lifecycle Chromium journeys
1 production-only PWA Chromium journey
strict TypeScript
zero-warning ESLint
brand, architecture, asset, storefront, localization, responsive,
runtime-shell, editor-gesture, demand-rendering, texture-lifecycle,
bundle, and delivery gates
```

### Production bundle after P6.4

| Metric | P6.4 | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 74.24 KiB | 90 KiB |
| Initial CSS, gzip | 15.77 KiB | 17 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 384.17 KiB | 390 KiB |
| Total JavaScript, raw | 1,333.36 KiB | 1,350 KiB |
| Total CSS, gzip | 15.77 KiB | 17 KiB |

No JavaScript, CSS, image, GPU, or runtime budget was raised for P6.4.

## Acceptance criteria satisfied

- No successful texture path can upload the unbounded original image.
- Both dimension and decoded pixel-area limits are enforced.
- Effective limits respect the WebGL hardware ceiling.
- Compatible duplicate layers share one texture resource.
- Incompatible profile configurations use separate cache entries.
- Pending work is cancelled when the final consumer leaves.
- Stale asynchronous results are disposed rather than installed.
- Ready resources are disposed exactly once after final release.
- Failed loads do not poison later retries.
- Repeated upload/delete cycles do not grow the cache without bound.
- Draft persistence, Undo/Redo, 2D recovery, WebGL recovery, Arabic, and PWA behavior remain validated.

## Remaining P6 work

P6.5 and later phases still need to address:

1. focused render-frame, React-commit, long-task, and save-operation counters,
2. production runtime-performance budgets,
3. constrained-device and idle-render performance journeys,
4. repeated large-artwork memory and timing budgets,
5. final version, roadmap, branch, troubleshooting, validation, and release reconciliation,
6. and final P6 exit validation before PR #6 leaves draft status.
