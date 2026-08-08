import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Size } from '@/types';
import {
  createDesignDraft,
  deleteDesignDraft,
  duplicateDesignDraft,
  listDesignDrafts,
  loadDesignDraft,
  markDesignDraftSubmitted,
  releaseDraftObjectUrls,
  releaseDraftSummaryObjectUrls,
  renameDesignDraft,
  saveCheckoutDetails,
  saveDesignDraft,
  storeArtworkFile,
} from './index';

const clearAllDrafts = async (): Promise<void> => {
  const summaries = await listDesignDrafts();
  releaseDraftSummaryObjectUrls(summaries);

  for (const summary of summaries) {
    await deleteDesignDraft(summary.id);
  }
};

const addArtworkLayer = async (draftId: string) => {
  const file = new File([new Uint8Array([137, 80, 78, 71])], 'team-logo.png', {
    type: 'image/png',
    lastModified: 1_700_000_000_000,
  });
  const asset = await storeArtworkFile(file);
  const layerId = 'layer-team-logo';

  await saveDesignDraft(draftId, {
    color: '#111111',
    size: Size.M,
    notes: 'Front print',
    activeDecalId: layerId,
    decals: [
      {
        id: layerId,
        url: 'blob:temporary-preview',
        assetId: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        position: [0.1, 0.2, 0.3],
        rotation: [0, 0.1, 0],
        userRotation: 0.25,
        scale: 0.18,
      },
    ],
  });

  return asset;
};

beforeEach(clearAllDrafts);
afterEach(clearAllDrafts);

describe('IndexedDB design drafts', () => {
  it('creates, renames, lists, and restores draft metadata', async () => {
    const draft = await createDesignDraft({
      productId: 'tshirt-classic',
      color: '#000000',
      size: Size.L,
    });

    await renameDesignDraft(draft.id, '  Team   launch shirts  ');
    await saveCheckoutDetails(draft.id, {
      fullName: 'Yasser Ahmed',
      phone: '07701234567',
      area: 'Al-Mansour',
      street: 'Main street',
      house: '12',
    });

    const summaries = await listDesignDrafts();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: draft.id,
      name: 'Team launch shirts',
      productId: 'tshirt-classic',
      size: Size.L,
      layerCount: 0,
      previewUrl: null,
    });
    releaseDraftSummaryObjectUrls(summaries);

    const restored = await loadDesignDraft(draft.id);
    expect(restored).not.toBeNull();
    expect(restored?.checkoutDetails).toEqual({
      fullName: 'Yasser Ahmed',
      phone: '07701234567',
      area: 'Al-Mansour',
      street: 'Main street',
      house: '12',
    });
  });

  it('persists artwork blobs and rebuilds safe preview URLs', async () => {
    const draft = await createDesignDraft({
      productId: 'tshirt-classic',
      color: '#000000',
    });
    const asset = await addArtworkLayer(draft.id);

    const restored = await loadDesignDraft(draft.id);
    expect(restored).not.toBeNull();
    expect(restored?.missingAssetCount).toBe(0);
    expect(restored?.decals).toHaveLength(1);
    expect(restored?.decals[0]).toMatchObject({
      id: 'layer-team-logo',
      assetId: asset.id,
      fileName: 'team-logo.png',
      mimeType: 'image/png',
      position: [0.1, 0.2, 0.3],
      rotation: [0, 0.1, 0],
      userRotation: 0.25,
      scale: 0.18,
    });
    expect(restored?.decals[0]?.url).toMatch(/^blob:test-/);

    if (restored) releaseDraftObjectUrls(restored);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('duplicates artwork atomically and keeps the copy independent', async () => {
    const source = await createDesignDraft({
      productId: 'tshirt-classic',
      color: '#000000',
    });
    await renameDesignDraft(source.id, 'Original design');
    await addArtworkLayer(source.id);
    await saveCheckoutDetails(source.id, {
      fullName: 'Customer',
      phone: '07701234567',
      area: 'Al-Mansour',
      street: 'Street 1',
      house: '2',
    });
    await markDesignDraftSubmitted(source.id, 'BGD-SOURCE');

    const duplicate = await duplicateDesignDraft(source.id, 'Copy of Original design');
    const sourceDraft = await loadDesignDraft(source.id);
    const duplicateDraft = await loadDesignDraft(duplicate.id);

    expect(duplicateDraft).not.toBeNull();
    expect(duplicateDraft?.name).toBe('Copy of Original design');
    expect(duplicateDraft?.submittedOrderId).toBeNull();
    expect(duplicateDraft?.checkoutDetails).toEqual({
      fullName: '',
      phone: '',
      area: '',
      street: '',
      house: '',
    });
    expect(duplicateDraft?.decals).toHaveLength(1);
    expect(duplicateDraft?.decals[0]?.assetId).not.toBe(sourceDraft?.decals[0]?.assetId);
    expect(duplicateDraft?.decals[0]?.id).not.toBe(sourceDraft?.decals[0]?.id);

    if (sourceDraft) releaseDraftObjectUrls(sourceDraft);
    if (duplicateDraft) releaseDraftObjectUrls(duplicateDraft);

    await deleteDesignDraft(source.id);
    const copyAfterSourceDeletion = await loadDesignDraft(duplicate.id);
    expect(copyAfterSourceDeletion?.decals).toHaveLength(1);
    if (copyAfterSourceDeletion) releaseDraftObjectUrls(copyAfterSourceDeletion);
  });
});
