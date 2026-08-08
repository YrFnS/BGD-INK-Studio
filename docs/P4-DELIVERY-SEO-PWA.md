# P4 — Delivery, SEO, and Controlled PWA Foundation

## Status

The code-only P4 foundation is complete for the current frontend and browser-local scope.

This work does not add a backend, production database, account system, remote artwork storage, authoritative stock, payment, real order acceptance, or fulfillment workflow.

## Branch and pull request

```text
agent/bgd-ink-p3-premium-storefront
└── agent/bgd-ink-p4-delivery-seo-pwa
```

P4 is isolated in a stacked draft pull request targeting the P3 branch. It remains unmerged so the P0, P2, P3, and P4 merge order stays explicit.

## Public-route SEO

Only genuinely public storefront routes are eligible for indexing:

```text
/
/catalog
/guide
```

Browser-local and customer-specific routes remain non-indexable:

```text
/designs
/studio/:draftId
/checkout/:draftId
/draft/:draftId
```

The build provides:

- Route-aware page titles and descriptions
- Open Graph metadata
- Twitter summary-card metadata
- Owned BGD/INK social artwork
- Canonical URLs when a verified production origin is configured
- Organization, website, web-application, collection, and product structured data
- Sitemap and robots output for a verified indexable production build
- `noindex,nofollow,noarchive` preview behavior by default

Product structured data deliberately excludes fabricated offers, availability guarantees, ratings, reviews, shipping promises, and price validity.

## Production indexing configuration

Preview and unknown-domain builds remain non-indexable.

A production deployment becomes indexable only when both values are supplied intentionally:

```bash
VITE_PUBLIC_SITE_URL=https://verified-production-domain.example
VITE_INDEXABLE_BUILD=true
```

`VITE_PUBLIC_SITE_URL` must be the final verified public origin. Do not enable indexing for temporary previews or placeholder domains.

## Owned install and social assets

The branch contains owned BGD/INK assets for:

```text
public/brand/app/favicon-32.png
public/brand/app/apple-touch-icon.png
public/brand/app/icon-192.png
public/brand/app/icon-512.png
public/brand/app/icon-maskable-512.png
public/brand/social/og-default.png
```

The delivery gate verifies the real PNG dimensions and the manifest references.

## Controlled PWA behavior

The application registers its service worker only in a production build and only in a secure context or on localhost.

The service worker uses a versioned cache and supports:

- A lightweight precached application shell
- Same-origin static-asset caching
- Network-first navigation with a cached shell fallback
- Runtime caching of public route chunks that were opened online
- Cache cleanup when a new version activates
- Client claiming after activation
- Explicit `SKIP_WAITING` handling only after customer confirmation

The application provides:

- A bilingual install prompt when the browser exposes installability
- A bilingual update notice with **Later** and **Update now** choices
- A bilingual offline notice that explains cached-access limitations
- No automatic update reload during an active editing session

This is a focused custom service worker rather than Workbox. The choice keeps the update behavior explicit, the generated output inspectable, and the delivery code within the existing performance limits.

## Honest offline boundary

The PWA does not promise that every screen, file, browser, or device works offline.

Supported behavior is described conditionally:

- The shell can reopen after it has been installed and cached.
- Public screens previously opened online can reopen from the browser cache.
- Browser-local IndexedDB drafts remain on the same device.
- New, uncached, or externally hosted content still requires a connection.
- Clearing browser data can remove both cached shell assets and customer drafts.

## WhatsApp handoff

The local receipt already includes a conditional WhatsApp handoff.

It becomes visible only after a verified number is configured in `src/config/brand.ts`. The generated message contains the draft identifier, garment, size, colour, quantity, layer count, customer details, address, and notes.

Until an official destination is configured, no WhatsApp action is displayed and no placeholder number is invented.

## Permanent validation

The normal gate includes:

```bash
npm run check:delivery
```

It validates:

- Preview-safe robots metadata
- Manifest ownership and icon references
- PNG dimensions
- Social-card presence
- Production build output
- Generated public route shells
- Versioned service-worker output
- Existing JavaScript and CSS budgets

A dedicated production browser command also exists:

```bash
npm run test:pwa
```

It builds and serves the actual production output, then proves:

1. The service worker activates and controls the page.
2. The owned standard and maskable icons resolve.
3. The Guide and Catalog open online.
4. The browser goes genuinely offline.
5. Both visited public routes reopen from the cache.
6. The honest offline notice appears.

## Final measured validation

The current committed branch passed:

```text
77 unit/component/accessibility tests across 28 files
11 desktop, phone, tablet, Arabic, editor, recovery, and export Chromium journeys
1 production-only PWA Chromium journey
strict TypeScript
zero-warning ESLint
brand, architecture, asset, storefront, localization, responsive, delivery, and bundle gates
```

Current production budgets:

| Metric                               |      Current |     Limit |
| ------------------------------------ | -----------: | --------: |
| Initial JavaScript, gzip             |    74.81 KiB |    90 KiB |
| Initial CSS, gzip                    |    15.97 KiB |    16 KiB |
| Largest async JavaScript chunk, gzip |   168.08 KiB |   200 KiB |
| Largest JavaScript chunk, raw        |   651.42 KiB |   725 KiB |
| Total JavaScript, gzip               |   381.03 KiB |   390 KiB |
| Total JavaScript, raw                | 1,322.97 KiB | 1,350 KiB |
| Total CSS, gzip                      |    15.97 KiB |    17 KiB |

No performance budget was raised for P4.

## Intentionally deferred inputs

The following are not responsibly implementable without approved business or privacy decisions:

- The official production domain
- Official WhatsApp, email, Instagram, and other contact destinations
- Analytics provider and consent wording
- Error-monitoring provider and data-retention policy
- Approved campaign, coupon, bulk-order, and repeat-order rules
- Approved photography, prices, production times, specifications, size charts, and policies
- Physical Android, iPhone, and tablet validation

These are external inputs, not hidden unfinished P4 infrastructure.
