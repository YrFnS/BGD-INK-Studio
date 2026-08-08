import { expect, test } from '@playwright/test';

test.describe('runtime shell stability', () => {
  test('starts immediately with native interaction and stable route containers', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const routeContainer = page.locator('[data-page-transition-key]');
    const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });

    await expect(primaryNavigation).toBeVisible();
    await expect(routeContainer).toHaveCount(1);
    await expect(routeContainer).toHaveAttribute('data-page-transition-key', '/');
    await expect(page.locator('body')).not.toHaveCSS('cursor', 'none');
    await expect(page.locator('feTurbulence')).toHaveCount(0);

    await routeContainer.evaluate((element) => {
      (element as HTMLElement).dataset.runtimeMarker = 'same-route';
    });
    await page.getByRole('button', { name: 'Use dark theme' }).click();
    await expect(routeContainer).toHaveAttribute('data-runtime-marker', 'same-route');

    await primaryNavigation.getByRole('button', { name: /Catalog/ }).click();
    await expect(page).toHaveURL('/catalog');
    await expect(routeContainer).toHaveCount(1);
    await expect(routeContainer).toHaveAttribute('data-page-transition-key', '/catalog');
    await expect(routeContainer).not.toHaveAttribute('data-runtime-marker', 'same-route');

    await primaryNavigation.getByRole('button', { name: /Guide/ }).click();
    await expect(page).toHaveURL('/guide');
    await expect(routeContainer).toHaveCount(1);
    await expect(routeContainer).toHaveAttribute('data-page-transition-key', '/guide');

    await page.goBack();
    await expect(page).toHaveURL('/catalog');
    await expect(routeContainer).toHaveCount(1);
    await expect(routeContainer).toHaveAttribute('data-page-transition-key', '/catalog');

    await page.goForward();
    await expect(page).toHaveURL('/guide');
    await expect(routeContainer).toHaveCount(1);
    await expect(routeContainer).toHaveAttribute('data-page-transition-key', '/guide');
  });
});
