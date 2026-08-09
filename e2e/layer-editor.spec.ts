import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

test('renames, duplicates, hides, reorders, and restores layers with history', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  const layerName = page.getByLabel('Layer name');
  await layerName.fill('Primary logo');
  await layerName.blur();

  await page.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('button', { name: 'Selected layer 2' })).toBeVisible();
  await expect(page.getByLabel('Layer name')).toHaveValue('Copy of Primary logo');

  await page.getByRole('button', { name: 'Hide' }).click();
  await expect(page.getByRole('button', { name: 'Show' })).toBeVisible();

  await page.getByRole('button', { name: /Undo/ }).click();
  await expect(page.getByRole('button', { name: 'Hide' })).toBeVisible();

  await page.getByRole('button', { name: /Undo/ }).click();
  await expect(page.getByRole('button', { name: 'Selected layer 2' })).toHaveCount(0);

  await page.getByRole('button', { name: /Redo/ }).click();
  await page.getByRole('button', { name: /Redo/ }).click();
  await expect(page.getByRole('button', { name: 'Show' })).toBeVisible();

  await page.getByRole('button', { name: 'Send layer backward' }).click();
  await page.getByRole('button', { name: 'Bring layer forward' }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Selected layer 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Selected layer 2' }).click();
  await expect(page.getByLabel('Layer name')).toHaveValue('Copy of Primary logo');
  await expect(page.getByRole('button', { name: 'Show' })).toBeVisible();
});

test('commits a continuous transform as one undoable and recoverable edit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'gesture-logo.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });

  const artworkWidth = page.getByLabel('Artwork width');
  const initialScale = Number.parseFloat(await artworkWidth.inputValue());
  const finalScale = await artworkWidth.evaluate((element) => {
    const input = element as HTMLInputElement;
    const minimum = Number.parseFloat(input.min);
    const maximum = Number.parseFloat(input.max);
    const values = [0.35, 0.55, 0.75].map((progress) => minimum + (maximum - minimum) * progress);

    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 }));
    values.forEach((value) => {
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 }));
    return input.valueAsNumber;
  });

  await expect
    .poll(async () => Number.parseFloat(await page.getByLabel('Artwork width').inputValue()))
    .toBeCloseTo(finalScale, 5);

  await page.getByRole('button', { name: /Undo/ }).click();
  await expect
    .poll(async () => Number.parseFloat(await page.getByLabel('Artwork width').inputValue()))
    .toBeCloseTo(initialScale, 5);

  await page.getByRole('button', { name: /Redo/ }).click();
  await expect
    .poll(async () => Number.parseFloat(await page.getByLabel('Artwork width').inputValue()))
    .toBeCloseTo(finalScale, 5);

  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect
    .poll(async () => Number.parseFloat(await page.getByLabel('Artwork width').inputValue()))
    .toBeCloseTo(finalScale, 5);
});
