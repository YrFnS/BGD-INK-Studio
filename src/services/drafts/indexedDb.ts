import { BRAND } from '@/config/brand';
import { normalizeDraftQuantity } from '@/config/draft';
import {
  DEFAULT_PRINT_SURFACE_ID,
  OrderDetails,
  PrintSurfaceId,
  Size,
} from '@/types';
import {
  CreateDesignDraftInput,
  DESIGN_DRAFT_VERSION,
  DesignDraftRecord,
  DesignDraftSnapshot,
  DesignDraftSummary,
  DraftStorageError,
  HydratedDesignDraft,
  StoredArtworkAsset,
  StoredDecalLayer,
} from './types';

const DATABASE_NAME = `${BRAND.storageNamespace}_studio`;
const DATABASE_VERSION = 1;
const DRAFT_STORE = 'design-drafts';
const ASSET_STORE = 'artwork-assets';
const MAX_DRAFT_NAME_LENGTH = 80;
const MAX_LAYER_NAME_LENGTH = 60;
const PRINT_SURFACE_IDS: readonly PrintSurfaceId[] = [
  'front',
  'back',
  'left-sleeve',
  'right-sleeve',
];

let databasePromise: Promise<IDBDatabase> | null = null;

type LegacyStoredDecalLayer = Omit<
  StoredDecalLayer,
  | 'surfaceId'
  | 'name'
  | 'visible'
  | 'pixelWidth'
  | 'pixelHeight'
  | 'aspectRatio'
  | 'hasTransparency'
  | 'transparentPixelRatio'
  | 'transparentPaddingRatio'
> & {
  surfaceId?: unknown;
  name?: unknown;
  visible?: unknown;
  pixelWidth?: unknown;
  pixelHeight?: unknown;
  aspectRatio?: unknown;
  hasTransparency?: unknown;
  transparentPixelRatio?: unknown;
  transparentPaddingRatio?: unknown;
};

type LegacyDesignDraftRecord = Omit<
  DesignDraftRecord,
  'version' | 'name' | 'quantity' | 'decals' | 'assetIds'
> & {
  version?: unknown;
  name?: unknown;
  quantity?: unknown;
  decals?: LegacyStoredDecalLayer[];
  assetIds?: unknown;
};

const emptyCheckoutDetails = (): OrderDetails => ({
  fullName: '',
  phone: '',
  area: '',
  street: '',
  house: '',
});

