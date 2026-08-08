# BGD/INK Studio

BGD/INK Studio is a bilingual English/Arabic local web application for designing and previewing custom-printed apparel in 3D.

> Designs, artwork, checkout fields, submitted draft summaries, and generated production files stay on the current device. They are not sent to a shop, synchronized between devices, or written to a production database.

## Current scope

The project is intentionally **frontend and local-only for now**.

Active work includes:

- The React/Vite storefront
- The 3D product customizer
- Browser-local IndexedDB drafts and original artwork blobs
- Local design recovery, proofs, and machine-readable exports
- Accessibility, mobile interaction, Iraqi Arabic, performance, PWA, and SEO

Paused until explicitly reopened:

- Backend development
- Production databases
- Remote object storage
- User accounts and cross-device synchronization
- Staff or administration portals
- Real product, stock, pricing, customer, and order persistence
- Real order acceptance, approval, tracking, or fulfillment

The current checkout and confirmation flow saves a **local design draft**, not a real customer order.

## P0 and P1 status

P0 and P1 are complete on `agent/bgd-ink-p0-foundation`:

- Central BGD/INK brand configuration and enforced brand source of truth
- Removed public prototype admin access, hardcoded PINs, client-side secrets, and false offline claims
- Compiled Tailwind CSS, strict TypeScript, warning-free ESLint, and Prettier
- Source code under `src/` with the `@/` alias and enforced import boundaries
- Recoverable URL routes, IndexedDB artwork and drafts, checkout recovery, and My Designs
- Unit, component, accessibility, desktop Chromium, mobile touch, and Arabic RTL coverage
- Pinned Node/npm, locked `npm ci`, CI caching, and route-aware bundle budgets
- Troubleshooting and prototype-safety documentation

## P2 status

P2 is in progress on `agent/bgd-ink-p2-models-print-areas`.

Completed local-customizer work includes:

- Honest product-model capability checks; products without genuine matching geometry are not opened with a fake T-shirt model
- Classic T-shirt front and back print surfaces with centimeter dimensions, safe boundaries, and surface-specific cameras
- Aspect-ratio-aware artwork width and height
- Source pixel, transparency, padding, and effective-DPI analysis performed locally in the browser
- Low-resolution, extreme-aspect-ratio, transparent-padding, and near-edge warnings
- Undo and redo with grouped pointer and slider gestures
- Layer rename, duplicate, visibility, ordering, selection, and non-destructive deletion
- Explicit **View Garment**, **Move Design**, and **Resize/Rotate** interaction modes
- One-pointer movement and transform gestures plus two-pointer pinch-and-twist transforms
- Adaptive high, balanced, and low-power rendering profiles
- WebGL support detection, context-loss handling, retryable recovery, and a safe 2D preview
- Rendering pause while the page is hidden and demand rendering on constrained devices
- Downloadable multi-surface PNG production proofs
- URL-free JSON production specifications with centimeter placement and artwork quality metadata
- IndexedDB draft version 4, which preserves source pixels, aspect ratio, transparency, and padding analysis for exports and recovery
- Runtime artwork textures capped by rendering profile without modifying the original IndexedDB files
- CI inspection and enforcement for GLB file size, triangle count, mesh count, material count, and embedded texture dimensions and bytes

Still required before P2 is complete:

- Confirming physical measurements against the real Classic T-shirt and printing process
- Genuine optimized oversized T-shirt, hoodie, and vest models
- Calibrated sleeve and other product-specific surfaces
- Geometry-aware seam warnings
- Compression and re-audit of the approved final garment assets

The current Classic T-shirt asset passes the enforced limits but does not yet use Meshopt, Draco, or KTX2 compression. Compression is deliberately deferred until the final product assets are approved so work is not repeated on placeholder or incomplete models.

None of this P2 work adds backend, database, account, or remote-storage infrastructure.

## Brand

Brand values live only in `src/config/brand.ts`:

- Customer-facing name: **BGD/INK**
- Product name: **BGD/INK Studio**
- Tagline: **Design it. Wear it.** / **صمّمها والبسها**
- Primary market: Baghdad, Iraq

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

The fast gate performs:

