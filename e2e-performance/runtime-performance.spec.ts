import { expect, test, type Page } from '@playwright/test';
import budgets from '../src/config/runtime-performance-budgets.json' with { type: 'json' };
import {
  createTransparentPng,
  enableRuntimePerformanceHarness,
  measureMilliseconds,
  median,
  readBrowserPerformance,
  readRuntimePerformance,
  readTexturePerformance,
  resetRuntimePerformance,
  setTestVisibility,
} from './runtimeHarness';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Wl8sAAAAASUVORK5CYII=',
  'base64',
);

const openClassicStudio = async (page: Page): Promise<void> => {
  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Classic T-Shirt/ }).click();
  await expect(page).toHaveURL(/\/studio\/draft-/);
  await expect(page.getByRole('toolbar', { name: 'Interaction mode' })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
};

const assertStandardBrowserBudgets = async (page: Page): Promise<void> => {
  const browser = await readBrowserPerformance(page);
  expect(browser.maximumLongTaskMs).toBeLessThanOrEqual(budgets.timingMs.maximumLongTask);
  expect(browser.longTaskTotalMs).toBeLessThanOrEqual(budgets.timingMs.totalLongTasks);
  expect(browser.maximumFrameGapMs).toBeLessThanOrEqual(budgets.timingMs.maximumFrameGap);
};

test.describe.configure({ mode: 'serial' });

test('keeps production startup and route transitions inside committed budgets', async ({
  page,
}) => {
  await enableRuntimePerformanceHarness(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const startupSamples: number[] = [];
  for (let sample = 0; sample < budgets.samples.homepageStartup; sample += 1) {
    startupSamples.push(
      await measureMilliseconds(async () => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
      }),
    );
  }
  expect(median(startupSamples)).toBeLessThanOrEqual(
    budgets.timingMs.homepageInteractiveMedian,
  );

  await resetRuntimePerformance(page);
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const destinations = [
    { name: /Catalog/, path: '/catalog' },
    { name: /Guide/, path: '/guide' },
    { name: /Catalog/, path: '/catalog' },
    { name: /Guide/, path: '/guide' },
    { name: /Catalog/, path: '/catalog' },
    { name: /Guide/, path: '/guide' },
  ];
  expect(destinations).toHaveLength(budgets.samples.routeNavigation);

  const routeSamples: number[] = [];
  for (const destination of destinations) {
    routeSamples.push(
      await measureMilliseconds(async () => {
        await primaryNavigation.getByRole('button', { name: destination.name }).click();
        await expect(page).toHaveURL(destination.path);
        await expect(page.locator('[data-page-transition-key]')).toHaveAttribute(
          'data-page-transition-key',
          destination.path,
        );
      }),
    );
  }

  expect(median(routeSamples)).toBeLessThanOrEqual(budgets.timingMs.routeTransitionMedian);
  const runtime = await readRuntimePerformance(page);
  expect(runtime.counters.routeTransitions).toBe(destinations.length);
  await assertStandardBrowserBudgets(page);
});

