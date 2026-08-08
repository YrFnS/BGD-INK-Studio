import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const changed = new Set();

const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const write = async (relativePath, content) => {
  await writeFile(path.join(root, relativePath), content);
  changed.add(relativePath);
};

const replaceExact = async (relativePath, before, after) => {
  const source = await read(relativePath);
  if (!source.includes(before)) {
    throw new Error(`${relativePath}: expected source fragment was not found`);
  }
  await write(relativePath, source.replace(before, after));
};

const replaceRegex = async (relativePath, pattern, replacement) => {
  const source = await read(relativePath);
  if (!pattern.test(source)) {
    throw new Error(`${relativePath}: expected pattern ${pattern} was not found`);
  }
  pattern.lastIndex = 0;
  await write(relativePath, source.replace(pattern, replacement));
};

const updateJson = async (relativePath, updater) => {
  const value = JSON.parse(await read(relativePath));
  updater(value);
  await write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
};

await write(
  'src/services/drafts/persistenceCoordinator.ts',
  `export const DRAFT_PERSISTENCE_FAILURE_EVENT = 'bgd-ink:draft-persistence-failed';

export interface DraftPersistenceFailureDetail {
  failedKeys: string[];
}

type PersistenceFlusher = () => Promise<void>;

const flushers = new Map<string, PersistenceFlusher>();
let lifecycleInstalled = false;
let activeFlush: Promise<boolean> | null = null;

const announceFailure = (failedKeys: string[]): void => {
  if (typeof window === 'undefined' || failedKeys.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<DraftPersistenceFailureDetail>(DRAFT_PERSISTENCE_FAILURE_EVENT, {
      detail: { failedKeys },
    }),
  );
};

export const registerDraftPersistenceFlusher = (
  key: string,
  flusher: PersistenceFlusher,
): (() => void) => {
  flushers.set(key, flusher);

  return () => {
    if (flushers.get(key) === flusher) flushers.delete(key);
  };
};

export const flushPendingDraftPersistence = async (
  options: { announce?: boolean } = {},
): Promise<boolean> => {
  if (activeFlush) return activeFlush;

  activeFlush = (async () => {
    const entries = Array.from(flushers.entries());
    const results = await Promise.allSettled(entries.map(([, flusher]) => flusher()));
    const failedKeys = results.flatMap((result, index) =>
      result.status === 'rejected' ? [entries[index]?.[0] ?? 'unknown'] : [],
    );

    if (options.announce !== false) announceFailure(failedKeys);
    return failedKeys.length === 0;
  })().finally(() => {
    activeFlush = null;
  });

  return activeFlush;
};

export const installDraftPersistenceLifecycle = (): void => {
  if (lifecycleInstalled || typeof window === 'undefined' || typeof document === 'undefined') return;
  lifecycleInstalled = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushPendingDraftPersistence({ announce: false });
    }
  });

  window.addEventListener('pagehide', () => {
    void flushPendingDraftPersistence({ announce: false });
  });
};

export const resetDraftPersistenceCoordinatorForTests = (): void => {
  flushers.clear();
  activeFlush = null;
};
`,
);

await write(
  'src/services/drafts/persistenceCoordinator.test.ts',
  `import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DRAFT_PERSISTENCE_FAILURE_EVENT,
  flushPendingDraftPersistence,
  registerDraftPersistenceFlusher,
  resetDraftPersistenceCoordinatorForTests,
} from './persistenceCoordinator';

afterEach(() => {
  resetDraftPersistenceCoordinatorForTests();
});

describe('draft persistence coordinator', () => {
  it('flushes every registered editor before navigation continues', async () => {
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);
    registerDraftPersistenceFlusher('customizer:draft-1', first);
    registerDraftPersistenceFlusher('checkout:draft-1', second);

    await expect(flushPendingDraftPersistence()).resolves.toBe(true);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('announces a failed flush and blocks the navigation decision', async () => {
    const listener = vi.fn();
    window.addEventListener(DRAFT_PERSISTENCE_FAILURE_EVENT, listener);
    registerDraftPersistenceFlusher('customizer:draft-2', async () => {
      throw new Error('storage unavailable');
    });

    await expect(flushPendingDraftPersistence()).resolves.toBe(false);
    expect(listener).toHaveBeenCalledOnce();

    window.removeEventListener(DRAFT_PERSISTENCE_FAILURE_EVENT, listener);
  });
});
`,
);

await replaceExact(
  'src/main.tsx',
  "import { registerServiceWorker } from './pwa/registerServiceWorker';\n",
  "import { registerServiceWorker } from './pwa/registerServiceWorker';\nimport { installDraftPersistenceLifecycle } from './services/drafts/persistenceCoordinator';\n",
);
await replaceExact(
  'src/main.tsx',
  'installAnchorNavigation();\nregisterServiceWorker();\n',
  'installAnchorNavigation();\ninstallDraftPersistenceLifecycle();\nregisterServiceWorker();\n',
);

