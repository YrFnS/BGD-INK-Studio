# BGD/INK Studio

BGD/INK Studio is a bilingual English/Arabic web experience for designing and previewing custom-printed apparel in 3D.

> **Current status: prototype foundation.** By default, submitted designs stay on the visitor's device. They are not sent to a shop, shared between devices, or written to a production database yet.

## Brand

- Customer-facing name: **BGD/INK**
- Product name: **BGD/INK Studio**
- Tagline: **Design it. Wear it.** / **صمّمها والبسها**
- Primary market: Baghdad, Iraq

Brand values, contact destinations, storage namespaces, and order prefixes are centralized in `config/brand.ts`. Application capability flags and data-source selection are centralized in `config/platform.ts`.

## Technology

- React 18 and strict TypeScript
- Vite
- Tailwind CSS 4 compiled through the Vite plugin
- React Three Fiber, Drei, and Three.js
- GSAP
- Zod runtime validation
- IndexedDB for recoverable local design drafts and binary artwork
- ESLint flat configuration and Prettier

## Local development

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- Git LFS for the GLB assets

### Commands

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run check
```

`npm run check` performs strict TypeScript validation, ESLint validation, and a production Vite build.

Additional commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run format
npm run build
npm run preview
```

## URL routes

The storefront uses the browser History API without an additional routing dependency:

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/catalog` | Product selection |
| `/studio/:draftId` | Recoverable 3D design draft |
| `/checkout/:draftId` | Checkout reconstructed from the same draft |
| `/draft/:orderId` | Local draft or order confirmation |

Browser Back and Forward navigation are supported. Netlify serves direct links through `public/_redirects`, so refreshing a studio or checkout URL returns to the application instead of a 404 page.

## Recoverable design drafts

Selecting a product creates a draft ID before opening the customizer. The browser stores the following in IndexedDB:

- Product ID, color, size, notes, and active layer
- Layer transforms and ordering
- Original PNG, JPEG, or WebP artwork blobs
- File names and MIME types
- Checkout contact and address fields
- Submission linkage after a local draft or real order is created

The customizer autosaves changes through an ordered, debounced queue. Artwork is stored before it is added to the scene. On refresh, new temporary object URLs are generated from the stored blobs and released again when the screen closes.

IndexedDB recovery is **device- and browser-specific**. It is not a substitute for server storage, cross-device accounts, backups, or the future S3-compatible artwork service.

## Data adapters

The storefront depends on a typed `PlatformApi` rather than reading products or writing orders directly from feature components.

Two adapters currently exist:

- `local-prototype`: reads the prototype catalog and stores clearly labeled submitted drafts in browser storage.
- `frappe`: calls the documented Frappe methods, validates responses with Zod, normalizes errors, includes credentials, and refuses to create a real order while artwork still uses temporary `blob:` URLs.

The local adapter is the safe default. Copy `.env.example` to `.env.local` only when changing the data source.

```env
VITE_PLATFORM_DATA_SOURCE=local-prototype
VITE_API_BASE_URL=
```

A future connected deployment will use:

```env
VITE_PLATFORM_DATA_SOURCE=frappe
VITE_API_BASE_URL=https://your-frappe-site.example
```

Selecting `frappe` without a base URL safely falls back to the local prototype adapter. The frontend adapter does not mean the Frappe methods already exist; the required server contract remains documented in `docs/backend-contract.md`.

## Prototype safety boundaries

The current branch deliberately removes misleading production behavior:

- There is no public browser-only admin dashboard.
- No API key is injected into the client bundle.
- A locally submitted design is called a **draft**, not a confirmed order.
- Active designs and artwork use IndexedDB; submitted local draft summaries use namespaced browser storage.
- Legacy `ashus_*` summary keys are migrated without deleting the originals.
- WhatsApp appears only after a real number is configured.
- Service-worker/offline claims remain disabled until a real PWA implementation exists.
- The Frappe order adapter blocks temporary artwork URLs until durable server uploads are implemented.

Do not use the current local prototype adapter for real customer orders or sensitive production data.

## Repository structure

```text
components/          Shared layout and UI components
config/              Brand, runtime, and capability configuration
contexts/            Theme, language, and toast state
features/            Catalog, customizer, checkout, and landing experiences
data/                Prototype product and 3D asset configuration
docs/                Architecture and backend contracts
hooks/                Shared hooks
routing/              History API route parsing and navigation
services/api/         Typed local and Frappe data adapters
services/drafts/      IndexedDB draft and artwork repository
utils/                Legacy/prototype summary persistence helpers
```

## Validation

Netlify deploy previews run `npm run check` before publishing. A GitHub Actions workflow contains the same install-and-check sequence for repositories where Actions is enabled.

## Roadmap

The implementation plan lives in `tasks.md` and is organized into P0–P4. P0 establishes the safe BGD/INK foundation. P1 adds the engineering pipeline, route recovery, and backend boundary. P2 rebuilds the production-grade customizer. P3 redesigns the storefront, and P4 adds operations, PWA, analytics, and growth features.
