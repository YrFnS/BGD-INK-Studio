# P6.6 — Repository and release reconciliation

## Status

**Complete and validated** on `agent/p6-runtime-stability`.

Validated reconciled implementation head:

```text
0cbd21ab9c264072f8497ece9e14c25f78fc9aa0
fix: separate CI validation from provider builds
```

Validated GitHub Actions run:

```text
31308581420
```

All three clean jobs passed on that head:

```text
Typecheck, lint, unit tests, build, and budgets
Desktop, mobile, and production PWA journeys
Production runtime performance budgets
```

Vercel and Netlify pull-request previews also completed successfully on the reconciled head.

P6.6 reconciles repository-controlled claims. It does not create a production release, change the product boundary, delete historical branches, or alter external Vercel/Netlify Production Branch settings.

## Reconciliation decisions

### Authoritative branch state

```text
main
└── agent/p6-runtime-stability
```

- PRs #1–#5 are merged.
- `main` is the P0–P5 baseline.
- PR #6 is the only active phase pull request.
- Historical phase branches are audit references, not an active stack and not deployment targets.

Branch comparisons found:

- P0, P2, P3, and P4 branches contain no commits ahead of `main`.
- The P5 branch uses squash-merge topology and therefore appears diverged from `main`; it has no file changes after the merged PR #5 head.
- Historical branch deletion remains a separate owner action after external deployment references are checked.

### Package and release state

The package remains:

```text
name: bgd-ink-studio
private: true
version: 0.4.0
```

`package.json` and `package-lock.json` agree.

P0–P6 are roadmap phase identifiers, not semantic versions. P6.6 does not publish an npm package, create a GitHub release, create a production tag, approve a public domain, or authorize live order processing.

### Validation claims

Living README and task documents no longer contain volatile test totals. Commands and current CI results are the source of truth. Exact totals remain in phase validation records tied to specific validated commits.

### Deployment state

Repository-controlled Vercel and Netlify configuration is branch-neutral.

Required policy:

```text
Production branch: main
PR branch: preview only
```

The deployment contract now separates responsibilities:

- GitHub CI runs the complete source, unit, build, functional, PWA, and production-performance validation.
- Vercel and Netlify run the deterministic `npm run build` provider build for the already-validated commit.
- Provider dashboards retain the external Production Branch setting, which must be manually confirmed before merge/release.

The corrected Vercel and Netlify pull-request previews both completed successfully.

## Files reconciled

- `README.md`
- `tasks.md`
- `docs/TROUBLESHOOTING.md`
- `docs/DEPLOYMENT.md`
- `docs/P6-RUNTIME-STABILITY-PLAN.md`
- `docs/P6-6-REPOSITORY-RECONCILIATION.md`
- `package.json`
- `netlify.toml`
- `vercel.json`
- `scripts/check-repository-reconciliation.mjs`

## Permanent gate

P6.6 adds:

```bash
npm run check:repository
```

The gate checks:

- package/lock name and version agreement,
- private-package release wording,
- current branch policy,
- removal of the obsolete active stack,
- absence of volatile validation counts in living status documents,
- runtime and complete-exit commands,
- P6 troubleshooting coverage,
- branch-neutral Vercel and Netlify configuration,
- deterministic provider build commands,
- production branch documentation,
- and CI performance-job retention.

It runs inside `npm run check` and passed on the validated head.

## Final exit command

The local complete sequence is:

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:p6
```

`verify:p6` executes:

```text
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

GitHub Actions split that sequence across independent clean checkouts and passed every job.

## Final automated evidence

Validated run `31308581420` completed successfully with:

```text
99 unit/component/accessibility tests across 35 files
16 functional Chromium journeys
1 production-only PWA Chromium journey
3 production runtime-performance Chromium journeys
strict TypeScript
zero-warning ESLint
repository-reconciliation gate
all runtime, texture, bundle, delivery, localization, persistence, recovery, and PWA gates
```

The production performance suite completed all three journeys in **19.2 seconds**.

### Production bundle

| Metric | Result | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 74.79 KiB | 90 KiB |
| Initial CSS, gzip | 15.77 KiB | 17 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 385.00 KiB | 390 KiB |
| Total JavaScript, raw | 1,335.48 KiB | 1,350 KiB |
| Total CSS, gzip | 15.77 KiB | 17 KiB |

No JavaScript, CSS, image, GPU, or runtime budget was increased.

## Acceptance criteria satisfied

- README, roadmap, task state, package metadata, and deployment guidance agree.
- Package and lockfile remain private version `0.4.0`.
- Historical branches are no longer described as an active stack.
- Living status documents use commands rather than volatile hard-coded validation totals.
- Runtime-performance, PWA, and final-exit commands are documented.
- Reduced motion, demand rendering, 2D fallback, WebGL recovery, large artwork, and texture lifecycle troubleshooting are documented.
- Repository deployment files contain no historical phase-branch dependency.
- Vercel and Netlify pull-request previews build successfully.
- The repository-reconciliation gate is permanent and part of normal validation.
- The clean automated P6 exit suite passes without skipped tests or weakened budgets.

## Remaining manual release gate

Before PR #6 can leave draft status:

1. Confirm Vercel Production Branch is `main` in the external dashboard.
2. Confirm Netlify Production Branch is `main` in the external dashboard.
3. Confirm no historical branch deploy or build-hook target remains.
4. Review the final PR diff and successful preview deployments.
5. Approve moving the PR out of draft and merging it.

P6.6 does not claim those external dashboard checks or the owner’s release approval have happened until they are explicitly confirmed.
