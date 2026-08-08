# BGD/INK Studio troubleshooting

## The 3D product does not load

Run `git lfs install` before cloning or pulling the repository, then run:

```bash
git lfs pull
```

Confirm the model files are not small Git LFS pointer text files. The editor shows a procedural fallback when a product model fails, but the fallback is not a production-accurate garment.

## A saved design disappeared

Local drafts are stored in IndexedDB and are tied to the current browser profile and device. Check that:

- Private browsing is disabled.
- Browser storage has not been cleared.
- Storage access is not blocked by privacy settings.
- The same browser profile is being used.

There is no cloud synchronization or account recovery in the local prototype.

## Artwork cannot be uploaded

The local editor accepts PNG, JPEG, and WebP files up to 5 MB. Verify that the browser can use IndexedDB and that the device has enough free storage.

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
