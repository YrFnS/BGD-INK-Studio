import { expect, test } from '@playwright/test';

test('presents verified guidance in English and Arabic', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/guide');

  await expect(
    page.getByRole('heading', { name: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.' }),
  ).toBeVisible();
  await expect(page.getByText('Exact garment chart pending')).toBeVisible();
  await expect(page.getByText('Reference only')).toHaveCount(3);

  await page.getByText('Does checkout send a real order?').click();
  await expect(
    page.getByText(/No\. It saves a local draft summary and marks the design as submitted/),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Switch to Arabic' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(
    page.getByRole('heading', { name: 'اعرف شنو المؤكد قبل ما تبدأ التصميم.' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'شوف القطع الجاهزة للمحرر' }).click();
  await expect(page).toHaveURL('/catalog');
});
