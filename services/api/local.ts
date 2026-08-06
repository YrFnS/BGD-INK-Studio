import { BRAND } from '../../config/brand';
import { PLATFORM_STATUS } from '../../config/platform';
import { Order } from '../../types';
import { getProducts, saveOrder } from '../../utils/storage';
import { PlatformApi, PlatformApiError, SubmitOrderInput } from './types';

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
};

const createDraftId = (): string => {
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().split('-')[0]
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  return `${BRAND.orderPrefix}-${token.toUpperCase()}`;
};

const submitLocalDraft = (
  { pendingOrder, details }: SubmitOrderInput,
  signal?: AbortSignal,
) => {
  throwIfAborted(signal);

  if (!PLATFORM_STATUS.localOrderStorageEnabled) {
    throw new PlatformApiError({
      code: 'LOCAL_STORAGE_DISABLED',
      message: 'Local draft storage is disabled.',
    });
  }

  const orderId = createDraftId();
  const draft: Order = {
    ...pendingOrder,
    ...details,
    id: orderId,
    date: new Date().toISOString(),
    status: 'PENDING',
  };

  if (!saveOrder(draft)) {
    throw new PlatformApiError({
      code: 'LOCAL_DRAFT_SAVE_FAILED',
      message: 'The draft could not be saved in this browser.',
    });
  }

  return {
    success: true as const,
    orderId,
    persistence: 'local-prototype' as const,
    status: 'DRAFT' as const,
  };
};

export const localPlatformApi: PlatformApi = {
  source: 'local-prototype',
  catalog: {
    listProducts: async (signal) => {
      throwIfAborted(signal);
      return getProducts();
    },
  },
  orders: {
    submitOrder: async (input, signal) => submitLocalDraft(input, signal),
  },
};
