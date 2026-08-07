# BGD/INK Studio Roadmap

## Project objective

Build a production-grade bilingual custom-printing platform for Baghdad with an accurate 3D editor, durable artwork storage, secure order processing, and practical staff operations.

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

## Deferred production decisions — not a P1 blocker

- [ ] Confirm business, hosting, inventory, staff, order, and data-retention requirements.
- [ ] Select and implement a secure production catalog and order architecture.
- [ ] Add authenticated staff operations outside the public storefront.
- [ ] Store products, variants, pricing, stock, customers, and orders in the selected production system.
- [ ] Store original artwork and generated derivatives in durable object storage.

## P2 — Production-grade customizer

- [ ] Use a genuine optimized 3D model for every sellable product.
- [ ] Define front, back, sleeve, and other physical print areas in centimeters.
- [ ] Add front, back, and sleeve surface selection.
- [ ] Constrain artwork to printable surfaces and warn about seams or unsafe placement.
- [ ] Add undo and redo.
- [ ] Add layer duplicate, visibility, ordering, and rename controls.
- [ ] Add precise physical dimensions.
- [ ] Add image-resolution, transparency, aspect-ratio, and estimated-DPI checks.
- [ ] Add permanent production upload before accepting a real order.
- [ ] Distinguish mobile camera gestures from artwork movement.
- [ ] Add adaptive render quality, WebGL fallback, and context recovery.
- [ ] Generate a saved 2D proof and machine-readable production specification.
- [ ] Keep original artwork separate from preview and production derivatives.
- [ ] Optimize GLB assets and production textures with measured limits.

## P3 — Premium storefront and customer journey

- [ ] Establish the complete BGD/INK identity and owned visual asset library.
- [ ] Replace generic stock imagery, emoji, and unverified testimonials.
- [ ] Add real product photography and completed customer work.
- [ ] Add price ranges, production times, size guides, and printing-method explanations.
- [ ] Add quantities, variants, stock, delivery fees, and estimated delivery dates.
- [ ] Complete the Iraqi Arabic and RTL content review.
- [ ] Add real contact information, policies, care guidance, and frequently asked questions.
- [ ] Keep motion intentional, accessible, and restrained.
- [ ] Finish a touch-first mobile customizer and checkout.
- [ ] Link reviews to real orders or remove them.

## P4 — Operations, PWA, SEO, and growth

- [ ] Add production queues, artwork approval, status timelines, and staff audit trails.
- [ ] Create production work orders and inventory reservations from validated customer orders.
- [ ] Add WhatsApp notifications as a communication channel, not the order database.
- [ ] Add delivery tracking, coupons, campaigns, corporate accounts, bulk orders, and repeat orders.
- [ ] Add consent-aware analytics and error monitoring.
- [ ] Add structured product data, canonical URLs, social cards, sitemap, and robots controls.
- [ ] Add owned PWA icons and reliable Workbox caching with upgrade handling.
- [x] Enforce production performance budgets.

## Definition of done

A phase is complete only when its behavior, failure states, tests, documentation, dependency lock, architecture checks, performance budgets, and deployment checks all pass. Visual completion alone is not completion.
