# BGD/INK Studio — Current Work State

## Authoritative branches

```text
main
└── agent/p6-runtime-stability
```

- `main` contains the merged P0–P5 baseline.
- `agent/p6-runtime-stability` is the only active phase branch.
- Draft PR #6 targets `main`.
- Historical P0, P2, P3, P4, and P5 branches are retained only as references. They are not an active stack, development bases, or deployment targets.
- Production providers must use `main` after merge. Pull-request previews may use the PR head.

## Phase status

| Phase | Status | Record |
| --- | --- | --- |
| P0/P1 | Merged into `main` | PR #1 |
| P2 | Merged into `main` | PR #2 |
| P3 | Merged into `main` | PR #3 |
| P4 | Merged into `main` | PR #4 |
| P5 | Merged into `main` | PR #5 |
| P6.1 | Complete and validated | Runtime shell and navigation |
| P6.2 | Complete and validated | `docs/P6-2-EDITOR-GESTURE-VALIDATION.md` |
| P6.3 | Complete and validated | `docs/P6-3-DEMAND-RENDERING-VALIDATION.md` |
| P6.4 | Complete and validated | `docs/P6-4-TEXTURE-LIFECYCLE-VALIDATION.md` |
| P6.5 | Complete and validated | `docs/P6-5-RUNTIME-PERFORMANCE-VALIDATION.md` |
| P6.6 | Complete and validated | `docs/P6-6-REPOSITORY-RECONCILIATION.md` |

## P6.6 checklist

- [x] Reconcile README status and branch policy.
- [x] Reconcile the private package version with `package-lock.json`.
- [x] Explain that P6 phase numbers are not semantic versions.
- [x] Remove the obsolete active stacked-branch diagram.
- [x] Remove volatile validation totals from living README and roadmap documents.
- [x] Document normal, PWA, and production-performance commands.
- [x] Document runtime budgets and strict logical invariants.
- [x] Document reduced motion, demand rendering, hidden-page behavior, and 2D recovery.
- [x] Document large-artwork limits, texture sharing, and deterministic cleanup.
- [x] Add branch-neutral Vercel and Netlify deployment guidance.
- [x] Add a permanent repository-reconciliation source gate.
- [x] Pass the clean source/build, functional, PWA, and production-performance exit suite.
- [x] Confirm the PR preview builds complete successfully on Vercel and Netlify.
- [ ] Confirm in the external Vercel dashboard that Production Branch is `main`.
- [ ] Confirm in the external Netlify dashboard that Production Branch is `main`.
- [ ] Complete final owner review of draft PR #6.
- [ ] Merge only after the owner approves the release and deployment state.

## Required exit commands

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

## Product boundary

The project remains frontend-only and browser-local. No backend, account system, remote artwork storage, authoritative inventory, payment processing, real order fulfillment, analytics collection, new garment geometry, or physical print calibration is added by P6.

## Next decision

The engineering and automated validation work is complete. Confirm the external provider Production Branch settings and perform the final PR review. Keep PR #6 draft and unmerged until that manual release gate is complete.
