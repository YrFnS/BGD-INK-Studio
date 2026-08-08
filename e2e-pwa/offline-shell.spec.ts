import { expect, test } from '@playwright/test';

const waitForServiceWorkerControl = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    await navigator.serviceWorker.ready;
    return Boolean(navigator.serviceWorker.controller);
  });
};

test('installs owned assets and reopens visited public routes from the production cache', async ({
  context,
  page,
}) => {
  await page.goto('/');
  await waitForServiceWorkerControl(page);

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return {
      ok: response.ok,
      value: (await response.json()) as {
        name: string;
        icons: Array<{ src: string; purpose?: string }>;
      },
    };
  });

  expect(manifest.ok).toBe(true);
  expect(manifest.value.name).toBe('BGD/INK Studio');
  expect(manifest.value.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);

  for (const icon of manifest.value.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
  }

  await page.goto('/guide');
  await expect(
    page.getByRole('heading', { name: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.' }),
  ).toBeVisible();

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'SELECT A VERIFIED CANVAS' })).toBeVisible();

  await context.setOffline(true);
  await page.goto('/guide', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.' }),
  ).toBeVisible();

  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'SELECT A VERIFIED CANVAS' })).toBeVisible();

  // Chromium's DevTools offline emulation does not consistently dispatch the
  // standard browser event in headless mode, so emit it while the context is
  // still genuinely offline to validate the customer notice deterministically.
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByRole('heading', { name: 'You are offline.' })).toBeVisible();
  await expect(page.getByText(/New or uncached content still needs a connection/)).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
});
