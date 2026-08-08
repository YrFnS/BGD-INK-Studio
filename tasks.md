# BGD/INK Studio Roadmap

## Project objective

Build a high-quality bilingual custom-printing experience for Baghdad with an accurate 3D editor, strong local draft recovery, and a polished customer journey.

## Current scope decision — frontend and local-only

Backend, production database, and remote file storage work are paused until explicitly reopened.

For the current roadmap:

- The application remains a frontend-only React/Vite project.
- Products continue to come from local typed configuration.
- Designs and original artwork remain in browser IndexedDB on the current device.
- Submitted designs remain local drafts; they are not accepted as real shop orders.
- No account system, staff portal, production API, database, inventory service, or object-storage integration will be built.
- P2 and P3 focus on the 3D customizer, customer experience, accessibility, mobile behavior, visual quality, and local exports.

The paused infrastructure work is listed near the end of this file so it does not block the active frontend roadmap.

## P0 — Safe foundation and rebrand — COMPLETE

- [x] Create `agent/bgd-ink-p0-foundation` from `main`.
- [x] Introduce one centralized BGD/INK brand configuration.
- [x] Replace customer-facing ASHUS and اشوز references with brand tokens.
- [x] Rename package, metadata, manifest, document title, header, footer, preloader, draft prefix, and storage namespace.
- [x] Preserve legacy `ashus_*` browser data through a non-destructive migration.
- [x] Remove browser-exposed Gemini/API-key configuration.
- [x] Remove the hardcoded client-side admin PIN and public admin entry.
- [x] Label browser persistence and submitted designs explicitly as local prototype drafts.
- [x] Keep typed local product, artwork, draft, and submission service boundaries.
- [x] Remove misleading service-worker and offline-mode claims.
- [x] Replace the false completed checklist with the maintained P0-P4 roadmap.
- [x] Enforce the brand source of truth in CI.

## P1 — Engineering foundation — COMPLETE

- [x] Compile Tailwind locally and move global styles out of `index.html`.
- [x] Remove the import map and runtime Tailwind CDN.
- [x] Move application source under `src/`.
- [x] Configure the `@/` module alias and enforce architectural import boundaries.
- [x] Enable strict TypeScript.
- [x] Add warning-free ESLint and Prettier.
- [x] Add environment and runtime validation.
- [x] Add unit, component, failure-state, accessibility, Arabic RTL, and mobile interaction tests.
- [x] Add Playwright customer recovery and mobile navigation journeys.
- [x] Add GitHub Actions for locked install, typecheck, lint, tests, build, budgets, and browser journeys.
- [x] Add real routes for catalog, designs, editor, checkout, and draft confirmation.
- [x] Add recoverable IndexedDB drafts, original artwork blobs, autosave, and checkout recovery.
- [x] Add the My Designs reopen, rename, duplicate, and delete workspace.
- [x] Replace AI Studio documentation with setup, architecture, deployment, safety, and troubleshooting guidance.
- [x] Pin Node.js and npm, commit the lockfile, use cached `npm ci`, and cancel superseded CI runs.
- [x] Split the 3D dependency graph into lazy vendor chunks and enforce tighter production bundle budgets.

## P2 — Production-quality local customizer

- [ ] Use a genuine optimized 3D model for every locally configured product.
- [ ] Define front, back, sleeve, and other physical print areas in centimeters.
- [ ] Add front, back, and sleeve surface selection.
- [ ] Constrain artwork to printable surfaces and warn about seams or unsafe placement.
- [ ] Add undo and redo.
- [ ] Add layer duplicate, visibility, ordering, and rename controls.
- [ ] Add precise physical dimensions.
- [ ] Add image-resolution, transparency, aspect-ratio, and estimated-DPI checks.
- [ ] Distinguish mobile camera gestures from artwork movement.
- [ ] Add adaptive render quality, WebGL fallback, and context recovery.
- [ ] Generate a downloadable 2D proof and machine-readable local production specification.
- [ ] Keep the original IndexedDB artwork blob separate from preview textures and generated exports.
- [ ] Optimize GLB assets and preview textures with measured limits.

## P3 — Premium storefront and customer journey

- [ ] Establish the complete BGD/INK identity and owned visual asset library.
- [ ] Replace generic stock imagery, emoji, and unverified testimonials.
- [ ] Add real product photography and completed customer work.
- [ ] Add locally configured price ranges, production times, size guides, and printing-method explanations.
- [ ] Add quantity and variant-selection UX using local product data.
- [ ] Complete the Iraqi Arabic and RTL content review.
- [ ] Add real contact information, policies, care guidance, and frequently asked questions.
- [ ] Keep motion intentional, accessible, and restrained.
- [ ] Finish a touch-first mobile customizer and draft-checkout experience.
- [ ] Link reviews to verifiable customer work or remove them.

## P4 — Frontend delivery, PWA, SEO, and growth

- [ ] Add a clear WhatsApp handoff for locally prepared design drafts without treating WhatsApp as a database.
- [ ] Add owned PWA icons and reliable Workbox caching with upgrade handling.
- [ ] Add structured product data, canonical URLs, social cards, sitemap, and robots controls.
- [ ] Add consent-aware analytics and client-side error monitoring.
- [ ] Add frontend campaign, coupon, bulk-design, and repeat-design experiences using local configuration where appropriate.
- [x] Enforce production performance budgets.

## Paused infrastructure — not part of the active roadmap

The following will remain untouched until backend, database, and storage work is explicitly reopened:

- Selecting or implementing a production backend.
- Creating a production database for products, customers, inventory, pricing, or orders.
- Building account synchronization or cross-device recovery.
- Uploading artwork to remote object storage.
- Building authenticated staff or administration operations.
- Accepting, tracking, approving, or fulfilling real production orders.
- Authoritative stock reservations, delivery tracking, production queues, or work orders.

## Definition of done

A phase is complete only when its behavior, failure states, tests, documentation, dependency lock, architecture checks, performance budgets, and deployment checks all pass. Visual completion alone is not completion.
