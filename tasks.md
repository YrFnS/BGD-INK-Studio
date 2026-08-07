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

## P2 — Production-quality local customizer — IN PROGRESS

### Models and physical surfaces

- [ ] Use a genuine optimized 3D model for every locally configured product.
- [x] Stop substituting the T-shirt GLB for products without matching geometry.
- [x] Define initial front and back physical print areas for the Classic T-shirt.
- [x] Add Classic T-shirt front/back surface selection and surface-specific camera views.
- [x] Constrain artwork movement and scale to the configured safe print boundary.
- [ ] Confirm Classic T-shirt measurements against the exact garment and printing process.
- [ ] Add genuine oversized T-shirt, hoodie, and vest models and calibrate their surfaces.
- [ ] Add sleeve and other supported surfaces where genuine model geometry permits them.
- [ ] Add explicit seam and unsafe-placement warnings tied to calibrated garment geometry.

### Editing and local persistence

- [x] Add bounded undo and redo for color, size, layer operations, placement, scale, and rotation.
- [x] Add layer rename, duplicate, visibility, ordering, selection, and deletion controls.
- [x] Preserve layer names, visibility, order, surfaces, quality metadata, and retained artwork assets in IndexedDB.
- [x] Add keyboard undo/redo shortcuts and gesture-aware history grouping.
- [x] Keep deletion non-destructive during the editing session so undo can restore the original artwork.

### Artwork dimensions and quality

- [x] Preserve source aspect ratio in the 3D and 2D previews.
- [x] Track precise physical artwork width and height in centimeters.
- [x] Read source pixel dimensions for PNG, JPEG, and WebP artwork locally.
- [x] Estimate effective print DPI from source pixels and selected physical dimensions.
- [x] Detect transparency, transparent padding, extreme aspect ratios, low resolution, and near-edge placement.
- [x] Add resilient image decoding with browser decoders and PNG/JPEG/WebP header fallbacks.
- [x] Keep the original IndexedDB artwork blob separate from temporary preview URLs and Three.js textures.

### Mobile interaction and rendering resilience

- [x] Separate garment camera controls from artwork movement and transformation.
- [x] Add explicit View Garment, Move Design, and Resize/Rotate interaction modes.
- [x] Add one-pointer move and transform gestures plus two-pointer pinch-and-twist transforms.
- [x] Group pointer gestures into single undoable history actions.
- [x] Select adaptive high, balanced, or low-power rendering profiles from device capabilities.
- [x] Adapt DPR, antialiasing, shadows, shadow resolution, texture anisotropy, and idle animation.
- [x] Pause rendering while the page is hidden and use demand rendering on constrained devices.
- [x] Detect WebGL support and handle context loss without losing the design draft.
- [x] Add a retryable, browser-local 2D preview when WebGL or the garment model cannot render.

### Local output and asset completion

- [x] Generate a downloadable multi-surface PNG proof for every configured print surface.
- [x] Generate a machine-readable local production specification with centimeter placement and quality data.
- [x] Keep generated proof assets separate from the original artwork blob and omit temporary preview URLs from specifications.
- [x] Cap derived Three.js artwork textures by rendering profile while preserving the original IndexedDB artwork.
- [x] Audit every current GLB in CI for file size, triangles, meshes, materials, embedded texture dimensions, and embedded texture bytes.
- [x] Establish measured GLB and artwork-texture budgets from the current Classic T-shirt baseline.
- [ ] Compress and re-audit the approved final garment GLBs and their embedded textures after genuine product assets are available.

## P3 — Premium storefront and customer journey — IN PROGRESS

### Identity, visual assets, and trust

- [x] Create `agent/bgd-ink-p3-premium-storefront` from the complete P2 branch.
- [x] Establish the editorial print-lab direction with paper, ink, signal-color, measurement-grid, and production-annotation language.
- [x] Add an owned vector garment library for all four locally configured catalog products.
- [x] Replace customer-facing stock photography with owned local assets.
- [x] Replace emoji process graphics with an owned SVG icon system.
- [x] Remove fabricated-looking anonymous testimonials instead of presenting them as customer proof.
- [x] Remove unsupported material, printing-method, wash-performance, superlative, and delivery claims.
- [x] Add a permanent CI trust gate for stock imagery, fabricated reviews, emoji icons, and unsupported promises.
- [x] Add a verified-versus-pending information system so unconfirmed prices, timing, measurements, and business details are visibly separated from implemented editor capabilities.
- [ ] Add approved real product photography.
- [ ] Add approved completed-customer-work photography.
- [ ] Finish the complete BGD/INK identity and owned campaign asset library.

### Premium storefront and catalog

- [x] Rebuild the homepage around the real editor, local-draft, quality-analysis, and export capabilities.
- [x] Add a premium model-aware studio workbench visual without loading Three.js on the homepage.
- [x] Rebuild the catalog hierarchy around model readiness, availability, starting price, configured colors, and editor sizes.
- [x] Keep unfinished products visible while clearly locking unavailable customization.
- [x] Add explicit local-price and no-real-order context.
- [x] Redesign the desktop header, RTL-aware mobile navigation, prototype notice, and footer.
- [x] Migrate legacy stored product records to owned canonical imagery while preserving local price, color, and stock values.
- [x] Add the `/guide` route with measurement instructions, method education, draft-preparation guidance, policies, and FAQs.
- [x] Explain that exact size charts, production timing, and price quotations remain pending rather than inventing values.
- [x] Add reference-only DTF, screen-printing, and embroidery explanations without claiming current availability.
- [ ] Confirm final price ranges with the business.
- [ ] Add confirmed production times.
- [ ] Add approved product-specific size guides.
- [ ] Add confirmed printing-method explanations.

### Customer journey and business information

- [x] Add prototype-specific local-data, artwork-rights, colour-preview, calibration, and no-commerce policies.
- [x] Add an honest bilingual FAQ covering orders, local storage, file formats, sizes, mobile editing, and pending contact channels.
- [x] Add an Iraqi-Arabic first pass for the guide, navigation labels, and mobile accessibility names.
- [x] Add unit accessibility coverage and a real English/Arabic Chromium guide journey.
- [x] Add recoverable local quantity preparation alongside the existing size/color variant selection, including a local estimate and explicit no-stock/no-quote wording.
- [x] Serialize contact and quantity autosaves so rapid local preparation changes cannot overwrite one another.
- [x] Finish touch-first draft-details and confirmation polish with a local receipt, draft-ID copy, prepared variant, quantity, estimate, and direct My Designs/new-draft actions.
- [ ] Add official contact information after verification.
- [ ] Add approved business policies, care guidance, and returns information.
- [ ] Complete the Iraqi Arabic editorial and terminology review.
- [ ] Review every RTL layout in the homepage, catalog, guide, editor, draft details, and confirmation flow.
- [ ] Validate the complete journey on representative physical phones and tablets.
- [ ] Link future reviews to verifiable customer work or keep the review section absent.

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
