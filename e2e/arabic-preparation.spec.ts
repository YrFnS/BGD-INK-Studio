import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test('validates and saves an Iraqi-Arabic local draft preparation without RTL overflow', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');

  await page.getByRole('button', { name: /تيشيرت كلاسيك/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);
  await page.getByRole('button', { name: 'كمّل تجهيز المسودة' }).click();
  await expect(page).toHaveURL(/\/checkout\/draft-/);

  await expect(page.getByRole('heading', { name: 'تجهيز المسودة' })).toBeVisible();
  await expect(page.getByLabel('المنطقة / الحي').getByRole('option', { name: 'المنصور' })).toHaveValue(
    'Al-Mansour',
  );
  await expect(
    page.getByLabel('المنطقة / الحي').getByRole('option', { name: 'بغداد الجديدة' }),
  ).toHaveValue('Baghdad Al-Jadida');
  await expect(page.getByLabel('رقم الموبايل (07...)')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByLabel('الكمية المحلية')).toHaveAttribute('dir', 'ltr');

  await page.getByRole('button', { name: 'احفظ المسودة محلياً' }).click();
  const validationSummary = page.getByTestId('preparation-validation-summary');
  await expect(validationSummary).toBeVisible();
  await expect(validationSummary).toContainText('راجع الحقول المطلوبة قبل الحفظ');
  await expect(page.getByLabel('الاسم الكامل')).toBeFocused();

  await page.getByLabel('الاسم الكامل').fill('ياسر رياض');
  await page.getByLabel('رقم الموبايل (07...)').fill('07701234567');
  await page.getByLabel('المنطقة / الحي').selectOption('Al-Mansour');
  await expect(page.getByLabel('المنطقة / الحي').locator('option:checked')).toHaveText('المنصور');
  await page.getByLabel('الشارع / البيت / أقرب نقطة دالة').fill('شارع 10، قرب الساحة الرئيسية');
  await page.getByLabel('الكمية المحلية').fill('3');

  const hasPreparationOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasPreparationOverflow).toBe(false);

  await page.getByRole('button', { name: 'احفظ المسودة محلياً' }).click();
  await expect(page).toHaveURL(/\/draft\/BGD-/);
  await expect(page.getByRole('heading', { name: 'انحفظت مسودة التصميم' })).toBeVisible();
  await expect(page.getByText('الكمية المحلية').locator('..')).toContainText('3');

  await page.getByRole('button', { name: 'افتح تصاميمي' }).click();
  await expect(page).toHaveURL('/designs');
  await expect(page.getByText('مجهّزة محلياً', { exact: true })).toBeVisible();

  const hasWorkspaceOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasWorkspaceOverflow).toBe(false);
});
