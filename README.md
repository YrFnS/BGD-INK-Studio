# BGD/INK Studio

BGD/INK Studio is a bilingual English/Iraqi-Arabic web application for preparing custom-apparel design drafts in a model-aware 3D editor.

> The project is intentionally frontend and browser-local. Designs, original artwork, preparation details, quantities, and generated production files stay on the current device. They are not sent to a shop, synchronized between devices, or written to a production database.

## Current scope

Active work includes:

- the React/Vite storefront
- the premium editorial print-lab identity
- owned local garment illustrations
- the product-aware 3D customizer
- IndexedDB drafts and original artwork blobs
- recoverable size, colour, quantity, and contact preparation
- local PNG proofs and JSON specifications
- persistent English/Iraqi-Arabic content and RTL behavior
- accessibility, touch interaction, safe-area behavior, performance, PWA, and SEO

Paused until explicitly reopened:

- backend development
- production databases
- remote object storage
- accounts and cross-device synchronization
- staff or administration portals
- authoritative stock, pricing, customer, and order data
- real order acceptance, payment, approval, tracking, or fulfillment

The preparation and receipt flow saves a **local design draft**, not a real customer order.

## Phase status

### P0 — safe foundation and rebrand

Complete on `agent/bgd-ink-p0-foundation`:

- centralized BGD/INK brand configuration
- removed public prototype administration, hardcoded PINs, browser-exposed secrets, and false offline claims
- migrated legacy browser keys without destroying recoverable data
- added a permanent brand source-of-truth check

### P1 — engineering foundation

Complete on `agent/bgd-ink-p0-foundation`:

- compiled Tailwind CSS, strict TypeScript, zero-warning ESLint, and Prettier
- application source under `src/` with the `@/` alias and enforced import boundaries
- History API routes and direct-route hosting fallback
- IndexedDB recovery and My Designs
- pinned Node/npm, committed lockfile, cached deterministic installation, CI, tests, and bundle budgets

### P2 — production-quality local customizer

In progress on `agent/bgd-ink-p2-models-print-areas`:

Implemented:

- honest product-model readiness
- Classic T-shirt front/back print surfaces
- centimetre placement and safe boundaries
- aspect-ratio-aware artwork dimensions
- source pixels, transparency, padding, effective DPI, and quality warnings
- undo/redo and complete layer controls
- explicit View, Move, and Resize/Rotate modes
- touch gestures and adaptive rendering
- WebGL recovery and safe 2D fallback
- multi-surface PNG proof and URL-free JSON specification
- GPU preview-texture limits and measured GLB budgets

Still dependent on real physical inputs:

- confirmed Classic T-shirt calibration
- genuine oversized T-shirt, hoodie, and vest models
- supported sleeve surfaces
- geometry-aware seam warnings
- final garment-model compression and re-audit

### P3 — premium storefront and customer journey

In progress on `agent/bgd-ink-p3-premium-storefront`:

Implemented:

- editorial print-lab homepage and model-aware Studio Workbench
- owned local garment illustrations and interface icons
- removal of remote stock photography, fabricated-looking reviews, and unsupported promises
- model-aware catalog with truthful unavailable states
- bilingual Studio Guide
- Iraqi-Arabic and contextual RTL review across the storefront, editor, preparation flow, receipt, and Guide
- recoverable quantity and preparation details
- accessible validation, draft-load retry, and autosave retry
- localized Baghdad areas with stable stored values
- touch-first local receipt
- safe-area and dynamic-viewport shell
- iPhone portrait/short-landscape and iPad Arabic orientation-sized browser coverage
- lightweight Web Animations motion runtime replacing the shipped GSAP runtime

Still pending:

- approved product and completed-work photography
- confirmed prices, production times, garment specifications, method availability, and size charts
- official contact channels
- approved returns, care, privacy, and fulfillment policies
- representative physical Android, iPhone, and tablet validation

## Brand

Brand values live in `src/config/brand.ts`:

- customer-facing name: **BGD/INK**
- product name: **BGD/INK Studio**
- tagline: **Design it. Wear it.** / **صمّمها والبسها**
- primary market: Baghdad, Iraq

`npm run check:brand` prevents customer-facing source files from reintroducing obsolete or duplicated brand literals.

## Technology

