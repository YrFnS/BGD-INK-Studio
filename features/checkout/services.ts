import { BRAND, getConfiguredWhatsAppNumber } from '../../config/brand';
import { platformApi, SubmitOrderResult } from '../../services/api';
import { OrderDetails, PendingOrder } from '../../types';

export type OrderResult = SubmitOrderResult;

export const submitOrder = (
  pendingOrder: PendingOrder,
  details: OrderDetails,
): Promise<OrderResult> =>
  platformApi.orders.submitOrder({
    pendingOrder,
    details,
  });

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
