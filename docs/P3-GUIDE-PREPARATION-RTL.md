# P3 — Studio Guide and Draft-Preparation RTL Review

## Objective

Complete the remaining frontend Iraqi-Arabic editorial and contextual RTL review for the long-form Studio Guide and the local draft-preparation route.

This work remains frontend and browser-local. It does not add a backend, database, account, remote upload, inventory, payment, or real order flow.

## Long-form Studio Guide

The Guide copy was reviewed in context rather than translated word for word.

The reviewed Arabic now:

- explains verified and pending information without implying business readiness
- distinguishes a saved local draft from a transmitted order
- explains garment measurement using familiar Iraqi-Arabic phrasing
- presents DTF, screen printing, and embroidery as general references only
- clarifies artwork preparation, local storage, usage rights, screen-colour limits, and physical calibration
- keeps product, method, and technical terms understandable without unnecessary English prose

A mobile-friendly section navigator now links to:

```text
Current status
Sizing
Print methods
Artwork preparation
Prototype limits
FAQ
```

Each section has a stable anchor and scroll offset. Long cards, method descriptions, policies, and FAQ answers use automatic text direction, word wrapping, minimum-width guards, and page-level overflow protection.

Technical indices and mixed-direction values use `bdi` and the shared `technical-ltr` boundary rather than relying on visual coincidence.

## Local draft preparation

The draft-preparation route now handles the complete local edge-state journey more clearly.

### Localized Baghdad areas

Visible area names are available in English and Arabic while the stored values remain stable:

```text
Al-Mansour       / المنصور
Al-Karrada       / الكرادة
Al-Jadriya       / الجادرية
Al-Yarmouk       / اليرموك
Al-Dora          / الدورة
Zayouna          / زيونة
Al-Adhamiya      / الأعظمية
Al-Shaab         / الشعب
Baghdad Al-Jadida / بغداد الجديدة
Al-Hurriya       / الحرية
Al-Ghazaliya     / الغزالية
Hayy Al-Jamia    / حي الجامعة
Al-Amiriya       / العامرية
Al-Saydiya       / السيدية
Other            / منطقة ثانية
```

Keeping the original stored values prevents older browser-local drafts from becoming incompatible when the display language changes.

### Validation recovery

Submitting incomplete details now:

1. Shows one accessible validation summary.
2. Lists the affected fields using the active language.
3. Preserves each field-level error.
4. Moves focus to the first invalid input.
5. Keeps the Iraqi phone field left-to-right inside the RTL page.

### Draft-load recovery

A missing draft and a temporary load failure are no longer presented as the same state.

- A missing draft explains that it may have been deleted or removed with browser data and directs the customer to My Designs.
- A load failure offers an explicit retry while preserving the browser-local safety wording.

### Autosave recovery

When contact or quantity autosave fails, the page now shows:

- a clear local-storage warning
- an explanation that the newest changes are not yet persisted
- a retry-local-save action
- a disabled state while retrying

Saving the receipt still waits for queued contact and quantity writes before creating the browser-local summary.

## RTL and mixed-direction safeguards

The preparation route isolates:

- phone numbers
- quantity controls and limits
- garment sizes
- colour hex values
- unit prices and local estimates
- artwork layer counts

Customer names, addresses, notes, and layer labels use automatic direction.

The summary layout uses wrapping and minimum-width guards so Arabic text and technical values do not force page-level horizontal scrolling on narrow phones.

## Permanent source boundaries

`npm run check:localization` now verifies the Guide and preparation route in addition to the existing storefront and customizer checks.

The gate requires:

- the Guide section navigator and anchored dense sections
- reviewed local-draft FAQ wording
- reference-only Arabic method labels
- direction-isolated Guide indices
- localized Baghdad area labels
- preparation validation and autosave-retry states
- load retry behavior
- left-to-right Iraqi phone handling
- direction-isolated prices, sizes, quantities, and colour codes

It rejects obsolete transmission wording, English-only area rendering, and the previous non-actionable autosave warning.

## Automated coverage

The unit, component, accessibility, and browser suite covers:

- English Guide actions and section navigation
- Iraqi-Arabic Guide restoration
- Arabic Guide axe accessibility
- localized Baghdad labels with stable stored values
- Arabic preparation validation and first-field focus
- Arabic area selection
- direction-safe phone and quantity inputs
- local receipt creation
- prepared-local My Designs state
- Pixel 5 page-overflow checks for Guide, preparation, and workspace routes

The complete branch gate contains 66 unit/component/accessibility tests across 24 files and nine Chromium journeys.

## Current measured cost

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 97.56 KiB | 140 KiB |
| Initial CSS, gzip | 15.65 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 230 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 800 KiB |
| Total JavaScript, gzip | 403.79 KiB | 410 KiB |
| Total JavaScript, raw | 1,376.40 KiB | 1,400 KiB |
| Total CSS, gzip | 15.65 KiB | 17 KiB |

No reviewed performance limit was raised for this slice. The remaining JavaScript headroom is narrow and future work should prefer simplification or lazy loading.

## Still open

The frontend Arabic/RTL review is complete for the implemented virtual-device journey. P3 still requires:

- representative physical Android, iPhone, and tablet validation
- approved real product photography
- approved completed-work photography
- confirmed prices, timing, garment specifications, print-method availability, and size charts
- official contact channels
- approved returns, care, privacy, and fulfillment policies

Those business-dependent inputs should remain pending rather than being invented.
