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
import {
  analyzeArtworkFile,
  analyzeArtworkUrl,
  normalizeArtworkAspectRatio,
} from './artworkAnalysis';
import { ArtworkQualityOverlay } from './ArtworkQualityOverlay';
import { Controls } from './Controls';
import {
  areEditorSnapshotsEqual,
  cloneEditorSnapshot,
  commitEditorHistory,
  createEditorHistory,
  redoEditorHistory,
  undoEditorHistory,
  type EditorHistory,
  type EditorSnapshot,
} from './editorHistory';
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
type LayerDirection = 'forward' | 'backward';

const createLayerId = (): string => {
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `layer-${token}`;
};

const createLayerName = (fileName: string, index: number): string => {
  const name = fileName.replace(/\.[^.]+$/, '').trim().replace(/\s+/g, ' ');
  return name.slice(0, 60) || `Artwork ${index + 1}`;
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
  index: number,
): DecalLayer => {
  const hasSupportedSurface = modelConfig.surfaces.some(
    (surface) => surface.id === layer.surfaceId,
  );
  const surface = getPrintSurface(
    modelConfig,
    hasSupportedSurface ? layer.surfaceId : modelConfig.defaultSurfaceId,
  );
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const scale = clampScaleToSurface(layer.scale, surface, aspectRatio);

  return {
    ...layer,
    name: layer.name.trim() || createLayerName(layer.fileName ?? 'artwork', index),
    visible: layer.visible !== false,
    surfaceId: surface.id,
    aspectRatio,
    scale,
    position: clampPositionToSurface(layer.position, surface, scale, aspectRatio),
  };
};

