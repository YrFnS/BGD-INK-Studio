# BGD/INK Studio troubleshooting

## The 3D product does not load

Run `git lfs install` before cloning or pulling the repository, then run:

```bash
git lfs pull
```

Confirm the model files are not small Git LFS pointer text files. The editor switches to a safe 2D preview when the garment model cannot render, so the local design remains available even though the 3D garment is unavailable.

The validation gate also checks this condition:

```bash
npm run check:assets
```

An unresolved LFS pointer fails immediately instead of reaching production as a broken garment asset.

## A GLB asset budget fails

Run:

```bash
git lfs pull
npm run check:assets
```

The report measures every GLB under `public/` and prints:

- File size
- Mesh and primitive count
- Estimated triangle count
- Material count
- Embedded image count
- Embedded PNG, JPEG, or WebP dimensions and bytes
- Whether Meshopt or Draco geometry compression is declared
- Whether KTX2/Basis texture compression is declared

The limits live in `src/config/asset-budgets.json`. Optimize the model, remove unused meshes or materials, reduce embedded texture dimensions, or compress approved assets instead of automatically raising a limit.

The current Classic T-shirt baseline is approximately 1.25 MiB with 7,202 triangles, one mesh, one material, and three 1024 px textures. It currently has no geometry or KTX2 texture compression, so compression remains work for the final approved asset set.

## Uploaded artwork uses too much GPU memory

The original PNG, JPEG, or WebP remains unchanged in IndexedDB. The Three.js renderer creates a separate canvas-derived preview texture and caps its largest dimension according to the rendering profile:

- High: 2048 px
- Balanced: 1536 px
- Low power: 1024 px

The cap also respects the browser-reported WebGL texture limit. It preserves aspect ratio and does not enlarge smaller files.

A generated preview texture is disposed when its layer, source URL, rendering quality, or component lifetime changes. This does not delete or recompress the original local artwork.

## The editor opened in 2D mode

The safe 2D preview can appear when:

- WebGL is unavailable or blocked.
- The browser loses its WebGL context.
- The graphics driver or GPU process resets.
- The garment GLB cannot be rendered.
- The customer manually chooses the 2D preview.

The draft, artwork blobs, layer metadata, and undoable design state remain stored locally. Use **Try 3D again** after updating the browser, enabling hardware acceleration, reconnecting from a sleep/wake cycle, or recovering the graphics driver.

A device that still cannot create a WebGL context will remain in the safe 2D preview rather than entering a broken canvas state.

## Move Design or Resize/Rotate is disabled

Artwork controls are enabled only when:

- The 3D preview is active.
- A layer is selected.
- The selected layer is visible.

Use **View Garment** to orbit and zoom the product, **Move Design** to change placement, and **Resize/Rotate** to transform the selected artwork. The explicit modes prevent one touch gesture from moving artwork and rotating the camera at the same time.

## Rendering is slow on a phone or low-power device

The editor automatically selects a high, balanced, or low-power profile from available browser hints. It can reduce device pixel ratio, antialiasing, shadows, shadow-map size, texture anisotropy, artwork-texture dimensions, and idle animation.

Rendering pauses while the page is hidden. Reduced-motion and data-saving preferences also select a lighter profile. The current automatic profile is shown in the interaction toolbar.

## A saved design disappeared

Local drafts are stored in IndexedDB and are tied to the current browser profile and device. Check that:

- Private browsing is disabled.
- Browser storage has not been cleared.
- Storage access is not blocked by privacy settings.
- The same browser profile is being used.

There is no cloud synchronization or account recovery in the local prototype.

## Artwork cannot be uploaded

The local editor accepts PNG, JPEG, and WebP files up to 5 MB. Verify that the browser can use IndexedDB and that the device has enough free storage.

The analysis pipeline first uses browser image decoders and then falls back to PNG, JPEG, or WebP header dimensions when possible. A genuinely malformed or unsupported image is rejected instead of being added with incorrect dimensions.

## The artwork-quality percentage differs between browsers

Pixel-level transparency analysis uses a bounded canvas sample for performance. Browser decoders and image resampling can produce small differences in the reported transparent-pixel percentage.

Physical dimensions, source width and height, aspect ratio, and effective DPI remain the primary print-quality measurements. Transparency percentages are guidance rather than production color-separation data.

## The quality panel overlaps the interaction controls

The quality card is positioned above the bottom interaction toolbar and has a bounded scroll area. Very small browser heights can still make the preview crowded; increasing viewport height or using the controls panel provides more room without changing the saved design.

## A PNG proof or JSON specification does not download

Open the **Production files** section below the customizer and confirm that the draft contains at least one visible artwork layer.

The export system waits briefly for IndexedDB autosave to stabilize before reading the draft. Keep the studio page open while the file is generated, and allow downloads for the site if the browser blocks them.

The PNG proof requires the browser to decode every visible artwork file and create a local canvas. A corrupt image, insufficient device memory, disabled canvas support, or a restrictive browser download policy can prevent generation.

The JSON specification does not include temporary `blob:` URLs. It uses the artwork metadata stored in IndexedDB draft version 4. Older drafts are analyzed and upgraded when they are opened in the current customizer; reopen and save an older design before exporting when source dimensions are missing.

## The exported placement or dimensions do not match production equipment

The exported coordinates use centimeters relative to the center of each configured print surface, viewed from that surface. The specification also records left, top, right, and bottom offsets.

Current Classic T-shirt print areas are planning values. The export deliberately marks calibration as `unverified` and requires confirmation against the exact garment blank, print method, platen, and production workflow before use.

Generated proofs are review and handoff aids; they are not automatic print authorization.

## A direct route returns 404 after deployment

The host must route unknown application paths to `index.html`. Netlify uses `public/_redirects`. Other hosts need an equivalent single-page application fallback.

## Playwright cannot start Chromium

Install the browser and its system dependencies:

```bash
npx playwright install --with-deps chromium
```

Then rerun:

```bash
npm run test:e2e
```

Headless CI may use the safe 2D path when software WebGL is unavailable. The browser journeys wait for either a stable 3D editor or the documented 2D recovery state rather than assuming a GPU exists.

## Validation reports the wrong Node.js or npm version

Use the pinned runtime:

```bash
nvm use
npm ci
```

The required versions are stored in `.nvmrc` and `package.json`.

## A bundle budget fails

Run:

```bash
npm run build
npm run check:bundle
```

The report identifies the failing initial, lazy, total JavaScript, or CSS measurement. Optimize or split the bundle instead of raising a limit automatically.
