# P3 — Premium Storefront Direction

## Objective

Turn BGD/INK Studio from a generic apparel landing page into a distinctive, trustworthy Baghdad design-studio experience without inventing product, customer, production, or fulfillment facts.

P3 remains frontend and local-only. It does not reopen backend, database, remote storage, accounts, inventory, real checkout, or production-order work.

## Visual direction

The storefront uses an **editorial print-lab** language rather than generic ecommerce cards:

- warm paper surfaces and near-black ink fields
- one controlled signal color
- measurement grids, crop marks, print boundaries, layer panels, and production annotations
- bold typography with restrained motion
- owned vector garment artwork instead of remote stock photography
- technical detail that reflects real editor capabilities

This direction is independent from any portfolio, operating-system, spatial-galaxy, or unrelated product visual language.

## Content trust rules

Customer-facing content must not claim facts that have not been confirmed.

The storefront therefore does not use:

- fabricated or anonymous testimonials
- generic stock photography presented as completed BGD/INK work
- unconfirmed material composition
- unconfirmed printing-method availability
- wash, stretch, colorfastness, or durability guarantees
- production-time or delivery promises
- unsupported superlatives such as “best”
- unavailable garments disguised with another product’s 3D geometry

When information is incomplete, the UI states that clearly and keeps the relevant claim or action unavailable.

`scripts/check-storefront-trust.mjs` enforces the most important source-level boundaries in CI.

## Owned visual assets

The first P3 slice introduces owned SVG product artwork under:

```text
public/brand/products/
```

Current files:

- `classic-tshirt.svg`
- `oversized-tee.svg`
- `premium-hoodie.svg`
- `urban-vest.svg`

The illustrations communicate product readiness and design direction. They are not substitutes for the real product photography still required later in P3.

Legacy stored catalog records retain local price, color, and stock configuration, while canonical identity and image paths are migrated to the owned assets.

## Implemented P3 storefront foundation

- new P3 branch stacked on the complete P2 branch
- premium editorial homepage
- model-aware studio workbench visual
- owned icon system replacing emoji
- owned product artwork replacing Unsplash images
- removal of fabricated-looking testimonial sections
- removal of unsupported fabric, printing, wash, and delivery claims
- evidence-based ready-now and guardrail sections
- stronger catalog hierarchy and model-readiness communication
- starting-price, configured-color, and editor-size presentation
- explicit local-price and no-real-order note
- premium header, RTL-aware mobile navigation, and footer
- local migration that prevents old stock-photo product URLs from returning
- homepage trust and navigation tests
- permanent storefront trust validation in `npm run check`

## Studio Guide and buying-preparation layer

The `/guide` route adds useful preparation information without pretending unverified business information is complete.

It includes:

- verified-versus-pending storefront expectations
- a garment-measurement workflow that explains how to compare an existing garment
- an explicit notice that exact product size charts still require physical measurement
- reference-only DTF, screen-printing, and embroidery explanations
- an artwork handoff checklist
- local-data, artwork-rights, colour-preview, physical-calibration, and no-commerce prototype policies
- an English/Iraqi-Arabic FAQ covering orders, storage, file formats, sizes, mobile editing, and contact availability
- direct routes back to the catalog and My Designs

The method explanations describe common trade-offs but do not claim that any method is currently offered. The prototype policies describe what the current application does; they are not substitutes for approved business returns, care, privacy, or fulfillment policies.

The guide has unit, accessibility, direct-route, and English/Arabic Chromium coverage.

## Recoverable local variant and quantity preparation

The size and colour selected in the editor are now joined by a local quantity from 1 to 50 on the draft-preparation route.

This is deliberately not presented as ecommerce stock or a quotation:

- the quantity is planning data stored in IndexedDB draft version 5
- older drafts safely normalize to quantity 1
- duplicated drafts preserve quantity while clearing contact information and prepared-receipt state
- the displayed estimate uses the locally configured unit price
- the UI states that no stock is reserved and the estimate is not a confirmed quotation or order
- legacy browser summaries also normalize missing quantities
- a future configured WhatsApp handoff includes quantity without turning WhatsApp into the database

