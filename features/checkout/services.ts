import { BRAND, getConfiguredWhatsAppNumber } from '../../config/brand';
import { PLATFORM_STATUS } from '../../config/platform';
import { Order, OrderDetails, PendingOrder } from '../../types';
import { saveOrder } from '../../utils/storage';

export interface OrderResult {
  success: true;
  orderId: string;
  persistence: 'local-demo';
}

const createDraftId = (): string => {
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().split('-')[0]
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  return `${BRAND.orderPrefix}-${token.toUpperCase()}`;
};

export const submitOrder = async (
  pendingOrder: PendingOrder,
  details: OrderDetails,
): Promise<OrderResult> => {
  if (!PLATFORM_STATUS.localOrderStorageEnabled) {
    throw new Error('Order storage is not configured.');
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
    throw new Error('The draft could not be saved in this browser.');
  }

  return {
    success: true,
    orderId,
    persistence: 'local-demo',
  };
};

export const generateWhatsAppLink = (
  orderId: string,
  order: PendingOrder,
  details: OrderDetails,
): string | null => {
  const adminNumber = getConfiguredWhatsAppNumber();
  if (!adminNumber) return null;

  const address = [details.area, details.street, details.house].filter(Boolean).join(', ');
  const text = `
*${BRAND.displayName} — Draft ${orderId}*
------------------
*Item:* ${order.productName}
*Size:* ${order.size}
*Color:* ${order.color}
*Design layers:* ${order.decals.length}
------------------
*Customer:* ${details.fullName}
*Phone:* ${details.phone}
*Address:* ${address}
------------------
*Notes:* ${order.notes || 'None'}
  `.trim();

  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`;
};
