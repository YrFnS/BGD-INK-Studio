import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

test('recovers artwork and checkout fields across refreshes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');

  const product = page.getByRole('button', { name: /Classic T-Shirt/ });
  await expect(product).toBeVisible();
  await product.click();

  await expect(page).toHaveURL(/\/studio\/draft-/);
  const studioPath = new URL(page.url()).pathname;

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();

  const notes = page.getByPlaceholder('e.g. Print on back, make logo smaller...');
  await notes.fill('Front center launch logo');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(studioPath);
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
  await expect(notes).toHaveValue('Front center launch logo');

  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout\/draft-/);

  await page.getByLabel('Full Name').fill('Yasser Test');
  await page.getByLabel('Phone Number (07...)').fill('07701234567');
  await page.getByLabel('Area / District').selectOption('Al-Mansour');
  await page.getByLabel('Street / House / Landmark').fill('Street 10, near the main square');

  await page.waitForTimeout(700);
  await page.reload();

  await expect(page.getByLabel('Full Name')).toHaveValue('Yasser Test');
  await expect(page.getByLabel('Phone Number (07...)')).toHaveValue('07701234567');
  await expect(page.getByLabel('Area / District')).toHaveValue('Al-Mansour');
  await expect(page.getByLabel('Street / House / Landmark')).toHaveValue(
    'Street 10, near the main square',
  );

  await page.getByRole('button', { name: 'CONFIRM ORDER' }).click();
  await expect(page).toHaveURL(/\/draft\/BGD-/);
  await expect(page.getByRole('heading', { name: 'Design draft saved' })).toBeVisible();

  await page.getByRole('button', { name: 'My Designs' }).click();
  await expect(page).toHaveURL('/designs');
  await expect(page.getByText('Submitted', { exact: true })).toBeVisible();
});
