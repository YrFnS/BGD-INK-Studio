# P6.6 — Repository and release reconciliation

## Status

**Implementation complete; final exit validation and external deployment-provider branch confirmation pending** on `agent/p6-runtime-stability`.

This phase reconciles repository-controlled claims. It does not create a production release, change the product boundary, delete historical branches, or alter external Vercel/Netlify dashboard settings.

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

`package.json` and `package-lock.json` must agree.

P0–P6 are roadmap phase identifiers, not semantic versions. No npm publication, GitHub release, production tag, or production-domain approval is performed by P6.6.

### Validation claims

Living README and task documents no longer contain volatile test totals. The commands and CI results are the source of truth. Exact totals remain only in phase validation records tied to specific commits.

### Deployment state

Repository-controlled Vercel and Netlify configuration is branch-neutral.

Required policy:

```text
Production branch: main
PR branch: preview only
```

The external provider dashboards cannot be read or changed through repository source. Their Production Branch settings must be manually confirmed before merge/release.

## Files reconciled

- `README.md`
- `tasks.md`
- `docs/TROUBLESHOOTING.md`
- `docs/DEPLOYMENT.md`
- `docs/P6-RUNTIME-STABILITY-PLAN.md`
- `docs/P6-6-REPOSITORY-RECONCILIATION.md`
- `package.json`
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
- production branch documentation,
- and CI performance-job retention.

It runs inside `npm run check`.

## Final exit command

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:p6
```

The final validation evidence and CI run identifiers will be added to this record after the final branch head passes.

## Remaining manual release gate

Before PR #6 can leave draft status:

1. Confirm Vercel Production Branch is `main`.
2. Confirm Netlify Production Branch is `main`.
3. Confirm no historical branch deploy or build hook remains.
4. Review the final PR diff and preview deployments.
5. Approve the merge and release decision.

P6.6 does not claim those external checks have happened until the owner confirms them.
