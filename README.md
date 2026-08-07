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
- Vitest, Testing Library, fake IndexedDB, and axe accessibility checks
- Playwright for Chromium browser journeys
- ESLint flat configuration and Prettier

## Local development

### Requirements

- Node.js **22.23.1**, pinned in `.nvmrc`
- npm **10.9.8**, declared through `packageManager`
- Git LFS for the GLB assets

### Commands

```bash
nvm use
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run check
```

`npm run check` performs strict TypeScript validation, warning-free ESLint validation, the fast unit/component test suite, a production Vite build, and route-aware bundle-budget enforcement.

Additional commands:

```bash
npm run typecheck
npm run lint
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

## Reproducible installs

`package-lock.json` is committed with lockfile version 3. Local validation and GitHub Actions use `npm ci`, so dependency resolution must match the reviewed lockfile exactly. GitHub Actions also caches npm's download cache by the lockfile hash; it does not cache `node_modules`.

Runtime consistency is enforced in four places:

- `.nvmrc` pins Node.js 22.23.1.
- `package.json` declares npm 10.9.8 and compatible engine ranges.
- GitHub Actions reads `.nvmrc` and installs with `npm ci`.
- Netlify uses the same pinned Node.js version and runs the full validation command before publishing.

When dependencies change, update both `package.json` and `package-lock.json` in the same review.

## Performance budgets

Vite emits `.vite/manifest.json`, and `scripts/check-bundle-budget.mjs` uses that graph to distinguish initial assets from lazy route chunks. It calculates gzip sizes itself and fails the build when a reviewed ceiling is exceeded.

Current production baseline and enforced limits:

| Metric | Current baseline | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 107.21 KiB | 140 KiB |
| Initial CSS, gzip | 9.86 KiB | 13 KiB |
| Largest lazy JavaScript chunk, gzip | 262.42 KiB | 290 KiB |
| Largest JavaScript chunk, raw | 943.74 KiB | 1,024 KiB |
| Total JavaScript, gzip | 395.61 KiB | 425 KiB |
| Total JavaScript, raw | 1,336.28 KiB | 1,450 KiB |
| Total CSS, gzip | 9.86 KiB | 15 KiB |

The thresholds live in `config/bundle-budgets.json`. A budget increase should be an intentional review decision with a documented reason, not an automatic response to a failing build. The large lazy customizer chunk remains a P2 optimization target even though it is not part of the initial page load.

## Automated testing

The fast Vitest suite runs in jsdom with fake IndexedDB and currently covers:

- Route parsing, path generation, History API navigation, and Back/Forward behavior
- Draft creation, naming, checkout persistence, artwork restoration, duplication, and independent deletion
- The My Designs empty state and populated card actions
- An axe accessibility scan of the My Designs workspace

The Playwright Chromium journey exercises the customer path in a real browser:

1. Select a product and create a recoverable draft.
2. Upload artwork and edit design notes.
3. Refresh the studio and verify artwork and notes are restored.
4. Continue to checkout and enter delivery information.
5. Refresh checkout and verify the form is restored.
6. Submit a local draft and confirm it appears as submitted in My Designs.

Coverage reports can be generated with `npm run test:coverage`. Generated coverage, Playwright reports, and browser test results are ignored by Git.

## URL routes

The storefront uses the browser History API without an additional routing dependency:

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/catalog` | Product selection |
| `/designs` | Recent designs workspace |
| `/studio/:draftId` | Recoverable 3D design draft |
| `/checkout/:draftId` | Checkout reconstructed from the same draft |
| `/draft/:orderId` | Local draft or order confirmation |

Browser Back and Forward navigation are supported. Netlify serves direct links through `public/_redirects`, so refreshing a workspace, studio, or checkout URL returns to the application instead of a 404 page.

## Recoverable design drafts

Selecting a product creates a draft ID before opening the customizer. The browser stores the following in IndexedDB:

- Draft name, product ID, color, size, notes, and active layer
- Layer transforms and ordering
- Original PNG, JPEG, or WebP artwork blobs
- File names and MIME types
- Checkout contact and address fields
- Submission linkage after a local draft or real order is created

The customizer autosaves changes through an ordered, debounced queue. Artwork is stored before it is added to the scene. On refresh, new temporary object URLs are generated from the stored blobs and released again when the screen closes.

The bilingual `/designs` workspace lists drafts by last modification time and allows the customer to:

- Reopen a saved design
- Rename it
- Duplicate it with independent copies of every artwork blob
- Permanently delete the draft and its local artwork
- See product, size, layer count, submission state, and an artwork preview

Duplicated drafts retain their design settings but reset checkout details and submission linkage. IndexedDB recovery is **device- and browser-specific**. It is not a substitute for server storage, cross-device accounts, backups, or the future S3-compatible artwork service.

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
config/              Brand, runtime, capability, and bundle-budget configuration
contexts/            Theme, language, and toast state
e2e/                 Playwright browser journeys
features/            Catalog, designs, customizer, checkout, and landing experiences
data/                Prototype product and 3D asset configuration
docs/                Architecture and backend contracts
hooks/                Shared hooks
routing/              History API route parsing and navigation
scripts/              Build-time quality and performance checks
services/api/         Typed local and Frappe data adapters
services/drafts/      IndexedDB draft and artwork repository
test/                 Shared Vitest and browser-environment setup
utils/                Legacy/prototype summary persistence helpers
```

## Validation

Netlify deploy previews run `npm run check` before publishing. GitHub Actions restores the npm cache, runs a locked `npm ci`, executes the same fast validation and bundle-budget gate, and then runs the Playwright Chromium recovery journey. A failed browser job uploads its Playwright report for diagnosis.

## Roadmap

The implementation plan lives in `tasks.md` and is organized into P0–P4. P0 establishes the safe BGD/INK foundation. P1 adds the engineering pipeline, recoverable workspace, route recovery, automated testing, reproducible builds, performance budgets, and backend boundary. P2 rebuilds the production-grade customizer. P3 redesigns the storefront, and P4 adds operations, PWA, analytics, and growth features.
