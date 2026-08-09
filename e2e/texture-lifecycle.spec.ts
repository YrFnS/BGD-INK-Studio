import { expect, test, type Page } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

interface TextureCacheSnapshot {
  entries: number;
  references: number;
  pending: number;
  ready: number;
  loadsStarted: number;
  texturesCreated: number;
  texturesDisposed: number;
  failedLoads: number;
  cancelledLoads: number;
  largestWidth: number;
  largestHeight: number;
  largestPixelArea: number;
}

type TextureTestWindow = Window & {
  __BGD_INK_TEXTURE_CACHE__?: TextureCacheSnapshot;
  __BGD_INK_TEXTURE_TEST_DELAY_MS__?: number;
};

const readTextureCache = (page: Page): Promise<TextureCacheSnapshot | null> =>
  page.evaluate(
    () => (window as TextureTestWindow).__BGD_INK_TEXTURE_CACHE__ ?? null,
  );

const createTransparentPng = async (
  page: Page,
  width: number,
  height: number,
): Promise<Buffer> => {
  const bytes = await page.evaluate(
    async ({ imageWidth, imageHeight }) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      context.clearRect(0, 0, imageWidth, imageHeight);
      context.fillStyle = '#ef4444';
      context.fillRect(
        Math.floor(imageWidth * 0.1),
        Math.floor(imageHeight * 0.1),
        Math.floor(imageWidth * 0.8),
        Math.floor(imageHeight * 0.8),
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error('PNG failed.'))),
          'image/png',
        );
      });
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { imageWidth: width, imageHeight: height },
  );

  return Buffer.from(bytes);
};

const openClassicStudio = async (page: Page) => {
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);
  await expect(page.locator('canvas')).toBeVisible();
};

test('bounds large artwork, shares duplicate textures, and releases every final consumer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openClassicStudio(page);

  const largeTransparentPng = await createTransparentPng(page, 2400, 1200);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'large-transparent-mark.png',
    mimeType: 'image/png',
    buffer: largeTransparentPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  await expect.poll(async () => (await readTextureCache(page))?.ready ?? 0).toBe(1);
  const lowSnapshot = await readTextureCache(page);
  expect(lowSnapshot).toMatchObject({
    entries: 1,
    references: 1,
    loadsStarted: 1,
    texturesCreated: 1,
  });
  expect(lowSnapshot?.largestWidth).toBeLessThanOrEqual(1024);
  expect(lowSnapshot?.largestHeight).toBeLessThanOrEqual(1024);
  expect(lowSnapshot?.largestPixelArea).toBeLessThanOrEqual(786_432);

  await page.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('button', { name: 'Selected layer 2' })).toBeVisible();
  await expect.poll(async () => (await readTextureCache(page))?.references ?? 0).toBe(2);
  expect(await readTextureCache(page)).toMatchObject({
    entries: 1,
    references: 2,
    loadsStarted: 1,
    texturesCreated: 1,
  });

  const toolbar = page.getByRole('toolbar', { name: 'Interaction mode' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(toolbar).toHaveAttribute('data-rendering-quality', 'balanced');
  await expect.poll(async () => (await readTextureCache(page))?.ready ?? 0).toBe(1);
  await expect.poll(async () => (await readTextureCache(page))?.references ?? 0).toBe(2);
  const balancedSnapshot = await readTextureCache(page);
  expect(balancedSnapshot?.loadsStarted).toBeGreaterThanOrEqual(2);
  expect(balancedSnapshot?.texturesDisposed).toBeGreaterThanOrEqual(1);
  expect(balancedSnapshot?.largestWidth).toBeLessThanOrEqual(1536);
  expect(balancedSnapshot?.largestPixelArea).toBeLessThanOrEqual(1_572_864);

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect.poll(async () => (await readTextureCache(page))?.references ?? 0).toBe(1);
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect.poll(async () => (await readTextureCache(page))?.entries ?? -1).toBe(0);
  expect(await readTextureCache(page)).toMatchObject({ entries: 0, references: 0 });

  for (let cycle = 0; cycle < 2; cycle += 1) {
    await page.locator('input[type="file"]').setInputFiles({
      name: `cycle-${cycle}.png`,
      mimeType: 'image/png',
      buffer: tinyPng,
    });
    await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
    await expect.poll(async () => (await readTextureCache(page))?.ready ?? 0).toBe(1);
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect.poll(async () => (await readTextureCache(page))?.entries ?? -1).toBe(0);
  }

  const finalSnapshot = await readTextureCache(page);
  expect(finalSnapshot).toMatchObject({ entries: 0, references: 0 });
  expect(finalSnapshot?.texturesDisposed).toBe(finalSnapshot?.texturesCreated);
});

test('cancels a slow texture decode when the draft route unmounts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openClassicStudio(page);

  const cancelledBefore = (await readTextureCache(page))?.cancelledLoads ?? 0;
  await page.evaluate(() => {
    (window as TextureTestWindow).__BGD_INK_TEXTURE_TEST_DELAY_MS__ = 1200;
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: 'slow-mark.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
  await expect.poll(async () => (await readTextureCache(page))?.pending ?? 0).toBe(1);

  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await primaryNavigation.getByRole('button', { name: /Guide/ }).click();
  await expect(page).toHaveURL('/guide');
  await expect.poll(async () => (await readTextureCache(page))?.entries ?? -1).toBe(0);
  await expect
    .poll(async () => (await readTextureCache(page))?.cancelledLoads ?? 0)
    .toBeGreaterThan(cancelledBefore);
});