```text
environment validation
→ strict TypeScript
→ warning-free ESLint
→ brand source-of-truth validation
→ import-boundary validation
→ measured GLB geometry and texture budgets
→ unit, component, and accessibility tests
→ production build
→ JavaScript and CSS bundle budgets
```

Current P2 coverage includes **45 unit/component/accessibility tests across 15 files** and **six Chromium customer journeys** covering recovery, artwork quality, layer editing, mobile Arabic/RTL navigation, rendering fallback behavior, and real PNG/JSON downloads.

Additional commands:

```bash
npm run typecheck
npm run lint
npm run check:environment
npm run check:brand
npm run check:boundaries
npm run check:assets
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

## Routes

| Route                | Purpose                   |
| -------------------- | ------------------------- |
| `/`                  | Landing page              |
| `/catalog`           | Product selection         |
| `/designs`           | Recent local designs      |
| `/studio/:draftId`   | Recoverable 3D editor     |
| `/checkout/:draftId` | Recoverable delivery form |
| `/draft/:draftId`    | Local draft confirmation  |

Browser Back/Forward navigation is supported. Netlify direct-route fallback is provided through `public/_redirects`.

## Local draft model

IndexedDB draft version 4 stores:

- Draft name, product, color, size, and notes
- Original PNG, JPEG, or WebP artwork blobs
- Layer names, visibility, ordering, active selection, and print surfaces
- Layer position, rotation, aspect ratio, and physical scale
- Source dimensions, transparency, padding, and other local artwork-analysis metadata
- Checkout contact and address fields
- Local submission linkage

The My Designs workspace can reopen, rename, duplicate, and permanently delete local designs. Duplicate designs receive independent artwork blobs.

The original artwork blob remains separate from generated object URLs, Three.js preview textures, PNG proofs, and JSON specifications. Export generation reads the original local preview data but never replaces or mutates the IndexedDB artwork blob. Preview URLs are recreated when a design is restored and revoked when the relevant screen closes.

IndexedDB is browser-local persistence, not production storage. Clearing browser data can permanently remove designs, and there is no server backup or cross-device recovery.

## Customizer interaction modes

The 3D editor deliberately separates gestures:

- **View Garment:** orbit and zoom the product camera
- **Move Design:** drag the selected visible layer within its safe print surface
- **Resize/Rotate:** drag horizontally to rotate and vertically to resize, or use two pointers for pinch-and-twist transforms

Move and transform controls remain disabled until a visible layer is selected. Gestures are grouped into single undoable history actions.

## Rendering resilience

The customizer chooses a rendering profile from device capabilities such as pointer type, viewport, hardware concurrency, optional device memory, reduced-motion preference, and data-saving preference.

Profiles can adjust:

- Device pixel ratio
- Antialiasing
- Shadows and shadow-map size
- Texture anisotropy
- Idle animation
- WebGL power preference
- Maximum derived artwork-texture dimensions

Rendering pauses while the document is hidden. Constrained devices use demand rendering rather than a permanent animation loop.

When WebGL is unavailable, its context is lost, or the garment model cannot render, the app switches to a safe local 2D preview without discarding the draft. A supported device can retry the 3D renderer from the same design state.

## Artwork preview textures

The original uploaded file remains untouched in IndexedDB. The 3D renderer creates a separate canvas-derived texture for GPU display and caps its largest dimension according to the selected rendering profile:

| Profile | Maximum preview dimension |
| --- | ---: |
| High | 2048 px |
| Balanced | 1536 px |
| Low power | 1024 px |

The cap also respects the browser-reported maximum WebGL texture size. Aspect ratio is preserved, smaller artwork is not enlarged, mipmaps remain enabled, and generated GPU textures are disposed when the layer or rendering profile changes.

These limits reduce GPU memory pressure without degrading the original file or the local production metadata.

## Local production files

The customizer route includes a collapsible **Production files** section below the editor. It reads the latest stable IndexedDB draft before generating either file.

### PNG proof

The PNG proof is a high-resolution, browser-generated sheet containing every configured product surface. It includes:

- Product, size, color, draft name, and draft ID
- Surface labels and physical print-area dimensions
- Safe-margin guides
- Visible artwork positioned and rotated from the saved centimeter placement
- Layer order and names
- A calibration warning

### JSON specification

The JSON specification contains:

- Product and draft metadata
- A documented centimeter coordinate system
- Every configured surface
- Visible and hidden layer state
- Layer order, width, height, center, edge offsets, and rotation
- Source file name, type, pixel dimensions, aspect ratio, and transparency data
- Estimated DPI, quality level, and warnings
- An explicit `unverified` calibration status requiring physical confirmation

Temporary `blob:` preview URLs are never included. Generated files are independent browser outputs and do not modify the original IndexedDB artwork.

These files are planning and handoff aids, not authorization to print. The physical print areas must still be confirmed against the exact garment blank and production method.

## 3D asset budgets

`npm run check:assets` validates every GLB under `public/` after Git LFS checkout. It fails when a model is still an LFS pointer, is not a valid glTF 2.0 binary, or exceeds a reviewed limit.

The current enforced per-model limits are:

| Metric | Limit |
| --- | ---: |
| GLB file size | 1,400,000 bytes |
| Triangle count | 25,000 |
| Mesh count | 4 |
| Material count | 4 |
| Embedded texture dimension | 1024 px |
| Embedded texture size | 1,100,000 bytes |

The measured Classic T-shirt baseline is:

| Metric | Current |
| --- | ---: |
| GLB file size | 1,284.25 KiB |
| Geometry | 1 mesh, 1 primitive, 7,202 triangles |
| Materials | 1 |
| Embedded textures | 3 at 1024 × 1024 |
| Largest embedded texture | 986.63 KiB JPEG |
| Geometry compression | None |
| Texture compression | None |

New models must pass the same audit. Final approved assets should then be tested with Meshopt or Draco geometry compression and KTX2/Basis textures where the visual and browser-compatibility tradeoffs are acceptable.

## Source architecture

```text
src/
  components/       shared presentation
  config/           brand, capability, and budget configuration
  contexts/         language, theme, and toast state
  data/             local products and 3D asset metadata
  features/         route-level customer experiences
  hooks/            shared React hooks
  routing/          History API routing
  services/         local application and IndexedDB services
  utils/            browser-local prototype helpers
  App.tsx           feature composition root
  main.tsx          browser entry point
  translations.ts   English and Iraqi Arabic copy
  types.ts          shared domain types
