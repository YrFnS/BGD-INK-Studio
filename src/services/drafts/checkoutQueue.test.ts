import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Size } from '@/types';
import {
  createDesignDraft,
  deleteDesignDraft,
  listDesignDrafts,
  loadDesignDraft,
  releaseDraftObjectUrls,
  releaseDraftSummaryObjectUrls,
  saveCheckoutDetails,
  saveDraftQuantity,
} from './index';

const clearAllDrafts = async (): Promise<void> => {
  const summaries = await listDesignDrafts();
  releaseDraftSummaryObjectUrls(summaries);

  for (const summary of summaries) {
    await deleteDesignDraft(summary.id);
  }
};

beforeEach(clearAllDrafts);
afterEach(clearAllDrafts);

describe('queued checkout draft updates', () => {
  it('preserves contact fields and quantity when autosaves start together', async () => {
    const draft = await createDesignDraft({
      productId: 'tshirt-classic',
      color: '#000000',
      size: Size.L,
    });

    await Promise.all([
      saveCheckoutDetails(draft.id, {
        fullName: 'Yasser Test',
        phone: '07701234567',
        area: 'Al-Mansour',
        street: 'Street 10',
        house: '12',
      }),
      saveDraftQuantity(draft.id, 4),
    ]);

    const restored = await loadDesignDraft(draft.id);
    expect(restored).not.toBeNull();
    expect(restored?.quantity).toBe(4);
    expect(restored?.checkoutDetails).toEqual({
      fullName: 'Yasser Test',
      phone: '07701234567',
      area: 'Al-Mansour',
      street: 'Street 10',
      house: '12',
    });

    if (restored) releaseDraftObjectUrls(restored);
  });
});
