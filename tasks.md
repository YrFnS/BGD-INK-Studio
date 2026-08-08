# BGD/INK Studio Roadmap

## Project objective

Build a high-quality bilingual custom-printing experience for Baghdad with an accurate local 3D editor, strong same-device draft recovery, a premium storefront, and trustworthy frontend delivery.

## Active scope decision — frontend and browser-local

Backend, production database, account, and remote-storage work remain paused until explicitly reopened.

For the active roadmap:

- The application remains a React/Vite frontend.
- Products come from typed local configuration.
- Designs and original artwork remain in browser IndexedDB on the current device.
- Prepared receipts remain local drafts; they are not real shop orders.
- No authoritative inventory, pricing, payment, delivery, or fulfillment system is implied.
- Public SEO and PWA behavior remain honest about these boundaries.

## Branch stack

```text
main
└── agent/bgd-ink-p0-foundation
    └── agent/bgd-ink-p2-models-print-areas
        └── agent/bgd-ink-p3-premium-storefront
            └── agent/bgd-ink-p4-delivery-seo-pwa
```

## P0 — Safe foundation and rebrand — COMPLETE

- [x] Create `agent/bgd-ink-p0-foundation` from `main`.
- [x] Introduce one centralized BGD/INK brand configuration.
- [x] Replace customer-facing ASHUS and اشوز references with brand tokens.
- [x] Rename package, metadata, manifest, title, header, footer, preloader, draft prefix, and storage namespace.
- [x] Preserve legacy `ashus_*` browser data through non-destructive migration.
- [x] Remove browser-exposed Gemini/API-key configuration.
- [x] Remove the hardcoded client-side admin PIN and public admin entry.
- [x] Label browser persistence and receipts explicitly as local prototype drafts.
- [x] Keep typed local product, artwork, draft, and submission boundaries.
- [x] Remove misleading service-worker and offline claims from the unsafe prototype.
- [x] Replace the false completed checklist with this maintained roadmap.
- [x] Enforce the brand source of truth in CI.

## P1 — Engineering foundation — COMPLETE

- [x] Compile Tailwind locally and move global styles out of `index.html`.
- [x] Remove the import map and runtime Tailwind CDN.
- [x] Move application source under `src/`.
- [x] Configure the `@/` alias and enforce architectural import boundaries.
- [x] Enable strict TypeScript.
- [x] Add zero-warning ESLint and Prettier.
- [x] Add environment and runtime validation.
- [x] Add unit, component, failure-state, accessibility, Arabic RTL, and mobile tests.
- [x] Add Playwright recovery and mobile navigation journeys.
- [x] Add GitHub Actions for locked install, typecheck, lint, tests, build, and budgets.
- [x] Add real routes for catalog, designs, editor, draft preparation, and local receipt.
- [x] Add recoverable IndexedDB drafts, original artwork blobs, autosave, and preparation recovery.
- [x] Add My Designs reopen, rename, duplicate, and delete actions.
- [x] Replace AI Studio documentation with setup, architecture, safety, deployment, and troubleshooting guidance.
- [x] Pin Node.js and npm, commit the lockfile, cache `npm ci`, and cancel superseded runs.
- [x] Split the 3D dependency graph into lazy chunks and enforce production budgets.

## P2 — Production-quality local customizer — ENGINEERING COMPLETE; PHYSICAL INPUTS PENDING

### Models and physical surfaces

- [ ] Use a genuine optimized 3D model for every locally configured product.
- [x] Stop substituting the T-shirt GLB for products without matching geometry.
- [x] Define initial front and back physical print areas for the Classic T-shirt.
- [x] Add Classic T-shirt front/back selection and surface-specific cameras.
- [x] Constrain movement and scale to the configured safe boundary.
- [ ] Confirm Classic T-shirt measurements against the exact garment and printing process.
- [ ] Add genuine oversized T-shirt, hoodie, and vest models and calibrate their surfaces.
- [ ] Add sleeve and other supported surfaces where genuine geometry permits them.
- [ ] Add seam and unsafe-placement warnings tied to calibrated geometry.

### Editing and local persistence

