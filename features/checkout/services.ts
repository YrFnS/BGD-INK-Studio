
import { OrderDetails, PendingOrder, Order } from '../../types';
import { saveOrder } from '../../utils/storage';

// Simulate a backend delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface OrderResult {
  success: boolean;
  orderId: string;
}

export const submitOrder = async (
  pendingOrder: PendingOrder,
  details: OrderDetails
): Promise<OrderResult> => {
  await delay(1500); // Simulate network latency

  // Generate a random Baghdad-style Order ID (e.g., ASH-921)
  const orderId = `ASH-${Math.floor(1000 + Math.random() * 9000)}`;

  const fullOrder: Order = {
    ...pendingOrder,
    ...details,
    id: orderId,
    date: new Date().toISOString(),
    status: 'PENDING'
  };

  // Save to "Database"
  saveOrder(fullOrder);

  // Log payload to console (Development Mode)
  console.group('🛒 Order Saved');
  console.log('ID:', orderId);
  console.groupEnd();

  return {
    success: true,
    orderId
  };
};

// Helper to generate WhatsApp link
export const generateWhatsAppLink = (orderId: string, order: PendingOrder, details: OrderDetails) => {
  const adminNumber = '9647700000000'; // Replace with actual shop number
  
  const text = `
*New Order: ${orderId}*
------------------
*Item:* ${order.productName}
*Size:* ${order.size}
*Color:* ${order.color}
------------------
*Customer:* ${details.fullName}
*Phone:* ${details.phone}
*Address:* ${details.area}, ${details.street}
------------------
*Notes:* ${order.notes || 'None'}
  `.trim();

  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`;
};
