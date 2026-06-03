import type { CartItem } from '../context/CartContext';

export interface OrderCustomer {
  id: string;
  name: string;
  email?: string;
}

export interface OrderRecord {
  id: number;
  orderUuid: string;
  createdAt: string;
  updatedAt?: string;
  customerPaymentDoneAt?: string;
  customerAcknowledgedAt?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  providerId?: string | number | null;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  notifyWhatsApp: boolean;
  status: 'placed' | 'order_received' | 'quoted' | 'quote_accepted' | 'payment_done' | 'payment_received' | 'delivery_pending' | 'delivered';
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const getHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const normalizeOrder = (order: any): OrderRecord => ({
  id: Number(order.id),
  orderUuid: order.order_uuid || order.orderUuid,
  createdAt: order.created_at || order.createdAt,
  updatedAt: order.updated_at || order.updatedAt || undefined,
  customerPaymentDoneAt: order.customer_payment_done_at || order.customerPaymentDoneAt || undefined,
  customerAcknowledgedAt: order.customer_acknowledged_at || order.customerAcknowledgedAt || undefined,
  customerId: String(order.customer_id ?? order.customerId ?? ''),
  customerName: order.customer_name || order.customerName || '',
  customerEmail: order.customer_email || order.customerEmail || undefined,
  providerId: order.provider_id ?? order.providerId ?? null,
  items: Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]'),
  subtotal: Number(order.subtotal || 0),
  shipping: Number(order.shipping || 0),
  total: Number(order.total || 0),
  notifyWhatsApp: Boolean(order.notify_whatsapp ?? order.notifyWhatsApp),
  status: order.status || 'placed',
});

export const buildOrderPayload = (
  items: CartItem[],
  customer: OrderCustomer,
  notifyWhatsApp: boolean
) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal;

  return {
    customerName: customer.name,
    customerEmail: customer.email,
    providerId: items[0]?.providerId || (items[0] as any)?.provider_id || (items[0] as any)?.seller_id || null,
    items,
    subtotal,
    shipping,
    total,
    notifyWhatsApp,
  };
};

export const createOrder = async (
  token: string | null,
  items: CartItem[],
  customer: OrderCustomer,
  notifyWhatsApp: boolean
) => {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(buildOrderPayload(items, customer, notifyWhatsApp)),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create order');
  }

  const data = await response.json();
  return normalizeOrder(data.order);
};

export const loadOrders = async (token: string | null): Promise<OrderRecord[]> => {
  const response = await fetch(`${API_BASE}/api/orders`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load orders');
  }

  const data = await response.json();
  return Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : [];
};