- [x] Add bounded undo and redo for colour, size, layers, placement, scale, and rotation.
- [x] Add layer rename, duplicate, visibility, ordering, selection, and deletion.
- [x] Preserve layer metadata and retained artwork assets in IndexedDB.
- [x] Add keyboard history shortcuts and gesture-aware history grouping.
- [x] Keep deletion non-destructive during editing so undo can restore artwork.

### Artwork dimensions and quality

- [x] Preserve source aspect ratio in 3D and 2D previews.
- [x] Track physical width and height in centimetres.
- [x] Read source dimensions for PNG, JPEG, and WebP locally.
- [x] Estimate effective print DPI.
- [x] Detect transparency, padding, extreme ratios, low resolution, and edge proximity.
- [x] Add resilient browser decoding and format-header fallbacks.
- [x] Keep original IndexedDB artwork separate from previews and exports.

### Mobile interaction and rendering resilience

- [x] Separate camera controls from artwork controls.
- [x] Add View, Move, and Resize/Rotate modes.
- [x] Add one-pointer and pinch/twist gestures.
- [x] Group gestures into single history actions.
- [x] Select adaptive rendering profiles from device capabilities.
- [x] Adapt DPR, antialiasing, shadows, textures, and idle animation.
- [x] Pause hidden-page rendering and use demand rendering on constrained devices.
- [x] Detect WebGL support and handle context loss without losing the draft.
- [x] Add a retryable local 2D fallback.

### Local output and assets

- [x] Generate a downloadable multi-surface PNG proof.
- [x] Generate a machine-readable JSON specification with centimetre placement and quality data.
- [x] Keep generated files separate from original artwork and omit temporary preview URLs.
- [x] Cap derived preview textures by rendering profile.
- [x] Audit current GLBs for file size, geometry, materials, and textures.
- [x] Establish measured GLB and artwork-texture budgets.
- [ ] Compress and re-audit approved final garment assets after genuine models are available.

## P3 — Premium storefront and customer journey — BROWSER IMPLEMENTATION COMPLETE; BUSINESS INPUTS PENDING

### Identity, assets, and trust

- [x] Create `agent/bgd-ink-p3-premium-storefront` from P2.
- [x] Establish the editorial print-lab visual direction.
- [x] Add owned vector garment artwork for all configured products.
- [x] Replace customer-facing stock imagery and emoji graphics.
- [x] Remove fabricated-looking testimonials and unsupported promises.
- [x] Add permanent storefront trust validation.
- [x] Separate verified capabilities from pending business information.
- [ ] Add approved real product photography.
- [ ] Add approved completed-customer-work photography.
- [ ] Finish the wider campaign asset library after photography and channels are approved.

### Storefront and catalog

- [x] Rebuild the homepage around real editor and local-draft capabilities.
- [x] Add a lightweight model-aware workbench without initial Three.js loading.
- [x] Rebuild the catalog around model readiness, local price, colours, and sizes.
- [x] Keep unfinished products visible but honestly locked.
- [x] Add local-price and no-real-order context.
- [x] Redesign desktop and mobile navigation, notices, and footer.
- [x] Migrate legacy product records to owned imagery.
- [x] Add `/guide` with measurement, method, policy, and FAQ guidance.
- [x] Keep unverified size, time, price, and method information visibly pending.
- [x] Add reference-only method education without claiming availability.
- [x] Add stable, mobile-friendly Guide section navigation.
- [ ] Confirm price ranges, production times, size guides, and available methods.

### Customer journey and localization

- [x] Add local-data, artwork-rights, colour-preview, calibration, and no-commerce guidance.
- [x] Add an honest bilingual FAQ.
- [x] Add recoverable quantity and a clearly labelled local estimate.
- [x] Serialize contact and quantity autosaves.
- [x] Add a touch-first preparation flow and receipt.
- [x] Persist language and synchronize `lang`, `dir`, and `data-language`.
- [x] Complete Iraqi-Arabic editorial and contextual RTL review.
- [x] Keep technical values stable inside RTL layouts.
- [x] Replace submitted/sent wording with prepared-locally wording.
- [x] Add permanent localization and RTL validation.
- [x] Localize Baghdad area labels while retaining stable stored values.
- [x] Add accessible validation, load retry, and autosave retry.
- [ ] Add official contact information after verification.
- [ ] Add approved privacy, return, care, and fulfillment policies.
- [ ] Add reviews only when tied to verifiable work.

