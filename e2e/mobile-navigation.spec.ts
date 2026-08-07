import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test('supports persistent mobile navigation and Arabic RTL interaction', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveAttribute(
    'aria-hidden',
    'false',
  );

  await page.getByRole('button', { name: 'My Designs' }).click();
  await expect(page).toHaveURL('/designs');

  await page.getByRole('button', { name: 'Switch to Arabic' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('data-language', 'ar');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'تصاميمي المحلية' })).toBeVisible();

  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await page
    .getByRole('navigation', { name: 'تنقل الموبايل' })
    .getByRole('button', { name: 'القطع' })
    .click();
  await expect(page).toHaveURL('/catalog');
  await expect(page.getByRole('heading', { name: 'اختار قطعة جاهزة للمحرر' })).toBeVisible();

  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(viewportFits).toBe(true);
});
