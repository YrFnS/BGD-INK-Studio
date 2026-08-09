# Troubleshooting

This guide covers the current P6 runtime, persistence, WebGL, artwork, PWA, deployment, and performance boundaries.

## Confirm the pinned environment first

The repository requires:

```text
Node.js 22.23.1
npm 10.9.8
```

Check:

```bash
node --version
npm --version
```

A mismatched runtime can change dependency resolution, native binaries, generated output, and performance measurements.

## Clean installation

Use the committed lockfile:

```bash
rm -rf node_modules
npm ci --include=dev --no-audit --no-fund
```

Do not delete or regenerate `package-lock.json` merely to bypass an installation error. The private package version in `package.json` and `package-lock.json` must remain identical.

## Git LFS or missing garment model

The Classic T-shirt GLB is stored through Git LFS.

```bash
git lfs install
git lfs pull
```

Check that `public/basic_t-shirt.glb` is a real binary and not a small text pointer. `npm run check:assets` rejects unresolved pointers, invalid glTF files, and asset-budget regressions.

## Which validation command should I run?

Source, unit, production build, bundle, and repository gates:

```bash
npm run check
```

Functional Chromium journeys:

```bash
npm run test:e2e
```

Production PWA journey:

```bash
npm run test:pwa
```

Production runtime-performance suite:

```bash
npm run test:performance
```

