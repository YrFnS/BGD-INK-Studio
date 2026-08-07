import gsap from 'gsap';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import {
  getPrintSurface,
  getReadyProductModelConfig,
  type ReadyProductModelConfig,
} from '@/data/assets3d';
import { useSEO } from '@/hooks/useSEO';
import { isAbortError, platformApi } from '@/services/api';
import {
  deleteArtworkAsset,
  DraftLoadStatus,
  DraftSaveStatus,
  DesignDraftSnapshot,
  loadDesignDraft,
  releaseDraftObjectUrls,
  saveDesignDraft,
  storeArtworkFile,
} from '@/services/drafts';
import {
  DEFAULT_PRINT_SURFACE_ID,
  DecalLayer,
  PrintSurfaceId,
  Product,
  Size,
} from '@/types';
import { Controls } from './Controls';
import {
  clampPositionToSurface,
  clampScaleToSurface,
  createDefaultSurfaceTransform,
} from './printArea';
import { Scene } from './Scene';
import { validateArtworkFile } from './artworkValidation';

interface CustomizerProps {
  draftId: string;
  onCheckout: (draftId: string) => void;
  onMissingDraft: () => void;
}

type CustomizerLoadStatus = DraftLoadStatus | 'model-unavailable';

const createLayerId = (): string => {
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `layer-${token}`;
};

const createSnapshot = (
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
});

const normalizeLayerForModel = (
  layer: DecalLayer,
  modelConfig: ReadyProductModelConfig,
): DecalLayer => {
  const hasSupportedSurface = modelConfig.surfaces.some(
    (surface) => surface.id === layer.surfaceId,
  );
  const surface = getPrintSurface(
    modelConfig,
    hasSupportedSurface ? layer.surfaceId : modelConfig.defaultSurfaceId,
  );
  const scale = clampScaleToSurface(layer.scale, surface);

  return {
    ...layer,
    surfaceId: surface.id,
    scale,
    position: clampPositionToSurface(layer.position, surface, scale),
  };
};

