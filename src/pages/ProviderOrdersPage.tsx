import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import ChatBox from './ChatBox';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// ===== Types =====
type ProviderOrderItem = {
  id: string | number;
  name: string;
  description?: string | null;
  image?: string;
  price: number;
  quantity: number;
  size?: string | null;
  type?: string;
  serviceCustomization?: {
    needsCustomization?: boolean;
    customizationRequest?: string;
    noCustomizationNeeded?: boolean;
    originalPrice?: number;
    quotedPrice?: number;
    quoteStatus?: 'quoted' | 'accepted';
    quotedAt?: string;
  };
};

type ProviderOrder = {
  id: number;
  orderUuid: string;
  customerId: string;
  customerName: string;
  customerEmail?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  customerPaymentDoneAt?: string;
  customerAcknowledgedAt?: string;
  items: ProviderOrderItem[];
};

type OrderStatus = 
  | 'placed' 
  | 'order_received' 
  | 'quoted' 
  | 'quote_accepted' 
  | 'payment_done' 
  | 'payment_received' 
  | 'delivery_pending' 
  | 'delivered';

type OrderSummary = {
  total: number;
  paymentPending: number;
  paymentReceived: number;
  deliveryPending: number;
  delivered: number;
};

// ===== Constants =====
const STATUS_CONFIG: Record<OrderStatus, { label: string; tone: string; nextActions?: OrderStatus[] }> = {
  placed: { label: 'Placed', tone: 'default', nextActions: ['order_received'] },
  order_received: { label: 'Order received by provider', tone: 'info', nextActions: ['payment_received'] },
  quoted: { label: 'Quoted new price', tone: 'warning', nextActions: [] },
  quote_accepted: { label: 'Quote accepted', tone: 'success', nextActions: ['payment_received'] },
  payment_done: { label: 'Payment pending provider confirmation', tone: 'info', nextActions: ['payment_received'] },
  payment_received: { label: 'Payment confirmed', tone: 'warning', nextActions: ['delivery_pending'] },
  delivery_pending: { label: 'Delivery pending customer confirmation', tone: 'info', nextActions: ['delivered'] },
  delivered: { label: 'Delivered', tone: 'success', nextActions: [] },
};

// ===== Utility Functions =====
const normalizeProviderOrder = (order: any): ProviderOrder => ({
  id: Number(order.id),
  orderUuid: order.order_uuid || order.orderUuid || `order-${order.id}`,
  customerId: String(order.customer_id || order.customerId || ''),
  customerName: order.customer_name || order.customerName || '',
  customerEmail: order.customer_email || order.customerEmail || null,
  subtotal: Number(order.subtotal || 0),
  shipping: Number(order.shipping || 0),
  total: Number(order.total || 0),
  status: order.status || 'placed',
  createdAt: order.created_at || order.createdAt || new Date().toISOString(),
  updatedAt: order.updated_at || order.updatedAt || undefined,
  customerPaymentDoneAt: order.customer_payment_done_at || order.customerPaymentDoneAt || undefined,
  customerAcknowledgedAt: order.customer_acknowledged_at || order.customerAcknowledgedAt || undefined,
  items: Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]'),
});

const getStatusTone = (status: OrderStatus, darkMode: boolean): string => {
  const tones = {
    default: darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700',
    info: darkMode ? 'bg-cyan-600/20 text-cyan-100' : 'bg-cyan-100 text-cyan-700',
    warning: darkMode ? 'bg-amber-600/20 text-amber-100' : 'bg-amber-100 text-amber-700',
    success: darkMode ? 'bg-green-600/20 text-green-100' : 'bg-green-100 text-green-700',
  };
  return tones[STATUS_CONFIG[status]?.tone as keyof typeof tones] || tones.default;
};

