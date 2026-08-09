# BGD/INK Studio — Current Work State

## Authoritative branch

```text
main
```

- `main` contains the complete merged P0–P6 application.
- PR #6 was squash-merged as `03d78a08febd8428555d6f1b657848f2a520eddc`.
- All superseded phase branches were deleted after the merge.
- Pull requests and phase validation documents remain the audit trail.
- Future work must begin from `main` on one intentionally named branch.

## Phase status

| Phase     | Status                           | Record                                        |
| --------- | -------------------------------- | --------------------------------------------- |
| P0/P1     | Merged into `main`               | PR #1                                         |
| P2        | Merged into `main`               | PR #2                                         |
| P3        | Merged into `main`               | PR #3                                         |
| P4        | Merged into `main`               | PR #4                                         |
| P5        | Merged into `main`               | PR #5                                         |
| P6.1–P6.6 | Merged into `main` and validated | PR #6 and `docs/P6-RUNTIME-STABILITY-PLAN.md` |

## Completed consolidation

- [x] Merge the validated P6 runtime-stability work into `main`.
- [x] Remove the obsolete P0–P6 phase branches.
- [x] Preserve phase records through merged pull requests and validation documents.
- [x] Keep package and lockfile metadata aligned at private version `0.4.0`.
- [x] Keep runtime, PWA, texture, persistence, and production-performance gates active.
- [x] Confirm the merged `main` commit builds successfully on Vercel.
- [x] Reconcile living documentation to the main-only repository state.

## Required validation commands

Run after a clean install:

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

The commands are the source of truth for current validation totals.

## Remaining product and release inputs

These are external product decisions rather than unresolved P6 engineering defects:

- Confirm in each external provider dashboard that Production Branch is `main`.
- Confirm no obsolete deploy hook or branch context remains in Netlify or Vercel.
- Approve the final production domain and indexing configuration.
- Supply official contact destinations and approved privacy, returns, care, and fulfillment content.
- Confirm prices, production times, garment specifications, and size charts.
- Add genuine remaining garment models and physical print calibration.
- Complete representative physical Android, iPhone, and tablet review.

## Product boundary

The project remains frontend-only and browser-local. It has no backend, account system, remote artwork storage, authoritative inventory, payment processing, real order fulfillment, analytics collection, additional verified garment geometry, or physical print calibration.

## Next engineering decision

Open one new branch from `main` only when a clearly scoped maintenance or product phase is approved. Do not recreate the historical phase stack.
