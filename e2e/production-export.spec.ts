import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const wideTransparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAABBklEQVR4nO3TsQ2AMAADwYT9dw5luhcFUhC6m8CFfwwAAAAAAAAAYJunB7xljbFOb2CbP/nWdXoAfJlAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBAAAAAAAAACAh26jZgKgUj3ijQAAAABJRU5ErkJggg==',
  'base64',
);

test('downloads a multi-surface PNG proof and URL-free JSON specification', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: wideTransparentPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  const exportToggle = page.getByTestId('production-export-toggle');
  await expect(exportToggle).toBeVisible();
  await exportToggle.click();

  const proofDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG proof' }).click();
  const proofDownload = await proofDownloadPromise;
  expect(proofDownload.suggestedFilename()).toMatch(/^bgd-ink-.*-proof\.png$/);
  const proofPath = await proofDownload.path();
  expect(proofPath).not.toBeNull();
  const proofBytes = await readFile(proofPath as string);
  expect(proofBytes.length).toBeGreaterThan(1_000);
  expect(proofBytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

  const specificationDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON specification' }).click();
  const specificationDownload = await specificationDownloadPromise;
  expect(specificationDownload.suggestedFilename()).toMatch(
    /^bgd-ink-.*-specification\.json$/,
  );
  const specificationPath = await specificationDownload.path();
  expect(specificationPath).not.toBeNull();
  const specificationText = await readFile(specificationPath as string, 'utf8');
  const specification = JSON.parse(specificationText) as {
    format: string;
    calibration: { status: string; requiresPhysicalConfirmation: boolean };
    product: { id: string; size: string; color: string };
    surfaces: Array<{
      id: string;
      layers: Array<{
        name: string;
        source: { pixelWidth: number; pixelHeight: number };
        placement: { widthCm: number; heightCm: number };
        quality: { estimatedDpi: number };
      }>;
    }>;
  };

  expect(specification.format).toBe('bgd-ink-production-specification');
  expect(specification.calibration).toEqual({
    status: 'unverified',
    requiresPhysicalConfirmation: true,
    note: expect.any(String),
  });
  expect(specification.product).toMatchObject({
    id: 'tshirt-classic',
    size: 'L',
    color: '#000000',
  });
  expect(specification.surfaces.map((surface) => surface.id)).toEqual(['front', 'back']);
  expect(specification.surfaces[0].layers[0]).toMatchObject({
    name: 'team-logo',
    source: {
      pixelWidth: 200,
      pixelHeight: 100,
    },
    placement: {
      widthCm: 12,
      heightCm: 6,
    },
  });
  expect(specification.surfaces[0].layers[0].quality.estimatedDpi).toBeCloseTo(42.3, 1);
  expect(specificationText).not.toContain('blob:');
});
