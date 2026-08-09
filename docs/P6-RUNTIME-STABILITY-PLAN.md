# P6 — Runtime stability and interaction performance

## Status

    P6.1 through P6.6 are complete, validated, and merged into `main`.

    The clean automated exit suite passed on the reconciled implementation head:

    ```text
    0cbd21ab9c264072f8497ece9e14c25f78fc9aa0
    fix: separate CI validation from provider builds
    ```

    Validated GitHub Actions run:

    ```text
    31308581420
    ```

    Vercel and Netlify pull-request previews completed successfully on that head. PR #6 was subsequently squash-merged into `main` as `03d78a08febd8428555d6f1b657848f2a520eddc`.

    The final repository state is:

    ```text
    main
    ```

    PRs #1–#6 are merged, and all superseded phase branches were deleted. Merged pull requests and validation documents preserve the history.

## Product boundary

P6 stabilizes the existing frontend and browser-local product. It does not add:

- a backend or production database,
- accounts or cross-device synchronization,
- remote artwork storage,
- inventory or payment processing,
- real order acceptance, tracking, or fulfillment,
- analytics collection,
- new garment geometry,
- physical print calibration,
- or new marketing scope.

## Non-negotiable rules

- Do not hide failures by skipping tests.
- Do not raise JavaScript, CSS, image, GPU, or runtime budgets merely to make a check pass.
- Do not disable React Strict Mode as a workaround.
- Do not weaken IndexedDB recovery, Undo/Redo, accessibility, Iraqi Arabic/RTL, safe 2D fallback, WebGL recovery, or PWA behavior.
- Runtime instrumentation must remain disabled by default, aggregate-only, and free of artwork or customer data.
- Keep future maintenance isolated on one branch created from `main`.

## Issue inventory and final disposition

| ID    | Area          | Original problem                                                            | Disposition                     |
| ----- | ------------- | --------------------------------------------------------------------------- | ------------------------------- |
| P6-01 | Cursor        | Native cursor was hidden while a custom cursor ran on pointer movement.     | Complete in P6.1.               |
| P6-02 | Startup       | An artificial full-screen preloader blocked access.                         | Complete in P6.1.               |
| P6-03 | Paint         | Permanent full-screen SVG turbulence remained mounted.                      | Complete in P6.1.               |
| P6-04 | Navigation    | Route transitions depended on unstable child identity and bubbled events.   | Complete in P6.1.               |
| P6-05 | Homepage      | Magnetic interaction performed layout work during pointer movement.         | Complete in P6.1.               |
| P6-06 | Route shell   | Decorative work remained in the performance-sensitive editor route.         | Complete in P6.1.               |
| P6-07 | Editor        | Pointer movement cloned durable snapshots and rerendered the editor.        | Complete in P6.2.               |
| P6-08 | History       | Snapshot equality serialized complete editor state.                         | Complete in P6.2.               |
| P6-09 | WebGL         | Continuous rendering, idle animation, DPR 2, and large shadows.             | Complete in P6.3.               |
| P6-10 | Profiles      | Rendering capability selection was frozen at mount.                         | Complete in P6.3.               |
| P6-11 | Artwork       | A fallback could upload an unbounded original image.                        | Complete in P6.4.               |
| P6-12 | GPU memory    | Compatible duplicate layers created duplicate textures.                     | Complete in P6.4.               |
| P6-13 | Quality gates | Bundle checks could not detect idle rendering or commit/save amplification. | Complete in P6.5.               |
| P6-14 | Repository    | Version, branch, deployment, troubleshooting, and release claims disagreed. | Complete and validated in P6.6. |

## P6.1 — Shell and navigation

Completed:

- restored native cursors,
- removed the blocking preloader,
- removed permanent turbulence and layout-reading magnetic behavior,
- rebuilt transitions around stable route keys,
- and added source plus Chromium regression coverage.

## P6.2 — Editor gesture and state pipeline

Completed:

- pointer-frequency transforms stay in refs and Three.js objects,
- one final transform is committed per gesture,
- one history action and one autosave cycle are created,
- typed transform and snapshot equality replace serialization,
- and navigation, cancellation, reload, export, fallback, and recovery remain safe.