```

Cross-area imports use `@/`. Features cannot import another feature's internals, and lower-level modules cannot depend on feature or UI layers. `npm run check:boundaries` enforces these rules.

## Performance budgets

The build manifest is measured for initial assets, lazy assets, total JavaScript, and CSS. The limits are stored in `src/config/bundle-budgets.json`. The Three.js core is kept in a dedicated lazy vendor chunk rather than being loaded with the initial storefront.

Current validated measurements:

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 108.08 KiB | 140 KiB |
| Initial CSS, gzip | 11.37 KiB | 13 KiB |
| Largest lazy JavaScript chunk, gzip | 168.08 KiB | 230 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 800 KiB |
| Total JavaScript, gzip | 397.88 KiB | 410 KiB |
| Total JavaScript, raw | 1,340.77 KiB | 1,400 KiB |
| Total CSS, gzip | 11.37 KiB | 15 KiB |

The customizer route is approximately **79.16 KiB raw / 26.15 KiB gzip**. The lazy PNG/JSON export engine is approximately **8.73 KiB raw / 3.70 KiB gzip**. Three.js remains isolated in its lazy vendor chunk.

A budget change must be intentional and reviewed; it should not be the automatic response to a regression.

## Prototype safety boundaries

- There is no public admin portal.
- There are no browser-exposed API keys.
- Local submission creates a draft, not a confirmed order.
- Clearing browser storage can permanently remove local designs.
- There is no account recovery or cross-device synchronization.
- WhatsApp actions appear only when a real destination is configured.
- PWA/offline claims remain disabled until reliable caching is implemented.
- No backend, database, or remote object-storage integration is currently planned.
- Generated proofs and specifications use unverified local calibration values until physically confirmed.

Do not use the local prototype for real customer orders or sensitive production data.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for Git LFS, IndexedDB, artwork upload, WebGL, local production exports, asset-budget validation, deployment routing, Playwright, runtime, and bundle-budget guidance.

## Roadmap

The maintained P0-P4 checklist lives in [tasks.md](tasks.md). The active roadmap is frontend/local-only; paused infrastructure is listed separately and does not block P2 or P3.