test('commits one durable edit, idles WebGL, and returns texture ownership to zero', async ({
  page,
}) => {
  await enableRuntimePerformanceHarness(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const studioReadyMs = await measureMilliseconds(() => openClassicStudio(page));
  expect(studioReadyMs).toBeLessThanOrEqual(budgets.timingMs.studioReady);

  const largeTransparentPng = await createTransparentPng(page, 2400, 1200);
  const artworkReadyMs = await measureMilliseconds(async () => {
    await page.locator('input[type="file"]').setInputFiles({
      name: 'performance-transparent-mark.png',
      mimeType: 'image/png',
      buffer: largeTransparentPng,
    });
    await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
    await expect.poll(async () => (await readTexturePerformance(page)).ready).toBe(1);
  });
  expect(artworkReadyMs).toBeLessThanOrEqual(budgets.timingMs.largeArtworkReady);
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  await resetRuntimePerformance(page);
  const artworkWidth = page.getByLabel('Artwork width');
  const finalScale = await artworkWidth.evaluate((element) => {
    const input = element as HTMLInputElement;
    const minimum = Number.parseFloat(input.min);
    const maximum = Number.parseFloat(input.max);
    const step = Number.parseFloat(input.step) || 0.005;
    const snap = (value: number) =>
      Math.min(maximum, Math.max(minimum, minimum + Math.round((value - minimum) / step) * step));
    const values = Array.from({ length: 24 }, (_, index) =>
      snap(minimum + (maximum - minimum) * ((index + 1) / 30)),
    );

    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 17 }));
    values.forEach((value) => {
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 17 }));
    return values.at(-1) ?? input.valueAsNumber;
  });

  await expect
    .poll(async () => Number.parseFloat(await page.getByLabel('Artwork width').inputValue()))
    .toBeCloseTo(finalScale, 5);
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  const gestureRuntime = await readRuntimePerformance(page);
  expect(gestureRuntime.counters.editorHistoryCommits).toBe(
    budgets.counts.editorHistoryCommitsPerGesture,
  );
  expect(gestureRuntime.counters.draftSavesStarted).toBe(budgets.counts.draftSavesPerGesture);
  expect(gestureRuntime.counters.draftSavesSucceeded).toBe(
    budgets.counts.draftSavesPerGesture,
  );
  expect(gestureRuntime.counters.draftSavesFailed).toBe(0);
  expect(gestureRuntime.counters.reactCommits).toBeLessThanOrEqual(
    budgets.counts.maximumReactCommitsPerGesture,
  );
  expect(gestureRuntime.counters.webglInvalidations).toBeGreaterThan(0);

  const framesBeforeIdle = gestureRuntime.counters.webglFrames;
  await page.waitForTimeout(budgets.windowsMs.idleSettle);
  const framesAfterIdle = (await readRuntimePerformance(page)).counters.webglFrames;
  expect(framesAfterIdle - framesBeforeIdle).toBeLessThanOrEqual(
    budgets.counts.maximumVisibleIdleWebglFrames,
  );

  await setTestVisibility(page, 'hidden');
  await page.waitForTimeout(100);
  const framesBeforeHiddenWindow = (await readRuntimePerformance(page)).counters.webglFrames;
  await page.waitForTimeout(budgets.windowsMs.hiddenObservation);
  const framesAfterHiddenWindow = (await readRuntimePerformance(page)).counters.webglFrames;
  expect(framesAfterHiddenWindow - framesBeforeHiddenWindow).toBe(
    budgets.counts.hiddenWebglFrames,
  );
  await setTestVisibility(page, 'visible');
  await page.waitForTimeout(150);

  await page.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('button', { name: 'Selected layer 2' })).toBeVisible();
  await expect.poll(async () => (await readTexturePerformance(page)).references).toBe(2);
  expect(await readTexturePerformance(page)).toMatchObject({ entries: 1, references: 2 });

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect.poll(async () => (await readTexturePerformance(page)).references).toBe(1);
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect
    .poll(async () => (await readTexturePerformance(page)).entries)
    .toBe(budgets.counts.maximumTextureEntriesAfterCleanup);

  for (let cycle = 0; cycle < 2; cycle += 1) {
    await page.locator('input[type="file"]').setInputFiles({
      name: `performance-cycle-${cycle}.png`,
      mimeType: 'image/png',
      buffer: tinyPng,
    });
    await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
    await expect.poll(async () => (await readTexturePerformance(page)).ready).toBe(1);
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect.poll(async () => (await readTexturePerformance(page)).entries).toBe(0);
  }

  const finalTexture = await readTexturePerformance(page);
  expect(finalTexture.entries).toBe(budgets.counts.maximumTextureEntriesAfterCleanup);
  expect(finalTexture.references).toBe(budgets.counts.maximumTextureReferencesAfterCleanup);
  expect(finalTexture.texturesDisposed).toBe(finalTexture.texturesCreated);
  await assertStandardBrowserBudgets(page);
});

test('keeps constrained-device artwork bounded under controlled CPU throttling', async ({
  page,
}) => {
  await enableRuntimePerformanceHarness(page, { constrained: true });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const largeSquarePng = await createTransparentPng(page, 2000, 2000);

  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: budgets.throttling.cpuRate });

  try {
    await openClassicStudio(page);
    const toolbar = page.getByRole('toolbar', { name: 'Interaction mode' });
    await expect(toolbar).toHaveAttribute('data-rendering-quality', 'low');
    await resetRuntimePerformance(page);

    const artworkReadyMs = await measureMilliseconds(async () => {
      await page.locator('input[type="file"]').setInputFiles({
        name: 'constrained-large-square.png',
        mimeType: 'image/png',
        buffer: largeSquarePng,
      });
      await expect(page.getByRole('button', { name: 'Selected layer 1' })).toBeVisible();
      await expect.poll(async () => (await readTexturePerformance(page)).ready).toBe(1);
    });
    expect(artworkReadyMs).toBeLessThanOrEqual(budgets.timingMs.constrainedArtworkReady);

    const boundedTexture = await readTexturePerformance(page);
    expect(boundedTexture.largestWidth).toBeLessThanOrEqual(1024);
    expect(boundedTexture.largestHeight).toBeLessThanOrEqual(1024);
    expect(boundedTexture.largestPixelArea).toBeLessThanOrEqual(786_432);

    await page.getByRole('button', { name: 'Duplicate' }).click();
    await expect.poll(async () => (await readTexturePerformance(page)).references).toBe(2);
    expect(await readTexturePerformance(page)).toMatchObject({
      entries: 1,
      references: 2,
      loadsStarted: 1,
      texturesCreated: 1,
    });

    await page.getByRole('button', { name: 'Remove' }).click();
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect.poll(async () => (await readTexturePerformance(page)).entries).toBe(0);

    const browser = await readBrowserPerformance(page);
    expect(browser.maximumLongTaskMs).toBeLessThanOrEqual(
      budgets.timingMs.constrainedMaximumLongTask,
    );
    expect(browser.longTaskTotalMs).toBeLessThanOrEqual(
      budgets.timingMs.constrainedTotalLongTasks,
    );
    expect(browser.maximumFrameGapMs).toBeLessThanOrEqual(
      budgets.timingMs.constrainedMaximumFrameGap,
    );
  } finally {
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
});
