# P3 Iraqi-Arabic and RTL Sweep

## Objective

Make the current BGD/INK storefront and local-draft journey reliable in English and Iraqi Arabic without treating translation as a text-only change.

This slice covers language persistence, document direction, typography, mixed-direction technical values, truthful browser-local status, and automated regression checks. It does not claim that every editor or production-tool sentence has completed a final human editorial review.

## Implemented language foundation

The active language now persists in browser storage under:

```text
bgd-ink-language
```

On every language change and restored page load, the application keeps these document attributes synchronized:

```html
<html lang="ar" dir="rtl" data-language="ar">
```

or:

```html
<html lang="en" dir="ltr" data-language="en">
```

This means a direct refresh no longer resets an Arabic customer to English, and layout behavior can rely on the document language instead of component-local assumptions.

Browser storage can be blocked. In that case, the current session still switches language and direction, while the application safely falls back to English on a future load.

## Arabic typography and mixed-direction values

Arabic typography is selected from the document language. Display text uses the Arabic font in Arabic mode rather than applying the Latin display face to Arabic letters.

RTL layouts also isolate values that should preserve their internal order:

- phone numbers
- numeric inputs
- prices and quantities
- garment sizes
- draft identifiers
- PNG, JSON, DPI, WebGL, and other technical formats
- collection codes and numbered production annotations
- email and URL fields

Reusable direction boundaries include `bdi`, `.technical-ltr`, and RTL rules for monospace and numeric values.

## Reviewed customer-facing surfaces

This slice includes an Iraqi-Arabic editorial and RTL pass for:

- homepage hero, proof points, workflow, trust states, catalog preview, and final action
- full catalog hierarchy, garment types, readiness, pricing context, and unavailable states
- prototype notices and local receipt messages
- footer trust statements and contact-link accessibility labels
- My Designs headings, empty/error states, actions, dates, quantities, and status
- local draft receipt identifiers, size, colour, quantity, estimate, and actions
- mobile navigation after an Arabic page reload

The homepage’s former English-only `Live` and `Honest` badges are now localized rather than remaining embedded English inside an Arabic page.

## Truthful local-draft status

The My Designs workspace no longer labels a browser-local receipt as `Submitted` or `تم الإرسال`.

The status is now:

```text
Prepared locally
مجهّزة محلياً
```

This avoids implying that artwork or customer details were transmitted to BGD/INK. Each saved-design card also shows its recoverable local quantity.

## Permanent localization boundary

`npm run check:localization` now runs inside the production `npm run check` gate.

It verifies that:

- language persistence and `data-language` remain implemented
- Arabic document typography remains tied to `lang="ar"`
- technical direction-isolation primitives remain available
- phone fields remain left-to-right inside RTL forms
- reviewed Iraqi-Arabic navigation terminology remains the source of truth
- homepage trust badges remain localized
- My Designs uses `Prepared locally` and exposes quantity
- footer contact navigation keeps localized accessibility copy

It also rejects regressions such as:

- obsolete `Draft Details` wording in the local preparation journey
- `Submitted`, `تم الإرسال`, or promised server-sync language in My Designs
- hardcoded English-only `Live` or `Honest` badges
- inconsistent `store` wording in the prototype status where the product is presented as a studio

## Automated coverage

The unit and component suite covers:

- switching the document to Arabic RTL
- persisting the selected language
- restoring Arabic on the next provider mount
- truthful prepared-local status
- saved quantity in My Designs
- local receipt behavior and accessibility

The mobile Chromium journey covers:

1. opening mobile navigation
2. switching to Iraqi Arabic
3. checking `lang`, `dir`, and `data-language`
4. reloading the page
5. confirming that Arabic remains active
6. navigating to the Arabic catalog through the RTL menu
7. checking that the page has no horizontal overflow at a Pixel 5 viewport

The draft-recovery journey continues to verify artwork, notes, contact fields, quantity, configured price, local estimate, receipt, and My Designs recovery.

## Current measured cost

The reviewed bilingual/RTL work remains within the existing production budgets:

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 97.56 KiB | 140 KiB |
| Initial CSS, gzip | 15.48 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 230 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 800 KiB |
| Total JavaScript, gzip | 400.60 KiB | 410 KiB |
| Total JavaScript, raw | 1,365.58 KiB | 1,400 KiB |
| Total CSS, gzip | 15.48 KiB | 16.5 KiB |

No budget was raised for this work.

## Still open

The following remain separate P3 work and should not be marked complete yet:

- final human Iraqi-Arabic review of the Studio Guide’s longer educational content
- complete editor-control, quality-overlay, fallback-preview, and export-tool terminology review
- complete draft-preparation failure and edge-state editorial review
- contextual RTL review for dense editor and production-tool layouts
- testing on representative physical Android phones, iPhones, and tablets
- official business contact details and approved business policies

The current automated mobile viewport is a strong regression check, but it is not a substitute for physical-device validation.