- React 18 and strict TypeScript
- Vite and compiled Tailwind CSS 4
- React Three Fiber, Drei, and Three.js
- a repository-specific Web Animations compatibility layer for UI motion
- IndexedDB for local drafts and original artwork
- Canvas-based PNG proof generation
- JSON local production specifications
- Vitest, Testing Library, fake IndexedDB, and axe
- Playwright for desktop, phone, and tablet Chromium journeys
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
```

The fast gate runs:

```text
environment validation
→ strict TypeScript
→ zero-warning ESLint
→ brand source-of-truth validation
→ import-boundary validation
→ measured GLB budgets
→ storefront trust validation
→ Iraqi-Arabic and RTL validation
→ responsive-shell validation
→ unit, component, and accessibility tests
→ production build
→ JavaScript and CSS budgets
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
npm run test
npm run test:unit
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run format:check
npm run format
npm run build
npm run check:bundle
npm run preview
```

Current validated coverage:

```text
71 unit/component/accessibility tests across 26 files
11 passing Chromium journeys
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Premium landing page |
| `/catalog` | Model-aware garment selection |
| `/guide` | Measurement, method, policy, and FAQ guidance |
| `/designs` | Recent local designs |
| `/studio/:draftId` | Recoverable 3D editor |
| `/checkout/:draftId` | Recoverable local draft preparation |
| `/draft/:draftId` | Local draft receipt |

Browser Back/Forward navigation is supported. Netlify direct-route fallback is provided through `public/_redirects`.

## Local draft model

IndexedDB draft version 5 stores:

- draft name, product, colour, size, quantity, and notes
- original PNG, JPEG, or WebP artwork blobs
- layer names, visibility, order, active selection, and print surfaces
- placement, rotation, aspect ratio, and physical scale
- source dimensions, transparency, padding, and quality metadata
- local contact and address fields
- local receipt linkage

My Designs can reopen, rename, duplicate, and permanently delete local drafts. Duplicated designs receive independent artwork blobs and preserve prepared quantity while clearing contact details and receipt state.

Clearing browser data can permanently remove designs. There is no server backup or account recovery.

## Customizer interaction

- **View Garment:** orbit and zoom the product camera
- **Move Design:** drag the selected visible layer inside its safe surface
- **Resize/Rotate:** use pointer or pinch-and-twist transforms

Continuous gestures become one undoable history action. Rendering adapts to device capabilities and falls back to a local 2D preview when WebGL is unavailable or loses context.

## Local production files

The customizer can generate:

### PNG proof

- every configured product surface
- product, size, colour, draft name, and ID
- physical print-area dimensions and safe margins
- visible artwork placement, rotation, order, and layer names
- an explicit physical-calibration warning

### JSON specification

- product and draft metadata
- documented viewer-facing centimetre coordinates
- configured surfaces
- visible and hidden layers
- dimensions, offsets, rotation, source metadata, transparency, estimated DPI, and warnings
- explicit `unverified` physical calibration

Temporary `blob:` preview URLs are excluded. These outputs are planning and handoff aids, not authorization to print.

## Bilingual and responsive behavior

- language preference persists under `bgd-ink-language`
- document `lang`, `dir`, and `data-language` stay synchronized
- technical values remain direction-safe inside RTL layouts
- same-page Guide navigation scrolls explicitly and keeps the URL hash synchronized
- reduced-motion preferences disable smooth section scrolling and decorative motion
- the viewport opts into `viewport-fit=cover` and software-keyboard resizing
- the fixed header, prototype notice, mobile menu, and footer account for safe-area insets
- the mobile menu remains scrollable in short landscape viewports

The browser matrix includes Pixel 5, iPhone 13, and iPad Mini-sized journeys, but real physical-device validation remains required.

## Performance baseline

Three.js remains lazy and is excluded from the initial storefront.

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 71.07 KiB | 90 KiB |
| Initial CSS, gzip | 15.91 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 377.29 KiB | 390 KiB |
| Total JavaScript, raw | 1,312.92 KiB | 1,350 KiB |
| Total CSS, gzip | 15.91 KiB | 16.5 KiB |

Replacing the shipped GSAP runtime reduced initial JavaScript from 97.56 KiB to 71.07 KiB gzip and total JavaScript from 403.79 KiB to 377.29 KiB gzip.

## Prototype safety boundaries

- no public administration portal
- no browser-exposed API keys
- no real order, payment, inventory reservation, delivery promise, or fulfillment flow
- no account recovery or cross-device synchronization
- no remote artwork upload
- official contact actions appear only after verified destinations are configured
- generated proofs and specifications use unverified calibration until physically confirmed
- PWA/offline claims remain disabled until reliable caching exists

Do not use the local prototype for real customer orders or sensitive production data.

## Documentation

- [P3 storefront direction](docs/P3-STOREFRONT-DIRECTION.md)
- [P3 Iraqi-Arabic and RTL sweep](docs/P3-ARABIC-RTL-SWEEP.md)
- [P3 dense editor Arabic and RTL](docs/P3-DENSE-EDITOR-ARABIC-RTL.md)
- [P3 Guide and preparation RTL review](docs/P3-GUIDE-PREPARATION-RTL.md)
- [P3 performance and responsive finalization](docs/P3-PERFORMANCE-RESPONSIVE-FINALIZATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Roadmap](tasks.md)