await replaceExact(
  'src/routing/appRouter.ts',
  "import { ViewState } from '@/types';\n",
  "import { flushPendingDraftPersistence } from '@/services/drafts/persistenceCoordinator';\nimport { ViewState } from '@/types';\n",
);
await replaceRegex(
  'src/routing/appRouter.ts',
  /export const useAppRouter = \(\) => \{[\s\S]*?\n\};\n$/,
  `export const useAppRouter = () => {
  const [route, setRoute] = useState<AppRoute>(readCurrentRoute);
  const routeRef = useRef(route);
  const navigationSequenceRef = useRef(0);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    const canonicalPath = routeToPath(readCurrentRoute());
    if (canonicalPath !== window.location.pathname) {
      window.history.replaceState(null, '', canonicalPath);
    }

    const handlePopState = async () => {
      const sequence = ++navigationSequenceRef.current;
      const previousRoute = routeRef.current;
      const nextRoute = readCurrentRoute();
      const flushed = await flushPendingDraftPersistence();
      if (sequence !== navigationSequenceRef.current) return;

      if (!flushed) {
        window.history.replaceState(null, '', routeToPath(previousRoute));
        return;
      }

      routeRef.current = nextRoute;
      setRoute(nextRoute);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback(async (nextRoute: AppRoute, options: NavigateOptions = {}) => {
    const sequence = ++navigationSequenceRef.current;
    const flushed = await flushPendingDraftPersistence();
    if (!flushed || sequence !== navigationSequenceRef.current) return false;

    const nextPath = routeToPath(nextRoute);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (options.replace) {
      window.history.replaceState(null, '', nextPath);
    } else if (currentPath !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }

    routeRef.current = nextRoute;
    setRoute(nextRoute);

    if (options.scroll !== false) {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    }

    return true;
  }, []);

  return {
    route,
    view: route.view as ViewState,
    navigate,
  };
};
`,
);
await replaceExact(
  'src/routing/appRouter.ts',
  "import { useCallback, useEffect, useState } from 'react';",
  "import { useCallback, useEffect, useRef, useState } from 'react';",
);

await replaceExact(
  'src/App.tsx',
  "import { createDesignDraft } from '@/services/drafts';\n",
  "import { createDesignDraft } from '@/services/drafts';\nimport { DRAFT_PERSISTENCE_FAILURE_EVENT } from '@/services/drafts/persistenceCoordinator';\n",
);
await replaceExact(
  'src/App.tsx',
  `const LoadingSpinner = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white" />
    <span className="sr-only">Loading</span>
  </div>
);`,
  `const LoadingSpinner = ({ language }: { language: 'en' | 'ar' }) => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white" />
    <span className="sr-only">{language === 'ar' ? 'جاري التحميل' : 'Loading'}</span>
  </div>
);`,
);
await replaceExact(
  'src/App.tsx',
  `interface ErrorBoundaryProps {
  children: ReactNode;
}`,
  `interface ErrorBoundaryProps {
  children: ReactNode;
  language: 'en' | 'ar';
}`,
);
await replaceExact(
  'src/App.tsx',
  `            <h2 className="mb-3 text-2xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-gray-500">Refresh the page to restart the studio.</p>`,
  `            <h2 className="mb-3 text-2xl font-bold">
              {this.props.language === 'ar' ? 'صار خطأ غير متوقع' : 'Something went wrong'}
            </h2>
            <p className="mb-6 text-gray-500">
              {this.props.language === 'ar'
                ? 'حدّث الصفحة حتى تعيد تشغيل الستوديو.'
                : 'Refresh the page to restart the studio.'}
            </p>`,
);
await replaceExact(
  'src/App.tsx',
  `              Refresh
`,
  `              {this.props.language === 'ar' ? 'تحديث الصفحة' : 'Refresh'}
`,
);
await replaceExact(
  'src/App.tsx',
  `  const [lastSubmission, setLastSubmission] = useState<LastSubmission | null>(null);
  const creatingDraftRef = useRef(false);
`,
  `  const [lastSubmission, setLastSubmission] = useState<LastSubmission | null>(null);
  const creatingDraftRef = useRef(false);

  React.useEffect(() => {
    const handlePersistenceFailure = () => {
      showToast(
        language === 'ar'
          ? 'آخر تغييراتك ما انحفظت، لذلك بقينا بنفس الصفحة. حاول مرة ثانية.'
          : 'Your latest changes could not be saved, so the Studio kept you on this page. Try again.',
        'error',
      );
    };

    window.addEventListener(DRAFT_PERSISTENCE_FAILURE_EVENT, handlePersistenceFailure);
    return () =>
      window.removeEventListener(DRAFT_PERSISTENCE_FAILURE_EVENT, handlePersistenceFailure);
  }, [language, showToast]);
`,
);
await replaceExact(
  'src/App.tsx',
  `<ErrorBoundary>
          <PageTransition viewKey={routeToPath(route)}>
            <Suspense fallback={<LoadingSpinner />}>{renderRoute()}</Suspense>
          </PageTransition>
        </ErrorBoundary>`,
  `<ErrorBoundary language={language}>
          <PageTransition viewKey={routeToPath(route)}>
            <Suspense fallback={<LoadingSpinner language={language} />}>{renderRoute()}</Suspense>
          </PageTransition>
        </ErrorBoundary>`,
);

