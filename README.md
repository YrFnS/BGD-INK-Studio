# BGD/INK Studio

BGD/INK Studio is a bilingual, browser-local apparel design prototype for preparing recoverable custom-print drafts. The application combines an editorial storefront, a model-aware 3D customizer, safe 2D recovery, IndexedDB persistence, and local production handoff files without pretending to be a live commerce backend.

## Repository status

The authoritative repository state is:

```text
main
```

- `main` contains the complete merged P0–P6 application.
- PR #6 was squash-merged into `main` as `03d78a08febd8428555d6f1b657848f2a520eddc`.
- All superseded P0–P6 phase branches were deleted after the merge.
- Merged pull requests and validation documents remain the audit record.
- Start future work from `main` on one intentionally named branch.

P6.1 through P6.6 are implemented, validated, merged, and consolidated in `main`.

## Version and release policy

**Current private package version: `0.4.0`.**

The package is private and is not published to npm. P0–P6 are engineering roadmap phases, not semantic-version numbers. P6 does not create a GitHub release or production tag by itself, so the private package version remains `0.4.0` and must match `package-lock.json`.

A version bump and release tag should happen only when a release owner approves the deployment target, verified public domain, indexing state, business information, and merge decision. Preview deployments and a passing pull request are not a production release.

## Product boundary

The current application is intentionally frontend-only and browser-local.

It includes:

- English and Iraqi-Arabic storefront and Studio flows.
- Recoverable IndexedDB design drafts and original artwork blobs.
- Model-aware 3D placement for the genuine Classic T-shirt model.
- Typed print surfaces, constrained placement, physical dimensions, and quality guidance.
- Layer naming, visibility, ordering, duplication, deletion, Undo, and Redo.
- Local PNG proofs and URL-free JSON production specifications.
- A controlled production PWA shell with honest offline behavior.
- Aggregate, opt-in runtime diagnostics used only by test and debug sessions.

It does **not** include:

- Accounts, a backend, or cross-device synchronization.
- Remote artwork or customer-data storage.
- Authoritative inventory, payment, or pricing.
- Real order acceptance, tracking, or fulfillment.
- Approved production policy, legal, privacy, returns, or care content.
- Genuine 3D geometry for garments other than the Classic T-shirt.
- Verified physical print calibration or production authorization.

## Runtime architecture

### Editor interaction

Pointer-frequency artwork movement, resize, and rotation stay outside durable React and IndexedDB state. The matching Three.js decal is previewed imperatively, then the final transform is committed once when the gesture ends.

One continuous gesture is required to create:

- one durable editor-history commit,
- one durable draft save,
- and one recoverable final transform.

### WebGL behavior

All visible 3D profiles use demand rendering. Hidden documents stop the canvas loop. The scene requests frames only for camera movement, artwork changes, textures, renderer/profile changes, resize, or recovery.

Rendering profiles are bounded and reactive:

| Profile | Maximum DPR | Shadows | Shadow map | Texture anisotropy |
| --- | ---: | --- | ---: | ---: |
| Low power | 1 | Off | 256 | 2 |
| Balanced | 1.25 | Off | 256 | 4 |
| High capability | 1.5 | On | 512 | 8 |

Reduced-motion, Save-Data, pointer, viewport, orientation, device-pixel-ratio, visibility, and capability changes can lower or restore quality without resetting the active draft.

### Artwork decoding and texture ownership

Every successful GPU artwork path is bounded before upload:

| Profile | Maximum dimension | Maximum decoded pixel area |
| --- | ---: | ---: |
| Low power | 1,024 px | 786,432 pixels |
| Balanced | 1,536 px | 1,572,864 pixels |
| High capability | 2,048 px | 3,145,728 pixels |

The effective dimension is also limited by the browser-reported WebGL maximum texture size. Compatible duplicate layers share one reference-counted texture. Hiding, deleting, replacing a profile, switching to 2D, leaving the route, cancellation, timeout, or failure releases ownership deterministically.

### Recovery

When WebGL is unsupported, lost, or unable to render the model, the Studio preserves the local draft and presents the safe 2D preview. The user can retry 3D after graphics recovery. Original artwork remains separate from generated GPU previews and export files.

## Requirements

Use the pinned runtime:

```text
Node.js 22.23.1
npm 10.9.8
```

Check the installed versions:

```bash
node --version
npm --version
```

