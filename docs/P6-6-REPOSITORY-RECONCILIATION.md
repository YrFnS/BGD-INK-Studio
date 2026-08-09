# P6.6 — Repository and release reconciliation

## Status

**Complete, validated, merged, and consolidated** in `main`.

Validated reconciled implementation head:

```text
0cbd21ab9c264072f8497ece9e14c25f78fc9aa0
fix: separate CI validation from provider builds
```

Validated GitHub Actions run:

```text
31308581420
```

All source/build, functional, PWA, and production-performance jobs passed, and both pull-request preview providers completed successfully.

PR #6 was squash-merged as `03d78a08febd8428555d6f1b657848f2a520eddc`, and all superseded phase branches were deleted afterward. This does not by itself create a public production release or alter external Vercel/Netlify Production Branch settings.

## Reconciliation decisions

### Authoritative branch state

```text
main
```

- PRs #1–#6 are merged.
- `main` contains the complete P0–P6 application.
- PR #6 produced squash commit `03d78a08febd8428555d6f1b657848f2a520eddc`.
- All superseded phase branches were deleted after their contents were verified as merged.
- Merged pull requests and validation documents are the audit record.

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

The deployment contract separates responsibilities:

- GitHub CI runs the complete source, unit, build, functional, PWA, and production-performance validation.
- Vercel and Netlify run the deterministic `npm run build` provider build for the already-validated commit.
- Provider dashboards retain external Production Branch settings that repository source cannot read; they should be confirmed as `main` before a public production launch.

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

## Post-merge result

- PR #6 was reviewed, marked ready, and squash-merged as `03d78a08febd8428555d6f1b657848f2a520eddc`.
- All phase branches were deleted; only `main` remains.
- The complete P6 automated exit suite passed before merge.
- Vercel built the merged `main` commit successfully.

External provider dashboard settings, the public production domain, indexing approval, business content, and physical-device validation remain separate production-launch inputs. Repository source does not claim those external decisions have been completed.