const analyzeRestoredLayer = async (layer: DecalLayer): Promise<DecalLayer> => {
  if (layer.pixelWidth && layer.pixelHeight && layer.aspectRatio) {
    return { ...layer, aspectRatio: normalizeArtworkAspectRatio(layer.aspectRatio) };
  }

  try {
    return { ...layer, ...(await analyzeArtworkUrl(layer.url)) };
  } catch {
    return { ...layer, aspectRatio: normalizeArtworkAspectRatio(layer.aspectRatio) };
  }
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
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const modelConfigRef = useRef<ReadyProductModelConfig | null>(null);
  const selectedColorRef = useRef('');
  const selectedSizeRef = useRef<Size>(Size.L);
  const selectedSurfaceIdRef = useRef<PrintSurfaceId>(DEFAULT_PRINT_SURFACE_ID);
  const activeDecalIdRef = useRef<string | null>(null);
  const decalsRef = useRef<DecalLayer[]>([]);
  const historyRef = useRef<EditorHistory | null>(null);
  const gestureStartRef = useRef<EditorSnapshot | null>(null);
  const mountedRef = useRef(true);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveVersionRef = useRef(0);

  const updateHistoryAvailability = useCallback((history = historyRef.current) => {
    setCanUndo(Boolean(history?.past.length));
    setCanRedo(Boolean(history?.future.length));
  }, []);

  const captureEditorSnapshot = useCallback(
    (): EditorSnapshot => ({
      color: selectedColorRef.current,
      size: selectedSizeRef.current,
      selectedSurfaceId: selectedSurfaceIdRef.current,
      activeDecalId: activeDecalIdRef.current,
      decals: decalsRef.current,
    }),
    [],
  );

  const applyEditorSnapshot = useCallback((snapshot: EditorSnapshot) => {
    const config = modelConfigRef.current;
    const normalizedDecals = config
      ? snapshot.decals.map((layer, index) => normalizeLayerForModel(layer, config, index))
      : snapshot.decals;
    const activeLayer = normalizedDecals.find(
      (layer) => layer.id === snapshot.activeDecalId,
    );
    const hasSelectedSurface = config?.surfaces.some(
      (surface) => surface.id === snapshot.selectedSurfaceId,
    );
    const nextSurfaceId =
      activeLayer?.surfaceId ??
      (hasSelectedSurface ? snapshot.selectedSurfaceId : config?.defaultSurfaceId) ??
      DEFAULT_PRINT_SURFACE_ID;
    const nextActiveDecalId = activeLayer?.id ?? null;

    selectedColorRef.current = snapshot.color;
    selectedSizeRef.current = snapshot.size;
    selectedSurfaceIdRef.current = nextSurfaceId;
    activeDecalIdRef.current = nextActiveDecalId;
    decalsRef.current = normalizedDecals;

    setSelectedColor(snapshot.color);
    setSelectedSize(snapshot.size);
    setSelectedSurfaceId(nextSurfaceId);
    setActiveDecalId(nextActiveDecalId);
    setDecals(normalizedDecals);
  }, []);

  const syncHistoryPresent = useCallback(
    (snapshot: EditorSnapshot) => {
      if (!historyRef.current) return;
      historyRef.current = {
        ...historyRef.current,
        present: cloneEditorSnapshot(snapshot),
      };
      updateHistoryAvailability();
    },
    [updateHistoryAvailability],
  );

  const commitEditorChange = useCallback(
    (update: (current: EditorSnapshot) => EditorSnapshot) => {
      const current = cloneEditorSnapshot(captureEditorSnapshot());
      const next = update(cloneEditorSnapshot(current));
      const baseHistory = historyRef.current
        ? { ...historyRef.current, present: current }
        : createEditorHistory(current);
      const nextHistory = commitEditorHistory(baseHistory, next);

      historyRef.current = nextHistory;
      applyEditorSnapshot(nextHistory.present);
      updateHistoryAvailability(nextHistory);
    },
    [applyEditorSnapshot, captureEditorSnapshot, updateHistoryAvailability],
  );

  const applyLiveEditorChange = useCallback(
    (update: (current: EditorSnapshot) => EditorSnapshot) => {
      const next = update(cloneEditorSnapshot(captureEditorSnapshot()));
      applyEditorSnapshot(next);
    },
    [applyEditorSnapshot, captureEditorSnapshot],
  );

  const beginEditorGesture = useCallback(() => {
    if (gestureStartRef.current) return;
    const start = cloneEditorSnapshot(captureEditorSnapshot());
    gestureStartRef.current = start;
    syncHistoryPresent(start);
  }, [captureEditorSnapshot, syncHistoryPresent]);

  const endEditorGesture = useCallback(() => {
    const start = gestureStartRef.current;
    if (!start) return;

    gestureStartRef.current = null;
    const current = cloneEditorSnapshot(captureEditorSnapshot());
    const baseHistory = historyRef.current
      ? { ...historyRef.current, present: cloneEditorSnapshot(start) }
      : createEditorHistory(start);
    const nextHistory = areEditorSnapshotsEqual(start, current)
      ? { ...baseHistory, present: current }
      : commitEditorHistory(baseHistory, current);

    historyRef.current = nextHistory;
    updateHistoryAvailability(nextHistory);
  }, [captureEditorSnapshot, updateHistoryAvailability]);

  const handleUndo = useCallback(() => {
    endEditorGesture();
    const history = historyRef.current;
    if (!history?.past.length) return;

    const nextHistory = undoEditorHistory(history);
    historyRef.current = nextHistory;
    applyEditorSnapshot(nextHistory.present);
    updateHistoryAvailability(nextHistory);
  }, [applyEditorSnapshot, endEditorGesture, updateHistoryAvailability]);

  const handleRedo = useCallback(() => {
    endEditorGesture();
    const history = historyRef.current;
    if (!history?.future.length) return;

    const nextHistory = redoEditorHistory(history);
    historyRef.current = nextHistory;
    applyEditorSnapshot(nextHistory.present);
    updateHistoryAvailability(nextHistory);
  }, [applyEditorSnapshot, endEditorGesture, updateHistoryAvailability]);

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
    modelConfigRef.current = null;
    historyRef.current = null;
    gestureStartRef.current = null;
    updateHistoryAvailability(null);

    Promise.all([loadDesignDraft(draftId), platformApi.catalog.listProducts(controller.signal)])
      .then(async ([draft, products]) => {
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

        const analyzedDecals = await Promise.all(draft.decals.map(analyzeRestoredLayer));
        if (disposed) {
          releaseDraftObjectUrls(draft);
          return;
        }

        modelConfigRef.current = matchingModelConfig;
        const normalizedDecals = analyzedDecals.map((layer, index) =>
          normalizeLayerForModel(layer, matchingModelConfig, index),
        );
        const restoredActiveLayer = normalizedDecals.find(
          (layer) => layer.id === draft.activeDecalId,
        );
        const initialSnapshot: EditorSnapshot = {
          color: matchingProduct.colors.includes(draft.color)
            ? draft.color
            : matchingProduct.colors[0],
          size: draft.size,
          selectedSurfaceId:
            restoredActiveLayer?.surfaceId ?? matchingModelConfig.defaultSurfaceId,
          activeDecalId: restoredActiveLayer?.id ?? null,
          decals: normalizedDecals,
        };

        setProduct(matchingProduct);
        setModelConfig(matchingModelConfig);
        setNotes(draft.notes);
        applyEditorSnapshot(initialSnapshot);
        historyRef.current = createEditorHistory(initialSnapshot);
        updateHistoryAvailability();
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
      modelConfigRef.current = null;
      historyRef.current = null;
      gestureStartRef.current = null;
    };
  }, [applyEditorSnapshot, draftId, language, showToast, updateHistoryAvailability]);

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

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      if (!(event.metaKey || event.ctrlKey)) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) handleRedo();
        else handleUndo();
      } else if (key === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleRedo, handleUndo]);

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

    const surface = getPrintSurface(modelConfig, selectedSurfaceIdRef.current);

    setIsUploading(true);
    try {
      const analysis = await analyzeArtworkFile(file);
      const defaultTransform = createDefaultSurfaceTransform(surface, analysis.aspectRatio);
      const asset = await storeArtworkFile(draftId, file);
      const newLayer: DecalLayer = {
        id: createLayerId(),
        name: createLayerName(asset.fileName, decalsRef.current.length),
        visible: true,
        url: URL.createObjectURL(file),
        assetId: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        surfaceId: surface.id,
        position: defaultTransform.position,
        rotation: defaultTransform.rotation,
        userRotation: 0,
        scale: defaultTransform.scale,
        ...analysis,
      };

      commitEditorChange((current) => ({
        ...current,
        selectedSurfaceId: surface.id,
        activeDecalId: newLayer.id,
        decals: [...current.decals, newLayer],
      }));
      showToast(
        language === 'ar'
          ? 'تم تحليل الصورة وإضافتها لمساحة الطباعة.'
          : 'Artwork analyzed and added to the selected print surface.',
        'success',
      );
    } catch {
      showToast(
        language === 'ar'
          ? 'تعذر قراءة الصورة أو حفظها على هذا الجهاز.'
          : 'The artwork could not be decoded or stored on this device.',
        'error',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDecal = (id: string) => {
    commitEditorChange((current) => {
      const index = current.decals.findIndex((layer) => layer.id === id);
      if (index < 0) return current;

      const nextDecals = current.decals.filter((layer) => layer.id !== id);
      const nextActiveLayer =
        current.activeDecalId === id
          ? nextDecals[Math.min(index, nextDecals.length - 1)] ?? null
          : nextDecals.find((layer) => layer.id === current.activeDecalId) ?? null;

      return {
        ...current,
        activeDecalId: nextActiveLayer?.id ?? null,
        selectedSurfaceId: nextActiveLayer?.surfaceId ?? current.selectedSurfaceId,
        decals: nextDecals,
      };
    });

    showToast(
      language === 'ar'
        ? 'تم حذف الطبقة. يمكنك التراجع.'
        : 'Layer removed. You can undo.',
      'info',
    );
  };

  const handleDecalUpdate = (id: string, updates: Partial<DecalLayer>) => {
    const config = modelConfigRef.current;
    if (!config) return;

    applyLiveEditorChange((current) => ({
      ...current,
      decals: current.decals.map((layer) => {
        if (layer.id !== id) return layer;

        const surface = getPrintSurface(config, layer.surfaceId);
        const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
        const scale = clampScaleToSurface(
          updates.scale ?? layer.scale,
          surface,
          aspectRatio,
        );
        const position = clampPositionToSurface(
          updates.position ?? layer.position,
          surface,
          scale,
          aspectRatio,
        );

        return {
          ...layer,
          ...updates,
          surfaceId: surface.id,
          aspectRatio,
          scale,
          position,
        };
      }),
    }));
  };

  const handleSceneDecalChange = (
    position: [number, number, number],
    rotation: [number, number, number],
  ) => {
    if (activeDecalIdRef.current) {
      handleDecalUpdate(activeDecalIdRef.current, { position, rotation });
    }
  };

  const handleSetActiveDecal = (id: string) => {
    endEditorGesture();
    const current = captureEditorSnapshot();
    const layer = current.decals.find((candidate) => candidate.id === id);
    if (!layer) return;

    const next = {
      ...current,
      activeDecalId: id,
      selectedSurfaceId: layer.surfaceId,
    };
    applyEditorSnapshot(next);
    syncHistoryPresent(next);
  };

  const handleSurfaceChange = (surfaceId: PrintSurfaceId) => {
    endEditorGesture();
    const current = captureEditorSnapshot();
    const activeLayer = current.decals.find((layer) => layer.id === current.activeDecalId);
    const next = {
      ...current,
      selectedSurfaceId: surfaceId,
      activeDecalId:
        activeLayer && activeLayer.surfaceId === surfaceId ? activeLayer.id : null,
    };
    applyEditorSnapshot(next);
    syncHistoryPresent(next);
  };

  const handleColorChange = (color: string) => {
    commitEditorChange((current) => ({ ...current, color }));
  };

  const handleSizeChange = (size: Size) => {
    commitEditorChange((current) => ({ ...current, size }));
  };

  const handleRenameDecal = (id: string, name: string) => {
    const normalizedName = name.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!normalizedName) return;

    commitEditorChange((current) => ({
      ...current,
      decals: current.decals.map((layer) =>
        layer.id === id ? { ...layer, name: normalizedName } : layer,
      ),
    }));
  };

  const handleToggleDecalVisibility = (id: string) => {
    commitEditorChange((current) => ({
      ...current,
      decals: current.decals.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    }));
  };

  const handleDuplicateDecal = (id: string) => {
    const config = modelConfigRef.current;
    if (!config) return;

    commitEditorChange((current) => {
      const index = current.decals.findIndex((layer) => layer.id === id);
      const source = current.decals[index];
      if (!source) return current;

      const surface = getPrintSurface(config, source.surfaceId);
      const duplicateId = createLayerId();
      const duplicate: DecalLayer = {
        ...source,
        id: duplicateId,
        name:
          language === 'ar'
            ? `نسخة من ${source.name}`.slice(0, 60)
            : `Copy of ${source.name}`.slice(0, 60),
        visible: true,
        position: clampPositionToSurface(
          [source.position[0] + 0.025, source.position[1] - 0.025, source.position[2]],
          surface,
          source.scale,
          normalizeArtworkAspectRatio(source.aspectRatio),
        ),
      };
      const nextDecals = [...current.decals];
      nextDecals.splice(index + 1, 0, duplicate);

      return {
        ...current,
        selectedSurfaceId: duplicate.surfaceId,
        activeDecalId: duplicateId,
        decals: nextDecals,
      };
    });
  };

  const handleMoveDecal = (id: string, direction: LayerDirection) => {
    commitEditorChange((current) => {
      const index = current.decals.findIndex((layer) => layer.id === id);
      if (index < 0) return current;
      const targetIndex = direction === 'forward' ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= current.decals.length) return current;

      const nextDecals = [...current.decals];
      const [layer] = nextDecals.splice(index, 1);
      nextDecals.splice(targetIndex, 0, layer);
      return { ...current, decals: nextDecals };
    });
  };

  const handleCheckout = async () => {
    if (!product) return;

    endEditorGesture();
    const snapshot = createSnapshot(
      selectedColorRef.current,
      selectedSizeRef.current,
      notes,
      activeDecalIdRef.current,
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
  const activeQualityLayer = decals.find((layer) => layer.id === activeDecalId) ?? null;
  const activeQualitySurface = activeQualityLayer
    ? getPrintSurface(modelConfig, activeQualityLayer.surfaceId)
    : selectedSurface;

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

        <ArtworkQualityOverlay
          layer={activeQualityLayer}
          surface={activeQualitySurface}
          language={language}
        />

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
              endEditorGesture();
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
            onDecalInteractionStart={beginEditorGesture}
            onDecalInteractionEnd={endEditorGesture}
            setDraggingDecal={setIsDraggingDecal}
          />
        </div>
      </div>

      <div ref={controlsRef} className="h-full lg:w-[400px]">
        <Controls
          product={product}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          selectedSize={selectedSize}
          onSizeChange={handleSizeChange}
          surfaces={modelConfig.surfaces}
          selectedSurfaceId={selectedSurfaceId}
          onSurfaceChange={handleSurfaceChange}
          decals={decals}
          activeDecalId={activeDecalId}
          onSetActiveDecal={handleSetActiveDecal}
          onUpload={handleFileUpload}
          onRemoveDecal={handleRemoveDecal}
          onUpdateDecal={handleDecalUpdate}
          onRenameDecal={handleRenameDecal}
          onDuplicateDecal={handleDuplicateDecal}
          onToggleDecalVisibility={handleToggleDecalVisibility}
          onMoveDecal={handleMoveDecal}
          onBeginTransform={beginEditorGesture}
          onEndTransform={endEditorGesture}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
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
