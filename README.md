# BGD/INK Studio

BGD/INK Studio is a bilingual English/Arabic web experience for designing and previewing custom-printed apparel in 3D.

> **Current status: local prototype foundation.** Designs and submitted draft summaries stay on the visitor's device. They are not sent to a shop, shared between devices, or written to a production database.

## Brand

- Customer-facing name: **BGD/INK**
- Product name: **BGD/INK Studio**
- Tagline: **Design it. Wear it.** / **صمّمها والبسها**
- Primary market: Baghdad, Iraq

Brand values, contact destinations, storage namespaces, and draft prefixes are centralized in `config/brand.ts`. Prototype capability flags are centralized in `config/platform.ts`.

## Technology

- React 18 and strict TypeScript
- Vite
- Tailwind CSS 4 compiled through the Vite plugin
- React Three Fiber, Drei, and Three.js
- GSAP
- Zod form validation
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

`package-lock.json` is committed with lockfile version 3. Local validation and GitHub Actions use `npm ci`, so dependency resolution must match the reviewed lockfile exactly. GitHub Actions caches npm's download cache by the lockfile hash; it does not cache `node_modules`.

Runtime consistency is enforced in four places:

- `.nvmrc` pins Node.js 22.23.1.
- `package.json` declares npm 10.9.8 and compatible engine ranges.
- GitHub Actions reads `.nvmrc` and installs with `npm ci`.
- Netlify uses the same pinned Node.js version and runs the full validation command before publishing.

When dependencies change, update both `package.json` and `package-lock.json` in the same review.

## Performance budgets

Vite emits `.vite/manifest.json`, and `scripts/check-bundle-budget.mjs` uses that graph to distinguish initial assets from lazy route chunks. It calculates gzip sizes and fails the build when a reviewed ceiling is exceeded.

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

The thresholds live in `config/bundle-budgets.json`. A budget increase should be an intentional review decision with a documented reason. The large lazy customizer chunk remains an optimization target even though it is not part of the initial page load.

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
| `/draft/:orderId` | Local draft confirmation |

Browser Back and Forward navigation are supported. Netlify serves direct links through `public/_redirects`, so refreshing a workspace, studio, or checkout URL returns to the application instead of a 404 page.

## Recoverable design drafts

Selecting a product creates a draft ID before opening the customizer. The browser stores the following in IndexedDB:

- Draft name, product ID, color, size, notes, and active layer
- Layer transforms and ordering
- Original PNG, JPEG, or WebP artwork blobs
- File names and MIME types
- Checkout contact and address fields
- Local submission linkage

The customizer autosaves changes through an ordered, debounced queue. Artwork is stored before it is added to the scene. On refresh, new temporary object URLs are generated from stored blobs and released when the screen closes.

The bilingual `/designs` workspace allows the customer to:

- Reopen a saved design
- Rename it
- Duplicate it with independent copies of every artwork blob
- Permanently delete the draft and its local artwork
- See product, size, layer count, submission state, and an artwork preview

Duplicated drafts retain their design settings but reset checkout details and submission linkage. IndexedDB recovery is **device- and browser-specific**. It is not a substitute for server storage, cross-device accounts, or backups.

## Local application service

Feature components use a typed `PlatformApi` facade instead of directly reading and writing storage. The current implementation has one source only:

- `local-prototype`: reads the prototype catalog and stores clearly labelled draft summaries in browser storage.

There is no remote commerce integration configured. A production data architecture should be selected later from the actual business, hosting, staff, inventory, and order-processing requirements rather than being assumed by the frontend.

## Prototype safety boundaries

The current branch deliberately avoids misleading production behavior:

- There is no public browser-only admin dashboard.
- No API key is injected into the client bundle.
- A submitted design is called a **draft**, not a confirmed order.
- Active designs and artwork use IndexedDB; submitted draft summaries use namespaced browser storage.
- Legacy `ashus_*` summary keys are migrated without deleting the originals.
- WhatsApp appears only after a real number is configured.
- Service-worker and offline claims remain disabled until a reliable PWA implementation exists.

Do not use the current local prototype for real customer orders or sensitive production data.

## Repository structure

```text
components/          Shared layout and UI components
config/              Brand, prototype capability, and bundle-budget configuration
contexts/            Theme, language, and toast state
e2e/                 Playwright browser journeys
features/            Catalog, designs, customizer, checkout, and landing experiences
data/                Prototype product and 3D asset configuration
hooks/                Shared hooks
routing/              History API route parsing and navigation
scripts/              Build-time quality and performance checks
services/api/         Typed local application facade
services/drafts/      IndexedDB draft and artwork repository
test/                 Shared Vitest and browser-environment setup
utils/                Legacy and prototype summary persistence helpers
```

## Validation

Netlify deploy previews run `npm run check` before publishing. GitHub Actions restores the npm cache, runs a locked `npm ci`, executes the same fast validation and bundle-budget gate, and then runs the Playwright Chromium recovery journey. A failed browser job uploads its Playwright report for diagnosis.

## Roadmap

The implementation plan lives in `tasks.md` and is organized into P0-P4. P0 establishes the safe BGD/INK foundation. P1 adds engineering quality, recoverable local workflows, testing, reproducible builds, and performance budgets. P2 rebuilds the production-grade customizer. P3 redesigns the storefront, and P4 adds production operations, PWA, analytics, and growth features.