// ===== Custom Hooks =====
const useProviderOrders = (token: string | null) => {
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/provider/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load provider orders (${response.status})`);
      }
      const data = await response.json();
      setOrders(Array.isArray(data.orders) ? data.orders.map(normalizeProviderOrder) : []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load provider orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderUuid: string, status: OrderStatus) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/provider/orders/${orderUuid}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update order (${response.status})`);
      }

      const data = await response.json();
      const normalizedOrder = normalizeProviderOrder(data.order);
      setOrders(prev => prev.map(order => (order.orderUuid === orderUuid ? normalizedOrder : order)));
      return true;
    } catch (updateError) {
      throw updateError;
    }
  };

  const quoteServicePrice = async (orderUuid: string, itemId: string | number, quotedPrice: number) => {
    if (!token) return;
    const response = await fetch(`${API_BASE}/api/provider/orders/${orderUuid}/quote`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId, quotedPrice }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Failed to quote order (${response.status})`);
    }

    const data = await response.json();
    const normalizedOrder = normalizeProviderOrder(data.order);
    setOrders(prev => prev.map(order => (order.orderUuid === orderUuid ? normalizedOrder : order)));
  };

  return { orders, loading, error, fetchOrders, updateOrderStatus, quoteServicePrice };
};

const useCustomerChatCounts = (token: string | null) => {
  const [customerChatCounts, setCustomerChatCounts] = useState<Record<string, { unread_count: number; name?: string }>>({});

  useEffect(() => {
    let mounted = true;
    if (!token) return;

    const fetchCustomerChats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/messages/provider/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!mounted) return;

        const counts = (Array.isArray(data) ? data : []).reduce((acc: Record<string, { unread_count: number; name?: string }>, customer: any) => {
          const customerId = String(customer.customer_id || customer.customerId || '');
          if (customerId) {
            acc[customerId] = {
              unread_count: Number(customer.unread_count ?? 0),
              name: customer.name,
            };
          }
          return acc;
        }, {});

        setCustomerChatCounts(counts);
      } catch (err) {
        console.error('Failed to fetch provider chat counts', err);
      }
    };

    fetchCustomerChats();
    const interval = setInterval(fetchCustomerChats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token]);

  return { customerChatCounts, setCustomerChatCounts };
};

// ===== Components =====
const OrderSummaryCards = ({ summary, darkMode }: { summary: OrderSummary; darkMode: boolean }) => {
  const cards = [
    { label: 'Total Orders', value: summary.total },
    { label: 'Payment Pending', value: summary.paymentPending },
    { label: 'Payment Received', value: summary.paymentReceived },
    { label: 'Delivery Pending', value: summary.deliveryPending },
    { label: 'Delivered', value: summary.delivered },
  ];

  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className={`rounded-2xl border p-4 ${borderColor} ${bgColor}`}>
          <p className={`text-sm ${secondaryTextColor}`}>{card.label}</p>
          <p className={`mt-1 text-2xl font-bold ${textColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status, darkMode }: { status: OrderStatus; darkMode: boolean }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(status, darkMode)}`}>
    {STATUS_CONFIG[status]?.label || status}
  </span>
);

const ActionButton = ({ 
  onClick, 
  disabled, 
  children, 
  variant = 'primary' 
}: { 
  onClick: () => void; 
  disabled: boolean; 
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-amber-600 text-white hover:bg-amber-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
        disabled ? 'cursor-not-allowed bg-gray-300 text-gray-500' : variants[variant]
      }`}
    >
      {children}
    </button>
  );
};

