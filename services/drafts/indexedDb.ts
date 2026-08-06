import { BRAND } from '../../config/brand';
import { OrderDetails, Size } from '../../types';
import {
  CreateDesignDraftInput,
  DESIGN_DRAFT_VERSION,
  DesignDraftRecord,
  DesignDraftSnapshot,
  DraftStorageError,
  HydratedDesignDraft,
  StoredArtworkAsset,
  StoredDecalLayer,
} from './types';

const DATABASE_NAME = `${BRAND.storageNamespace}_studio`;
const DATABASE_VERSION = 1;
const DRAFT_STORE = 'design-drafts';
const ASSET_STORE = 'artwork-assets';

let databasePromise: Promise<IDBDatabase> | null = null;

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
          'Another tab is blocking the design database. Close older BGD/INK tabs and try again.',
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
    DesignDraftRecord | undefined
  >;
  const draft = await requestToPromise(request);
  await completion;
  return draft ?? null;
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

const serializeLayer = (layer: DesignDraftSnapshot['decals'][number]): StoredDecalLayer => {
  if (!layer.assetId) {
    throw new DraftStorageError(
      'ARTWORK_NOT_PERSISTED',
      'An artwork layer must be stored before the design draft can be saved.',
    );
  }

  return {
    id: layer.id,
    assetId: layer.assetId,
    fileName: layer.fileName ?? 'artwork',
    mimeType: layer.mimeType ?? 'application/octet-stream',
    position: layer.position,
    rotation: layer.rotation,
    userRotation: layer.userRotation,
    scale: layer.scale,
  };
};

export const createDesignDraft = async ({
  productId,
  color,
  size = Size.L,
}: CreateDesignDraftInput): Promise<DesignDraftRecord> => {
  const now = new Date().toISOString();
  const draft: DesignDraftRecord = {
    version: DESIGN_DRAFT_VERSION,
    id: createId('draft'),
    productId,
    color,
    size,
    notes: '',
    activeDecalId: null,
    decals: [],
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

export const loadDesignDraft = async (
  draftId: string,
): Promise<HydratedDesignDraft | null> => {
  const draft = await getDraftRecord(draftId);
  if (!draft) return null;

  const database = await openDatabase();
  const transaction = database.transaction(ASSET_STORE, 'readonly');
  const completion = waitForTransaction(transaction);
  const assetStore = transaction.objectStore(ASSET_STORE);
  const assetRequests = draft.decals.map((layer) =>
    requestToPromise(
      assetStore.get(layer.assetId) as IDBRequest<StoredArtworkAsset | undefined>,
    ),
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
        url: URL.createObjectURL(asset.blob),
        assetId: layer.assetId,
        fileName: layer.fileName || asset.fileName,
        mimeType: layer.mimeType || asset.mimeType,
        position: layer.position,
        rotation: layer.rotation,
        userRotation: layer.userRotation,
        scale: layer.scale,
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
  updateDraftRecord(draftId, (draft) => ({
    ...draft,
    color: snapshot.color,
    size: snapshot.size,
    notes: snapshot.notes,
    activeDecalId: snapshot.activeDecalId,
    decals: snapshot.decals.map(serializeLayer),
    updatedAt: new Date().toISOString(),
  }));

export const storeArtworkFile = async (file: File): Promise<StoredArtworkAsset> => {
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
  const transaction = database.transaction(ASSET_STORE, 'readwrite');
  const completion = waitForTransaction(transaction);
  transaction.objectStore(ASSET_STORE).add(asset);
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
  draft.decals.forEach((layer) => assetStore.delete(layer.assetId));
  await completion;
};

export const releaseDraftObjectUrls = (draft: Pick<HydratedDesignDraft, 'decals'>): void => {
  draft.decals.forEach((layer) => {
    if (layer.url.startsWith('blob:')) URL.revokeObjectURL(layer.url);
  });
};
