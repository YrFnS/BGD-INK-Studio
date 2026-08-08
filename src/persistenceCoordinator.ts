export const DRAFT_PERSISTENCE_FAILURE_EVENT = 'bgd-ink:draft-persistence-failed';

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

export const flushRetriablePendingValue = async <T>(
  pendingValue: T | null,
  persist: (value: T) => Promise<void>,
  waitForQueue: () => Promise<void>,
  restore: (value: T) => void,
): Promise<void> => {
  try {
    if (pendingValue !== null) await persist(pendingValue);
    await waitForQueue();
  } catch (error) {
    if (pendingValue !== null) restore(pendingValue);
    throw error;
  }
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
  if (lifecycleInstalled || typeof window === 'undefined' || typeof document === 'undefined')
    return;
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
