import { BRAND, getConfiguredWhatsAppNumber } from '@/config/brand';
import { platformApi, SubmitOrderResult } from '@/services/api';
import { Language, OrderDetails, PendingOrder } from '@/types';

export type OrderResult = SubmitOrderResult;

export const submitOrder = (
  designDraftId: string,
  pendingOrder: PendingOrder,
  details: OrderDetails,
  signal?: AbortSignal,
): Promise<OrderResult> =>
  platformApi.orders.submitOrder(
    {
      designDraftId,
      pendingOrder,
      details,
    },
    signal,
  );

export const buildWhatsAppDraftMessage = (
  orderId: string,
  order: PendingOrder,
  details: OrderDetails,
  language: Language,
  productName: string,
): string => {
  const address = [details.area, details.street, details.house].filter(Boolean).join(', ');
  const labels =
    language === 'ar'
      ? {
          draft: 'مسودة',
          item: 'القطعة',
          size: 'القياس',
          color: 'اللون',
          quantity: 'الكمية',
          layers: 'طبقات التصميم',
          customer: 'الزبون',
          phone: 'الهاتف',
          address: 'العنوان',
          notes: 'ملاحظات',
          none: 'ماكو',
        }
      : {
          draft: 'Draft',
          item: 'Item',
          size: 'Size',
          color: 'Color',
          quantity: 'Quantity',
          layers: 'Design layers',
          customer: 'Customer',
          phone: 'Phone',
          address: 'Address',
          notes: 'Notes',
          none: 'None',
        };

  return `
*${BRAND.displayName} — ${labels.draft} ${orderId}*
------------------
*${labels.item}:* ${productName}
*${labels.size}:* ${order.size}
*${labels.color}:* ${order.color}
*${labels.quantity}:* ${order.quantity}
*${labels.layers}:* ${order.decals.length}
------------------
*${labels.customer}:* ${details.fullName}
*${labels.phone}:* ${details.phone}
*${labels.address}:* ${address}
------------------
*${labels.notes}:* ${order.notes || labels.none}
  `.trim();
};

export const generateWhatsAppLink = (
  orderId: string,
  order: PendingOrder,
  details: OrderDetails,
  language: Language,
  productName: string,
): string | null => {
  const adminNumber = getConfiguredWhatsAppNumber();
  if (!adminNumber) return null;

  const text = buildWhatsAppDraftMessage(orderId, order, details, language, productName);
  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`;
};
