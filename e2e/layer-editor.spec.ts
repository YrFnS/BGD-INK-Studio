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