await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `  saveDesignDraft,
  storeArtworkFile,
} from '@/services/drafts';`,
  `  saveDesignDraft,
  storeArtworkFile,
} from '@/services/drafts';
import { registerDraftPersistenceFlusher } from '@/services/drafts/persistenceCoordinator';`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `const createSnapshot = (
  color: string,
  size: Size,
  notes: string,
  activeDecalId: string | null,
  decals: DecalLayer[],
): DesignDraftSnapshot => ({
  color,
  size,
  notes,
  activeDecalId,
  decals,
});`,
  `const createSnapshot = (
  color: string,
  size: Size,
  notes: string,
  activeDecalId: string | null,
  decals: DecalLayer[],
  retainedAssetIds: string[] = [],
): DesignDraftSnapshot => ({
  color,
  size,
  notes,
  activeDecalId,
  decals,
  retainedAssetIds,
});

const collectRetainedAssetIds = (
  history: EditorHistory | null,
  decals: DecalLayer[],
): string[] => {
  const assetIds = new Set(
    decals.flatMap((layer) => (layer.assetId ? [layer.assetId] : [])),
  );

  if (history) {
    [...history.past, history.present, ...history.future].forEach((snapshot) => {
      snapshot.decals.forEach((layer) => {
        if (layer.assetId) assetIds.add(layer.assetId);
      });
    });
  }

  return Array.from(assetIds);
};`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveVersionRef = useRef(0);
`,
  `  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveVersionRef = useRef(0);
  const pendingSaveRef = useRef<DesignDraftSnapshot | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);
`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `  const queueDraftSave = useCallback(
    (snapshot: DesignDraftSnapshot): Promise<void> => {
      const saveVersion = ++saveVersionRef.current;
      if (mountedRef.current) setSaveStatus('saving');

      const operation = saveQueueRef.current
        .catch(() => undefined)
        .then(() => saveDesignDraft(draftId, snapshot))
        .then(() => {
          if (mountedRef.current && saveVersion === saveVersionRef.current) {
            setSaveStatus('saved');
          }
        })
        .catch((error: unknown) => {
          if (mountedRef.current && saveVersion === saveVersionRef.current) {
            setSaveStatus('error');
          }
          throw error;
        });

      saveQueueRef.current = operation.catch(() => undefined);
      return operation;
    },
    [draftId],
  );`,
  `  const queueDraftSave = useCallback(
    (snapshot: DesignDraftSnapshot): Promise<void> => {
      const saveVersion = ++saveVersionRef.current;
      if (mountedRef.current) setSaveStatus('saving');

      const operation = saveQueueRef.current
        .catch(() => undefined)
        .then(() => saveDesignDraft(draftId, snapshot))
        .then(() => {
          if (mountedRef.current && saveVersion === saveVersionRef.current) {
            setSaveStatus('saved');
          }
        })
        .catch((error: unknown) => {
          if (mountedRef.current && saveVersion === saveVersionRef.current) {
            setSaveStatus('error');
          }
          throw error;
        });

      saveQueueRef.current = operation.catch(() => undefined);
      return operation;
    },
    [draftId],
  );

  const flushPendingSave = useCallback(async (): Promise<void> => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const pendingSnapshot = pendingSaveRef.current;
    pendingSaveRef.current = null;

    if (pendingSnapshot) await queueDraftSave(pendingSnapshot);
    await saveQueueRef.current;
  }, [queueDraftSave]);

  useEffect(
    () => registerDraftPersistenceFlusher(`customizer:${draftId}`, flushPendingSave),
    [draftId, flushPendingSave],
  );`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `          showToast(
            language === 'ar'
              ? ` + "`تعذر استرجاع ${draft.missingAssetCount} من ملفات التصميم.`" + `
              : ` + "`${draft.missingAssetCount} artwork file(s) could not be restored.`" + `,
            'error',
          );`,
  `          showToast(
            languageRef.current === 'ar'
              ? ` + "`تعذر استرجاع ${draft.missingAssetCount} من ملفات التصميم.`" + `
              : ` + "`${draft.missingAssetCount} artwork file(s) could not be restored.`" + `,
            'error',
          );`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `  }, [applyEditorSnapshot, draftId, language, showToast, updateHistoryAvailability]);`,
  `  }, [applyEditorSnapshot, draftId, showToast, updateHistoryAvailability]);`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setSaveStatus('unsaved');
    const snapshot = createSnapshot(selectedColor, selectedSize, notes, activeDecalId, decals);
    const timer = window.setTimeout(() => {
      void queueDraftSave(snapshot).catch(() => undefined);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [activeDecalId, decals, loadStatus, notes, queueDraftSave, selectedColor, selectedSize]);`,
  `  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setSaveStatus('unsaved');
    pendingSaveRef.current = createSnapshot(
      selectedColor,
      selectedSize,
      notes,
      activeDecalId,
      decals,
      collectRetainedAssetIds(historyRef.current, decals),
    );

    if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      const pendingSnapshot = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (!pendingSnapshot) return;
      void queueDraftSave(pendingSnapshot).catch(() => {
        pendingSaveRef.current = pendingSnapshot;
      });
    }, 650);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [activeDecalId, decals, loadStatus, notes, queueDraftSave, selectedColor, selectedSize]);`,
);
await replaceExact(
  'src/features/customizer/Customizer.tsx',
  `    const snapshot = createSnapshot(
      selectedColorRef.current,
      selectedSizeRef.current,
      notes,
      activeDecalIdRef.current,
      decalsRef.current,
    );

    try {
      await queueDraftSave(snapshot);
      onCheckout(draftId);`,
  `    const snapshot = createSnapshot(
      selectedColorRef.current,
      selectedSizeRef.current,
      notes,
      activeDecalIdRef.current,
      decalsRef.current,
      collectRetainedAssetIds(historyRef.current, decalsRef.current),
    );

    try {
      pendingSaveRef.current = snapshot;
      await flushPendingSave();
      onCheckout(draftId);`,
);

