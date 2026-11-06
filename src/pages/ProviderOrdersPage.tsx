import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import ChatBox from './ChatBox';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { API_BASE } from '../api/apiClient';
import {
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
  payment_received: { label: 'Payment Confirmed', tone: 'brand', nextActions: ['delivery_pending'] },
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
    info: darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    warning: darkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    brand: darkMode ? 'bg-red-500/10 text-[#E5252A] border-red-500/20' : 'bg-red-500/10 text-[#E5252A] border-red-500/20',
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
                className="text-[#E5252A] hover:underline font-bold text-[10px] inline-flex items-center gap-0.5 mt-0.5"
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
    { label: 'Total Orders', value: summary.total, icon: <Package className="w-5 h-5 text-gray-400" /> },
    { label: 'Payment Pending', value: summary.paymentPending, icon: <Clock className="w-5 h-5 text-amber-500" /> },
    { label: 'Payment Confirmed', value: summary.paymentReceived, icon: <DollarSign className="w-5 h-5 text-[#E5252A]" /> },
    { label: 'Delivery Pending', value: summary.deliveryPending, icon: <Truck className="w-5 h-5 text-blue-500" /> },
    { label: 'Completed', value: summary.delivered, icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
            darkMode ? 'border-gray-800 bg-gray-900' : 'border-[#E5E5E5] bg-white'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#666666] dark:text-gray-400">{card.label}</span>
            {card.icon}
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[#151515] dark:text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status, darkMode }: { status: OrderStatus; darkMode: boolean }) => (
  <span className={`border rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusTone(status, darkMode)}`}>
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
    primary: 'bg-[#E5252A] hover:bg-[#c91d22] text-white shadow-xs',
    secondary: 'bg-[#0A0A0A] hover:bg-black text-white dark:bg-gray-800 dark:hover:bg-gray-700 shadow-xs',
    danger: 'bg-red-700 hover:bg-red-800 text-white shadow-xs',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 active:scale-[0.98] cursor-pointer ${
        disabled ? 'cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-400' : variants[variant]
      }`}
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

  const borderColor = darkMode ? 'border-gray-800' : 'border-[#E5E5E5]';
  const inputBg = darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-[#E5E5E5] text-gray-900';

  if (!customization || customization.noCustomizationNeeded) return null;
  if (customization.quoteStatus === 'accepted') {
    return (
      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
        <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
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
      <div className={`mt-3 rounded-xl border p-3.5 ${borderColor} ${darkMode ? 'bg-gray-900/40' : 'bg-[#F5F5F5]'}`}>
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-semibold text-[#151515] dark:text-white">Active Offered Quote: RWF {Number(customization.quotedPrice).toLocaleString()}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs uppercase font-bold text-[#E5252A] hover:underline cursor-pointer"
          >
            Adjust Quote
          </button>
        </div>
        {customization.customizationRequest && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Request notes: {customization.customizationRequest}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`mt-3 rounded-xl border p-4 ${borderColor} ${darkMode ? 'bg-gray-900/40' : 'bg-[#F5F5F5]'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-1.5">Submit custom service quote</p>
      {customization.customizationRequest && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">Request: {customization.customizationRequest}</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          min="0"
          step="0.01"
          value={quoteDraft}
          onChange={(e) => setQuoteDraft(e.target.value)}
          placeholder={`Reg Price: RWF ${Number(item.price).toLocaleString()}`}
          className={`min-w-0 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] flex-grow ${inputBg}`}
        />
        <button
          onClick={handleQuote}
          disabled={saving || !quoteDraft}
          className="w-full sm:w-auto bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
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
  const cardBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]';
  const borderColor = darkMode ? 'border-gray-800' : 'border-[#E5E5E5]';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-[#666666]';

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
    <div className={`min-w-0 border rounded-2xl shadow-xs p-4 sm:p-6 ${cardBg}`}>
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-4 dark:border-gray-800">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="text-base font-bold uppercase tracking-tight text-[#151515] dark:text-white">Order #{order.orderUuid.slice(0, 12).toUpperCase()}</h2>
            <StatusBadge status={order.status} darkMode={darkMode} />
          </div>
          <p className="text-sm font-semibold text-[#151515] dark:text-white">{order.customerName}</p>
          {order.customerEmail && (
            <p className={`text-xs ${secondaryTextColor} mt-0.5`}>{order.customerEmail}</p>
          )}

          <div className="mt-3 w-full max-w-xs">
            <button
              onClick={handleChatToggle}
              className="w-full py-2.5 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with client {unreadCount > 0 ? `(${unreadCount} New)` : ''}</span>
            </button>
          </div>

          <div className={`mt-3 text-[10px] font-bold uppercase tracking-wide space-y-1 ${secondaryTextColor}`}>
            <div className="flex items-start gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="break-words">Placed: {new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.customerPaymentDoneAt && <p className="text-amber-500 font-semibold">Payment notified: {new Date(order.customerPaymentDoneAt).toLocaleString()}</p>}
            {order.customerAcknowledgedAt && <p className="text-emerald-500 font-semibold">Delivery acknowledged: {new Date(order.customerAcknowledgedAt).toLocaleString()}</p>}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className={`text-xs ${secondaryTextColor} uppercase tracking-wider font-bold`}>Quote Sum</div>
          <div className="text-2xl font-extrabold text-[#E5252A]">RWF {Number(order.total).toLocaleString()}</div>
          <div className={`text-[10px] ${secondaryTextColor} uppercase tracking-wider font-bold mt-0.5`}>Subtotal: RWF {Number(order.subtotal).toLocaleString()}</div>
        </div>
      </div>

      {/* Grid contents */}
      <div className={`mt-4 min-w-0 grid gap-6 ${isChatOpen ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,680px)]' : 'lg:grid-cols-[minmax(0,1fr)_320px]'}`}>
        
        {/* Column 1 - Items */}
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl text-[11px] leading-relaxed border border-red-500/15 bg-red-500/5 text-[#666666] dark:text-gray-400">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#E5252A] mb-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Transport & Delivery</span>
            </div>
            Negotiate delivery coordinates and transport terms directly with the customer.
          </div>

          <div className={`border rounded-xl divide-y overflow-hidden ${borderColor}`}>
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white dark:bg-gray-900">
                <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl border dark:border-gray-800 object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase tracking-tight text-[#151515] dark:text-white truncate">{item.name}</p>
                      {item.description && (
                        <p className={`text-xs ${secondaryTextColor} mt-0.5`}>{item.description}</p>
                      )}
                      <p className={`text-xs ${secondaryTextColor} mt-1`}>
                        Qty: <strong className="text-[#151515] dark:text-white font-bold">{item.quantity}</strong> {item.size && ` · Size: ${item.size}`}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-[#151515] dark:text-white shrink-0">
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
          <div className={`min-w-0 border rounded-2xl overflow-hidden p-2 ${borderColor} ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
        {!isChatOpen && <div className="space-y-4">
          <div className={`border rounded-2xl p-4 ${borderColor} ${darkMode ? 'bg-gray-900/40' : 'bg-[#F5F5F5]'}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Receipt Summary</div>
            <div className="text-2xl font-extrabold text-[#E5252A]">RWF {Number(order.total).toLocaleString()}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Subtotal: RWF {Number(order.subtotal).toLocaleString()}</div>
          </div>

          <div className={`border rounded-2xl p-4 ${borderColor} ${darkMode ? 'bg-gray-900/40' : 'bg-[#F5F5F5]'}`}>
            <div className="space-y-3">
              {renderActionButtons()}
            </div>
            
            <div className={`mt-4 p-3 rounded-xl border text-[11px] leading-relaxed ${borderColor} ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600'}`}>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#E5252A] mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>Next Action Notes</span>
              </div>
              {getStatusMessage()}
            </div>
          </div>

          {/* Client Information Card */}
          <div className={`border rounded-2xl p-4 text-xs space-y-2 ${borderColor} ${darkMode ? 'bg-gray-900/40 text-gray-300' : 'bg-white text-gray-800'}`}>
            <div className="font-bold text-[10px] uppercase tracking-widest text-[#E5252A] border-b pb-2 dark:border-gray-800">Client Information</div>
            <div className="space-y-2 mt-2">
              <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:items-center">
                <span className={secondaryTextColor}>Name:</span>
                <span className="max-w-full break-words font-bold text-[#151515] dark:text-white sm:text-right">{order.customerName}</span>
              </div>
              <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:items-center">
                <span className={secondaryTextColor}>Phone:</span>
                {customer?.phone_number ? (
                  <a href={`tel:${customer.phone_number}`} className="font-semibold text-[#E5252A] hover:underline">
                    {customer.phone_number}
                  </a>
                ) : (
                  <span className="font-semibold text-gray-400">Not Available</span>
                )}
              </div>
              <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:items-center">
                <span className={secondaryTextColor}>WhatsApp:</span>
                {customer?.whatsapp_number ? (
                  <button
                    type="button"
                    onClick={() => {
                      const phone = customer.whatsapp_number.replace(/\D/g, '');
                      if (phone) window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="font-semibold text-[#E5252A] hover:underline cursor-pointer"
                  >
                    {customer.whatsapp_number}
                  </button>
                ) : (
                  <span className="font-semibold text-gray-400">Not Available</span>
                )}
              </div>
              <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:items-center">
                <span className={secondaryTextColor}>Email:</span>
                <span className="max-w-full break-all font-semibold select-all text-xs sm:text-right">{order.customerEmail || customer?.email || 'Not Available'}</span>
              </div>
              <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:items-start">
                <span className={secondaryTextColor}>Address:</span>
                <div className="max-w-full break-words sm:max-w-[180px] sm:text-right">
                  {formatAddress(customer?.address || customer?.location)}
                </div>
              </div>
            </div>
          </div>
        </div>}

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

  const bgColor = darkMode ? 'bg-gray-950 text-gray-100' : 'bg-[#F5F5F5] text-[#151515]';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-[#666666]';

  return (
    <div className={`min-h-screen py-5 px-0 sm:py-8 sm:px-6 lg:px-8 ${bgColor}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          badge="Operations"
          title="Client Orders"
          subtitle="Manage incoming service bookings, product orders, custom quotes, and payment statuses"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Client Orders' }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                to="/dashboard"
                className={`inline-flex items-center justify-center border text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-2.5 transition-colors ${
                  darkMode 
                    ? 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'bg-white border-[#E5E5E5] text-[#151515] hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Dashboard
              </Link>
              <button
                onClick={fetchOrders}
                className={`inline-flex items-center justify-center border text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-2.5 transition-colors cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'bg-white border-[#E5E5E5] text-[#151515] hover:bg-gray-50'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh
              </button>
            </div>
          }
        />

        {/* Summary Cards */}
        <OrderSummaryCards summary={summary} darkMode={darkMode} />

        {/* Orders List */}
        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="lg" message="Loading received orders..." variant="dots" />
          </div>
        ) : error ? (
          <div className={`border rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'}`}>
            <AlertCircle className="w-10 h-10 text-[#E5252A] mx-auto mb-3" />
            <p className="font-bold uppercase tracking-wider text-sm text-[#E5252A]">Could not load provider orders</p>
            <p className={`text-xs mt-1 ${secondaryTextColor}`}>{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className={`border rounded-2xl p-12 text-center flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'}`}>
            <Package className="w-12 h-12 text-gray-400 mb-3 opacity-30" />
            <p className="font-bold uppercase tracking-wider text-sm text-[#151515] dark:text-white">No orders yet</p>
            <p className={`text-xs mt-1 ${secondaryTextColor}`}>
              Customer order requests will populate here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs Filter */}
            <div className="flex flex-wrap gap-2 border-b border-[#E5E5E5] dark:border-gray-800 pb-4">
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
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 border flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#E5252A] border-[#E5252A] text-white shadow-xs'
                      : darkMode
                        ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'bg-white border-[#E5E5E5] text-[#666666] hover:text-[#151515] hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === tab.id
                      ? 'bg-black/20 text-white'
                      : darkMode
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-gray-100 text-[#666666]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'}`}>
                <Package className="w-12 h-12 text-gray-400 mb-3 opacity-30" />
                <p className="font-bold uppercase tracking-wider text-sm text-[#151515] dark:text-white">No orders found</p>
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
    </div>
  );
}