The browser test uncovered a real lost-update race when contact details and quantity were saved as competing whole-record updates. The draft-preparation route now serializes those writes through one ordered queue. Every snapshot completes before the next starts, and saving the receipt waits for the latest queued state.

The recovery journey verifies quantity, customer fields, configured unit price, and the local estimate after a full page refresh.

## Touch-first local draft receipt

The confirmation route is now a local draft receipt rather than a generic order-success screen.

It provides:

- a clear browser-local status
- draft identifier with copy action
- prepared garment, size, colour, quantity, and local estimate when available in the current session
- explicit “not a quote or confirmed order” language
- direct actions to My Designs, a new draft, and the homepage
- a compact identifier-only state after a direct refresh
- English/Iraqi-Arabic copy
- automated accessibility coverage

The receipt does not imply payment, stock reservation, shop receipt, delivery, transmission, or production acceptance.

## Iraqi-Arabic and RTL foundation

P3 now treats Arabic as a persistent product state rather than a temporary component toggle.

Implemented behavior includes:

- browser-local language persistence
- synchronized document `lang`, `dir`, and `data-language`
- Arabic typography selected by document language
- Iraqi-Arabic editorial review for the homepage, catalog, prototype notices, footer, My Designs, and local receipt
- localized homepage trust badges instead of embedded English status words
- direction isolation for phone numbers, number inputs, prices, quantities, sizes, draft identifiers, file formats, and collection codes
- truthful `Prepared locally` / `مجهّزة محلياً` status in My Designs instead of `Submitted`
- visible recoverable quantity on each saved-design card
- mobile Chromium coverage for Arabic persistence after reload, RTL menu navigation, and horizontal-overflow prevention

A permanent `npm run check:localization` gate protects these boundaries inside `npm run check`.

See [P3 Iraqi-Arabic and RTL Sweep](P3-ARABIC-RTL-SWEEP.md) for the implementation details, regression rules, and deliberately unfinished review areas.

## Performance decisions

P3 originally caused the homepage to import the model manifest from a module that also performed Drei model preloading. That pulled Three.js into the initial route.

The preload side effect was removed from the lightweight model configuration module. Three.js is lazy again, and the initial JavaScript measurement remains below 100 KiB gzip.

The editorial storefront, guide, draft-preparation view, receipt, and RTL foundation remain within the reviewed limits:

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 97.56 KiB | 140 KiB |
| Initial CSS, gzip | 15.48 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 230 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 800 KiB |
| Total JavaScript, gzip | 400.60 KiB | 410 KiB |
| Total JavaScript, raw | 1,365.58 KiB | 1,400 KiB |
| Total CSS, gzip | 15.48 KiB | 16.5 KiB |

No performance budget was raised for the Iraqi-Arabic and RTL work.

## Remaining P3 work

### Real business inputs

- approved product photography
- approved completed-customer-work photography
- confirmed price ranges
- confirmed garment specifications
- confirmed production-method availability
- confirmed production times
- approved product-specific size charts
- official contact channels
- approved returns, care, privacy, and fulfillment policies

These should be added only after the business supplies or confirms them.

### Customer journey

- contact and handoff flow once official contact details are configured
- final human Iraqi-Arabic review of the Studio Guide’s longer educational content
- editor-control, quality-overlay, fallback-preview, and export-tool terminology review
- draft-preparation failure and edge-state editorial review
- contextual RTL review for dense editor and production-tool layouts
- representative physical phone and tablet validation
- future review or completed-work sections only when evidence is verifiable

## Definition of done

P3 is complete only when:

1. Every customer-facing asset is owned, licensed, or clearly marked as a placeholder.
2. Every business claim has an approved source or is visibly marked pending.
3. All bilingual content is reviewed in context.
4. The catalog, guide, editor, draft preparation, and receipt journey are touch-first and accessible.
5. Unit, accessibility, browser, trust, localization, asset, build, and performance gates pass.
