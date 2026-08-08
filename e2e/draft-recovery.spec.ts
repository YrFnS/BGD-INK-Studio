import { expect, test } from '@playwright/test';
import { PRODUCTS } from '../src/data/products';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

const classicProduct = PRODUCTS.find((product) => product.id === 'tshirt-classic');
if (!classicProduct) throw new Error('Classic T-shirt test product is missing.');

const quantity = 4;
const formatPrice = (value: number): string => new Intl.NumberFormat('en-US').format(value);

test('recovers artwork, quantity, and draft-preparation fields across refreshes', async ({
  page,
}) => {
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

  const notes = page.getByLabel('Draft Notes');
  await notes.fill('Front center launch logo');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(studioPath);
  await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
  await expect(page.getByLabel('Draft Notes')).toHaveValue('Front center launch logo');

  await page.getByRole('button', { name: 'Continue to Draft Preparation' }).click();
  await expect(page).toHaveURL(/\/checkout\/draft-/);

  await page.getByLabel('Local quantity').fill(String(quantity));
  await page.getByLabel('Full Name').fill('Yasser Test');
  await page.getByLabel('Phone Number (07...)').fill('07701234567');
  await page.getByLabel('Area / District').selectOption('Al-Mansour');
  await page.getByLabel('Street / House / Landmark').fill('Street 10, near the main square');

  await page.waitForTimeout(700);
  await page.reload();

  await expect(page.getByLabel('Local quantity')).toHaveValue(String(quantity));
  await expect(page.getByLabel('Full Name')).toHaveValue('Yasser Test');
  await expect(page.getByLabel('Phone Number (07...)')).toHaveValue('07701234567');
  await expect(page.getByLabel('Area / District')).toHaveValue('Al-Mansour');
  await expect(page.getByLabel('Street / House / Landmark')).toHaveValue(
    'Street 10, near the main square',
  );

  const configuredPriceRow = page.getByText('Configured unit price').locator('..');
  await expect(configuredPriceRow).toContainText(formatPrice(classicProduct.basePrice));
  await expect(configuredPriceRow).toContainText(`× ${quantity}`);

  const configuredEstimateRow = page.getByText('Local estimate').locator('../..');
  await expect(configuredEstimateRow).toContainText(
    formatPrice(classicProduct.basePrice * quantity),
  );

  await page.getByRole('button', { name: 'SAVE LOCAL DRAFT' }).click();
  await expect(page).toHaveURL(/\/draft\/BGD-/);
  await expect(page.getByRole('heading', { name: 'Design draft saved' })).toBeVisible();

  await page.getByRole('button', { name: 'Open My Designs', exact: true }).click();
  await expect(page).toHaveURL('/designs');
  await expect(page.getByText('Prepared locally', { exact: true })).toBeVisible();

  const quantitySummary = page.getByText('Quantity', { exact: true }).locator('..');
  await expect(quantitySummary).toContainText(String(quantity));
});