await replaceExact(
  'src/features/checkout/Checkout.tsx',
  `} from '@/services/drafts';
import { OrderDetails, PendingOrder, Product } from '@/types';`,
  `} from '@/services/drafts';
import { registerDraftPersistenceFlusher } from '@/services/drafts/persistenceCoordinator';
import { OrderDetails, PendingOrder, Product } from '@/types';`,
);
await replaceExact(
  'src/features/checkout/Checkout.tsx',
  `  const preparationSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
`,
  `  const preparationSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingPreparationRef = useRef<{ details: OrderDetails; quantity: number } | null>(null);
  const preparationTimerRef = useRef<number | null>(null);
`,
);
await replaceExact(
  'src/features/checkout/Checkout.tsx',
  `  const queuePreparationSave = useCallback(
    (nextDetails: OrderDetails, nextQuantity: number): Promise<void> => {
      const task = preparationSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await saveCheckoutDetails(draftId, nextDetails);
          await saveDraftQuantity(draftId, nextQuantity);
        });

      preparationSaveQueueRef.current = task;
      return task;
    }, [draftId],
  );`,
  `  const queuePreparationSave = useCallback(
    (nextDetails: OrderDetails, nextQuantity: number): Promise<void> => {
      const task = preparationSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await saveCheckoutDetails(draftId, nextDetails);
          await saveDraftQuantity(draftId, nextQuantity);
        });

      preparationSaveQueueRef.current = task;
      return task;
    }, [draftId],
  );

  const flushPreparationSave = useCallback(async (): Promise<void> => {
    if (preparationTimerRef.current !== null) {
      window.clearTimeout(preparationTimerRef.current);
      preparationTimerRef.current = null;
    }

    const pending = pendingPreparationRef.current;
    pendingPreparationRef.current = null;
    if (pending) await queuePreparationSave(pending.details, pending.quantity);
    await preparationSaveQueueRef.current;
  }, [queuePreparationSave]);

  useEffect(
    () => registerDraftPersistenceFlusher(`checkout:${draftId}`, flushPreparationSave),
    [draftId, flushPreparationSave],
  );`,
);
await replaceExact(
  'src/features/checkout/Checkout.tsx',
  `  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setFormSaveFailed(false);
    const timer = window.setTimeout(() => {
      void queuePreparationSave(formData, quantity).catch(() => setFormSaveFailed(true));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [formData, loadStatus, quantity, queuePreparationSave]);`,
  `  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setFormSaveFailed(false);
    pendingPreparationRef.current = { details: formData, quantity };
    if (preparationTimerRef.current !== null) window.clearTimeout(preparationTimerRef.current);
    preparationTimerRef.current = window.setTimeout(() => {
      preparationTimerRef.current = null;
      const pending = pendingPreparationRef.current;
      pendingPreparationRef.current = null;
      if (!pending) return;
      void queuePreparationSave(pending.details, pending.quantity).catch(() => {
        pendingPreparationRef.current = pending;
        setFormSaveFailed(true);
      });
    }, 500);

    return () => {
      if (preparationTimerRef.current !== null) {
        window.clearTimeout(preparationTimerRef.current);
        preparationTimerRef.current = null;
      }
    };
  }, [formData, loadStatus, quantity, queuePreparationSave]);`,
);
await replaceExact(
  'src/features/checkout/Checkout.tsx',
  `    try {
      await queuePreparationSave(formData, quantity);
      setFormSaveFailed(false);`,
  `    try {
      pendingPreparationRef.current = { details: formData, quantity };
      await flushPreparationSave();
      setFormSaveFailed(false);`,
);
await replaceExact(
  'src/features/checkout/Checkout.tsx',
  `      await preparationSaveQueueRef.current.catch(() => undefined);
      await queuePreparationSave(normalizedDetails, pendingOrder.quantity);
      setFormSaveFailed(false);`,
  `      pendingPreparationRef.current = {
        details: normalizedDetails,
        quantity: pendingOrder.quantity,
      };
      await flushPreparationSave();
      setFormSaveFailed(false);`,
);

await replaceExact(
  'src/config/platform.ts',
  `  localOrderStorageEnabled: true,
  adminPortalEnabled: false,
  pwaEnabled: false,`,
  `  localDraftPreparationEnabled: true,
  adminPortalEnabled: false,
  pwaEnabled: true,`,
);

