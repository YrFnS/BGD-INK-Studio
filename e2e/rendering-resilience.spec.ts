import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

test('separates camera and artwork modes and recovers through the 2D preview', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  const viewMode = page.getByRole('button', { name: 'View garment' });
  const moveMode = page.getByRole('button', { name: 'Move design' });
  const transformMode = page.getByRole('button', { name: 'Resize or rotate design' });

  await expect(viewMode).toHaveAttribute('aria-pressed', 'true');
  await expect(moveMode).toBeDisabled();
  await expect(transformMode).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  await expect(moveMode).toBeEnabled();
  await moveMode.click();
  await expect(moveMode).toHaveAttribute('aria-pressed', 'true');

  await transformMode.click();
  await expect(transformMode).toHaveAttribute('aria-pressed', 'true');

  await page.locator('canvas').evaluate((canvas) => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });

  const fallback = page.getByRole('img', { name: '2D design preview' });
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('Your design was not lost');

  await page.getByRole('button', { name: 'Try 3D again' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(viewMode).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Switch to 2D preview' }).click();
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('The 2D preview is active');
});
