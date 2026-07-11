import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import ChatBox from './ChatBox';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  FileText, 
  RefreshCw, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Truck, 
  CheckCircle,
  MessageSquare,
  AlertCircle,
  Clock,
  Calendar,
  Info
} from 'lucide-react';

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
  placed: { label: 'Awaiting Payment', tone: 'default', nextActions: ['order_received'] },
  order_received: { label: 'Order Received', tone: 'info', nextActions: ['payment_received'] },
  quoted: { label: 'Quoted Price', tone: 'warning', nextActions: [] },
  quote_accepted: { label: 'Quote Accepted', tone: 'success', nextActions: ['payment_received'] },
  payment_done: { label: 'Payment Sent', tone: 'info', nextActions: ['payment_received'] },
  payment_received: { label: 'Payment Confirmed', tone: 'warning', nextActions: ['delivery_pending'] },
  delivery_pending: { label: 'Delivery Pending', tone: 'info', nextActions: ['delivered'] },
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
    default: darkMode ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    info: darkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    warning: darkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    success: darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };
  return tones[STATUS_CONFIG[status]?.tone as keyof typeof tones] || tones.default;
};

const formatAddress = (addressStr?: string | null) => {
  if (!addressStr) return 'Not Available';
  const trimmed = addressStr.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const { lat, lng, name, address, district, sector, cell, village, known_place, knownPlace } = parsed as Record<string, any>;
        if (lat != null && lng != null) {
          return (
            <div className="flex flex-col items-end gap-0.5">
              {address && <span className="font-semibold text-right">{address}</span>}
              {name && <span className="text-[10px] text-gray-500 text-right">{name}</span>}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:underline font-bold text-[10px] inline-flex items-center gap-0.5 mt-0.5"
              >
                Google Maps ({Number(lat).toFixed(5)}, {Number(lng).toFixed(5)})
              </a>
            </div>
          );
        }

        const knownPlaceValue = known_place != null ? known_place : knownPlace;
        const fieldRows = [
          { label: 'District', value: district },
          { label: 'Sector', value: sector },
          { label: 'Cell', value: cell },
          { label: 'Village', value: village },
          { label: 'Known Place', value: knownPlaceValue },
        ];

        if (fieldRows.some(field => field.value != null && String(field.value).trim() !== '')) {
          return (
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="font-semibold">Address</span>
              {fieldRows.map(field => (
                <span key={field.label} className="font-medium text-[11px] leading-snug">
                  {field.label}: {field.value != null && String(field.value).trim() !== '' ? String(field.value) : 'Not Available'}
                </span>
              ))}
            </div>
          );
        }

        if (address) {
          return <span className="font-semibold text-right">{address}</span>;
        }
      }
    } catch {
      // fallback
    }
  }
  return <span className="font-semibold">{addressStr}</span>;
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
    { label: 'Total Orders', value: summary.total, icon: <Package className="w-5 h-5 text-gray-500" /> },
    { label: 'Payment Pending', value: summary.paymentPending, icon: <Clock className="w-5 h-5 text-amber-500" /> },
    { label: 'Payment Confirmed', value: summary.paymentReceived, icon: <DollarSign className="w-5 h-5 text-emerald-500" /> },
    { label: 'Delivery Pending', value: summary.deliveryPending, icon: <Truck className="w-5 h-5 text-cyan-500" /> },
    { label: 'Completed', value: summary.delivered, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  ];


  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className={`border p-4 shadow-sm flex flex-col justify-between ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`} style={{ borderRadius: '2px', ...{ backgroundColor: darkMode ? '#111827' : '#ffffff' } }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{card.label}</span>
            {card.icon}
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-emerald-500">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status, darkMode }: { status: OrderStatus; darkMode: boolean }) => (
  <span className={`border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusTone(status, darkMode)}`} style={{ borderRadius: '2px' }}>
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
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    secondary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
        disabled ? 'cursor-not-allowed bg-gray-700 text-gray-500' : variants[variant]
      }`}
      style={{ borderRadius: '2px' }}
    >
      {children}
    </button>
  );
};

const QuoteSection = ({ 
  item, 
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
  const customization = item.serviceCustomization;

  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-250';
  const inputBg = darkMode ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-250 text-gray-900';

  if (!customization || customization.noCustomizationNeeded) return null;
  if (customization.quoteStatus === 'accepted') {
    return (
      <div className="mt-3 border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs" style={{ borderRadius: '2px' }}>
        <p className="font-semibold text-emerald-500 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Customer accepted offered quote: RWF {Number(customization.quotedPrice).toLocaleString()}
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
      <div className={`mt-3 border p-3 ${borderColor} ${darkMode ? 'bg-gray-950/20' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-semibold">Active Offered Quote: RWF {Number(customization.quotedPrice).toLocaleString()}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs uppercase font-bold text-emerald-500 hover:underline"
          >
            Adjust Quote
          </button>
        </div>
        {customization.customizationRequest && (
          <p className="text-[11px] text-gray-500 mt-1">Request notes: {customization.customizationRequest}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`mt-3 border p-4 ${borderColor} ${darkMode ? 'bg-gray-950/20' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1.5">Submit custom service quote</p>
      {customization.customizationRequest && (
        <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">Request: {customization.customizationRequest}</p>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={quoteDraft}
          onChange={(e) => setQuoteDraft(e.target.value)}
          placeholder={`Reg Price: RWF ${Number(item.price).toLocaleString()}`}
          className={`px-3 py-2 text-xs border focus:outline-none flex-grow ${inputBg}`}
          style={{ borderRadius: '2px' }}
        />
        <button
          onClick={handleQuote}
          disabled={saving || !quoteDraft}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 disabled:opacity-50"
          style={{ borderRadius: '2px' }}
        >
          {customization.quotedPrice ? 'Adjust Quote' : 'Send Quote'}
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
  customer,
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
  customer?: any;
  darkMode: boolean;
}) => {
  const cardBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-250';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-gray-650';

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
    const actionMap: Partial<Record<OrderStatus, { label: string; variant: 'primary' | 'secondary' }>> = {
      order_received: { label: 'Receive Order', variant: 'primary' },
      payment_received: { label: 'Verify Payment Cleared', variant: 'secondary' },
      delivery_pending: { label: 'Confirm Transport Completed', variant: 'primary' },
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
      placed: 'New order requested. Please acknowledge to proceed.',
      order_received: 'Order acknowledged. The customer will process the transaction transfer.',
      quoted: 'Pending customer review of the newly updated service price.',
      quote_accepted: 'Quote accepted. Customer was notified to complete the payment.',
      payment_done: 'Customer marked transaction completed. Verify your account and confirm.',
      payment_received: 'Payment confirmed. Please dispatch delivery and mark transport complete.',
      delivery_pending: 'Transport dispatched. Waiting for client to confirm delivery receipt.',
      delivered: 'Order fully closed and delivered successfully.',
    };
    return messages[order.status] || 'Processing...';
  };

  return (
    <div className={`border shadow-sm p-6 ${cardBg}`} style={{ borderRadius: '2px' }}>
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-4 dark:border-gray-800">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="text-base font-bold uppercase tracking-tight">Order #{order.orderUuid.slice(0, 12).toUpperCase()}</h2>
            <StatusBadge status={order.status} darkMode={darkMode} />
          </div>
          <p className="text-sm font-semibold">{order.customerName}</p>
          {order.customerEmail && (
            <p className={`text-xs ${secondaryTextColor} mt-0.5`}>{order.customerEmail}</p>
          )}

          <div className="mt-3 w-full max-w-xs">
            <style>{`
              @keyframes chat-shake {
                0%, 100% { transform: scale(1); }
                10%, 30%, 50%, 70%, 90% { transform: scale(1.02) rotate(-0.5deg); }
                20%, 40%, 60%, 80% { transform: scale(1.02) rotate(0.5deg); }
              }
              @keyframes chat-pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
                70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
              }
              .chat-wave-shake {
                animation: chat-shake 4s infinite ease-in-out, chat-pulse 2s infinite;
              }
            `}</style>
            <button
              onClick={handleChatToggle}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black uppercase tracking-widest shadow-md chat-wave-shake hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              style={{ borderRadius: '2px' }}
            >
              <MessageSquare className="w-4 h-4 animate-bounce" />
              <span>Chat with client {unreadCount > 0 ? `(${unreadCount} New)` : ''}</span>
            </button>
          </div>

          <div className={`mt-3 text-[10px] font-bold uppercase tracking-wide space-y-1 ${secondaryTextColor}`}>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.customerPaymentDoneAt && <p className="text-amber-500">Payment notified: {new Date(order.customerPaymentDoneAt).toLocaleString()}</p>}
            {order.customerAcknowledgedAt && <p className="text-emerald-500">Delivery acknowledged: {new Date(order.customerAcknowledgedAt).toLocaleString()}</p>}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className={`text-xs ${secondaryTextColor} uppercase tracking-wider font-bold`}>Quote Sum</div>
          <div className="text-xl font-bold text-emerald-500">RWF {Number(order.total).toLocaleString()}</div>
          <div className={`text-[10px] ${secondaryTextColor} uppercase tracking-wider font-bold mt-0.5`}>Subtotal: RWF {Number(order.subtotal).toLocaleString()}</div>
        </div>
      </div>

      {/* Grid contents */}
      <div className={`mt-4 grid gap-6 ${isChatOpen ? 'lg:grid-cols-[1fr_360px_320px]' : 'lg:grid-cols-[1fr_320px]'}`}>
        
        {/* Column 1 - Items */}
        <div className="space-y-4">
          <div className={`p-3 text-[11px] leading-relaxed border border-emerald-500/15 bg-emerald-500/5 text-gray-500`} style={{ borderRadius: '2px' }}>
            <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-emerald-500 mb-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Transport & Delivery</span>
            </div>
            Negotiate delivery coordinates and transport terms directly with the customer.
          </div>

          <div className={`border divide-y ${borderColor}`} style={{ borderRadius: '2px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 flex gap-4">
                <img src={item.image} alt={item.name} className="h-14 w-14 border dark:border-gray-800 object-cover shrink-0" style={{ borderRadius: '2px' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight truncate">{item.name}</p>
                      {item.description && (
                        <p className={`text-xs ${secondaryTextColor} mt-0.5`}>{item.description}</p>
                      )}
                      <p className={`text-xs ${secondaryTextColor} mt-1`}>
                        Qty: <strong className="text-emerald-500 font-bold">{item.quantity}</strong> {item.size && ` · Size: ${item.size}`}
                      </p>
                    </div>
                    <div className="text-sm font-semibold shrink-0">
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
            ))}
          </div>
        </div>

        {/* Column 2 - Chat Box */}
        {isChatOpen && (
          <div className={`border p-3 ${borderColor} ${darkMode ? 'bg-gray-955' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
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

        {/* Column 3 - Actions */}
        <div className="space-y-4">
          <div className={`border p-4 ${borderColor} ${darkMode ? 'bg-gray-950/20' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Receipt Summary</div>
            <div className="text-xl font-bold text-emerald-500">RWF {Number(order.total).toLocaleString()}</div>
            <div className={`text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5`}>Subtotal: RWF {Number(order.subtotal).toLocaleString()}</div>
          </div>

          <div className={`border p-4 ${borderColor} ${darkMode ? 'bg-gray-950/20' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
            <div className="space-y-3">
              {renderActionButtons()}
            </div>
            
            <div className={`mt-4 p-3 border text-[11px] leading-relaxed ${borderColor} ${darkMode ? 'bg-gray-955 text-gray-400' : 'bg-gray-50 text-gray-650'}`} style={{ borderRadius: '2px' }}>
              <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-emerald-500 mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>Next Action Notes</span>
              </div>
              {getStatusMessage()}
            </div>
          </div>

          {/* Client Information Card */}
          <div className={`border p-4 text-xs space-y-2 ${borderColor} ${darkMode ? 'bg-gray-955 text-gray-300' : 'bg-gray-50 text-gray-800'}`} style={{ borderRadius: '2px' }}>
            <div className="font-bold text-[10px] uppercase tracking-widest text-emerald-500 border-b pb-1.5 dark:border-gray-800">Client Information</div>
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between items-center">
                <span className={secondaryTextColor}>Name:</span>
                <span className="font-bold text-emerald-500">{order.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={secondaryTextColor}>Phone:</span>
                {customer?.phone_number ? (
                  <a href={`tel:${customer.phone_number}`} className="font-semibold text-emerald-500 hover:underline">
                    {customer.phone_number}
                  </a>
                ) : (
                  <span className="font-semibold text-gray-500">Not Available</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className={secondaryTextColor}>WhatsApp:</span>
                {customer?.whatsapp_number ? (
                  <button
                    type="button"
                    onClick={() => {
                      const phone = customer.whatsapp_number.replace(/\D/g, '');
                      if (phone) window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="font-semibold text-emerald-500 hover:underline"
                  >
                    {customer.whatsapp_number}
                  </button>
                ) : (
                  <span className="font-semibold text-gray-500">Not Available</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className={secondaryTextColor}>Email:</span>
                <span className="font-semibold select-all">{order.customerEmail || customer?.email || 'Not Available'}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className={secondaryTextColor}>Address:</span>
                <div className="max-w-[180px] break-words">
                  {formatAddress(customer?.address || customer?.location)}
                </div>
              </div>
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
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'unpaid' | 'payment_sent' | 'processing' | 'completed'>('all');
  const [customerContacts, setCustomerContacts] = useState<Record<string, any>>({});

  useEffect(() => {
    let mounted = true;
    const ids = Array.from(new Set(orders.map(order => String(order.customerId)).filter(Boolean)));
    if (!ids.length) return;

    const fetchFor = async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/providers/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setCustomerContacts(prev => ({ ...prev, [id]: data }));
          }
        }
      } catch {
        // ignore errors
      }
    };

    ids.forEach(id => {
      if (!customerContacts[id]) {
        fetchFor(id);
      }
    });

    return () => {
      mounted = false;
    };
  }, [orders, customerContacts]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(order => {
      if (activeTab === 'all') return true;
      if (activeTab === 'new') return order.status === 'placed';
      if (activeTab === 'unpaid') return ['order_received', 'quoted', 'quote_accepted'].includes(order.status);
      if (activeTab === 'payment_sent') return order.status === 'payment_done';
      if (activeTab === 'processing') return ['payment_received', 'delivery_pending'].includes(order.status);
      if (activeTab === 'completed') return order.status === 'delivered';
      return true;
    });
  }, [sortedOrders, activeTab]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

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

  const bgColor = darkMode ? 'bg-gray-955 text-gray-100' : 'bg-gray-50 text-gray-900';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-gray-650';

  return (
    <div className={`p-6 max-w-7xl mx-auto min-h-screen ${bgColor}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            <span>Provider Dashboard Orders</span>
          </h1>
          <p className={`text-xs uppercase tracking-wider font-semibold ${secondaryTextColor} mt-1`}>
            Manage incoming client orders, review service quotes, and confirm transactions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard"
            className={`inline-flex items-center justify-center border text-xs font-bold uppercase tracking-wider px-4 py-2 transition-all hover:scale-102
              ${darkMode 
                ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850' 
                : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
            style={{ borderRadius: '2px' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <button
            onClick={fetchOrders}
            className={`inline-flex items-center justify-center border text-xs font-bold uppercase tracking-wider px-4 py-2 transition-all hover:scale-102
              ${darkMode 
                ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850' 
                : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
            style={{ borderRadius: '2px' }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <OrderSummaryCards summary={summary} darkMode={darkMode} />

      {/* Orders List */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" message="Loading received orders..." variant="dots" />
        </div>
      ) : error ? (
        <div className={`border p-8 text-center bg-gray-900/10`} style={{ borderRadius: '2px' }}>
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-bold uppercase tracking-wider text-sm text-red-500">Could not load provider orders</p>
          <p className={`text-xs mt-1 ${secondaryTextColor}`}>{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2"
            style={{ borderRadius: '2px' }}
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className={`border p-12 text-center flex flex-col items-center justify-center`} style={{ borderRadius: '2px' }}>
          <Package className="w-12 h-12 text-gray-500 mb-3 opacity-30" />
          <p className="font-bold uppercase tracking-wider text-sm text-gray-500">No orders yet</p>
          <p className={`text-xs mt-1 ${secondaryTextColor}`}>
            Customer order requests will populate here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2 border-b dark:border-gray-800 pb-4">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'new', label: 'New Orders', count: orders.filter(o => o.status === 'placed').length },
              { id: 'unpaid', label: 'Awaiting Payment', count: orders.filter(o => ['order_received', 'quoted', 'quote_accepted'].includes(o.status)).length },
              { id: 'payment_sent', label: 'Payment Sent', count: orders.filter(o => o.status === 'payment_done').length },
              { id: 'processing', label: 'Processing', count: orders.filter(o => ['payment_received', 'delivery_pending'].includes(o.status)).length },
              { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'delivered').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : darkMode
                      ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-850'
                      : 'bg-white border-gray-250 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                style={{ borderRadius: '2px' }}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold
                  ${activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : darkMode
                      ? 'bg-gray-850 text-gray-500'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className={`border p-12 text-center flex flex-col items-center justify-center`} style={{ borderRadius: '2px' }}>
              <Package className="w-12 h-12 text-gray-500 mb-3 opacity-30" />
              <p className="font-bold uppercase tracking-wider text-sm text-gray-500">No orders found</p>
              <p className={`text-xs mt-1 ${secondaryTextColor}`}>
                There are no orders matching this filter tab.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map(order => (
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
              customer={customerContacts[String(order.customerId)]}
              darkMode={darkMode}
            />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}