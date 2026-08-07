import { expect, test } from '@playwright/test';

const stablePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAABBklEQVR4nO3TsQ2AMAADwYT9dw5luhcFUhC6m8CFfwwAAAAAAAAAYJunB7xljbFOb2CbP/nWdXoAfJlAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBAAAAAAAAACAh26jZgKgUj3ijQAAAABJRU5ErkJggg==',
  'base64',
);

test('separates camera and artwork modes and preserves the draft through 2D recovery', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  const viewMode = page.getByRole('button', { name: 'View garment' });
  const moveMode = page.getByRole('button', { name: 'Move design' });
  const transformMode = page.getByRole('button', { name: 'Resize or rotate design' });

  const startsIn3d = await page.locator('canvas').isVisible().catch(() => false);
  if (startsIn3d) {
    await expect(viewMode).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(moveMode).toBeDisabled();
  await expect(transformMode).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: stablePng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  const canvas = page.locator('canvas');
  const fallback = page.getByRole('img', { name: '2D design preview' });
  const has3dAfterUpload = await canvas.isVisible().catch(() => false);

  if (has3dAfterUpload) {
    await expect(moveMode).toBeEnabled();
    await moveMode.click();
    await expect(moveMode).toHaveAttribute('aria-pressed', 'true');

    await transformMode.click();
    await expect(transformMode).toHaveAttribute('aria-pressed', 'true');

    await canvas.evaluate((element) => {
      element.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    });

    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('Your design was not lost');
  } else {
    await expect(fallback).toBeVisible();
    await expect(moveMode).toBeDisabled();
    await expect(transformMode).toBeDisabled();
    await expect(fallback.locator('img[alt="team-logo"]')).toBeVisible();
  }

  const retry = page.getByRole('button', { name: 'Try 3D again' });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
  }

  if (await canvas.isVisible().catch(() => false)) {
    await expect(viewMode).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Switch to 2D preview' }).click();
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('The 2D preview is active');
  } else {
    await expect(fallback).toBeVisible();
  }

  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
});
