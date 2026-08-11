import { expect, test } from '@playwright/test';
import { isProductCustomizerReady } from '../src/data/assets3d';
import { PRODUCTS } from '../src/data/products';
import { getGarmentPreviewDefinition } from '../src/features/customizer/garmentPreview';

const garmentAssetPaths = [
  ...PRODUCTS.map((product) => product.image),
  ...PRODUCTS.flatMap((product) => [
    getGarmentPreviewDefinition(product.id, 'front').assetPath,
    getGarmentPreviewDefinition(product.id, 'back').assetPath,
  ]),
];

const uniqueGarmentAssetPaths = [...new Set(garmentAssetPaths)];

test('loads every owned garment render and preserves catalog availability in a real browser', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const failedLocalResponses: Array<{ status: number; url: string }> = [];
  page.on('response', (response) => {
    if (
      response.url().startsWith('http://127.0.0.1:4173/') &&
      response.status() >= 400
    ) {
      failedLocalResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.goto('/catalog');

  const productImages = page.locator('main img[src^="/brand/products/"]');
  await expect(productImages).toHaveCount(PRODUCTS.length);
  await expect
    .poll(() =>
      productImages.evaluateAll((images) =>
        images.every((image) => {
          const element = image as HTMLImageElement;
          return element.complete && element.naturalWidth > 0 && element.naturalHeight > 0;
        }),
      ),
    )
    .toBe(true);

  const decodedAssets = await page.evaluate(async (paths) => {
    const loadImage = (source: string, label: string) =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error(`Could not decode image: ${label}`));
        image.src = source;
      });

    return Promise.all(
      paths.map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Could not fetch ${path}: ${response.status}`);
        }

        const svgSource = await response.text();
        const documentNode = new DOMParser().parseFromString(svgSource, 'image/svg+xml');
        if (documentNode.querySelector('parsererror')) {
          throw new Error(`Could not parse SVG wrapper: ${path}`);
        }

        const embeddedSources = [...documentNode.querySelectorAll('image')]
          .map(
            (embeddedImage) =>
              embeddedImage.getAttribute('href') ??
              embeddedImage.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
          )
          .filter((source): source is string => Boolean(source));
        if (embeddedSources.length === 0) {
          throw new Error(`SVG wrapper has no embedded image: ${path}`);
        }

        const wrapper = await loadImage(path, path);
        const nestedImages = await Promise.all(
          embeddedSources.map((source, index) =>
            loadImage(
              new URL(source, response.url).href,
              `${path} nested image ${index + 1}`,
            ),
          ),
        );

        return { path, wrapper, nestedImages };
      }),
    );
  }, uniqueGarmentAssetPaths);

  expect(decodedAssets).toHaveLength(PRODUCTS.length * 3);
  for (const decodedAsset of decodedAssets) {
    expect(decodedAsset.wrapper.width, decodedAsset.path).toBeGreaterThan(0);
    expect(decodedAsset.wrapper.height, decodedAsset.path).toBeGreaterThan(0);
    expect(decodedAsset.nestedImages.length, decodedAsset.path).toBeGreaterThan(0);
    for (const nestedImage of decodedAsset.nestedImages) {
      expect(nestedImage.width, decodedAsset.path).toBeGreaterThan(0);
      expect(nestedImage.height, decodedAsset.path).toBeGreaterThan(0);
    }
  }

  for (const product of PRODUCTS) {
    const productCard = page.locator('button').filter({
      has: page.locator(`img[src="${product.image}"]`),
    });
    await expect(productCard).toHaveCount(1);

    const isReady = product.inStock && isProductCustomizerReady(product.id);
    if (!isReady) {
      await expect(productCard).toBeDisabled();
      continue;
    }

    await expect(productCard).toBeEnabled();
    await productCard.click();
    await expect(page).toHaveURL(/\/studio\/draft-/);
    await page.goto('/catalog');
  }

  expect(failedLocalResponses).toEqual([]);
});
