# BGD/INK Studio Roadmap

## Project objective

Build a production-grade bilingual custom-printing platform for Baghdad with an accurate 3D editor, durable artwork storage, real order processing, and a Frappe/ERPNext operations backend.

## P0 — Safe foundation and rebrand

- [x] Create `agent/bgd-ink-p0-foundation` from `main`.
- [x] Introduce centralized BGD/INK brand configuration.
- [x] Rename package, metadata, manifest, document title, header, footer, preloader, order prefix, and browser-storage namespace.
- [x] Preserve old browser data through a non-destructive `ashus_*` migration.
- [x] Remove browser-exposed Gemini/API-key injection.
- [x] Remove the hardcoded client-side admin route and PIN.
- [x] Stop presenting local browser drafts as confirmed orders.
- [x] Remove placeholder contact actions unless real values are configured.
- [x] Disable obsolete service-worker/offline behavior.
- [x] Restore browser zoom and add reduced-motion handling.
- [x] Replace AI Studio boilerplate with accurate project documentation.
- [x] Document the production backend contract.
- [x] Validate the branch with a clean dependency install, TypeScript check, and production build through the Netlify deploy preview.

## P1 — Engineering and backend foundation

- [ ] Move Tailwind from the browser CDN into PostCSS/Vite.
- [ ] Introduce `src/`, strict TypeScript, ESLint, Prettier, and import boundaries.
- [ ] Add unit, component, accessibility, and Playwright end-to-end tests.
- [ ] Add GitHub Actions for install, type-check, lint, test, build, and bundle budgets.
- [ ] Add route-based navigation and recoverable design drafts.
- [ ] Implement a typed API adapter with development mocks and a Frappe production implementation.
- [ ] Create authenticated staff access in Frappe rather than the storefront bundle.
- [ ] Persist products, variants, stock, pricing, customers, and orders in Frappe.
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
- [ ] Add draft recovery, cart behavior, clear totals, and order confirmation.
- [ ] Optimize the editor and checkout for touch-first mobile use.

## P4 — Operations, PWA, SEO, and growth

- [ ] Add production queues, artwork approval, status timelines, and staff audit trails.
- [ ] Create ERPNext Sales Orders and inventory reservations from validated storefront orders.
- [ ] Add configured WhatsApp notifications without making WhatsApp the order database.
- [ ] Implement Workbox-based PWA caching with local owned icons and upgrade handling.
- [ ] Add structured product data, canonical URLs, social cards, sitemap, and robots controls.
- [ ] Add privacy-respecting analytics, consent, error monitoring, and performance budgets.
- [ ] Add campaigns, coupons, bulk orders, corporate accounts, and repeat-order flows.

## Definition of done

A phase is complete only when its user-facing behavior, failure states, tests, documentation, and deployment checks all pass. Visual completion alone is not completion.