export const Customizer: React.FC<CustomizerProps> = ({ draftId, onCheckout, onMissingDraft }) => {
  const { theme, t, language } = useAppContext();
  const { showToast } = useToast();

  useSEO('seo.customizer.title', 'seo.customizer.description');

  const [loadStatus, setLoadStatus] = useState<CustomizerLoadStatus>('loading');
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('saved');
  const [product, setProduct] = useState<Product | null>(null);
  const [modelConfig, setModelConfig] = useState<ReadyProductModelConfig | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState<Size>(Size.L);
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<PrintSurfaceId>(
    DEFAULT_PRINT_SURFACE_ID,
  );
  const [notes, setNotes] = useState('');
  const [decals, setDecals] = useState<DecalLayer[]>([]);
  const [activeDecalId, setActiveDecalId] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDraggingDecal, setIsDraggingDecal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const decalsRef = useRef<DecalLayer[]>([]);
  const mountedRef = useRef(true);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveVersionRef = useRef(0);

  const updateDecals = useCallback((update: (current: DecalLayer[]) => DecalLayer[]) => {
    setDecals((current) => {
      const next = update(current);
      decalsRef.current = next;
      return next;
    });
  }, []);

  const queueDraftSave = useCallback(
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

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    let disposed = false;
    setLoadStatus('loading');
    setProduct(null);
    setModelConfig(null);

    Promise.all([loadDesignDraft(draftId), platformApi.catalog.listProducts(controller.signal)])
      .then(([draft, products]) => {
        if (disposed) {
          if (draft) releaseDraftObjectUrls(draft);
          return;
        }

        if (!draft) {
          setLoadStatus('missing');
          return;
        }

        const matchingProduct = products.find((candidate) => candidate.id === draft.productId);
        if (!matchingProduct) {
          releaseDraftObjectUrls(draft);
          setLoadStatus('error');
          return;
        }

        const matchingModelConfig = getReadyProductModelConfig(matchingProduct.id);
        if (!matchingModelConfig) {
          releaseDraftObjectUrls(draft);
          setProduct(matchingProduct);
          setLoadStatus('model-unavailable');
          return;
        }

        const normalizedDecals = draft.decals.map((layer) =>
          normalizeLayerForModel(layer, matchingModelConfig),
        );
        const restoredActiveLayer = normalizedDecals.find(
          (layer) => layer.id === draft.activeDecalId,
        );

        decalsRef.current = normalizedDecals;
        setProduct(matchingProduct);
        setModelConfig(matchingModelConfig);
        setSelectedColor(
          matchingProduct.colors.includes(draft.color) ? draft.color : matchingProduct.colors[0],
        );
        setSelectedSize(draft.size);
        setSelectedSurfaceId(
          restoredActiveLayer?.surfaceId ?? matchingModelConfig.defaultSurfaceId,
        );
        setNotes(draft.notes);
        setDecals(normalizedDecals);
        setActiveDecalId(restoredActiveLayer?.id ?? null);
        setSaveStatus('saved');
        setLoadStatus('ready');

        if (draft.missingAssetCount > 0) {
          showToast(
            language === 'ar'
              ? `تعذر استرجاع ${draft.missingAssetCount} من ملفات التصميم.`
              : `${draft.missingAssetCount} artwork file(s) could not be restored.`,
            'error',
          );
        }
      })
      .catch((error: unknown) => {
        if (disposed || isAbortError(error)) return;
        setLoadStatus('error');
      });

    return () => {
      disposed = true;
      mountedRef.current = false;
      controller.abort();
      releaseDraftObjectUrls({ decals: decalsRef.current });
      decalsRef.current = [];
    };
  }, [draftId, language, showToast]);

  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setSaveStatus('unsaved');
    const snapshot = createSnapshot(selectedColor, selectedSize, notes, activeDecalId, decals);
    const timer = window.setTimeout(() => {
      void queueDraftSave(snapshot).catch(() => undefined);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [activeDecalId, decals, loadStatus, notes, queueDraftSave, selectedColor, selectedSize]);

  useEffect(() => {
    if (loadStatus !== 'ready' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.from(viewerRef.current, {
        scale: 0.96,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from(controlsRef.current, {
        x: language === 'ar' ? -40 : 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.15,
      });
    }, containerRef);

    return () => context.revert();
  }, [language, loadStatus]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !modelConfig) return;

    const validationError = validateArtworkFile(file);
    if (validationError) {
      const message =
        validationError === 'unsupported-type'
          ? language === 'ar'
            ? 'ارفع صورة PNG أو JPG أو WebP.'
            : 'Upload a PNG, JPG, or WebP image.'
          : language === 'ar'
            ? 'حجم الصورة أكبر من 5 ميغابايت.'
            : 'Artwork must be 5 MB or smaller.';

      showToast(message, 'error');
      return;
    }

    const surface = getPrintSurface(modelConfig, selectedSurfaceId);
    const defaultTransform = createDefaultSurfaceTransform(surface);

    setIsUploading(true);
    try {
      const asset = await storeArtworkFile(file);
      const newLayer: DecalLayer = {
        id: createLayerId(),
        url: URL.createObjectURL(file),
        assetId: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        surfaceId: surface.id,
        position: defaultTransform.position,
        rotation: defaultTransform.rotation,
        userRotation: 0,
        scale: defaultTransform.scale,
      };

      updateDecals((current) => [...current, newLayer]);
      setActiveDecalId(newLayer.id);
      showToast(
        language === 'ar'
          ? 'تم حفظ الصورة وإضافتها لمساحة الطباعة.'
          : 'Artwork saved and added to the selected print surface.',
        'success',
      );
    } catch {
      showToast(
        language === 'ar'
          ? 'تعذر حفظ الصورة على هذا الجهاز.'
          : 'The artwork could not be stored on this device.',
        'error',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDecal = (id: string) => {
    const removedLayer = decalsRef.current.find((layer) => layer.id === id);
    const nextDecals = decalsRef.current.filter((layer) => layer.id !== id);
    const nextActiveDecalId = activeDecalId === id ? null : activeDecalId;

    updateDecals(() => nextDecals);
    setActiveDecalId(nextActiveDecalId);

    if (removedLayer?.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedLayer.url);
    }

    const snapshot = createSnapshot(
      selectedColor,
      selectedSize,
      notes,
      nextActiveDecalId,
      nextDecals,
    );

    void queueDraftSave(snapshot)
      .then(() => (removedLayer?.assetId ? deleteArtworkAsset(removedLayer.assetId) : undefined))
      .catch(() => undefined);

    showToast(language === 'ar' ? 'تم حذف الطبقة.' : 'Layer removed.', 'info');
  };

  const handleDecalUpdate = (id: string, updates: Partial<DecalLayer>) => {
    if (!modelConfig) return;

    updateDecals((current) =>
      current.map((layer) => {
        if (layer.id !== id) return layer;

        const surface = getPrintSurface(modelConfig, layer.surfaceId);
        const scale = clampScaleToSurface(updates.scale ?? layer.scale, surface);
        const position = clampPositionToSurface(
          updates.position ?? layer.position,
          surface,
          scale,
        );

        return {
          ...layer,
          ...updates,
          surfaceId: surface.id,
          scale,
          position,
        };
      }),
    );
  };

  const handleSceneDecalChange = (
    position: [number, number, number],
    rotation: [number, number, number],
  ) => {
    if (activeDecalId) {
      handleDecalUpdate(activeDecalId, { position, rotation });
    }
  };

  const handleSetActiveDecal = (id: string) => {
    const layer = decalsRef.current.find((candidate) => candidate.id === id);
    if (!layer) return;
    setActiveDecalId(id);
    setSelectedSurfaceId(layer.surfaceId);
  };

  const handleSurfaceChange = (surfaceId: PrintSurfaceId) => {
    setSelectedSurfaceId(surfaceId);
    const activeLayer = decalsRef.current.find((layer) => layer.id === activeDecalId);
    if (activeLayer && activeLayer.surfaceId !== surfaceId) {
      setActiveDecalId(null);
    }
  };

  const handleCheckout = async () => {
    if (!product) return;

    const snapshot = createSnapshot(
      selectedColor,
      selectedSize,
      notes,
      activeDecalId,
      decalsRef.current,
    );

    try {
      await queueDraftSave(snapshot);
      onCheckout(draftId);
    } catch {
      showToast(
        language === 'ar'
          ? 'يجب حفظ المسودة قبل الانتقال إلى معلومات التوصيل.'
          : 'The draft must be saved before continuing to checkout.',
        'error',
      );
    }
  };

  if (loadStatus === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-24" role="status">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white" />
          <p className="text-sm font-medium text-gray-500">
            {language === 'ar' ? 'جاري استرجاع مسودة التصميم…' : 'Restoring your design draft…'}
          </p>
        </div>
      </div>
    );
  }

  if (
    loadStatus === 'missing' ||
    loadStatus === 'error' ||
    loadStatus === 'model-unavailable' ||
    !product ||
    !modelConfig
  ) {
    const message =
      loadStatus === 'missing'
        ? language === 'ar'
          ? 'هذه المسودة غير موجودة أو تم حذفها.'
          : 'This design draft does not exist or was deleted.'
        : loadStatus === 'model-unavailable'
          ? t('customizer.modelUnavailable')
          : language === 'ar'
            ? 'تعذر فتح مسودة التصميم على هذا الجهاز.'
            : 'The design draft could not be opened on this device.';

    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pt-24 text-center">
        <div className="max-w-lg rounded-3xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-2xl font-bold">{message}</h2>
          <button
            type="button"
            onClick={onMissingDraft}
            className="mt-4 rounded-full bg-black px-6 py-3 font-bold text-white dark:bg-white dark:text-black"
          >
            {language === 'ar' ? 'العودة للموديلات' : 'Back to catalog'}
          </button>
        </div>
      </div>
    );
  }

  const selectedSurface = getPrintSurface(modelConfig, selectedSurfaceId);

  return (
    <div
      ref={containerRef}
      className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 pt-20 md:p-8 md:pt-24 lg:h-[calc(100vh-80px)] lg:flex-row"
    >
      <div
        ref={viewerRef}
        className="relative min-h-[45vh] flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 transition-colors duration-300 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="pointer-events-none absolute start-6 top-6 z-10">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-black opacity-50 dark:text-white">
            {t(product.name)}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-white px-2 py-1 text-xs font-bold dark:bg-black">
              {selectedSize}
            </span>
            <span className="rounded bg-white px-2 py-1 text-xs font-bold dark:bg-black">
              {t(selectedSurface.labelKey)}
            </span>
            <span className="rounded bg-white px-2 py-1 font-mono text-xs font-bold dark:bg-black">
              {selectedSurface.physicalWidthCm} × {selectedSurface.physicalHeightCm} cm
            </span>
          </div>
        </div>

        {!isInteracting && (
          <button
            type="button"
            className="interactive absolute inset-0 z-20 flex items-center justify-center bg-black/5 backdrop-blur-[2px] transition-all hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            onClick={() => setIsInteracting(true)}
          >
            <span className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-black shadow-lg transition-transform hover:scale-105 dark:bg-black dark:text-white">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
                />
              </svg>
              {t('customizer.interact')}
            </span>
          </button>
        )}

        {isInteracting && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsInteracting(false);
            }}
            className="interactive absolute end-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/70"
            aria-label={t('customizer.exitInteract')}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
              />
            </svg>
          </button>
        )}

        <div className={`h-full w-full ${isDraggingDecal ? 'cursor-grabbing' : ''}`}>
          <Scene
            modelConfig={modelConfig}
            selectedSurfaceId={selectedSurfaceId}
            color={selectedColor}
            theme={theme}
            decals={decals}
            activeDecalId={activeDecalId}
            enableControls={isInteracting && !isDraggingDecal}
            onDecalChange={handleSceneDecalChange}
            setDraggingDecal={setIsDraggingDecal}
          />
        </div>
      </div>

      <div ref={controlsRef} className="h-full lg:w-[400px]">
        <Controls
          product={product}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          surfaces={modelConfig.surfaces}
          selectedSurfaceId={selectedSurfaceId}
          onSurfaceChange={handleSurfaceChange}
          decals={decals}
          activeDecalId={activeDecalId}
          onSetActiveDecal={handleSetActiveDecal}
          onUpload={handleFileUpload}
          onRemoveDecal={handleRemoveDecal}
          onUpdateDecal={handleDecalUpdate}
          notes={notes}
          onNotesChange={setNotes}
          saveStatus={saveStatus}
          isUploading={isUploading}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
};
