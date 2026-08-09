import {
  incrementRuntimeCounter,
  recordRuntimeDuration,
} from '@/runtime/performanceMetrics';
import { saveDesignDraft as saveDesignDraftImplementation } from './indexedDb';
import type {
  DesignDraftRecord as StoredDesignDraftRecord,
  DesignDraftSnapshot as StoredDesignDraftSnapshot,
} from './types';

const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

export const saveDesignDraft = async (
  draftId: string,
  snapshot: StoredDesignDraftSnapshot,
): Promise<StoredDesignDraftRecord> => {
  const startedAt = now();
  incrementRuntimeCounter('draftSavesStarted');

  try {
    const draft = await saveDesignDraftImplementation(draftId, snapshot);
    incrementRuntimeCounter('draftSavesSucceeded');
    recordRuntimeDuration('draftSave', now() - startedAt);
    return draft;
  } catch (error) {
    incrementRuntimeCounter('draftSavesFailed');
    recordRuntimeDuration('draftSave', now() - startedAt);
    throw error;
  }
};

export {
  createDesignDraft,
  deleteArtworkAsset,
  deleteDesignDraft,
  duplicateDesignDraft,
  listDesignDrafts,
  loadDesignDraft,
  markDesignDraftSubmitted,
  releaseDraftObjectUrls,
  renameDesignDraft,
  storeArtworkFile,
} from './indexedDb';
export { saveCheckoutDetails, saveDraftQuantity } from './checkoutQueue';
export { releaseDraftSummaryObjectUrls } from './objectUrls';
export type {
  CreateDesignDraftInput,
  DesignDraftRecord,
  DesignDraftSnapshot,
  DesignDraftSummary,
  DraftLoadStatus,
  DraftSaveStatus,
  HydratedDesignDraft,
  StoredArtworkAsset,
} from './types';
export { DraftStorageError } from './types';
