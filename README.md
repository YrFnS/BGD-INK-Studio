# BGD/INK Studio

BGD/INK Studio is a bilingual English/Iraqi-Arabic web application for preparing custom-apparel design drafts in a model-aware 3D editor.

> The project is intentionally frontend and local-only. Designs, original artwork, draft details, quantities, and generated production files stay on the current device. They are not sent to a shop, synchronized between devices, or written to a production database.

## Current scope

Active work includes:

- the React/Vite storefront
- the premium editorial print-lab identity
- owned local garment illustrations
- the product-aware 3D customizer
- browser-local IndexedDB drafts and original artwork blobs
- recoverable size, colour, quantity, and contact preparation
- local design recovery, PNG proofs, and JSON specifications
- English/Iraqi-Arabic content and RTL behavior
- accessibility, touch interaction, performance, PWA, and SEO

Paused until explicitly reopened:

- backend development
- production databases
- remote object storage
- accounts and cross-device synchronization
- staff or administration portals
- authoritative stock, pricing, customer, and order data
- real order acceptance, payment, approval, tracking, or fulfillment

The draft-details and receipt flow saves a **local design draft**, not a real customer order.

## Phase status

### P0 — safe foundation and rebrand

Complete on `agent/bgd-ink-p0-foundation`:

- centralized BGD/INK brand configuration
- removed public prototype admin access, hardcoded PINs, browser-exposed secrets, and false offline claims
- migrated old local browser keys without destroying recovery data
- added a permanent brand source-of-truth check

### P1 — engineering foundation

Complete on `agent/bgd-ink-p0-foundation`:

- compiled Tailwind CSS, strict TypeScript, warning-free ESLint, and Prettier
- application source under `src/` with the `@/` alias and enforced import boundaries
- History API routes and direct-route hosting fallback
- recoverable IndexedDB designs, draft details, and My Designs workspace
- locked Node/npm environment, committed lockfile, cached `npm ci`, tests, CI, and bundle budgets

### P2 — production-quality local customizer

In progress on `agent/bgd-ink-p2-models-print-areas`:

- honest product-model readiness; no unrelated garment geometry is substituted
- Classic T-shirt front/back surfaces, centimeter placement, safe boundaries, and surface-specific cameras
- aspect-ratio-aware artwork dimensions
- source pixels, transparency, padding, effective DPI, and quality warnings
- undo/redo and complete layer controls
- explicit View, Move, and Resize/Rotate modes
- one- and two-pointer gestures
- adaptive rendering profiles, WebGL recovery, and safe 2D fallback
- downloadable multi-surface PNG proof and URL-free JSON specification
- profile-aware GPU preview textures that preserve original IndexedDB artwork
- measured GLB geometry and embedded-texture budgets

P2 still depends on real physical inputs: confirmed Classic T-shirt calibration, genuine oversized T-shirt/hoodie/vest models, supported sleeve surfaces, geometry-aware seam warnings, and final asset compression.

### P3 — premium storefront and customer journey

In progress on `agent/bgd-ink-p3-premium-storefront`:

- editorial print-lab homepage and model-aware Studio Workbench
- owned local SVG garment library for the four configured products
- owned icon system instead of emoji process art
- removal of remote stock imagery, fabricated-looking testimonials, and unsupported product or delivery promises
- catalog hierarchy built around model readiness, availability, local starting price, configured colours, and editor sizes
- premium header, RTL-aware mobile navigation, footer, and prototype notice
- permanent storefront trust gate
- `/guide` route with verified-versus-pending expectations, garment-measurement instructions, reference-only method education, artwork preparation, prototype policies, and FAQs
- recoverable local quantity preparation alongside size and colour
- serialized detail/quantity autosaves that prevent lost updates
- touch-first local draft receipt with draft-ID copy, prepared variant, quantity, local estimate, and direct My Designs/new-draft actions
- English/Iraqi-Arabic guide and direct-route browser coverage
- Three.js kept out of the initial storefront bundle

Still open in P3:

- approved real product and completed-work photography
- confirmed prices, production times, product specifications, method availability, and product-specific size charts
- official contact channels
- approved returns, care, privacy, and fulfillment policies
- complete Iraqi-Arabic editorial and RTL review
- representative physical phone and tablet validation

## Brand

Brand values live in `src/config/brand.ts`:

- customer-facing name: **BGD/INK**
- product name: **BGD/INK Studio**
- tagline: **Design it. Wear it.** / **صمّمها والبسها**
- primary market: Baghdad, Iraq

`npm run check:brand` prevents customer-facing source files from reintroducing old or hardcoded brand literals.

## Technology

- React 18 and strict TypeScript
- Vite and compiled Tailwind CSS 4
- React Three Fiber, Drei, and Three.js
- GSAP
- IndexedDB for local drafts and original artwork blobs
- Canvas-based local PNG proof generation
- JSON local production specifications
- Vitest, Testing Library, fake IndexedDB, and axe
- Playwright for desktop and mobile Chromium journeys
- ESLint and Prettier

## Requirements

- Node.js **22.23.1**
- npm **10.9.8**
- Git LFS for GLB assets

## Local development

