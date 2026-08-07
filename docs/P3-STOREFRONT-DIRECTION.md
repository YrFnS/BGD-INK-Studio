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

## Performance decisions

P3 originally caused the homepage to import the model manifest from a module that also performed Drei model preloading. That pulled Three.js into the initial route.

The preload side effect was removed from the lightweight model configuration module. Three.js is lazy again, and the initial JavaScript measurement improved to approximately 97 KiB gzip.

The editorial storefront and guide increased generated Tailwind CSS to approximately 15.08 KiB gzip. After review, the CSS gates were reset narrowly to:

- initial CSS: 16 KiB gzip
- total CSS: 16.5 KiB gzip

This records the deliberate visual-system cost while preserving less than 1.5 KiB of headroom. It is not permission to raise future budgets automatically.

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

- quantity and variant-selection experience using local product data
- contact and handoff flow once official contact details are configured
- complete Iraqi Arabic editorial and terminology review
- complete RTL review across homepage, catalog, guide, editor, draft details, and confirmation
- touch-first draft-details and confirmation polish
- representative physical phone and tablet validation
- future review or completed-work sections only when evidence is verifiable

## Definition of done

P3 is complete only when:

1. Every customer-facing asset is owned, licensed, or clearly marked as a placeholder.
2. Every business claim has an approved source or is visibly marked pending.
3. All bilingual content is reviewed in context.
4. The catalog, guide, editor, draft details, and confirmation journey are touch-first and accessible.
5. Unit, accessibility, browser, trust, asset, build, and performance gates pass.
