# BGD/INK Studio Roadmap

## Project objective

Build a production-grade bilingual custom-printing platform for Baghdad with an accurate 3D editor, durable artwork storage, secure order processing, and practical staff operations.

## P0 — Safe foundation and rebrand

- [x] Create `agent/bgd-ink-p0-foundation` from `main`.
- [x] Introduce centralized BGD/INK brand configuration.
- [x] Rename package, metadata, manifest, document title, header, footer, preloader, draft prefix, and browser-storage namespace.
- [x] Preserve old browser data through a non-destructive `ashus_*` migration.
- [x] Remove browser-exposed Gemini/API-key injection.
- [x] Remove the hardcoded client-side admin route and PIN.
- [x] Stop presenting local browser drafts as confirmed orders.
- [x] Remove placeholder contact actions unless real values are configured.
- [x] Disable obsolete service-worker/offline behavior.
- [x] Restore browser zoom and add reduced-motion handling.
- [x] Replace AI Studio boilerplate with accurate project documentation.
- [x] Document prototype safety boundaries and future production requirements.
- [x] Validate the branch with a clean dependency install, TypeScript check, and production build through the Netlify deploy preview.

## P1 — Engineering and local platform foundation

- [x] Move Tailwind from the browser CDN into the compiled Vite pipeline.
- [x] Enable strict TypeScript, Vite client types, ESLint flat config, and Prettier.
- [x] Add a full `typecheck → lint → test → build → bundle budgets` quality gate to Netlify and GitHub Actions.
- [x] Implement a typed local `PlatformApi` facade.
- [x] Route catalog loading and draft submission through the service boundary.
- [x] Add catalog loading, retry, abort, validation, and accessible product-card states.
- [x] Keep one explicit local prototype data source with no hidden remote fallback.
- [x] Add URL-based navigation with browser Back/Forward support and direct-link fallbacks.
- [x] Persist recoverable design drafts, artwork blobs, transforms, notes, and checkout details in IndexedDB.
- [x] Rehydrate temporary preview URLs safely and autosave ordered customizer changes.
- [x] Add a bilingual recent-designs workspace with reopen, rename, duplicate, and permanent-delete actions.
- [x] Duplicate drafts atomically with independent artwork blobs and reset checkout/submission state.
- [x] Add Vitest route and IndexedDB lifecycle tests with fake IndexedDB.
- [x] Add Testing Library component coverage and an axe accessibility scan for My Designs.
- [x] Add a Playwright Chromium journey covering upload, refresh recovery, checkout recovery, submission, and workspace status.
- [x] Run fast tests in the deployment gate and the Chromium journey as a dependent CI job.
- [x] Pin Node.js and npm, commit `package-lock.json`, use `npm ci`, and cache npm by lockfile hash in CI.
- [x] Enforce route-aware initial, lazy-chunk, total JavaScript, and CSS production bundle budgets.
- [x] Fail lint validation when any warning is introduced.
- [x] Remove the unused remote integration path and its configuration, adapter, and documentation.
- [ ] Move application source under `src/` and enforce import boundaries.
- [ ] Expand automated coverage across catalog errors, customizer failures, checkout validation, Arabic RTL, and mobile interaction.
- [ ] Reduce and split the large lazy 3D customizer bundle below the current performance baseline.
- [ ] Define the production data architecture from confirmed business, hosting, inventory, and staff requirements.
- [ ] Implement a secure remote catalog and order service only after that architecture is selected.
- [ ] Create authenticated staff operations outside the public storefront bundle.
- [ ] Persist products, variants, stock, pricing, customers, and orders in the selected production system.
- [ ] Store original artwork and generated previews in S3-compatible object storage.

## P2 — Production-grade customizer

- [ ] Use a genuine optimized 3D model for every sellable product.
- [ ] Define front, back, sleeve, and other physical print areas in centimeters.
- [ ] Constrain artwork to printable surfaces and warn about seams or unsafe placement.
- [ ] Add layer ordering, visibility, rename, duplicate, undo, redo, and keyboard controls.
- [ ] Add image-resolution, transparency, aspect-ratio, and estimated-DPI checks.
- [ ] Separate original artwork, preview textures, and production files.
- [ ] Generate a 2D proof plus machine-readable placement specification.
- [ ] Add adaptive mobile rendering, WebGL fallback, and GPU/context recovery.

## P3 — Premium storefront and customer journey

- [ ] Establish the full BGD/INK visual identity and owned asset library.
- [ ] Replace generic stock imagery, emoji, and unverified testimonials.
- [ ] Build accessible product cards, size guides, quantities, variants, and delivery estimates.
- [ ] Complete Iraqi Arabic localization and RTL review.
- [ ] Add truthful production, material, care, returns, privacy, and artwork policies.
- [ ] Add cart behavior, clear totals, and production-grade order confirmation.
- [ ] Optimize the editor and checkout for touch-first mobile use.

## P4 — Operations, PWA, SEO, and growth

- [ ] Add production queues, artwork approval, status timelines, and staff audit trails.
- [ ] Create production work orders and inventory reservations from validated customer orders.
- [ ] Add configured WhatsApp notifications without making WhatsApp the order database.
- [ ] Implement Workbox-based PWA caching with local owned icons and upgrade handling.
- [ ] Add structured product data, canonical URLs, social cards, sitemap, and robots controls.
- [ ] Add privacy-respecting analytics, consent, error monitoring, and performance budgets.
- [ ] Add campaigns, coupons, bulk orders, corporate accounts, and repeat-order flows.

## Definition of done

A phase is complete only when its user-facing behavior, failure states, tests, documentation, dependency lock, performance budgets, and deployment checks all pass. Visual completion alone is not completion.