### Performance and responsive finalization

- [x] Replace the shipped GSAP runtime with a focused Web Animations adapter.
- [x] Preserve existing motion behavior with regression tests.
- [x] Reduce and re-budget initial and total JavaScript.
- [x] Add safe areas, dynamic viewport height, keyboard resizing, and short-landscape handling.
- [x] Add reliable reduced-motion-aware same-page navigation.
- [x] Add a permanent responsive-shell gate.
- [x] Add Pixel 5, iPhone 13, and iPad Mini-sized browser journeys.
- [ ] Validate on representative physical Android, iPhone, and tablet hardware.

## P4 — Frontend delivery, SEO, PWA, and handoff — CODE FOUNDATION COMPLETE

### Public delivery and search

- [x] Create `agent/bgd-ink-p4-delivery-seo-pwa` from P3.
- [x] Keep preview and unknown-domain builds non-indexable by default.
- [x] Add optional production canonical URLs behind verified environment configuration.
- [x] Add Open Graph and Twitter metadata with owned social artwork.
- [x] Add honest organization, website, application, collection, and product structured data.
- [x] Generate sitemap and robots output for verified indexable production builds.
- [x] Exclude My Designs, editor, preparation, and receipt routes from indexing.
- [x] Add permanent delivery-output validation.
- [ ] Configure the verified production domain when selected.

### Installable and cached application shell

- [x] Add owned favicon, Apple touch, standard, and maskable icons.
- [x] Add an owned install manifest with Catalog and Guide shortcuts.
- [x] Register the service worker only in production and a secure context or localhost.
- [x] Add versioned shell and same-origin static-asset caching.
- [x] Add network-first navigation with cached-shell fallback.
- [x] Require explicit confirmation before activating a waiting update.
- [x] Add bilingual install, update, and honest offline notices.
- [x] Add source and generated-output PWA validation.
- [x] Add a production-only Chromium journey proving offline reopening of visited public routes.

### Communication and external services

- [x] Add a conditional WhatsApp draft handoff without treating WhatsApp as a database.
- [ ] Configure the official WhatsApp number after verification.
- [ ] Select an analytics provider and approve consent/privacy wording before enabling tracking.
- [ ] Select an error-monitoring provider and approve data-retention rules.
- [ ] Define campaign, coupon, bulk-order, and repeat-order rules before building customer-facing offers.
- [x] Enforce production performance budgets.

## P5 — Pre-launch hardening — COMPLETE

- [x] Flush pending customizer and checkout data before internal navigation.
- [x] Flush on browser history transitions and best-effort page lifecycle events.
- [x] Keep language changes from reloading the active editor.
- [x] Remove the duplicate local receipt store and purge obsolete customer-contact records.
- [x] Make IndexedDB draft updates atomic and revisioned.
- [x] Retain artwork needed by bounded undo/redo while deleting unreferenced assets.
- [x] Require both an explicit verified public URL and explicit indexing approval.
- [x] Keep preview builds free of canonical URLs and public-site metadata.
- [x] Localize WhatsApp handoff labels and resolve product translation keys.
- [x] Correct and validate every owned PWA product asset.
- [x] Remove third-party font requests and add a production Content Security Policy.
- [x] Localize global loading and application-recovery states.
- [x] Remove the unused GSAP runtime dependency and restore practical CSS budget headroom.

## Paused infrastructure — outside the active roadmap

The following remain untouched until backend, database, and storage work is explicitly reopened:

- Production backend selection or implementation
- Product, customer, inventory, pricing, or order database
- Account synchronization or cross-device recovery
- Remote artwork storage
- Authenticated staff operations
- Real order acceptance, approval, tracking, or fulfillment
- Authoritative stock reservation, delivery tracking, production queues, or work orders

## Current definition of done

The responsible code-only frontend scope is complete when:

- Every implemented behavior has failure-state handling.
- Tests, documentation, dependency locking, architecture checks, and budgets pass.
- Preview and production delivery behavior remain honest.
- Unverified business, physical, privacy, and contact information is not invented.

That condition is now satisfied. Remaining checklist items require approved physical assets, business information, providers, hardware, deployment domain, or an explicit decision to reopen backend infrastructure.
