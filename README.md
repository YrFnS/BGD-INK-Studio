# BGD/INK Studio

BGD/INK Studio is a bilingual English/Iraqi-Arabic web application for preparing custom-apparel design drafts in a model-aware 3D editor.

> The project is intentionally frontend and browser-local. Designs, original artwork, preparation details, quantities, and generated production files stay on the current device. They are not sent to a shop, synchronized between devices, or written to a production database.

## Current scope

The implemented application includes:

- Premium React/Vite storefront
- Owned BGD/INK garment illustrations, app icons, and social artwork
- Product-aware 3D customizer
- Browser-local IndexedDB drafts and original artwork blobs
- Recoverable size, colour, quantity, notes, and contact preparation
- Artwork dimensions, transparency, padding, DPI, and quality guidance
- Undo/redo and complete layer controls
- Adaptive rendering, WebGL recovery, and a safe 2D fallback
- Local multi-surface PNG proofs and JSON specifications
- Persistent English/Iraqi-Arabic content and contextual RTL behavior
- Safe-area, short-landscape, phone, and tablet layout handling
- Preview-safe SEO and optional production indexing
- Controlled installable PWA shell with explicit update confirmation
- Honest cached offline access for previously opened public screens

Paused until explicitly reopened:

- Backend development
- Production databases
- Remote artwork storage
- Accounts and cross-device synchronization
- Staff or administration portals
- Authoritative stock, pricing, customer, and order data
- Real order acceptance, payment, approval, tracking, or fulfillment

The preparation and receipt flow saves a **local design draft**, not a real customer order.

## Branch and phase status

```text
main
└── agent/bgd-ink-p0-foundation
    └── agent/bgd-ink-p2-models-print-areas
        └── agent/bgd-ink-p3-premium-storefront
            └── agent/bgd-ink-p4-delivery-seo-pwa
```

### P0 — safe foundation and rebrand

Complete:

- Central BGD/INK brand configuration
- Legacy ASHUS browser-data migration
- Removed public prototype administration, hardcoded PINs, browser secrets, and false offline claims
- Brand source-of-truth enforcement

### P1 — engineering foundation

Complete:

- Compiled Tailwind CSS
- Strict TypeScript
- Zero-warning ESLint and Prettier
- Source code under `src/` with enforced import boundaries
- History API routes and direct-route hosting fallback
- IndexedDB draft recovery and My Designs
- Pinned Node/npm, committed lockfile, cached deterministic install, CI, tests, and performance budgets

### P2 — production-quality local customizer

Implemented engineering foundation:

- Honest model readiness instead of substituting unrelated geometry
- Classic T-shirt front/back print surfaces
- Centimetre placement and safe boundaries
- Aspect-ratio-aware artwork dimensions
- Source pixels, transparency, padding, effective DPI, and quality warnings
- Undo/redo and complete layer controls
- View, Move, and Resize/Rotate modes
- Touch gestures and adaptive rendering
- WebGL recovery and safe 2D fallback
- Multi-surface PNG proof and URL-free JSON specification
- GPU preview-texture limits and measured GLB budgets

Still dependent on real physical assets and measurements:

- Confirmed Classic T-shirt calibration
- Genuine oversized T-shirt, hoodie, and vest models
- Supported sleeve surfaces
- Geometry-aware seam warnings
- Final garment-model compression and re-audit

### P3 — premium storefront and customer journey

Implemented browser experience:

- Editorial print-lab homepage and model-aware Studio Workbench
- Owned local garment artwork and interface icons
- Removed remote stock photography, fabricated-looking reviews, and unsupported promises
- Honest model-aware catalog
- Bilingual Studio Guide
- Full contextual Iraqi-Arabic and RTL review
- Recoverable quantity and preparation details
- Accessible validation, draft-load retry, and autosave retry
- Localized Baghdad areas with stable stored values
- Touch-first local receipt
- Safe-area and dynamic-viewport shell
- Pixel 5, iPhone 13, and iPad Mini-sized browser coverage
- Lightweight Web Animations motion runtime

Still dependent on approved business content and hardware:

- Real product and completed-work photography
- Confirmed prices, times, garment specifications, printing methods, and size charts
- Official contact channels
- Approved privacy, returns, care, and fulfillment policies
- Physical Android, iPhone, and tablet validation

### P4 — delivery, SEO, and controlled PWA

The code-only foundation is complete:

- Preview-safe `noindex` behavior by default
- Optional production canonical URLs
- Open Graph, Twitter, and owned social artwork
- Organization, website, application, collection, and product structured data
- Public sitemap and robots generation
- Private local routes excluded from indexing
- Owned standard, Apple, and maskable app icons
- Production-only service-worker registration
- Explicit update confirmation before activation
- Bilingual install, update, and offline notices
- Conditional WhatsApp handoff when an official number is configured
- Production-mode offline browser validation

Still dependent on approved external choices:

- Verified production domain
- Official WhatsApp, email, Instagram, and other destinations
- Analytics provider, consent wording, and privacy policy
- Error-monitoring provider and retention policy
- Campaign, coupon, bulk-order, and repeat-order rules

## Brand

Brand values live in `src/config/brand.ts`:

- Customer-facing name: **BGD/INK**
- Product name: **BGD/INK Studio**
- Tagline: **Design it. Wear it.** / **صمّمها والبسها**
- Primary market: Baghdad, Iraq

`npm run check:brand` prevents customer-facing files from reintroducing obsolete or duplicated brand literals.

## Technology

- React 18 and strict TypeScript
- Vite and compiled Tailwind CSS 4
- React Three Fiber, Drei, and Three.js
- Repository-specific Web Animations compatibility layer
- IndexedDB for local drafts and original artwork
- Canvas PNG proof generation
- JSON local production specifications
- Versioned custom service worker
- Vitest, Testing Library, fake IndexedDB, and axe
- Playwright for desktop, mobile, tablet, and production-PWA Chromium journeys
- ESLint and Prettier

## Requirements

- Node.js **22.23.1**
- npm **10.9.8**
- Git LFS for GLB assets

## Local development

```bash
git lfs install
nvm use
npm ci --include=dev
npm run dev
```

No application secret or remote-backend environment variable is required.

## Validation

```bash
npm run check
npm run test:e2e
npm run test:pwa
```

The fast gate performs:

```text
environment validation
→ strict TypeScript
→ zero-warning ESLint
→ brand validation
→ import-boundary validation
→ measured GLB budgets
→ storefront trust validation
→ Iraqi-Arabic and RTL validation
→ responsive-shell validation
→ unit, component, and accessibility tests
→ production build
→ JavaScript and CSS budgets
→ delivery, manifest, social, SEO, and service-worker validation
```

Useful commands:

```bash
npm run typecheck
npm run lint
npm run check:environment
npm run check:brand
npm run check:boundaries
npm run check:assets
npm run check:storefront
npm run check:localization
npm run check:responsive
npm run check:bundle
npm run check:delivery
npm run test
npm run test:unit
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run test:pwa
npm run format:check
npm run format
npm run build
npm run preview
```

Current validated coverage:

```text
77 unit/component/accessibility tests across 28 files
11 desktop, phone, tablet, Arabic, editor, recovery, and export Chromium journeys
1 production-only PWA Chromium journey
```

## Routes

| Route | Purpose | Search visibility |
| --- | --- | --- |
| `/` | Premium landing page | Public |
| `/catalog` | Model-aware garment selection | Public |
| `/guide` | Measurement, method, policy, and FAQ guidance | Public |
| `/designs` | Recent local designs | Private/noindex |
| `/studio/:draftId` | Recoverable 3D editor | Private/noindex |
| `/checkout/:draftId` | Recoverable local draft preparation | Private/noindex |
| `/draft/:draftId` | Local draft receipt | Private/noindex |

Browser Back/Forward navigation is supported. Netlify direct-route fallback is provided through `public/_redirects`.

## Local draft model

IndexedDB draft version 5 stores:

- Draft name, product, colour, size, quantity, and notes
- Original PNG, JPEG, or WebP artwork blobs
- Layer names, visibility, order, selection, and print surfaces
- Placement, rotation, aspect ratio, and physical scale
- Source dimensions, transparency, padding, and quality metadata
- Local contact and address fields
- Local receipt linkage

My Designs can reopen, rename, duplicate, and permanently delete drafts. Duplicates receive independent artwork blobs and preserve prepared quantity while clearing contact and receipt state.

Clearing browser data can permanently remove designs. There is no server backup or account recovery.

## Customizer interaction

- **View Garment:** orbit and zoom the product camera
- **Move Design:** drag the selected visible layer inside its safe surface
- **Resize/Rotate:** use pointer or pinch-and-twist transforms

Continuous gestures become one undoable history action. Rendering adapts to device capabilities and falls back to a local 2D preview when WebGL is unavailable or loses context.

## Local production files

### PNG proof

The proof includes:

- Every configured product surface
- Product, size, colour, draft name, and ID
- Physical print-area dimensions and safe margins
- Visible artwork placement, rotation, order, and names
- Explicit physical-calibration warning

### JSON specification

The specification includes:

- Product and draft metadata
- Viewer-facing centimetre coordinates
- Configured surfaces
- Visible and hidden layers
- Dimensions, offsets, rotation, source metadata, transparency, estimated DPI, and warnings
- Explicit `unverified` physical calibration

Temporary `blob:` preview URLs are excluded. These outputs are planning and handoff aids, not authorization to print.

## SEO deployment

Preview builds are non-indexable by default.

Enable indexing only after the real public domain is verified:

```bash
VITE_PUBLIC_SITE_URL=https://verified-production-domain.example
VITE_INDEXABLE_BUILD=true
```

Do not use these values for temporary previews or placeholder domains.

## PWA and offline behavior

The service worker registers only in production and in a secure context or localhost.

It provides:

- Owned install icons and manifest shortcuts
- Versioned application-shell caching
- Runtime caching for same-origin static assets
- Network-first navigation with a cached shell fallback
- Explicit confirmation before a waiting update activates
- Bilingual install, update, and offline notices

Offline support is conditional. Previously opened public screens can reopen after their assets have been cached; new or uncached content still requires a connection. IndexedDB designs remain browser-local and are not synchronized.

## Conditional WhatsApp handoff

The local receipt can generate a detailed WhatsApp handoff containing the draft ID, garment, variant, quantity, layers, customer details, address, and notes.

The action is hidden until a verified WhatsApp number is configured in `src/config/brand.ts`. No placeholder contact is shown.

## Performance baseline

Three.js remains lazy and excluded from the initial storefront.

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 74.81 KiB | 90 KiB |
| Initial CSS, gzip | 15.97 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 381.03 KiB | 390 KiB |
| Total JavaScript, raw | 1,322.97 KiB | 1,350 KiB |
| Total CSS, gzip | 15.97 KiB | 17 KiB |

No P4 budget was raised.

## Safety boundaries

- No public administration portal
- No browser-exposed API keys
- No real order, payment, inventory reservation, delivery promise, or fulfillment flow
- No account recovery or cross-device synchronization
- No remote artwork upload
- Official contact actions appear only after verified destinations are configured
- Generated proofs use unverified calibration until physically confirmed
- Offline wording does not promise universal availability
- Analytics and monitoring remain disabled until consent and privacy decisions are approved

Do not use the local prototype for real customer orders or sensitive production data.

## Documentation

- [P3 storefront direction](docs/P3-STOREFRONT-DIRECTION.md)
- [P3 Iraqi-Arabic and RTL sweep](docs/P3-ARABIC-RTL-SWEEP.md)
- [P3 dense editor Arabic and RTL](docs/P3-DENSE-EDITOR-ARABIC-RTL.md)
- [P3 Guide and preparation RTL review](docs/P3-GUIDE-PREPARATION-RTL.md)
- [P3 performance and responsive finalization](docs/P3-PERFORMANCE-RESPONSIVE-FINALIZATION.md)
- [P4 delivery, SEO, and PWA](docs/P4-DELIVERY-SEO-PWA.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Roadmap](tasks.md)