const createId = (prefix: string): string => {
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${token}`;
};

const normalizeDraftName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').slice(0, MAX_DRAFT_NAME_LENGTH);

const normalizeLayerName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').slice(0, MAX_LAYER_NAME_LENGTH);

const createLayerName = (fileName: string, index: number): string => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return normalizeLayerName(withoutExtension) || `Artwork ${index + 1}`;
};

const isPrintSurfaceId = (value: unknown): value is PrintSurfaceId =>
  typeof value === 'string' && PRINT_SURFACE_IDS.includes(value as PrintSurfaceId);

const normalizeOptionalPositiveNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

const normalizeOptionalFraction = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : undefined;

const normalizeStoredLayer = (
  layer: LegacyStoredDecalLayer,
  index: number,
): StoredDecalLayer => ({
  ...layer,
  name:
    typeof layer.name === 'string' && normalizeLayerName(layer.name)
      ? normalizeLayerName(layer.name)
      : createLayerName(layer.fileName, index),
  visible: typeof layer.visible === 'boolean' ? layer.visible : true,
  surfaceId: isPrintSurfaceId(layer.surfaceId)
    ? layer.surfaceId
    : DEFAULT_PRINT_SURFACE_ID,
  pixelWidth: normalizeOptionalPositiveNumber(layer.pixelWidth),
  pixelHeight: normalizeOptionalPositiveNumber(layer.pixelHeight),
  aspectRatio: normalizeOptionalPositiveNumber(layer.aspectRatio),
  hasTransparency:
    typeof layer.hasTransparency === 'boolean' ? layer.hasTransparency : undefined,
  transparentPixelRatio: normalizeOptionalFraction(layer.transparentPixelRatio),
  transparentPaddingRatio: normalizeOptionalFraction(layer.transparentPaddingRatio),
});

const normalizeDraftRecord = (draft: LegacyDesignDraftRecord): DesignDraftRecord => {
  const decals = Array.isArray(draft.decals)
    ? draft.decals.map(normalizeStoredLayer)
    : [];
  const storedAssetIds = Array.isArray(draft.assetIds)
    ? draft.assetIds.filter((assetId): assetId is string => typeof assetId === 'string')
    : [];

  return {
    ...draft,
    version: DESIGN_DRAFT_VERSION,
    name: typeof draft.name === 'string' ? draft.name : '',
    quantity: normalizeDraftQuantity(draft.quantity),
    decals,
    assetIds: Array.from(
      new Set([...storedAssetIds, ...decals.map((layer) => layer.assetId)]),
    ),
  };
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new DraftStorageError(
          'INDEXED_DB_REQUEST_FAILED',
          request.error?.message ?? 'The browser database request failed.',
          { cause: request.error },
        ),
      );
  });

const waitForTransaction = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        new DraftStorageError(
          'INDEXED_DB_TRANSACTION_FAILED',
          transaction.error?.message ?? 'The browser database transaction failed.',
          { cause: transaction.error },
        ),
      );
    transaction.onabort = () =>
      reject(
        new DraftStorageError(
          'INDEXED_DB_TRANSACTION_ABORTED',
          transaction.error?.message ?? 'The browser database transaction was aborted.',
          { cause: transaction.error },
        ),
      );
  });

const openDatabase = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(
      new DraftStorageError(
        'INDEXED_DB_UNAVAILABLE',
        'This browser does not provide the storage required for recoverable design drafts.',
      ),
    );
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        const draftStore = database.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
        draftStore.createIndex('updatedAt', 'updatedAt');
      }

      if (!database.objectStoreNames.contains(ASSET_STORE)) {
        database.createObjectStore(ASSET_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };

    request.onerror = () => {
      reject(
        new DraftStorageError(
          'INDEXED_DB_OPEN_FAILED',
          request.error?.message ?? 'The browser database could not be opened.',
          { cause: request.error },
        ),
      );
    };

    request.onblocked = () => {
      reject(
        new DraftStorageError(
          'INDEXED_DB_BLOCKED',
          `Another tab is blocking the design database. Close older ${BRAND.displayName} tabs and try again.`,
        ),
      );
    };
  }).catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
};

const getDraftRecord = async (draftId: string): Promise<DesignDraftRecord | null> => {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFT_STORE, 'readonly');
  const completion = waitForTransaction(transaction);
  const request = transaction.objectStore(DRAFT_STORE).get(draftId) as IDBRequest<
    LegacyDesignDraftRecord | undefined
  >;
  const draft = await requestToPromise(request);
  await completion;
  return draft ? normalizeDraftRecord(draft) : null;
};

const getAllDraftRecords = async (): Promise<DesignDraftRecord[]> => {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFT_STORE, 'readonly');
  const completion = waitForTransaction(transaction);
  const request = transaction.objectStore(DRAFT_STORE).getAll() as IDBRequest<
    LegacyDesignDraftRecord[]
  >;
  const drafts = await requestToPromise(request);
  await completion;
  return drafts.map(normalizeDraftRecord);
};

const getArtworkAssets = async (assetIds: string[]): Promise<Map<string, StoredArtworkAsset>> => {
  const uniqueAssetIds = Array.from(new Set(assetIds));
  const assetsById = new Map<string, StoredArtworkAsset>();
  if (uniqueAssetIds.length === 0) return assetsById;

  const database = await openDatabase();
  const transaction = database.transaction(ASSET_STORE, 'readonly');
  const completion = waitForTransaction(transaction);
  const assetStore = transaction.objectStore(ASSET_STORE);
  const requests = uniqueAssetIds.map(async (assetId) => {
    const asset = await requestToPromise(
      assetStore.get(assetId) as IDBRequest<StoredArtworkAsset | undefined>,
    );
    return [assetId, asset] as const;
  });

  const entries = await Promise.all(requests);
  await completion;
  entries.forEach(([assetId, asset]) => {
    if (asset) assetsById.set(assetId, asset);
  });
  return assetsById;
};

const putDraftRecord = async (draft: DesignDraftRecord): Promise<void> => {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFT_STORE, 'readwrite');
  const completion = waitForTransaction(transaction);
  transaction.objectStore(DRAFT_STORE).put(draft);
  await completion;
};

const updateDraftRecord = async (
  draftId: string,
  update: (draft: DesignDraftRecord) => DesignDraftRecord,
): Promise<DesignDraftRecord> => {
  const currentDraft = await getDraftRecord(draftId);
  if (!currentDraft) {
    throw new DraftStorageError('DRAFT_NOT_FOUND', 'The requested design draft no longer exists.');
  }

  const nextDraft = update(currentDraft);
  await putDraftRecord(nextDraft);
  return nextDraft;
};

const serializeLayer = (
  layer: DesignDraftSnapshot['decals'][number],
  index: number,
): StoredDecalLayer => {
  if (!layer.assetId) {
    throw new DraftStorageError(
      'ARTWORK_NOT_PERSISTED',
      'An artwork layer must be stored before the design draft can be saved.',
    );
  }

  return {
    id: layer.id,
    name: normalizeLayerName(layer.name) || createLayerName(layer.fileName ?? 'artwork', index),
    visible: layer.visible,
    assetId: layer.assetId,
    fileName: layer.fileName ?? 'artwork',
    mimeType: layer.mimeType ?? 'application/octet-stream',
    surfaceId: layer.surfaceId,
    position: layer.position,
    rotation: layer.rotation,
    userRotation: layer.userRotation,
    scale: layer.scale,
    pixelWidth: normalizeOptionalPositiveNumber(layer.pixelWidth),
    pixelHeight: normalizeOptionalPositiveNumber(layer.pixelHeight),
    aspectRatio: normalizeOptionalPositiveNumber(layer.aspectRatio),
    hasTransparency:
      typeof layer.hasTransparency === 'boolean' ? layer.hasTransparency : undefined,
    transparentPixelRatio: normalizeOptionalFraction(layer.transparentPixelRatio),
    transparentPaddingRatio: normalizeOptionalFraction(layer.transparentPaddingRatio),
  };
};

export const createDesignDraft = async ({
  productId,
  color,
  size = Size.L,
  quantity = 1,
}: CreateDesignDraftInput): Promise<DesignDraftRecord> => {
  const now = new Date().toISOString();
  const draft: DesignDraftRecord = {
    version: DESIGN_DRAFT_VERSION,
    id: createId('draft'),
    name: '',
    productId,
    color,
    size,
    quantity: normalizeDraftQuantity(quantity),
    notes: '',
    activeDecalId: null,
    decals: [],
    assetIds: [],
    checkoutDetails: emptyCheckoutDetails(),
    submittedOrderId: null,
    createdAt: now,
    updatedAt: now,
  };

  const database = await openDatabase();
  const transaction = database.transaction(DRAFT_STORE, 'readwrite');
  const completion = waitForTransaction(transaction);
  transaction.objectStore(DRAFT_STORE).add(draft);
  await completion;
  return draft;
};

export const listDesignDrafts = async (): Promise<DesignDraftSummary[]> => {
  const drafts = (await getAllDraftRecords()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  const previewAssetIds = drafts.flatMap((draft) => {
    const firstLayer = draft.decals.find((layer) => layer.visible) ?? draft.decals[0];
    return firstLayer ? [firstLayer.assetId] : [];
  });
  const assetsById = await getArtworkAssets(previewAssetIds);

  return drafts.map((draft) => {
    const firstLayer = draft.decals.find((layer) => layer.visible) ?? draft.decals[0];
    const previewAsset = firstLayer ? assetsById.get(firstLayer.assetId) : undefined;

    return {
      id: draft.id,
      name: draft.name,
      productId: draft.productId,
      color: draft.color,
      size: draft.size,
      quantity: draft.quantity,
      layerCount: draft.decals.length,
      previewUrl: previewAsset ? URL.createObjectURL(previewAsset.blob) : null,
      submittedOrderId: draft.submittedOrderId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  });
};

export const loadDesignDraft = async (draftId: string): Promise<HydratedDesignDraft | null> => {
  const draft = await getDraftRecord(draftId);
  if (!draft) return null;

  const database = await openDatabase();
  const transaction = database.transaction(ASSET_STORE, 'readonly');
  const completion = waitForTransaction(transaction);
  const assetStore = transaction.objectStore(ASSET_STORE);
  const assetRequests = draft.decals.map((layer) =>
    requestToPromise(assetStore.get(layer.assetId) as IDBRequest<StoredArtworkAsset | undefined>),
  );
  const assets = await Promise.all(assetRequests);
  await completion;

  let missingAssetCount = 0;
  const decals = draft.decals.flatMap((layer, index) => {
    const asset = assets[index];
    if (!asset) {
      missingAssetCount += 1;
      return [];
    }

    return [
      {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        url: URL.createObjectURL(asset.blob),
        assetId: layer.assetId,
        fileName: layer.fileName || asset.fileName,
        mimeType: layer.mimeType || asset.mimeType,
        surfaceId: layer.surfaceId,
        position: layer.position,
        rotation: layer.rotation,
        userRotation: layer.userRotation,
        scale: layer.scale,
        pixelWidth: layer.pixelWidth,
        pixelHeight: layer.pixelHeight,
        aspectRatio: layer.aspectRatio,
        hasTransparency: layer.hasTransparency,
        transparentPixelRatio: layer.transparentPixelRatio,
        transparentPaddingRatio: layer.transparentPaddingRatio,
      },
    ];
  });

  return {
    ...draft,
    decals,
    missingAssetCount,
  };
};

export const saveDesignDraft = async (
  draftId: string,
  snapshot: DesignDraftSnapshot,
): Promise<DesignDraftRecord> =>
  updateDraftRecord(draftId, (draft) => {
    const decals = snapshot.decals.map(serializeLayer);
    return {
      ...draft,
      color: snapshot.color,
      size: snapshot.size,
      notes: snapshot.notes,
      activeDecalId: snapshot.activeDecalId,
      decals,
      assetIds: Array.from(
        new Set([...draft.assetIds, ...decals.map((layer) => layer.assetId)]),
      ),
      updatedAt: new Date().toISOString(),
    };
  });

export const renameDesignDraft = async (
  draftId: string,
  name: string,
): Promise<DesignDraftRecord> => {
  const normalizedName = normalizeDraftName(name);
  if (!normalizedName) {
    throw new DraftStorageError('DRAFT_NAME_REQUIRED', 'Enter a name for this design.');
  }

  return updateDraftRecord(draftId, (draft) => ({
    ...draft,
    name: normalizedName,
    updatedAt: new Date().toISOString(),
  }));
};

export const duplicateDesignDraft = async (
  draftId: string,
  name: string,
): Promise<DesignDraftRecord> => {
  const sourceDraft = await getDraftRecord(draftId);
  if (!sourceDraft) {
    throw new DraftStorageError('DRAFT_NOT_FOUND', 'The requested design draft no longer exists.');
  }

  const sourceAssetIds = Array.from(new Set(sourceDraft.decals.map((layer) => layer.assetId)));
  const sourceAssets = await getArtworkAssets(sourceAssetIds);
  const missingAssetId = sourceAssetIds.find((assetId) => !sourceAssets.has(assetId));
  if (missingAssetId) {
    throw new DraftStorageError(
      'DRAFT_ARTWORK_MISSING',
      'This design cannot be duplicated because one of its artwork files is missing.',
    );
  }

  const now = new Date().toISOString();
  const assetIdMap = new Map<string, string>();
  const duplicatedAssets = sourceAssetIds.map((assetId) => {
    const sourceAsset = sourceAssets.get(assetId);
    if (!sourceAsset) {
      throw new DraftStorageError(
        'DRAFT_ARTWORK_MISSING',
        'This design cannot be duplicated because one of its artwork files is missing.',
      );
    }

    const duplicatedAssetId = createId('asset');
    assetIdMap.set(assetId, duplicatedAssetId);
    return {
      ...sourceAsset,
      id: duplicatedAssetId,
      blob: sourceAsset.blob.slice(0, sourceAsset.blob.size, sourceAsset.mimeType),
      createdAt: now,
    } satisfies StoredArtworkAsset;
  });

  const layerIdMap = new Map<string, string>();
  const duplicatedLayers = sourceDraft.decals.map((layer) => {
    const duplicatedLayerId = createId('layer');
    const duplicatedAssetId = assetIdMap.get(layer.assetId);
    if (!duplicatedAssetId) {
      throw new DraftStorageError(
        'DRAFT_ARTWORK_MISSING',
        'This design cannot be duplicated because one of its artwork files is missing.',
      );
    }

    layerIdMap.set(layer.id, duplicatedLayerId);
    return {
      ...layer,
      id: duplicatedLayerId,
      assetId: duplicatedAssetId,
    };
  });

  const duplicate: DesignDraftRecord = {
    ...sourceDraft,
    id: createId('draft'),
    name: normalizeDraftName(name) || normalizeDraftName(sourceDraft.name),
    activeDecalId: sourceDraft.activeDecalId
      ? (layerIdMap.get(sourceDraft.activeDecalId) ?? null)
      : null,
    decals: duplicatedLayers,
    assetIds: duplicatedAssets.map((asset) => asset.id),
    checkoutDetails: emptyCheckoutDetails(),
    submittedOrderId: null,
    createdAt: now,
    updatedAt: now,
  };

  const database = await openDatabase();
  const transaction = database.transaction([DRAFT_STORE, ASSET_STORE], 'readwrite');
  const completion = waitForTransaction(transaction);
  const assetStore = transaction.objectStore(ASSET_STORE);
  duplicatedAssets.forEach((asset) => assetStore.add(asset));
  transaction.objectStore(DRAFT_STORE).add(duplicate);
  await completion;
  return duplicate;
};

export const storeArtworkFile = async (
  draftId: string,
  file: File,
): Promise<StoredArtworkAsset> => {
  const asset: StoredArtworkAsset = {
    id: createId('asset'),
    blob: file.slice(0, file.size, file.type),
    fileName: file.name,
    mimeType: file.type,
    byteSize: file.size,
    lastModified: file.lastModified,
    createdAt: new Date().toISOString(),
  };

  const database = await openDatabase();
  const transaction = database.transaction([DRAFT_STORE, ASSET_STORE], 'readwrite');
  const completion = waitForTransaction(transaction);
  const draftStore = transaction.objectStore(DRAFT_STORE);
  const draftRequest = draftStore.get(draftId) as IDBRequest<
    LegacyDesignDraftRecord | undefined
  >;
  const storedDraft = await requestToPromise(draftRequest);

  if (!storedDraft) {
    transaction.abort();
    await completion.catch(() => undefined);
    throw new DraftStorageError('DRAFT_NOT_FOUND', 'The requested design draft no longer exists.');
  }

  const draft = normalizeDraftRecord(storedDraft);
  transaction.objectStore(ASSET_STORE).add(asset);
  draftStore.put({
    ...draft,
    assetIds: Array.from(new Set([...draft.assetIds, asset.id])),
    updatedAt: new Date().toISOString(),
  });
  await completion;
  return asset;
};

export const deleteArtworkAsset = async (assetId: string): Promise<void> => {
  const database = await openDatabase();
  const transaction = database.transaction(ASSET_STORE, 'readwrite');
  const completion = waitForTransaction(transaction);
  transaction.objectStore(ASSET_STORE).delete(assetId);
  await completion;
};

export const saveCheckoutDetails = async (
  draftId: string,
  checkoutDetails: OrderDetails,
): Promise<DesignDraftRecord> =>
  updateDraftRecord(draftId, (draft) => ({
    ...draft,
    checkoutDetails,
    updatedAt: new Date().toISOString(),
  }));

export const saveDraftQuantity = async (
  draftId: string,
  quantity: number,
): Promise<DesignDraftRecord> =>
  updateDraftRecord(draftId, (draft) => ({
    ...draft,
    quantity: normalizeDraftQuantity(quantity),
    updatedAt: new Date().toISOString(),
  }));

export const markDesignDraftSubmitted = async (
  draftId: string,
  orderId: string,
): Promise<DesignDraftRecord> =>
  updateDraftRecord(draftId, (draft) => ({
    ...draft,
    submittedOrderId: orderId,
    updatedAt: new Date().toISOString(),
  }));

export const deleteDesignDraft = async (draftId: string): Promise<void> => {
  const draft = await getDraftRecord(draftId);
  if (!draft) return;

  const database = await openDatabase();
  const transaction = database.transaction([DRAFT_STORE, ASSET_STORE], 'readwrite');
  const completion = waitForTransaction(transaction);
  transaction.objectStore(DRAFT_STORE).delete(draftId);

  const assetStore = transaction.objectStore(ASSET_STORE);
  Array.from(
    new Set([...draft.assetIds, ...draft.decals.map((layer) => layer.assetId)]),
  ).forEach((assetId) => assetStore.delete(assetId));
  await completion;
};

export const releaseDraftObjectUrls = (draft: Pick<HydratedDesignDraft, 'decals'>): void => {
  draft.decals.forEach((layer) => {
    if (layer.url.startsWith('blob:')) URL.revokeObjectURL(layer.url);
  });
};
