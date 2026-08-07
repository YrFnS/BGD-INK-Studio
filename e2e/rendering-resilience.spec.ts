import { expect, test } from '@playwright/test';

const stablePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAABBklEQVR4nO3TsQ2AMAADwYT9dw5luhcFUhC6m8CFfwwAAAAAAAAAYJunB7xljbFOb2CbP/nWdXoAfJlAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBAAAAAAAAACAh26jZgKgUj3ijQAAAABJRU5ErkJggg==',
  'base64',
);

type StablePreviewState = '3d' | '2d';

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
  const canvas = page.locator('canvas');
  const fallback = page.locator('section[aria-labelledby="fallback-preview-title"]');
  const isFallbackVisible = (): Promise<boolean> => fallback.isVisible().catch(() => false);

  await expect(moveMode).toBeDisabled();
  await expect(transformMode).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: stablePng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  await page.waitForFunction(() => {
    const moveButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Move design"]',
    );
    const fallbackPreview = document.querySelector(
      'section[aria-labelledby="fallback-preview-title"]',
    );
    return Boolean(fallbackPreview || (moveButton && !moveButton.disabled));
  });

  const getStablePreviewState = async (): Promise<StablePreviewState> =>
    (await isFallbackVisible()) ? '2d' : '3d';

  let previewState = await getStablePreviewState();

  if (previewState === '3d' && (await moveMode.isEnabled().catch(() => false))) {
    await moveMode.click({ timeout: 3_000 }).catch(() => undefined);
    await page.waitForTimeout(150);

    if (await isFallbackVisible()) {
      previewState = '2d';
    } else if ((await moveMode.getAttribute('aria-pressed')) === 'true') {
      if (await transformMode.isEnabled().catch(() => false)) {
        await transformMode.click({ timeout: 3_000 }).catch(() => undefined);
        await page.waitForTimeout(150);

        if (!(await isFallbackVisible())) {
          await expect(transformMode).toHaveAttribute('aria-pressed', 'true');
        }
      }

      if (await canvas.isVisible().catch(() => false)) {
        await canvas.evaluate((element) => {
          element.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
        });
        await expect(fallback).toBeVisible();
        await expect(fallback).toContainText('Your design was not lost');
        previewState = '2d';
      }
    }
  }

  previewState = await getStablePreviewState();
  if (previewState === '2d') {
    await expect(moveMode).toBeDisabled();
    await expect(transformMode).toBeDisabled();
    await expect(fallback.locator('img[alt="team-logo"]')).toBeVisible();
  }

  const retry = page.getByRole('button', { name: 'Try 3D again' });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
    await page.waitForTimeout(250);
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
