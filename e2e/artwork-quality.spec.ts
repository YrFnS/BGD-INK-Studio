import { expect, test } from '@playwright/test';

const wideTransparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAABBklEQVR4nO3TsQ2AMAADwYT9dw5luhcFUhC6m8CFfwwAAAAAAAAAYJunB7xljbFOb2CbP/nWdXoAfJlAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBAAAAAAAAACAh26jZgKgUj3ijQAAAABJRU5ErkJggg==',
  'base64',
);

test('preserves artwork aspect ratio and reports local print quality', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'wide-transparent-logo.png',
    mimeType: 'image/png',
    buffer: wideTransparentPng,
  });

  const quality = page.getByLabel('Artwork quality');
  await expect(quality).toBeVisible();
  await expect(quality).toContainText('12.0 × 6.0 cm');
  await expect(quality).toContainText('200 × 100 px');
  await expect(quality).toContainText('42 DPI');
  await expect(quality).toContainText(/Transparent background · \d+%/);
  await expect(quality).toContainText('Resolution is very low');
  await expect(quality).toContainText('substantial transparent padding');

  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();

  const restoredQuality = page.getByLabel('Artwork quality');
  await expect(restoredQuality).toContainText('12.0 × 6.0 cm');
  await expect(restoredQuality).toContainText('200 × 100 px');
});