```bash
git lfs install
nvm use
npm ci
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
→ warning-free ESLint
→ brand source-of-truth validation
→ architectural import-boundary validation
→ measured GLB asset budgets
→ storefront content-trust validation
→ unit, component, and accessibility tests
→ production build
→ JavaScript and CSS bundle budgets
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

The current P3 fast suite contains **55 unit/component/accessibility tests across 20 files**. Seven Chromium journeys cover draft/detail/quantity recovery, artwork quality, layer history, mobile Arabic/RTL navigation, WebGL/2D recovery, real PNG/JSON downloads, and the bilingual Studio Guide.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Premium landing page |
| `/catalog` | Model-aware garment selection |
| `/guide` | Size preparation, methods, policies, and FAQ |
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
- layer placement, rotation, aspect ratio, and physical scale
- source dimensions, transparency, padding, and quality metadata
- local contact and address fields
- local submission linkage

My Designs can reopen, rename, duplicate, and permanently delete local drafts. Duplicated designs receive independent artwork blobs and preserve the prepared quantity while clearing contact details and submission status.

The draft-preparation page serializes contact and quantity writes so rapid edits cannot overwrite one another. Submit waits for the latest queued state before creating the browser-local summary.

The original artwork remains separate from object URLs, Three.js preview textures, PNG proofs, and JSON specifications. Clearing browser data can permanently remove local designs; there is no server backup or account recovery.

## Local quantity and receipt

The size and colour selected in the editor are joined by a recoverable local quantity from 1 to 50. The interface calculates a local estimate from the configured unit price and repeats that it is not a quotation, stock reservation, or confirmed order.

After saving, the local receipt shows:

- draft identifier with copy action
- garment, size, and colour
- local quantity
- local estimate
- direct actions to My Designs, a new draft, or the homepage

Refreshing the receipt route can still show the draft identifier, while My Designs remains the source for reopening browser-local content.

## Customizer interaction modes

- **View Garment:** orbit and zoom the product camera
- **Move Design:** drag the selected visible layer within its safe print surface
- **Resize/Rotate:** drag or use two pointers for pinch-and-twist transforms

Artwork modes remain disabled until a visible layer is selected. Continuous gestures are grouped into one undoable history action.

## Rendering and texture resilience

The editor selects high, balanced, or low-power settings from available device hints. Profiles can adjust DPR, antialiasing, shadows, anisotropy, idle animation, power preference, and maximum derived artwork-texture dimensions.

| Profile | Maximum preview dimension |
| --- | ---: |
| High | 2048 px |
| Balanced | 1536 px |
| Low power | 1024 px |

The cap also respects the WebGL hardware limit. Smaller files are not enlarged, aspect ratio is preserved, and generated GPU textures are disposed when no longer needed.

Rendering pauses while the page is hidden. When WebGL is unavailable or loses context, the app switches to a safe local 2D preview without discarding the draft.

## Local production files

The customizer can generate:

### PNG proof

- every configured product surface
- product, size, colour, draft name, and ID
- physical print-area dimensions and safe margins
- visible artwork placement, rotation, order, and layer names
- an explicit calibration warning

### JSON specification

- product and draft metadata
- documented viewer-facing centimeter coordinates
- every configured surface
- visible and hidden layers
- physical dimensions, center and edge offsets, and rotation
- source file metadata, dimensions, aspect ratio, and transparency
- estimated DPI, quality level, and warnings
- explicit `unverified` physical calibration

Temporary `blob:` preview URLs are excluded. These files are planning and handoff aids, not authorization to print.

## Studio Guide

The `/guide` route deliberately separates verified implementation facts from information that still needs real business or production confirmation.

It includes:

- current storefront expectations
- how to measure an existing garment rather than guessing body measurements
- a clear pending state for exact product size charts
- reference-only DTF, screen-printing, and embroidery trade-offs
- artwork-preparation checklist
- local-data, artwork-rights, colour-preview, calibration, and no-commerce policies
- bilingual FAQ

The method descriptions do not claim that those methods are currently offered. Prototype policies do not replace approved business policies.

## 3D asset budgets

`npm run check:assets` validates every GLB under `public/` after Git LFS checkout. It rejects unresolved LFS pointers, invalid glTF 2.0 binaries, and assets that exceed reviewed limits.

| Metric | Limit |
| --- | ---: |
| GLB file size | 1,400,000 bytes |
| Triangle count | 25,000 |
| Mesh count | 4 |
| Material count | 4 |
| Embedded texture dimension | 1024 px |
| Embedded texture size | 1,100,000 bytes |

Current Classic T-shirt baseline:

| Metric | Current |
| --- | ---: |
| GLB file size | 1,284.25 KiB |
| Geometry | 1 mesh, 1 primitive, 7,202 triangles |
| Materials | 1 |
| Embedded textures | 3 at 1024 × 1024 |
| Largest embedded texture | 986.63 KiB JPEG |
| Geometry compression | None |
| Texture compression | None |

Final approved models should be tested with Meshopt or Draco and KTX2/Basis where the visual and compatibility trade-offs are acceptable.

## Performance budgets

The P3 storefront keeps Three.js lazy. Current measured production baseline:

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 97.32 KiB | 140 KiB |
| Initial CSS, gzip | 15.30 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 230 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 800 KiB |
| Total JavaScript, gzip | 400.06 KiB | 410 KiB |
| Total JavaScript, raw | 1,363.73 KiB | 1,400 KiB |
| Total CSS, gzip | 15.30 KiB | 16.5 KiB |

The CSS limit was deliberately reviewed for the P3 editorial visual system. JavaScript and CSS limits should not be raised automatically.

## Prototype safety boundaries

- no public admin portal
- no browser-exposed API keys
- no real order, payment, inventory reservation, delivery promise, or fulfillment workflow
- no account recovery or cross-device synchronization
- no remote artwork upload
- official contact actions appear only after verified destinations are configured
- generated proofs and specifications use unverified physical calibration until confirmed
- PWA/offline claims remain disabled until reliable caching exists

Do not use the local prototype for real customer orders or sensitive production data.

## Documentation

- [P3 storefront direction](docs/P3-STOREFRONT-DIRECTION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Roadmap](tasks.md)
