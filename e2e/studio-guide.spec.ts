import { expect, test } from '@playwright/test';

test('presents the long-form Studio Guide safely in English and Iraqi Arabic', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/guide');

  await expect(
    page.getByRole('heading', { name: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.' }),
  ).toBeVisible();
  await expect(page.getByText('Exact garment chart pending')).toBeVisible();
  await expect(page.getByText('Reference only')).toHaveCount(3);

  const methodsLink = page.getByRole('link', { name: /Print methods/ });
  await expect(methodsLink).toHaveAttribute('href', '#methods');
  await methodsLink.click();
  await expect(page).toHaveURL(/\/guide#methods$/);
  await expect(page.locator('[data-guide-section="methods"]')).toBeVisible();

  await page.getByText('Does saving the draft send a real order?').click();
  await expect(
    page.getByText(/No\. It saves a local receipt and marks the design as prepared locally/),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Switch to Arabic' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(
    page.getByRole('heading', { name: 'اعرف شنو المؤكد قبل لا تبدأ التصميم.' }),
  ).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'أقسام الدليل' })).toBeVisible();
  await expect(page.getByText('مرجع عام')).toHaveCount(3);
  await expect(page.getByText('هل حفظ المسودة يرسل طلب حقيقي؟')).toBeVisible();
  await expect(page.getByText(/ينحفظ إيصال محلي، وينعلّم التصميم كمجهّز محلياً/)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole('button', { name: 'شوف القطع الجاهزة للمحرر' }).click();
  await expect(page).toHaveURL('/catalog');
});
