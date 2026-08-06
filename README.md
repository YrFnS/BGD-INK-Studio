# BGD/INK Studio

BGD/INK Studio is a bilingual English/Arabic web experience for designing and previewing custom-printed apparel in 3D.

> **Current status: prototype foundation.** Orders are stored only in the visitor's browser. They are not sent to a shop, shared between devices, or written to a production database yet.

## Brand

- Customer-facing name: **BGD/INK**
- Product name: **BGD/INK Studio**
- Tagline: **Design it. Wear it.** / **صمّمها والبسها**
- Primary market: Baghdad, Iraq

Brand values, contact destinations, storage namespaces, and order prefixes are centralized in `config/brand.ts`. Application capability flags are centralized in `config/platform.ts`.

## Technology

- React 18 and TypeScript
- Vite
- React Three Fiber, Drei, and Three.js
- GSAP
- Zod
- Temporary Tailwind CDN configuration; P1 will move Tailwind into the Vite build

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

`npm run check` runs TypeScript validation followed by a production build.

## Prototype safety boundaries

The current branch deliberately removes misleading production behavior:

- There is no public browser-only admin dashboard.
- No API key is injected into the client bundle.
- A submitted design is called a **draft**, not a confirmed order.
- Drafts use namespaced local browser storage and migrate legacy `ashus_*` keys without deleting them.
- WhatsApp is shown only after a real number is configured.
- Service-worker/offline claims are disabled until a real PWA implementation exists.

Do not use the current local-storage adapter for real customer orders or personal data. The production backend contract is documented in `docs/backend-contract.md`.

## Repository structure

```text
components/          Shared layout and UI components
config/              Brand and capability configuration
contexts/            Theme, language, and toast state
features/            Catalog, customizer, checkout, and landing experiences
data/                Prototype product and 3D asset configuration
docs/                Architecture and backend contracts
hooks/                Shared hooks
utils/                Prototype persistence helpers
```

## Roadmap

The implementation plan lives in `tasks.md` and is organized into P0–P4. P0 establishes the safe BGD/INK foundation. P1 adds the real engineering pipeline and backend adapter. P2 rebuilds the production-grade customizer. P3 redesigns the storefront, and P4 adds operations, PWA, analytics, and growth features.
