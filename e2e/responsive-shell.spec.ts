import { devices, expect, type Page, test } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollWidth - root.clientWidth, body.scrollWidth - body.clientWidth);
  });

  expect(overflow).toBeLessThanOrEqual(1);
};

const expectNavigationFitsViewport = async (page: Page) => {
  const measurements = await page.locator('#mobile-navigation').evaluate((navigation) => {
    const rect = navigation.getBoundingClientRect();
    const styles = window.getComputedStyle(navigation);
    return {
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      overflowY: styles.overflowY,
    };
  });

  expect(measurements.top).toBeGreaterThanOrEqual(0);
  expect(measurements.bottom).toBeLessThanOrEqual(measurements.viewportHeight + 1);
  expect(measurements.width).toBeLessThanOrEqual(measurements.viewportWidth + 1);
  expect(['auto', 'scroll']).toContain(measurements.overflowY);
};

test.describe('iPhone 13 responsive shell', () => {
  test.use({ ...devices['iPhone 13'] });

  test('keeps the safe-area shell usable through portrait and short landscape', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /viewport-fit=cover/,
    );
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await expectNavigationFitsViewport(page);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await expectNavigationFitsViewport(page);
    await expectNoHorizontalOverflow(page);

    const mobileNavigation = page.locator('#mobile-navigation');
    await mobileNavigation.getByRole('button', { name: 'Start design' }).scrollIntoViewIfNeeded();
    await expect(mobileNavigation.getByRole('button', { name: 'Start design' })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNavigationFitsViewport(page);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('iPad Mini responsive shell', () => {
  test.use({ ...devices['iPad Mini'] });

  test('preserves the Guide route and RTL layout through tablet orientation changes', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bgd-ink-language', 'ar');
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/guide');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'اعرف شنو المؤكد قبل ما تبدأ التصميم.' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page).toHaveURL('/guide');
    await expect(page.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'أقسام دليل الستوديو' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('link', { name: 'الأسئلة' }).click();
    await expect(page.locator('#faq')).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  });
});
