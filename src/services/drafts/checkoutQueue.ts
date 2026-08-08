import type { OrderDetails } from '@/types';
import {
  saveCheckoutDetails as persistCheckoutDetails,
  saveDraftQuantity as persistDraftQuantity,
} from './indexedDb';
import type { DesignDraftRecord } from './types';

const draftUpdateQueues = new Map<string, Promise<void>>();

const enqueueDraftUpdate = <T>(draftId: string, operation: () => Promise<T>): Promise<T> => {
  const previous = draftUpdateQueues.get(draftId) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );

  draftUpdateQueues.set(draftId, tail);
  void tail.then(() => {
    if (draftUpdateQueues.get(draftId) === tail) draftUpdateQueues.delete(draftId);
  });

  return result;
};

export const saveCheckoutDetails = (
  draftId: string,
  checkoutDetails: OrderDetails,
): Promise<DesignDraftRecord> =>
  enqueueDraftUpdate(draftId, () => persistCheckoutDetails(draftId, checkoutDetails));

export const saveDraftQuantity = (
  draftId: string,
  quantity: number,
): Promise<DesignDraftRecord> =>
  enqueueDraftUpdate(draftId, () => persistDraftQuantity(draftId, quantity));
