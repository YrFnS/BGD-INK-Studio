# P5 — Pre-launch hardening

## Status

The P5 code scope is complete on `agent/bgd-ink-p5-prelaunch-hardening`.

The application remains frontend-only and browser-local. P5 does not add accounts, a backend, remote artwork storage, inventory, payment, real order acceptance, delivery tracking, or fulfillment.

## Persistence and navigation safety

Customizer and preparation changes still use short debounced saves during ordinary editing, but internal navigation and browser-history transitions now flush pending data before changing routes.

The persistence coordinator provides:

- Registered flushers for the active customizer and preparation screen
- One shared flush for rapid competing navigation requests
- Navigation cancellation when any pending write fails
- A bilingual failure notice while the customer remains on the current screen
- Best-effort flushes when the document becomes hidden or the page is being left
- Retention of a failed pending snapshot so a later retry cannot silently skip it

Changing the interface language no longer reloads the active customizer or cancels its pending save.

## IndexedDB and artwork lifecycle

Draft schema version 6 adds a monotonically increasing revision value.

Draft reads and writes that update existing records now operate inside a single read-write transaction. Customizer saves update the draft and remove artwork assets that are no longer referenced by either:

- The current visible or hidden layer set
- The bounded undo and redo history

This keeps undo recovery intact without retaining abandoned uploads indefinitely.

P5 does not introduce multi-device or collaborative conflict resolution. Drafts remain limited to the current browser profile.

## Local customer-data lifecycle

The former duplicate localStorage receipt collection has been removed. Draft preparation details and the prepared receipt relationship remain in the IndexedDB draft instead of being copied into a second hidden record.

On the first P5 load, obsolete local product, gallery, and receipt keys from the previous BGD/INK and ASHUS prototype namespaces are removed. Product price, availability, colours, identity, and owned imagery now come from canonical application configuration rather than stale customer-browser overrides.

Deleting a design therefore removes its current draft, customer preparation details, and associated artwork through one storage lifecycle.

## Search and production delivery

A build becomes indexable only when both conditions are deliberately satisfied:

```bash
VITE_PUBLIC_SITE_URL=https://verified-production-domain.example
VITE_INDEXABLE_BUILD=true
```

Production hosting context alone no longer enables indexing. Preview builds publish no canonical URL or public-site metadata, while customer-specific draft routes remain `noindex` in every build.

The generated service worker now uses the correct premium-hoodie asset path. Delivery validation and the production PWA journey verify every owned product illustration in a fresh shell cache before the Catalog route is visited.

## Privacy and security posture

The application no longer requests Google-hosted fonts. It uses a system-font stack so the public shell has no normal third-party font request and remains visually stable offline.

Netlify delivery includes a restrictive Content Security Policy alongside the existing frame, referrer, MIME-sniffing, permissions, and opener policies.

The official WhatsApp action remains hidden until a verified destination is configured. When enabled, its draft summary now uses the translated garment display name and localized English or Iraqi-Arabic field labels rather than exposing translation keys.

## Runtime and bundle cleanup

The shipped GSAP package has been removed. Existing imports resolve to the repository's tested Web Animations compatibility layer through Vite, Vitest, and TypeScript aliases.

Measured production baseline:

| Metric                               |      Current |     Limit |
| ------------------------------------ | -----------: | --------: |
| Initial JavaScript, gzip             |    75.68 KiB |    90 KiB |
| Initial CSS, gzip                    |    15.99 KiB |  16.5 KiB |
| Largest async JavaScript chunk, gzip |   168.08 KiB |   200 KiB |
| Largest JavaScript chunk, raw        |   651.42 KiB |   725 KiB |
| Total JavaScript, gzip               |   381.95 KiB |   390 KiB |
| Total JavaScript, raw                | 1,325.67 KiB | 1,350 KiB |
| Total CSS, gzip                      |    15.99 KiB |    17 KiB |

## Validation

The focused P5 branch passes:

```text
82 unit/component/accessibility tests across 30 files
11 desktop, phone, tablet, Arabic, editor, recovery, and export Chromium journeys
1 production-only PWA Chromium journey
strict TypeScript
zero-warning ESLint
brand, architecture, asset, storefront, localization, responsive, bundle, and delivery gates
```

The additional P5 tests cover navigation flushing, failed-write retention, retry behavior, localized WhatsApp content, private-route SEO, and fresh PWA product-asset caching.

## Remaining external inputs

P5 does not remove the existing launch dependencies:

- Verified production domain
- Official WhatsApp, email, Instagram, and other destinations
- Approved privacy, returns, care, and fulfillment policies
- Confirmed prices, production times, methods, size charts, and garment specifications
- Genuine remaining garment models and physical print-area calibration
- Representative physical Android, iPhone, and tablet validation
- Approved analytics, consent, monitoring, and retention decisions