await write(
  'src/utils/storage.ts',
  `import { BRAND } from '@/config/brand';
import { PRODUCTS as INITIAL_PRODUCTS } from '@/data/products';
import { Product } from '@/types';

const LEGACY_CONFIGURATION_KEYS = [
  `${BRAND.storageNamespace}:products`,
  `${BRAND.storageNamespace}:gallery`,
  'ashus_products',
  'ashus_gallery',
] as const;
const LEGACY_RECEIPT_KEYS = [`${BRAND.storageNamespace}:orders`, 'ashus_orders'] as const;
const CLEANUP_KEY = `${BRAND.storageNamespace}:local-configuration-cleanup:v2`;

const INITIAL_GALLERY = [
  '/brand/products/classic-tshirt.svg',
  '/brand/products/oversized-tee.svg',
  '/brand/products/premium-hoodie.svg',
  '/brand/products/urban-vest.svg',
];

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Browser storage is unavailable:', error);
    return null;
  }
};

const cleanLegacyConfigurationAndReceipts = (): void => {
  const storage = getBrowserStorage();
  if (!storage || storage.getItem(CLEANUP_KEY)) return;

  try {
    [...LEGACY_CONFIGURATION_KEYS, ...LEGACY_RECEIPT_KEYS].forEach((key) => storage.removeItem(key));
    storage.setItem(CLEANUP_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('Unable to clean obsolete browser configuration:', error);
  }
};

const cloneInitialProducts = (): Product[] =>
  INITIAL_PRODUCTS.map((product) => ({
    ...product,
    colors: [...product.colors],
  }));

export const getProducts = (): Product[] => {
  cleanLegacyConfigurationAndReceipts();
  return cloneInitialProducts();
};

export const getGallery = (): string[] => {
  cleanLegacyConfigurationAndReceipts();
  return [...INITIAL_GALLERY];
};
`,
);

await replaceExact(
  'src/services/api/local.ts',
  `import { Order, PendingOrder } from '@/types';
import { getProducts, saveOrder } from '@/utils/storage';`,
  `import { PendingOrder } from '@/types';
import { getProducts } from '@/utils/storage';`,
);
await replaceExact(
  'src/services/api/local.ts',
  `  if (!PLATFORM_STATUS.localOrderStorageEnabled) {
    throw new PlatformApiError({
      code: 'LOCAL_STORAGE_DISABLED',
      message: 'Local draft storage is disabled.',
    });
  }

  const orderId = createDraftId();
  const draft: Order = {
    ...createDurablePendingOrder(pendingOrder),
    ...details,
    id: orderId,
    date: new Date().toISOString(),
    status: 'PENDING',
    designDraftId,
  };

  if (!saveOrder(draft)) {
    throw new PlatformApiError({
      code: 'LOCAL_DRAFT_SAVE_FAILED',
      message: 'The draft could not be saved in this browser.',
    });
  }

  return {`,
  `  if (!PLATFORM_STATUS.localDraftPreparationEnabled) {
    throw new PlatformApiError({
      code: 'LOCAL_STORAGE_DISABLED',
      message: 'Local draft preparation is disabled.',
    });
  }

  createDurablePendingOrder(pendingOrder);
  const orderId = createDraftId();

  return {`,
);
await replaceExact(
  'src/services/api/local.ts',
  `  { designDraftId, pendingOrder, details }: SubmitOrderInput,`,
  `  { pendingOrder }: SubmitOrderInput,`,
);

await replaceExact(
  'src/services/drafts/types.ts',
  `export const DESIGN_DRAFT_VERSION = 5 as const;`,
  `export const DESIGN_DRAFT_VERSION = 6 as const;`,
);
await replaceExact(
  'src/services/drafts/types.ts',
  `  version: typeof DESIGN_DRAFT_VERSION;
  id: string;`,
  `  version: typeof DESIGN_DRAFT_VERSION;
  revision: number;
  id: string;`,
);
await replaceExact(
  'src/services/drafts/types.ts',
  `  decals: DecalLayer[];
}`,
  `  decals: DecalLayer[];
  retainedAssetIds?: string[];
}`,
);