Complete clean P6 exit suite:

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:p6
```

## Repository reconciliation fails

Run:

```bash
npm run check:repository
```

This gate checks:

- package and lockfile name/version consistency,
- the private-package release policy,
- current branch and deployment documentation,
- the absence of the obsolete active branch stack,
- Vercel and Netlify branch-neutral configuration,
- runtime-performance and final-exit commands,
- and required P6 troubleshooting coverage.

Fix the stale source or documentation. Do not weaken the gate to preserve an obsolete claim.

## Drafts appear missing

Drafts are browser-local IndexedDB data.

Check:

1. The same browser profile is open.
2. Private/incognito mode was not used.
3. Site storage was not cleared.
4. The deployment origin or domain did not change.
5. Browser storage permission is available.
6. The application is not open from a different preview URL.

Drafts do not synchronize across devices or domains.

The current persisted **Draft schema version is 6**. Older local records are normalized when loaded. A schema number is not the same as the package version.

## A change did not save

The editor serializes durable saves and retains a failed pending snapshot for retry.

Try:

1. Stay on the current route.
2. Wait for the saved status.
3. Retry the action.
4. Check browser storage quota and IndexedDB availability.
5. Close duplicate tabs if a database upgrade is blocked.
6. Inspect the browser console for `DraftStorageError` codes.

Internal navigation is blocked when a required flush fails so the latest edit is not silently discarded.

## Undo or Redo looks wrong

One continuous move, resize, or rotation gesture should create one history action. Pointer-frequency previews do not enter durable history.

Run:

```bash
npm run check:editor-gesture
npm run test:e2e
```

Do not move live pointer updates back into the full React snapshot path.

## Reduced motion changes the experience

`prefers-reduced-motion: reduce` intentionally removes or shortens nonessential motion and selects a lower-cost rendering profile where appropriate. It must not remove functionality, reset the draft, or disable recovery.

Test in browser developer tools or with Playwright media emulation. Keep technical controls and route changes usable without animation.

## The 3D preview is idle

This is expected. The canvas uses demand rendering:

- visible Studio: `frameloop="demand"`,
- hidden document: `frameloop="never"`.

Frames are requested only for camera movement, artwork transforms, texture readiness, renderer/profile changes, resize, and recovery. A stationary garment should not continuously animate.

Run:

```bash
npm run check:demand-rendering
npm run test:performance
```

Do not restore a permanent idle rotation or continuous `useFrame` loop.

## WebGL is unavailable or the context is lost

The Studio switches to the safe 2D fallback and preserves the local draft.

Try:

1. Keep the current page open until the saved state is visible.
2. Close other GPU-heavy tabs or applications.
3. Update the browser and graphics driver.
4. Re-enable hardware acceleration if organizational policy allows it.
5. Use **Try 3D again** after the graphics context recovers.
6. Continue in 2D when 3D remains unavailable.

A WebGL failure must not delete artwork, history, placement, or IndexedDB data.

## The garment model fails but WebGL works

The model error boundary presents the procedural or 2D fallback. Confirm:

- Git LFS completed,
- `public/basic_t-shirt.glb` passes `npm run check:assets`,
- the configured mesh name still exists,
- and the deployed static asset is served with a successful response.

Do not silently substitute one garment’s GLB for another product.

## Large artwork is slow

All successful GPU previews are resized before upload. The effective maximum is the smaller of the rendering-profile limit and the browser’s WebGL texture limit.

| Profile | Maximum dimension | Maximum decoded pixel area |
| --- | ---: | ---: |
| Low power | 1,024 px | 786,432 pixels |
| Balanced | 1,536 px | 1,572,864 pixels |
| High capability | 2,048 px | 3,145,728 pixels |

The pixel-area limit matters for large square images even when each side is below the dimension ceiling.

Recommended source preparation:

- crop unnecessary transparent padding,
- avoid extremely large camera originals,
- use PNG for transparency,
- use JPEG or WebP for opaque photographic artwork,
- and keep the upload at or below the application’s file-size validation limit.

Run:

```bash
npm run check:texture-lifecycle
npm run test:performance
```

Never reintroduce a direct original-image `TextureLoader` fallback.

## Duplicate artwork consumes extra GPU memory

Compatible duplicates should share one reference-counted texture. Different rendering profiles may use separate bounded entries when their limits differ.

The cache must return to zero references after every final consumer is hidden, deleted, replaced, switched to 2D, or unmounted.

Debug/test snapshots are aggregate-only:

```text
window.__BGD_INK_TEXTURE_CACHE__
```

They must not expose artwork bytes, names, URLs, or customer data.

## Runtime-performance tests fail

The performance suite builds and serves production output, runs serially, blocks service workers, and uses the repository-pinned Chromium.

Common causes:

- another process is saturating CPU,
- a development server is already using the performance port,
- Chromium is missing,
- a service worker was accidentally allowed,
- a route no longer exposes a stable settled boundary,
- a gesture causes multiple durable commits or saves,
- demand rendering was replaced with a continuous loop,
- texture cleanup no longer reaches zero,
- or artwork decoding bypasses the bounded path.

Install Chromium:

```bash
npx playwright install --with-deps chromium
```

Run only the production suite:

```bash
npm run test:performance
```

Review the Playwright trace/report on failure. **Do not raise a runtime budget simply to make CI green.** Confirm the regression, fix the source, then rerun.

## Bundle budget fails

Run:

```bash
npm run build
npm run check:bundle
```

Prefer:

- removing unused code,
- preserving route-level lazy loading,
- keeping Three.js outside the initial storefront,
- and avoiding duplicate dependencies.

Do not raise JavaScript or CSS limits without a reviewed product reason and measured evidence.

## PWA journey fails

Run:

```bash
npx playwright install --with-deps chromium
npm run test:pwa
```

The PWA test builds production output and checks a controlled offline shell. It does not promise that unvisited routes, uncached artwork, or remote services work offline.

If an update is waiting, the application requires explicit user confirmation before activating it.

## Direct routes return 404 after deployment

The host must return `index.html` for client-side routes.

Repository controls:

- Netlify: `public/_redirects` and `netlify.toml`.
- Vercel: `vercel.json`.

The production output directory is `dist`.

## Deployment uses the wrong branch

The required production branch is `main`. `agent/p6-runtime-stability` is a pull-request preview branch until approved and merged. Historical phase branches must not be production or build-hook targets.

Repository configuration is branch-neutral, but provider production-branch selection lives in the external dashboards. Confirm it directly in both Vercel and Netlify before a production release. See `docs/DEPLOYMENT.md`.

## Preview pages are unexpectedly indexable

Preview builds should remain `noindex`.

Indexing requires both:

```text
VITE_PUBLIC_SITE_URL=https://verified.example
VITE_INDEXABLE_BUILD=true
```

Set those only in the approved production environment. Do not set them globally for preview contexts.

## Final exit suite fails after documentation changes

P6 is not complete on a branch head until the clean suite passes:

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:p6
```

The GitHub Actions jobs split that suite across clean checkouts. Review all three jobs, not only the source-validation job.
