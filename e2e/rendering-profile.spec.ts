import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

test('reacts to rendering environment changes without resetting the active draft', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let hardwareConcurrency = 8;
    const connection = {
      saveData: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };

    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      get: () => hardwareConcurrency,
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      configurable: true,
      get: () => 8,
    });
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      get: () => connection,
    });

    (
      window as Window & {
        __setRenderingHardwareConcurrency?: (value: number) => void;
      }
    ).__setRenderingHardwareConcurrency = (value: number) => {
      hardwareConcurrency = value;
    };
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  const toolbar = page.getByRole('toolbar', { name: 'Interaction mode' });
  await expect(toolbar).toHaveAttribute('data-rendering-quality', 'low');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'adaptive-logo.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  const layerName = page.getByLabel('Layer name');
  await layerName.fill('Adaptive mark');
  await layerName.blur();
  const artworkWidth = page.getByLabel('Artwork width');
  const committedScale = Number.parseFloat(await artworkWidth.inputValue());
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(toolbar).toHaveAttribute('data-rendering-quality', 'balanced');
  await expect(layerName).toHaveValue('Adaptive mark');
  await expect
    .poll(async () => Number.parseFloat(await artworkWidth.inputValue()))
    .toBeCloseTo(committedScale, 5);

  await page.evaluate(() => {
    (
      window as Window & {
        __setRenderingHardwareConcurrency?: (value: number) => void;
      }
    ).__setRenderingHardwareConcurrency?.(16);
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await expect(toolbar).toHaveAttribute('data-rendering-quality', 'high');
  await expect(layerName).toHaveValue('Adaptive mark');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(toolbar).toHaveAttribute('data-rendering-quality', 'low');
  await expect(layerName).toHaveValue('Adaptive mark');
  await expect
    .poll(async () => Number.parseFloat(await artworkWidth.inputValue()))
    .toBeCloseTo(committedScale, 5);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
  await expect(page.getByLabel('Layer name')).toHaveValue('Adaptive mark');
  await expect(toolbar).toHaveAttribute('data-rendering-quality', 'low');
});