await replaceExact(
  'src/services/drafts/indexedDb.ts',
  `  'version' | 'name' | 'quantity' | 'decals' | 'assetIds'`,
  `  'version' | 'revision' | 'name' | 'quantity' | 'decals' | 'assetIds'`,
);
await replaceExact(
  'src/services/drafts/indexedDb.ts',
  `  version?: unknown;
  name?: unknown;`,
  `  version?: unknown;
  revision?: unknown;
  name?: unknown;`,
);
await replaceExact(
  'src/services/drafts/indexedDb.ts',
  `    version: DESIGN_DRAFT_VERSION,
    name: typeof draft.name === 'string' ? draft.name : '',`,
  `    version: DESIGN_DRAFT_VERSION,
    revision:
      typeof draft.revision === 'number' && Number.isInteger(draft.revision) && draft.revision >= 0
        ? draft.revision
        : 0,
    name: typeof draft.name === 'string' ? draft.name : '',`,
);
await replaceRegex(
  'src/services/drafts/indexedDb.ts',
  /const putDraftRecord = async \([\s\S]*?\n\};\n\nconst updateDraftRecord = async \([\s\S]*?\n\};\n/,
  `const updateDraftRecord = async (
  draftId: string,
  update: (draft: DesignDraftRecord) => DesignDraftRecord,
): Promise<DesignDraftRecord> => {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFT_STORE, 'readwrite');
  const completion = waitForTransaction(transaction);
  const draftStore = transaction.objectStore(DRAFT_STORE);
  const storedDraft = await requestToPromise(
    draftStore.get(draftId) as IDBRequest<LegacyDesignDraftRecord | undefined>,
  );

  if (!storedDraft) {
    await completion;
    throw new DraftStorageError('DRAFT_NOT_FOUND', 'The requested design draft no longer exists.');
  }

  const currentDraft = normalizeDraftRecord(storedDraft);
  const nextDraft = {
    ...update(currentDraft),
    revision: currentDraft.revision + 1,
  };
  draftStore.put(nextDraft);
  await completion;
  return nextDraft;
};
`,
);
await replaceExact(
  'src/services/drafts/indexedDb.ts',
  `    version: DESIGN_DRAFT_VERSION,
    id: createId('draft'),`,
  `    version: DESIGN_DRAFT_VERSION,
    revision: 0,
    id: createId('draft'),`,
);
await replaceRegex(
  'src/services/drafts/indexedDb.ts',
  /export const saveDesignDraft = async \([\s\S]*?\n  \}\);\n\nexport const renameDesignDraft/,
  `export const saveDesignDraft = async (
  draftId: string,
  snapshot: DesignDraftSnapshot,
): Promise<DesignDraftRecord> => {
  const decals = snapshot.decals.map(serializeLayer);
  const retainedAssetIds = (snapshot.retainedAssetIds ?? []).filter(
    (assetId): assetId is string => typeof assetId === 'string' && assetId.length > 0,
  );
  const liveAssetIds = Array.from(
    new Set([...decals.map((layer) => layer.assetId), ...retainedAssetIds]),
  );

  const database = await openDatabase();
  const transaction = database.transaction([DRAFT_STORE, ASSET_STORE], 'readwrite');
  const completion = waitForTransaction(transaction);
  const draftStore = transaction.objectStore(DRAFT_STORE);
  const storedDraft = await requestToPromise(
    draftStore.get(draftId) as IDBRequest<LegacyDesignDraftRecord | undefined>,
  );

  if (!storedDraft) {
    await completion;
    throw new DraftStorageError('DRAFT_NOT_FOUND', 'The requested design draft no longer exists.');
  }

  const draft = normalizeDraftRecord(storedDraft);
  const nextDraft: DesignDraftRecord = {
    ...draft,
    revision: draft.revision + 1,
    color: snapshot.color,
    size: snapshot.size,
    notes: snapshot.notes,
    activeDecalId: snapshot.activeDecalId,
    decals,
    assetIds: liveAssetIds,
    updatedAt: new Date().toISOString(),
  };

  draftStore.put(nextDraft);
  const assetStore = transaction.objectStore(ASSET_STORE);
  draft.assetIds
    .filter((assetId) => !liveAssetIds.includes(assetId))
    .forEach((assetId) => assetStore.delete(assetId));
  await completion;
  return nextDraft;
};

export const renameDesignDraft`,
);
await replaceExact(
  'src/services/drafts/indexedDb.ts',
  `  const duplicate: DesignDraftRecord = {
    ...sourceDraft,
    id: createId('draft'),`,
  `  const duplicate: DesignDraftRecord = {
    ...sourceDraft,
    revision: 0,
    id: createId('draft'),`,
);
await replaceExact(
  'src/services/drafts/indexedDb.ts',
  `  draftStore.put({
    ...draft,
    assetIds: Array.from(new Set([...draft.assetIds, asset.id])),
    updatedAt: new Date().toISOString(),
  });`,
  `  draftStore.put({
    ...draft,
    revision: draft.revision + 1,
    assetIds: Array.from(new Set([...draft.assetIds, asset.id])),
    updatedAt: new Date().toISOString(),
  });`,
);

await replaceExact(
  'scripts/generate-delivery-assets.mjs',
  `  '/brand/products/hoodie-premium.svg',`,
  `  '/brand/products/premium-hoodie.svg',`,
);
await replaceRegex(
  'scripts/generate-delivery-assets.mjs',
  /const siteUrl =[\s\S]*?const indexable =[\s\S]*?;\n\nconst escapeAttribute/,
  `const siteUrl = normalizeSiteUrl(process.env.VITE_PUBLIC_SITE_URL);
const indexable = Boolean(siteUrl) && process.env.VITE_INDEXABLE_BUILD === 'true';

const escapeAttribute`,
);
await replaceExact(
  'scripts/check-delivery-assets.mjs',
  `  'brand/social/og-default.png',
]) {`,
  `  'brand/social/og-default.png',
  'brand/products/classic-tshirt.svg',
  'brand/products/premium-hoodie.svg',
  'brand/products/oversized-tee.svg',
  'brand/products/urban-vest.svg',
]) {`,
);
await replaceExact(
  'scripts/check-delivery-assets.mjs',
  `} else {
  requirePattern(robots, /Disallow:\s*\//, 'a preview build must block crawling');
}`,
  `} else {
  requirePattern(robots, /Disallow:\s*\//, 'a preview build must block crawling');
  if (/rel="canonical"/.test(index)) failures.push('a preview build must not publish a canonical URL');
  if (/name="bgd:site-url"/.test(index)) failures.push('a preview build must not expose a public site URL');
}`,
);

