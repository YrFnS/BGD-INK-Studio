# Deployment

This document defines the repository-controlled deployment contract and the external provider checks required before a production release.

## Branch policy

**Production branch: `main`.**

```text
main   # authoritative production and development source
```

PRs #1–#6 are merged. All superseded phase branches were deleted after PR #6 merged as `03d78a08febd8428555d6f1b657848f2a520eddc`. Merged pull requests and validation documents preserve the audit history.

Historical phase branches are not deployment targets and must not be recreated as a stack.

## Repository-controlled build contract

Pinned runtime:

```text
Node.js 22.23.1
npm 10.9.8
```

Clean install:

```bash
npm ci --include=dev --no-audit --no-fund
```

Pre-merge validation runs in GitHub Actions:

```bash
npm run check
```

Provider build command:

```bash
npm run build
```

Output directory:

```text
dist
```

`npm run build` invokes the `prebuild` asset gate first. The build fails when a GLB is unresolved pointer text, malformed binary glTF, or outside the reviewed asset budgets.

The approved Classic T-shirt model is committed directly at `public/basic_t-shirt.glb`. Standard Git checkouts on Vercel, Netlify, CI, and local machines receive the same binary without provider-specific Git LFS settings.

`npm run check` remains the required CI and release gate. Deployment providers run the deterministic production build after CI has validated the commit.

## Vercel

`vercel.json` declares:

- Vite framework,
- clean npm installation,
- `npm run build`,
- `dist` output,
- SPA rewrites,
- immutable asset caching,
- service-worker and manifest caching rules,
- security headers,
- and no dependency on a dashboard Git LFS toggle.

### External dashboard checklist

The repository cannot encode or read the Vercel project’s Production Branch setting. Confirm manually:

- Production Branch is `main`.
- PR previews are enabled for pull-request branches.
- No historical phase branch is pinned in project settings or a deploy hook.
- Preview environments do not receive production indexing variables.
- The verified production domain is attached only to the approved production deployment.

## Netlify

`netlify.toml` and `public/_redirects` declare:

- `npm run build`,
- `dist` publishing,
- the pinned Node runtime,
- SPA fallback,
- static-asset caching,
- service-worker and manifest caching rules,
- security headers,
- and no obsolete `GIT_LFS_ENABLED` build variable.

### External dashboard checklist

The repository cannot encode or read the Netlify site’s Production Branch setting. Confirm manually:

- Production Branch is `main`.
- Deploy Previews are enabled for pull requests.
- No historical phase branch is configured as a branch deploy or build-hook target.
- Preview contexts do not receive production indexing variables.
- The verified production domain is assigned only after the release decision.

## Indexing and public URL

Preview output is intentionally non-indexable.

An indexable build requires both:

```text
VITE_PUBLIC_SITE_URL=https://verified-production-domain.example
VITE_INDEXABLE_BUILD=true
```

Rules:

- `VITE_PUBLIC_SITE_URL` must be a verified `http` or `https` origin.
- `VITE_INDEXABLE_BUILD=true` belongs only in the approved production environment.
- Do not expose those values to pull-request previews.
- Customer-specific routes remain non-indexable.
- The generated robots and sitemap output is validated by `npm run check:delivery`.

## Preview deployments

A preview deployment validates the branch’s generated static application. It is not proof that:

- the provider Production Branch is correct,
- the custom domain is approved,
- the build is indexable,
- business information is final,
- or the application is authorized for real order processing.

Preview deployments validate proposed commits only; production remains sourced from `main`.

## Local production preview

```bash
npm ci --include=dev --no-audit --no-fund
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

For the complete production behavior and performance exit suite:

```bash
npm run verify:p6
```

## Direct-route fallback

The app uses browser History API routes. Every host must serve `index.html` for unknown application routes.

Covered routes include:

```text
/
/catalog
/guide
/designs
/studio/:draftId
/checkout/:draftId
/draft/:draftId
```

Netlify uses `public/_redirects`. Vercel uses the rewrite in `vercel.json`.

## Service worker and cache behavior

The build generates a versioned service worker after Vite output is complete.

- Shell assets are versioned by content.
- Old BGD/INK shell caches are removed on activation.
- Updates require explicit user confirmation before `SKIP_WAITING`.
- Heavy garment geometry is not part of the lightweight install precache.
- The production performance suite blocks service workers to avoid warmed-cache timing distortion.

## Security and privacy boundary

The deployment is static and browser-local.

- Drafts and original artwork remain in the user’s browser profile.
- No backend or remote artwork upload is configured.
- Runtime diagnostics are disabled by default and aggregate-only when explicitly enabled.
- Do not add analytics, monitoring, or customer-data collection without an approved privacy and retention decision.
- Do not treat a local receipt as a confirmed real order.

## Historical branch cleanup

Completed after the P6 merge:

- PRs #1–#6 remain the audit record.
- P0–P6 validation documents remain in `main`.
- All superseded phase branches were deleted.
- Future work must branch from `main` without recreating the old stack.