Detailed record: `docs/P6-2-EDITOR-GESTURE-VALIDATION.md`.

## P6.3 — Demand-driven WebGL

Completed:

- visible canvases use demand rendering,
- hidden documents stop the frame loop,
- idle garment animation and continuous `useFrame` work are removed,
- meaningful camera, scene, texture, profile, resize, and recovery changes invalidate explicitly,
- profiles are bounded,
- and capability changes react without resetting the draft.

Detailed record: `docs/P6-3-DEMAND-RENDERING-VALIDATION.md`.

## P6.4 — Bounded texture lifecycle

Completed:

- every successful GPU path resizes before upload,
- dimension and decoded-pixel-area budgets apply,
- limits intersect the WebGL hardware ceiling,
- compatible duplicate layers share a reference-counted texture,
- stale results cannot install,
- and every final consumer releases ownership deterministically.

Detailed record: `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md`.

## P6.5 — Production runtime budgets

Completed:

- opt-in route, commit, gesture, save, invalidation, and frame counters,
- save durations and settled milestones,
- Long Tasks API and requestAnimationFrame-gap collection,
- production Vite-preview performance journeys,
- visible-idle and hidden-frame invariants,
- bounded artwork and texture cleanup checks,
- and a 4× CPU-throttled constrained-device journey.

Committed budgets are in `src/config/runtime-performance-budgets.json`.

Detailed record: `docs/P6-5-RUNTIME-PERFORMANCE-VALIDATION.md`.

## P6.6 — Repository and release reconciliation

Completed and validated:

- README reflects the authoritative main-only repository state.
- Historical phase branches are no longer described as an active stack.
- The private `0.4.0` package version is separated from P6 roadmap numbering and checked against the lockfile.
- Living documentation avoids volatile test totals and points to commands as the source of truth.
- Runtime, PWA, performance, and complete exit commands are documented.
- Reduced motion, demand rendering, 2D fallback, WebGL recovery, large artwork, and texture ownership are documented.
- Vercel and Netlify repository configuration is branch-neutral and the required production branch is documented as `main`.
- Provider build commands use the deterministic production build while GitHub CI remains the complete validation gate.
- A permanent repository-reconciliation source gate is part of `npm run check`.
- `npm run verify:p6` defines the final clean exit sequence.
- The clean source/build, functional, PWA, and production-performance jobs passed together.
- Both pull-request preview providers built the reconciled application successfully.

Detailed record: `docs/P6-6-REPOSITORY-RECONCILIATION.md`.

## Version decision

The current package remains private version `0.4.0`.

P0–P6 identifiers describe engineering phases; they are not package semantic versions. The P6 merge does not publish an npm package, create a GitHub release, or by itself approve a production deployment. Package and lockfile versions must match. A future release owner may bump and tag the package only with an approved deployment/domain/business release decision.

## Deployment decision

Repository-controlled Vercel and Netlify files contain no phase-branch dependency. Production must use `main`; PR branches are previews.

The provider Production Branch setting is external to GitHub source. Confirm `main` in both provider dashboards before the merge/release decision. See `docs/DEPLOYMENT.md`.

## Final exit suite

The reconciled head passed the clean-equivalent GitHub Actions jobs for:

```text
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

The local combined command remains:

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:p6
```

GitHub Actions executes the sequence across independent clean checkouts so source/build validation, functional/PWA behavior, and production-performance budgets remain separately visible.

## Engineering definition of done

The P6 engineering definition of done is satisfied:

- P6.1 through P6.6 are implemented and documented,
- all automated jobs pass on the reconciled implementation head,
- documentation and package/deployment claims agree,
- no budget was weakened,
- both pull-request preview deployments build successfully,
- and no unresolved engineering stabilization phase remains.

## Remaining external production checks

    P6 engineering and repository consolidation are complete. Before presenting the application as a production service, still confirm:

    - Vercel Production Branch is `main`,
    - Netlify Production Branch is `main`,
    - no obsolete deploy hook or branch context remains,
    - and the production domain, indexing, business content, and physical-device review are approved.