await replaceRegex(
  'src/utils/seo.ts',
  /export const getPublicSiteUrl = \(\): string => \{[\s\S]*?\n\};\n\nexport const isIndexableBuild = \(\): boolean => \{[\s\S]*?\n\};/,
  `export const getPublicSiteUrl = (): string | null => {
  const configured = normalizeSiteUrl(import.meta.env.VITE_PUBLIC_SITE_URL);
  if (configured) return configured;
  return normalizeSiteUrl(readMetaContent('bgd:site-url'));
};

export const isIndexableBuild = (): boolean =>
  readMetaContent('bgd:indexing') === 'indexable' && getPublicSiteUrl() !== null;`,
);
await replaceExact(
  'src/utils/seo.ts',
  `export const createAbsoluteSiteUrl = (pathname: string): string =>
  new URL(pathname, `${getPublicSiteUrl()}/`).toString();

export const getCanonicalUrl = (pathname: string): string | null => {
  const normalized = normalizePath(pathname);
  return isPublicIndexablePath(normalized) ? createAbsoluteSiteUrl(normalized) : null;
};`,
  `export const createAbsoluteSiteUrl = (pathname: string): string => {
  const configuredSiteUrl = getPublicSiteUrl();
  const fallbackOrigin =
    typeof window !== 'undefined' && normalizeSiteUrl(window.location.origin)
      ? window.location.origin
      : 'http://localhost';
  return new URL(pathname, `${configuredSiteUrl ?? fallbackOrigin}/`).toString();
};

export const getCanonicalUrl = (pathname: string): string | null => {
  const normalized = normalizePath(pathname);
  return isIndexableBuild() && isPublicIndexablePath(normalized)
    ? createAbsoluteSiteUrl(normalized)
    : null;
};`,
);
await replaceExact(
  'src/utils/seo.ts',
  `  const siteUrl = getPublicSiteUrl();
  const canonicalUrl = createAbsoluteSiteUrl(normalizedPath);`,
  `  const siteUrl = getPublicSiteUrl();
  if (!siteUrl || !isIndexableBuild()) return null;
  const canonicalUrl = createAbsoluteSiteUrl(normalizedPath);`,
);
await replaceExact(
  'src/hooks/useSEO.ts',
  `    const structuredData = buildRouteStructuredData({`,
  `    const structuredData = isIndexable
      ? buildRouteStructuredData({`,
);
await replaceExact(
  'src/hooks/useSEO.ts',
  `      translate: t,
    });
    const existingStructuredDataElement`,
  `          translate: t,
        })
      : null;
    const existingStructuredDataElement`,
);

await replaceExact(
  'src/features/checkout/services.ts',
  `import { OrderDetails, PendingOrder } from '@/types';`,
  `import { Language, OrderDetails, PendingOrder } from '@/types';`,
);
await replaceRegex(
  'src/features/checkout/services.ts',
  /export const generateWhatsAppLink = \([\s\S]*?\n\};\n$/,
  `export const buildWhatsAppDraftMessage = (
  orderId: string,
  order: PendingOrder,
  details: OrderDetails,
  language: Language,
  productName: string,
): string => {
  const address = [details.area, details.street, details.house].filter(Boolean).join(', ');
  const labels =
    language === 'ar'
      ? {
          draft: 'مسودة',
          item: 'القطعة',
          size: 'القياس',
          color: 'اللون',
          quantity: 'الكمية',
          layers: 'طبقات التصميم',
          customer: 'الزبون',
          phone: 'الهاتف',
          address: 'العنوان',
          notes: 'ملاحظات',
          none: 'ماكو',
        }
      : {
          draft: 'Draft',
          item: 'Item',
          size: 'Size',
          color: 'Color',
          quantity: 'Quantity',
          layers: 'Design layers',
          customer: 'Customer',
          phone: 'Phone',
          address: 'Address',
          notes: 'Notes',
          none: 'None',
        };

  return `
*${BRAND.displayName} — ${labels.draft} ${orderId}*
------------------
*${labels.item}:* ${productName}
*${labels.size}:* ${order.size}
*${labels.color}:* ${order.color}
*${labels.quantity}:* ${order.quantity}
*${labels.layers}:* ${order.decals.length}
------------------
*${labels.customer}:* ${details.fullName}
*${labels.phone}:* ${details.phone}
*${labels.address}:* ${address}
------------------
*${labels.notes}:* ${order.notes || labels.none}
  `.trim();
};

export const generateWhatsAppLink = (
  orderId: string,
  order: PendingOrder,
  details: OrderDetails,
  language: Language,
  productName: string,
): string | null => {
  const adminNumber = getConfiguredWhatsAppNumber();
  if (!adminNumber) return null;

  const text = buildWhatsAppDraftMessage(orderId, order, details, language, productName);
  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`;
};
`,
);
await replaceExact(
  'src/features/checkout/Success.tsx',
  `  const whatsappLink =
    pendingOrder && orderDetails ? generateWhatsAppLink(orderId, pendingOrder, orderDetails) : null;`,
  `  const whatsappLink =
    pendingOrder && orderDetails
      ? generateWhatsAppLink(
          orderId,
          pendingOrder,
          orderDetails,
          language,
          t(pendingOrder.productName),
        )
      : null;`,
);
await write(
  'src/features/checkout/services.test.ts',
  `import { describe, expect, it } from 'vitest';
import { Size } from '@/types';
import { buildWhatsAppDraftMessage } from './services';

const order = {
  productId: 'tshirt-classic',
  productName: 'product.classic_tshirt',
  basePrice: 15000,
  color: '#000000',
  size: Size.L,
  quantity: 2,
  decals: [],
  notes: '',
};
const details = {
  fullName: 'Test Customer',
  phone: '07700000000',
  area: 'Al-Mansour',
  street: 'Street 1',
  house: '',
};

