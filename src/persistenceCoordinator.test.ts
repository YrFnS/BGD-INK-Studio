import { afterEach, describe, expect, it, vi } from 'vitest';
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
