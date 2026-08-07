import { devices, expect, test } from '@playwright/test';

const wideTransparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAABBklEQVR4nO3TsQ2AMAADwYT9dw5luhcFUhC6m8CFfwwAAAAAAAAAYJunB7xljbFOb2CbP/nWdXoAfJlAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBAAAAAAAAACAh26jZgKgUj3ijQAAAABJRU5ErkJggg==',
  'base64',
);

test.use({ ...devices['Pixel 5'] });

test('keeps the Arabic customizer, quality guidance, fallback, and handoff tools RTL-safe', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'اختار قطعة جاهزة للمحرر' })).toBeVisible();

  await page.getByRole('button', { name: /تيشيرت كلاسيك/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'team-logo.png',
    mimeType: 'image/png',
    buffer: wideTransparentPng,
  });

  await expect(page.getByRole('button', { name: /الطبقة المختارة: team-logo/ })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'أوضاع التحكم بالمحرر' })).toBeVisible();
  await expect(page.getByTestId('artwork-quality-overlay')).toContainText('جودة التصميم للطباعة');
  await expect(page.getByTestId('artwork-quality-overlay')).toContainText('200 × 100 px');

  const moveMode = page.getByRole('button', { name: 'تحريك التصميم' });
  const transformMode = page.getByRole('button', { name: 'تغيير الحجم والتدوير' });
  const fallbackTitle = page.getByText('المعاينة الآمنة 2D', { exact: true });

  await page.waitForFunction(() => {
    const moveButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="تحريك التصميم"]',
    );
    const fallback = Array.from(document.querySelectorAll('p')).some(
      (element) => element.textContent?.trim() === 'المعاينة الآمنة 2D',
    );
    return Boolean(fallback || (moveButton && !moveButton.disabled));
  });

  if (await fallbackTitle.isVisible().catch(() => false)) {
    await expect(moveMode).toBeDisabled();
    await expect(transformMode).toBeDisabled();
  } else {
    await expect(moveMode).toBeEnabled();
    await expect(transformMode).toBeEnabled();
    await page.getByRole('button', { name: 'استخدم المعاينة 2D' }).click();
    await expect(fallbackTitle).toBeVisible();
  }

  const exportToggle = page.getByTestId('production-export-toggle');
  await exportToggle.scrollIntoViewIfNeeded();
  await exportToggle.click();
  await expect(page.getByRole('heading', { name: 'ملفات التسليم المحلية' })).toBeVisible();
  await expect(page.getByText('على هذا الجهاز', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'نزّل إثبات PNG' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'نزّل مواصفات JSON' })).toBeEnabled();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