The approved Classic T-shirt model is committed directly at `public/basic_t-shirt.glb`. Normal Git clones and deployment providers receive the real binary without Git LFS. `npm run check:assets` verifies its binary glTF structure and reviewed asset budgets, and `npm run build` invokes that gate automatically through `prebuild`.

## Local setup

```bash
git clone https://github.com/YrFnS/BGD-INK-Studio.git
cd BGD-INK-Studio
git checkout main
npm ci --include=dev --no-audit --no-fund
npm run dev
```

New development and production deployment should use `main` as the authoritative source.

## Validation commands

Fast repository and production-build validation:

```bash
npm run check
```

Functional browser journeys:

```bash
npm run test:e2e
```

Production PWA journey:

```bash
npm run test:pwa
```

Production runtime-performance budgets:

```bash
npm run test:performance
```

Complete P6 exit suite after one clean install:

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:p6
```

`npm run check` includes environment, strict TypeScript, zero-warning ESLint, brand, import-boundary, 3D asset, storefront, localization, responsive-shell, runtime-shell, editor-gesture, demand-rendering, texture-lifecycle, runtime-performance, repository-reconciliation, unit/accessibility, production build, bundle, and delivery gates.

The commands are the source of truth for current test counts. Phase validation documents preserve historical counts for their exact validated commits; README and roadmap files intentionally avoid volatile hard-coded totals.

## Runtime-performance budgets

The committed source of truth is `src/config/runtime-performance-budgets.json`.

Key ceilings include:

| Measurement | Budget |
| --- | ---: |
| Homepage interactive median | 2,500 ms |
| Route-transition median | 1,250 ms |
| Studio ready | 9,000 ms |
| Large artwork ready | 7,000 ms |
| Constrained artwork ready | 15,000 ms |
| Maximum normal long task | 600 ms |
| Maximum constrained long task | 1,200 ms |
| Maximum normal frame gap | 550 ms |
| Maximum constrained frame gap | 1,000 ms |

Strict logical invariants include:

- one durable history commit per continuous gesture,
- one durable draft save per continuous gesture,
- no more than eight measured React/R3F commits per gesture,
- no more than two extra WebGL frames during the visible idle window,
- zero WebGL frames during the hidden observation window,
- zero texture entries and references after final cleanup,
- and a constrained low-power journey under 4× CPU throttling.

Do not raise budgets simply to obtain a passing build. Diagnose and remove the regression.

## Deployment policy

Repository-controlled Vercel and Netlify configuration is branch-neutral. `main` is the only repository branch and the required production source; future pull requests may receive isolated preview deployments. The garment model is delivered as a normal Git asset, so no provider-specific Git LFS toggle is required.

Before a production release, verify the provider dashboards directly:

- Vercel Production Branch is `main`.
- Netlify Production Branch is `main`.
- No historical phase branch is pinned as a production, deploy-context, or build-hook target.
- Only the verified production environment receives `VITE_PUBLIC_SITE_URL`.
- `VITE_INDEXABLE_BUILD=true` is enabled only after the public domain and indexing decision are approved.

Detailed deployment and provider checks are in `docs/DEPLOYMENT.md`.

## Documentation

- `docs/P6-RUNTIME-STABILITY-PLAN.md` — P6 issue inventory, phase outcomes, and exit criteria.
- `docs/P6-2-EDITOR-GESTURE-VALIDATION.md` — one-commit editor gesture architecture.
- `docs/P6-3-DEMAND-RENDERING-VALIDATION.md` — demand rendering and adaptive profiles.
- `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md` — bounded decoding and shared texture lifecycle.
- `docs/P6-5-RUNTIME-PERFORMANCE-VALIDATION.md` — production measurements and budgets.
- `docs/P6-6-REPOSITORY-RECONCILIATION.md` — branch, package, deployment, and release reconciliation.
- `docs/DEPLOYMENT.md` — branch-neutral Vercel/Netlify deployment policy.
- `docs/TROUBLESHOOTING.md` — runtime, persistence, WebGL, artwork, and performance troubleshooting.

## Remaining external release inputs

Engineering validation cannot invent or approve:

- the final production domain,
- official contact destinations,
- approved privacy, returns, care, and fulfillment policies,
- confirmed prices, production times, garment specifications, and size charts,
- genuine remaining garment models,
- physical print calibration,
- representative physical Android, iPhone, and tablet review,
- or provider-dashboard production-branch settings.

Keep preview language honest until those inputs are approved.