const QuoteSection = ({ 
  item, 
  orderUuid, 
  orderStatus,
  onQuote, 
  saving,
  darkMode 
}: {
  item: ProviderOrderItem;
  orderUuid: string;
  orderStatus: OrderStatus;
  onQuote: (itemId: string | number, price: number) => Promise<void>;
  saving: boolean;
  darkMode: boolean;
}) => {
  const [quoteDraft, setQuoteDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const itemKey = `${orderUuid}-${item.id}`;
  const customization = item.serviceCustomization;

  if (!customization || customization.noCustomizationNeeded) return null;
  if (customization.quoteStatus === 'accepted') {
    return (
      <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
        <p className={`font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
          ✓ Customer accepted the quote of RWF {Number(customization.quotedPrice).toLocaleString()}
        </p>
      </div>
    );
  }

  if (['delivered', 'delivery_pending'].includes(orderStatus)) return null;

  const handleQuote = () => {
    const price = Number(quoteDraft);
    if (isNaN(price) || price <= 0) return;
    onQuote(item.id, price);
    setQuoteDraft('');
    setIsEditing(false);
  };

  if (!isEditing && customization.quotedPrice) {
    return (
      <div className={`mt-3 rounded-xl border px-4 py-3 ${darkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Quoted Price: RWF {Number(customization.quotedPrice).toLocaleString()}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Edit Quote
          </button>
        </div>
        {customization.customizationRequest && (
          <p className="text-xs text-gray-500">Request: {customization.customizationRequest}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`mt-3 rounded-xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-gray-50'}`}>
      <p className="text-sm font-semibold mb-2">Provide Service Quote</p>
      {customization.customizationRequest && (
        <p className="text-xs text-gray-500 mb-2">Request: {customization.customizationRequest}</p>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={quoteDraft}
          onChange={(e) => setQuoteDraft(e.target.value)}
          placeholder={`Original: RWF ${Number(item.price).toLocaleString()}`}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-800'}`}
        />
        <button
          onClick={handleQuote}
          disabled={saving || !quoteDraft}
          className="rounded-lg px-4 py-2 text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {customization.quotedPrice ? 'Update Quote' : 'Submit Quote'}
        </button>
      </div>
    </div>
  );
};

const OrderCard = ({ 
  order, 
  providerId,
  onUpdateStatus,
  onQuoteItem,
  savingOrderUuid,
  activeChatOrderUuid,
  onToggleChat,
  customerChatCounts,
  onClearUnreadCount,
  darkMode 
}: {
  order: ProviderOrder;
  providerId: string;
  onUpdateStatus: (orderUuid: string, status: OrderStatus) => Promise<void>;
  onQuoteItem: (orderUuid: string, itemId: string | number, price: number) => Promise<void>;
  savingOrderUuid: string | null;
  activeChatOrderUuid: string | null;
  onToggleChat: (orderUuid: string) => void;
  customerChatCounts: Record<string, { unread_count: number; name?: string }>;
  onClearUnreadCount: (customerId: string) => void;
  darkMode: boolean;
}) => {
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  
  const isSaving = savingOrderUuid === order.orderUuid;
  const isChatOpen = activeChatOrderUuid === order.orderUuid;
  const customerId = String(order.customerId);
  const unreadCount = customerChatCounts[customerId]?.unread_count ?? 0;

  const handleStatusUpdate = (status: OrderStatus) => () => {
    onUpdateStatus(order.orderUuid, status);
  };

  const handleChatToggle = () => {
    onToggleChat(order.orderUuid);
    if (unreadCount > 0) onClearUnreadCount(customerId);
  };

  const renderActionButtons = () => {
    const nextActions = STATUS_CONFIG[order.status]?.nextActions || [];
    const actionMap: Record<OrderStatus, { label: string; variant: 'primary' | 'secondary' }> = {
      order_received: { label: '✓ Confirm Order Received', variant: 'primary' },
      payment_received: { label: '💰 Confirm Payment Received', variant: 'secondary' },
      delivery_pending: { label: '📦 Mark as Delivered', variant: 'primary' },
    };

    return nextActions.map(action => {
      const config = actionMap[action];
      if (!config) return null;
      return (
        <ActionButton
          key={action}
          onClick={handleStatusUpdate(action)}
          disabled={isSaving}
          variant={config.variant}
        >
          {config.label}
        </ActionButton>
      );
    });
  };

  const getStatusMessage = () => {
    const messages: Record<OrderStatus, string> = {
      placed: 'Order placed; confirm receipt to proceed.',
      order_received: 'You confirmed receipt; the customer can now proceed with payment.',
      quoted: 'A new price has been quoted for the customer to review.',
      quote_accepted: 'The customer accepted the quote. You can now continue with payment and delivery steps.',
      payment_done: 'Customer marked payment done; confirm receipt to continue.',
      payment_received: 'Payment confirmed; now mark the order as delivered to the customer.',
      delivery_pending: 'Delivery marked completed; waiting for customer confirmation.',
      delivered: 'This order has been successfully delivered.',
    };
    return messages[order.status] || 'Processing...';
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${borderColor} ${bgColor}`}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className={`text-lg font-semibold ${textColor}`}>Order {order.orderUuid}</h2>
            <StatusBadge status={order.status} darkMode={darkMode} />
          </div>
          <p className={`text-sm ${secondaryTextColor}`}>Customer: {order.customerName}</p>
          {order.customerEmail && (
            <p className={`text-sm ${secondaryTextColor}`}>Email: {order.customerEmail}</p>
          )}
          <button
            onClick={handleChatToggle}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-hafi-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-hafi-green"
          >
            💬 Chat with customer{unreadCount > 0 && ` (${unreadCount} new)`}
          </button>
          <div className="mt-3 text-xs space-y-0.5">
            <p className={secondaryTextColor}>Placed: {new Date(order.createdAt).toLocaleString()}</p>
            {order.updatedAt && <p>Updated: {new Date(order.updatedAt).toLocaleString()}</p>}
            {order.customerPaymentDoneAt && <p>Payment marked: {new Date(order.customerPaymentDoneAt).toLocaleString()}</p>}
            {order.customerAcknowledgedAt && <p>Delivery confirmed: {new Date(order.customerAcknowledgedAt).toLocaleString()}</p>}
          </div>
        </div>
        <div className={`text-right ${textColor}`}>
          <div className="text-sm">Subtotal: RWF {Number(order.subtotal).toLocaleString()}</div>
          <div className="text-lg font-bold">Total: RWF {Number(order.total).toLocaleString()}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={`mt-4 grid gap-4 ${isChatOpen ? 'md:grid-cols-[1fr_360px_280px]' : 'md:grid-cols-[1fr_280px]'}`}>
        {/* Left Column - Items */}
        <div className="space-y-4">
          <div className={`rounded-xl border px-4 py-3 text-sm ${borderColor} ${darkMode ? 'bg-gray-900/20 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
            ℹ️ Transport and delivery are negotiated directly between the customer and the service provider.
          </div>

          <div className={`rounded-xl border ${borderColor} ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
            {order.items.map((item, idx) => (
              <div key={idx} className={`border-b last:border-b-0 p-4 ${idx > 0 ? 'border-t' : ''}`}>
                <div className="flex gap-3">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${textColor}`}>{item.name}</p>
                        {item.description && (
                          <p className={`text-sm ${secondaryTextColor} mt-0.5`}>{item.description}</p>
                        )}
                        <p className={`text-sm ${secondaryTextColor} mt-1`}>
                          Qty {item.quantity} {item.size && `· Size ${item.size}`}
                        </p>
                      </div>
                      <div className={`text-sm font-semibold ${textColor}`}>
                        RWF {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    {item.type === 'service' && (
                      <QuoteSection
                        item={item}
                        orderUuid={order.orderUuid}
                        orderStatus={order.status}
                        onQuote={(itemId, price) => onQuoteItem(order.orderUuid, itemId, price)}
                        saving={isSaving}
                        darkMode={darkMode}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column - Chat (conditional) */}
        {isChatOpen && (
          <div className={`rounded-xl border p-3 ${borderColor} ${darkMode ? 'bg-gray-900/20' : 'bg-gray-50'}`}>
            <ChatBox
              providerId={providerId}
              customerId={customerId}
              currentUserRole="provider"
              partnerName={order.customerName}
              onClose={() => onToggleChat(order.orderUuid)}
              inline
            />
          </div>
        )}

        {/* Right Column - Actions */}
        <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${borderColor} ${darkMode ? 'bg-gray-900/20' : 'bg-gray-50'}`}>
            <div className="text-sm text-gray-500 mb-1">Order total</div>
            <div className={`text-2xl font-bold ${textColor}`}>RWF {Number(order.total).toLocaleString()}</div>
            <div className={`mt-1 text-sm ${secondaryTextColor}`}>Subtotal: RWF {Number(order.subtotal).toLocaleString()}</div>
          </div>

          <div className={`rounded-xl border p-4 ${borderColor} ${darkMode ? 'bg-gray-900/20' : 'bg-gray-50'}`}>
            <div className="space-y-3">
              {renderActionButtons()}
            </div>
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${borderColor} ${darkMode ? 'bg-gray-900/20 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
              {getStatusMessage()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Main Component =====
export default function ProviderOrdersPage() {
  const { token, user } = useAuth();
  const { darkMode } = useDarkMode();
  const { orders, loading, error, fetchOrders, updateOrderStatus, quoteServicePrice } = useProviderOrders(token);
  const { customerChatCounts, setCustomerChatCounts } = useCustomerChatCounts(token);
  
  const [savingOrderUuid, setSavingOrderUuid] = useState<string | null>(null);
  const [activeChatOrderUuid, setActiveChatOrderUuid] = useState<string | null>(null);

  const summary = useMemo(() => ({
    total: orders.length,
    paymentPending: orders.filter(order => order.status === 'payment_done').length,
    paymentReceived: orders.filter(order => order.status === 'payment_received').length,
    deliveryPending: orders.filter(order => order.status === 'delivery_pending').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
  }), [orders]);

  const handleUpdateStatus = async (orderUuid: string, status: OrderStatus) => {
    setSavingOrderUuid(orderUuid);
    try {
      await updateOrderStatus(orderUuid, status);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSavingOrderUuid(null);
    }
  };

  const handleQuoteItem = async (orderUuid: string, itemId: string | number, price: number) => {
    setSavingOrderUuid(orderUuid);
    try {
      await quoteServicePrice(orderUuid, itemId, price);
    } catch (error) {
      console.error('Failed to quote price:', error);
    } finally {
      setSavingOrderUuid(null);
    }
  };

  const handleToggleChat = (orderUuid: string) => {
    setActiveChatOrderUuid(prev => prev === orderUuid ? null : orderUuid);
  };

  const handleClearUnreadCount = (customerId: string) => {
    setCustomerChatCounts(prev => ({
      ...prev,
      [customerId]: { ...prev[customerId], unread_count: 0 },
    }));
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`p-6 max-w-7xl mx-auto min-h-screen ${bgColor}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-hafi-teal-light' : 'text-hafi-teal'}`}>
            Provider Orders
          </h1>
          <p className={`mt-1 ${secondaryTextColor}`}>
            Manage client orders, confirm receipt, confirm payment, and mark deliveries completed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard"
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors ${
              darkMode
                ? 'bg-hafi-teal/20 text-white hover:bg-hafi-teal/35'
                : 'bg-hafi-teal text-white hover:bg-hafi-green'
            }`}
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={fetchOrders}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors ${
              darkMode
                ? 'border border-gray-600 text-gray-100 hover:bg-gray-800'
                : 'border border-gray-300 text-gray-800 hover:bg-gray-100'
            }`}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <OrderSummaryCards summary={summary} darkMode={darkMode} />

      {/* Orders List */}
      {loading ? (
        <div className={`rounded-2xl border p-10 text-center ${borderColor} ${cardBg}`}>
          <p className={secondaryTextColor}>Loading provider orders...</p>
        </div>
      ) : error ? (
        <div className={`rounded-2xl border p-8 text-center ${borderColor} ${cardBg}`}>
          <p className={`text-lg font-semibold ${textColor}`}>Could not load provider orders</p>
          <p className={`mt-2 ${secondaryTextColor}`}>{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 rounded-lg bg-hafi-teal px-4 py-2 text-white hover:bg-hafi-green"
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${borderColor} ${cardBg}`}>
          <p className={`text-lg font-semibold ${textColor}`}>No provider orders yet</p>
          <p className={`mt-2 ${secondaryTextColor}`}>
            Orders from customers will appear here once they place them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard
              key={order.orderUuid}
              order={order}
              providerId={String(user?.id ?? '')}
              onUpdateStatus={handleUpdateStatus}
              onQuoteItem={handleQuoteItem}
              savingOrderUuid={savingOrderUuid}
              activeChatOrderUuid={activeChatOrderUuid}
              onToggleChat={handleToggleChat}
              customerChatCounts={customerChatCounts}
              onClearUnreadCount={handleClearUnreadCount}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}