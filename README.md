# BGD/INK Studio

BGD/INK Studio is a bilingual English/Arabic local web application for designing and previewing custom-printed apparel in 3D.

> Designs, artwork, checkout fields, and submitted draft summaries stay on the current device. They are not sent to a shop, synchronized between devices, or written to a production database.

## Current scope

The project is intentionally **frontend and local-only for now**.

Active work includes:

- The React/Vite storefront
- The 3D product customizer
- Browser-local IndexedDB drafts and original artwork blobs
- Local design recovery and exports
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

Still required before P2 is complete:

- Confirming physical measurements against the real Classic T-shirt and printing process
- Genuine optimized oversized T-shirt, hoodie, and vest models
- Calibrated sleeve and other product-specific surfaces
- Geometry-aware seam warnings
- Downloadable visual proofs and a local machine-readable production specification
- Final GLB and preview-texture optimization

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
→ unit, component, and accessibility tests
→ production build
→ bundle budgets
```

Additional commands:

```bash
npm run typecheck
npm run lint
npm run check:environment
npm run check:brand
npm run check:boundaries
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

IndexedDB stores:

- Draft name, product, color, size, and notes
- Original PNG, JPEG, or WebP artwork blobs
- Layer names, visibility, ordering, active selection, and print surfaces
- Layer position, rotation, aspect ratio, and physical scale
- Source dimensions, transparency, padding, and other local artwork-analysis metadata
- Checkout contact and address fields
- Local submission linkage

The My Designs workspace can reopen, rename, duplicate, and permanently delete local designs. Duplicate designs receive independent artwork blobs.

The original artwork blob remains separate from generated object URLs and Three.js preview textures. Preview URLs are recreated when a design is restored and revoked when the relevant screen closes.

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

Rendering pauses while the document is hidden. Constrained devices use demand rendering rather than a permanent animation loop.

When WebGL is unavailable, its context is lost, or the garment model cannot render, the app switches to a safe local 2D preview without discarding the draft. A supported device can retry the 3D renderer from the same design state.

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

Do not use the local prototype for real customer orders or sensitive production data.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for Git LFS, IndexedDB, artwork upload, WebGL, deployment routing, Playwright, runtime, and bundle-budget guidance.

## Roadmap

The maintained P0-P4 checklist lives in [tasks.md](tasks.md). The active roadmap is frontend/local-only; paused infrastructure is listed separately and does not block P2 or P3.