describe('WhatsApp draft handoff', () => {
  it('uses the translated garment name instead of the translation key', () => {
    const message = buildWhatsAppDraftMessage(
      'BGD-1234',
      order,
      details,
      'en',
      'Classic T-shirt',
    );

    expect(message).toContain('*Item:* Classic T-shirt');
    expect(message).not.toContain('product.classic_tshirt');
  });

  it('localizes the field labels for Iraqi Arabic handoff', () => {
    const message = buildWhatsAppDraftMessage(
      'BGD-1234',
      order,
      details,
      'ar',
      'تيشيرت كلاسيك',
    );

    expect(message).toContain('*القطعة:* تيشيرت كلاسيك');
    expect(message).toContain('*الكمية:* 2');
  });
});
`,
);

await replaceExact(
  'e2e-pwa/offline-shell.spec.ts',
  `  for (const icon of manifest.value.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
  }

  await page.goto('/guide');`,
  `  for (const icon of manifest.value.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
  }

  const precachedProductAssets = await page.evaluate(async () =>
    Promise.all(
      (await caches.keys()).map(async (key) =>
        (await (await caches.open(key)).keys()).map((request) => new URL(request.url).pathname),
      ),
    ).then((groups) => groups.flat()),
  );
  expect(precachedProductAssets).toEqual(
    expect.arrayContaining([
      '/brand/products/classic-tshirt.svg',
      '/brand/products/premium-hoodie.svg',
      '/brand/products/oversized-tee.svg',
      '/brand/products/urban-vest.svg',
    ]),
  );

  await page.goto('/guide');`,
);

await replaceRegex(
  'index.html',
  /\n    <link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>[\s\S]*?rel="stylesheet"\n    \/>/,
  '',
);
await replaceExact(
  'src/styles.css',
  `  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Syne', ui-sans-serif, system-ui, sans-serif;
  --font-arabic: 'Cairo', ui-sans-serif, system-ui, sans-serif;`,
  `  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Arial Black', 'Segoe UI Black', ui-sans-serif, system-ui, sans-serif;
  --font-arabic: 'Noto Sans Arabic', 'Geeza Pro', Tahoma, Arial, sans-serif;`,
);
await replaceExact(
  'netlify.toml',
  `    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"`,
  `    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Content-Security-Policy = "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' blob: data:; manifest-src 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; upgrade-insecure-requests"`,
);

await updateJson('package.json', (packageJson) => {
  delete packageJson.dependencies.gsap;
});
await updateJson('tsconfig.json', (tsconfig) => {
  tsconfig.compilerOptions.paths.gsap = ['src/utils/gsap-lite.ts'];
});
await updateJson('src/config/bundle-budgets.json', (budgets) => {
  budgets.initialCssGzipKiB = 16.5;
  budgets.totalCssGzipKiB = 17;
});

await replaceExact(
  'README.md',
  `### P4 — delivery, SEO, and controlled PWA
`,
  `### P5 — pre-launch hardening

Implemented on \`agent/bgd-ink-p5-prelaunch-hardening\`:

- Flushes pending customizer and preparation saves before internal navigation and browser history transitions
- Keeps language changes from reloading the active editor
- Removes the obsolete duplicate local receipt store and purges legacy customer-contact records
- Uses atomic IndexedDB draft updates with revisions and bounded artwork cleanup
- Requires an explicit verified URL and indexability flag before publishing canonical or crawlable output
- Localizes WhatsApp handoff fields and resolves the garment display name
- Verifies every owned product asset in the fresh PWA precache
- Removes third-party font requests and adds a restrictive production Content Security Policy
- Localizes global loading and crash recovery states
- Removes the unused GSAP package while retaining the local Web Animations adapter

### P4 — delivery, SEO, and controlled PWA
`,
);
await replaceExact(
  'tasks.md',
  `## Paused infrastructure — outside the active roadmap
`,
  `## P5 — Pre-launch hardening — COMPLETE

- [x] Flush pending customizer and checkout data before internal navigation.
- [x] Flush on browser history transitions and best-effort page lifecycle events.
- [x] Keep language changes from reloading the active editor.
- [x] Remove the duplicate local receipt store and purge obsolete customer-contact records.
- [x] Make IndexedDB draft updates atomic and revisioned.
- [x] Retain artwork needed by bounded undo/redo while deleting unreferenced assets.
- [x] Require both an explicit verified public URL and explicit indexing approval.
- [x] Keep preview builds free of canonical URLs and public-site metadata.
- [x] Localize WhatsApp handoff labels and resolve product translation keys.
- [x] Correct and validate every owned PWA product asset.
- [x] Remove third-party font requests and add a production Content Security Policy.
- [x] Localize global loading and application-recovery states.
- [x] Remove the unused GSAP runtime dependency and restore practical CSS budget headroom.

## Paused infrastructure — outside the active roadmap
`,
);

await rm(path.join(root, '.github/workflows/p5-hardening-bootstrap.yml'), { force: true });
await rm(path.join(root, 'scripts/p5-hardening.mjs'), { force: true });

console.log(`P5 hardening updated ${changed.size} file(s).`);
