# P3 — Performance and Responsive Finalization

## Objective

Finalize the implemented P3 frontend for realistic phone and tablet browser conditions while reducing the JavaScript cost of the storefront.

This work remains frontend and browser-local. It does not add a backend, database, accounts, remote storage, inventory, payment, or real order processing.

## Lightweight motion runtime

The storefront previously shipped the complete GSAP runtime for a small set of entrance, page-transition, cursor, magnetic, toast, and editor animations.

P3 now aliases existing `gsap` imports to a focused Web Animations compatibility layer in:

```text
src/utils/gsap-lite.ts
```

The compatibility layer implements only the API surface used by this repository:

- `context`
- `timeline`
- `from`
- `to`
- top-level and timeline `fromTo`
- `set`
- `quickTo`
- relative timeline positions
- staggered starts
- opacity, translation, scale, skew, rotation, and colour
- `clearProps`
- completion callbacks
- scoped style restoration

Dedicated unit tests protect the toast and catalog animation patterns that exposed missing compatibility methods during browser validation.

The GSAP package remains declared temporarily for lockfile compatibility, but Vite and Vitest resolve application imports to the local adapter. The production bundle does not ship the full GSAP runtime.

## Measured JavaScript reduction

Before this finalization pass:

| Metric | Previous |
| --- | ---: |
| Initial JavaScript, gzip | 97.56 KiB |
| Total JavaScript, gzip | 403.79 KiB |
| Total JavaScript, raw | 1,376.40 KiB |

Final measured baseline:

| Metric | Current | Change |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 71.07 KiB | −26.49 KiB |
| Total JavaScript, gzip | 377.29 KiB | −26.50 KiB |
| Total JavaScript, raw | 1,312.92 KiB | −63.48 KiB |

The initial JavaScript reduction is approximately 27 percent. Three.js remains in a separate lazy chunk and is not loaded by the homepage.

## Tightened budgets

The measured savings are protected by narrower limits:

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 71.07 KiB | 90 KiB |
| Initial CSS, gzip | 15.91 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 200 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 725 KiB |
| Total JavaScript, gzip | 377.29 KiB | 390 KiB |
| Total JavaScript, raw | 1,312.92 KiB | 1,350 KiB |
| Total CSS, gzip | 15.91 KiB | 16.5 KiB |

The decorative continuous scanner overlay was removed rather than weakening the CSS budget. The garment workbench retains restrained motion.

## Safe-area and dynamic-viewport shell

The browser viewport now opts into display cutouts and software-keyboard resizing:

```text
viewport-fit=cover
interactive-widget=resizes-content
```

The application shell uses:

- `100dvh` for the live viewport
- `safe-area-inset-top`, `right`, `bottom`, and `left`
- a safe-area-aware fixed header
- a prototype notice positioned below the real header height
- a mobile menu sized to the remaining live viewport
- contained menu overscroll
- bottom safe-area padding for the menu and footer
- dedicated short-landscape menu behavior
- horizontal clipping at the document boundary

## Reliable same-page navigation

Long Guide section links retain normal anchor `href` values, but the application also installs a small event-delegated fallback.

The fallback:

1. Handles only unmodified primary clicks on same-page hash links.
2. Finds the destination by ID.
3. Calls `scrollIntoView` explicitly.
4. Uses instant scrolling when reduced motion is requested.
5. Uses smooth scrolling otherwise.
6. Keeps the URL hash synchronized with `history.replaceState`.
7. Leaves modified clicks, downloads, external targets, and missing destinations to the browser.

This closes a tablet-emulation case where the hash changed but a long page did not reliably scroll.

## Responsive source gate

`npm run check:responsive` permanently verifies:

- display-cutout support
- software-keyboard viewport resizing
- safe-area variables
- dynamic viewport sizing
- short-landscape handling
- contained mobile-menu scrolling
- application-wide anchor navigation
- reduced-motion-aware section scrolling
- iPhone and iPad browser coverage
- orientation or viewport-size changes

## Browser coverage

The complete P3 browser suite now contains 11 Chromium journeys:

1. Iraqi-Arabic dense customizer and handoff tools on Pixel 5.
2. Iraqi-Arabic draft preparation and receipt on Pixel 5.
3. Persistent mobile Arabic navigation and RTL behavior.
4. Artwork dimensions and quality analysis.
5. Draft, quantity, and preparation recovery.
6. Layer editing and undo/redo.
7. Real PNG and JSON downloads.
8. WebGL failure and safe 2D recovery.
9. Long-form English and Iraqi-Arabic Studio Guide.
10. iPhone 13 portrait, short-landscape, and restored-portrait shell behavior.
11. iPad Mini Arabic Guide behavior through an orientation-sized viewport change.

The iPhone and iPad journeys verify page-level horizontal-overflow prevention. The iPhone journey also verifies that the full mobile navigation remains reachable in a short landscape viewport.

## Final validation

The exact documented head passed:

```bash
npm ci --include=dev --no-audit --no-fund
npm run check
npm run test:e2e
```

The gate contains:

- runtime validation
- strict TypeScript
- zero-warning ESLint
- brand, import-boundary, GLB, storefront-trust, localization, and responsive checks
- 71 unit/component/accessibility tests across 26 files
- production Vite build
- all tightened JavaScript and CSS budgets
- all 11 Chromium journeys

## Remaining limitation

Browser emulation is now broad and reliable, but it is not a substitute for physical-device validation.

P3 still requires representative checks on:

- a physical Android phone
- a physical iPhone
- a physical tablet
- real browser chrome and safe-area behavior
- software-keyboard opening and dismissal
- rotation while a form or editor control is active
- actual touch latency and device performance

Business-dependent photography, pricing, production timing, specifications, contacts, and policies also remain pending until verified.
