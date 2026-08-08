# P3 Dense Editor — Iraqi-Arabic and RTL Review

## Objective

Complete the contextual Iraqi-Arabic and RTL review for the densest frontend surfaces in BGD/INK Studio:

- customizer controls
- interaction modes
- artwork-quality guidance
- safe 2D recovery
- local PNG and JSON handoff tools

This work remains frontend and browser-local. It does not add a backend, production database, remote artwork storage, account system, inventory, payment, or real order processing.

## Reviewed customizer controls

The editor panel now uses clearer Iraqi-Arabic terminology for:

- artwork layers
- selected layer
- add, duplicate, hide, show, and remove actions
- bring-forward and send-backward ordering
- undo and redo
- layer naming
- artwork width
- rotation
- autosave status
- continuation to local draft preparation

The layer picker retains stable English numbered accessibility names for existing automation and assistive workflows, while Arabic mode uses the layer's actual name in its accessible label.

Layer buttons expose their list position through `aria-posinset` and `aria-setsize`.

## Direction-safe technical controls

RTL changes the editor's layout direction without reversing technical values or controls that must keep their conventional order.

The following remain left-to-right inside Arabic layouts:

- S, M, L, XL, and XXL sizes
- centimeter measurements
- pixel dimensions
- DPI values
- degree values
- 2D and 3D labels
- range-input progression
- layer positions and counts

Layer names and draft notes use automatic direction detection so Arabic, English, and mixed customer text remain readable.

## Interaction modes

The mobile interaction toolbar now uses reviewed Iraqi-Arabic labels for:

- View garment
- Move design
- Resize and rotate
- Switch to 2D
- Try 3D again
- rendering quality

The toolbar keeps its help text linked with `aria-describedby`, preserves technical 2D/3D direction, and remains disabled correctly when there is no visible selected artwork layer or when the editor is in the safe 2D state.

## Artwork-quality guidance

The artwork-quality overlay now distinguishes:

- physical artwork size on the garment
- original source dimensions
- estimated print DPI
- transparency
- transparent padding
- low and very-low resolution
- unusual aspect ratio
- placement near the safe print edge

The Arabic warning language explains what the customer can do rather than only reporting a problem—for example, reducing physical print size, choosing a larger source file, or moving artwork inward.

Measurements use explicit direction isolation, and the panel has automated accessibility coverage.

## Safe 2D recovery

The fallback was corrected structurally as well as linguistically.

Previously, the retry button was nested inside an element with `role="img"`. That can hide interactive descendants from assistive technology.

The recovery view now has:

- an accessible section heading and description
- a separate non-interactive garment image role
- an ordinary reachable retry button
- reviewed Iraqi-Arabic explanations for manual 2D mode, unsupported WebGL, context loss, and model failure
- explicit confirmation that the customer's local design remains preserved

## Local handoff tools

The export interface is now presented as **local handoff files**, not a production authorization.

Arabic mode includes:

- a localized on-device badge
- Download PNG proof
- Download JSON specification
- empty-artwork guidance
- download success states
- missing-draft and unavailable-model states
- explicit physical-calibration caution

PNG and JSON labels remain direction-safe. The original IndexedDB artwork is not replaced, uploaded, or embedded as a temporary `blob:` address in the JSON specification.

## Permanent regression gate

`npm run check:localization` now verifies dense editor requirements in addition to the storefront and My Designs requirements.

The gate requires:

- reviewed Arabic layer terminology
- LTR range controls inside RTL layouts
- localized interaction modes
- direction-isolated artwork measurements
- accessible 2D recovery structure
- localized local-handoff terminology and badge

It rejects obsolete literal translations and the return of an English-only `Local` export badge.

## Automated coverage

The fast suite contains dedicated coverage for:

- Arabic customizer controls
- technical direction inside RTL controls
- Arabic interaction modes
- artwork-quality copy and measurements
- accessible 2D recovery and retry
- English and Arabic local-handoff controls
- axe accessibility checks for the new dense surfaces

A new Pixel 5 Chromium journey validates:

1. restored Arabic before the catalog loads
2. Arabic catalog navigation
3. Classic T-shirt draft creation
4. local artwork upload
5. Arabic layer controls
6. Arabic quality guidance and source dimensions
7. either 3D interaction or GPU-safe 2D fallback
8. local PNG and JSON handoff controls
9. absence of page-level horizontal overflow

The journey is GPU-portable: it accepts either a working headless 3D session or the intentional safe 2D recovery state.

## Measured result

The reviewed branch passed the fast gate with:

```text
24 test files
64 unit/component/accessibility tests
strict TypeScript
zero-warning ESLint
brand, architecture, GLB, storefront, and localization gates
production build
all bundle budgets
```

Current measured production baseline:

| Metric | Current | Limit |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 97.56 KiB | 140 KiB |
| Initial CSS, gzip | 15.51 KiB | 16 KiB |
| Largest async JavaScript chunk, gzip | 168.08 KiB | 230 KiB |
| Largest JavaScript chunk, raw | 651.42 KiB | 800 KiB |
| Total JavaScript, gzip | 401.45 KiB | 410 KiB |
| Total JavaScript, raw | 1,368.65 KiB | 1,400 KiB |
| Total CSS, gzip | 15.51 KiB | 17 KiB |

No budget was raised for this slice.

## Still open in P3

This slice does not mark all P3 localization and device work complete.

Still required:

- final human review of the Studio Guide's longer educational Arabic copy
- draft-preparation failure and edge-state editorial review
- contextual RTL inspection of the Guide's densest long-form layouts
- physical Android, iPhone, and tablet testing
- approved business contacts, policies, pricing, timing, size charts, method availability, and photography

The automated Pixel 5 journey is a strong regression boundary, but it is not a substitute for physical-device validation.
