import { BRAND } from '@/config/brand';
import { PLATFORM_STATUS } from '@/config/platform';
import { PendingOrder } from '@/types';
import { getProducts } from '@/utils/storage';
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

const createDurablePendingOrder = (pendingOrder: PendingOrder): PendingOrder => ({
  ...pendingOrder,
  decals: pendingOrder.decals.map((layer) => {
    if (layer.url.startsWith('blob:') && !layer.assetId) {
      throw new PlatformApiError({
        code: 'ARTWORK_NOT_PERSISTED',
        message: 'Artwork must be stored before the local draft can be submitted.',
      });
    }

    return {
      ...layer,
      url: layer.assetId ? `indexeddb://artwork/${layer.assetId}` : layer.url,
    };
  }),
});

const submitLocalDraft = ({ pendingOrder }: SubmitOrderInput, signal?: AbortSignal) => {
  throwIfAborted(signal);

  if (!PLATFORM_STATUS.localDraftPreparationEnabled) {
    throw new PlatformApiError({
      code: 'LOCAL_STORAGE_DISABLED',
      message: 'Local draft preparation is disabled.',
    });
  }

  createDurablePendingOrder(pendingOrder);
  const orderId = createDraftId();

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
