import { useDarkMode } from '@/context/DarkMode';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Link, useSearchParams } from 'react-router-dom';
import ChatBox from './ChatBox';
import { loadOrders, type OrderRecord } from '../utils/orderStorage';
import { 
  FileText, 
  MessageSquare, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Info, 
  Phone, 
  ArrowLeft, 
  CreditCard,
  Package,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const getMethodDisplayName = (method: string) => {
  switch (method) {
    case 'mtn':
      return 'MTN Mobile Money';
    case 'airtel':
      return 'Airtel Money';
    case 'momoPay':
      return 'Mobile Money (Merchant Code)';
    default:
      return method;
  }
};

const formatAddress = (addressStr?: string | null) => {
  if (!addressStr) return 'Not Available';
  const trimmed = addressStr.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const { lat, lng, name, address } = parsed;
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
      }
    } catch {
      // fallback
    }
  }
  return <span className="font-semibold">{addressStr}</span>;
};

type ProviderContact = {
  id: number | string;
  name?: string;
  phone_number?: string | null;
  whatsapp_number?: string | null;
};

const OrdersPage = () => {
  const { darkMode } = useDarkMode();
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [providerMethods, setProviderMethods] = useState<Record<string, any>>({});
  const [providerContacts, setProviderContacts] = useState<Record<string, ProviderContact>>({});
  const [activeChatOrderUuid, setActiveChatOrderUuid] = useState<string | null>(null);
  const [orderMessageCounts, setOrderMessageCounts] = useState<Record<string, number>>({});
  const [orderLastSeenAt, setOrderLastSeenAt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingOrderUuid, setDeletingOrderUuid] = useState<string | null>(null);
  const customerId = user?.id ?? '';
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'quoted' | 'payment_sent' | 'processing' | 'completed'>('all');

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(order => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unpaid') return ['placed', 'order_received', 'quote_accepted'].includes(order.status);
      if (activeTab === 'quoted') return order.status === 'quoted';
      if (activeTab === 'payment_sent') return order.status === 'payment_done';
      if (activeTab === 'processing') return ['payment_received', 'delivery_pending'].includes(order.status);
      if (activeTab === 'completed') return order.status === 'delivered';
      return true;
    });
  }, [sortedOrders, activeTab]);

  const placedOrderId = searchParams.get('placed');

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await loadOrders(token);
        if (mounted) setOrders(data);
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load orders');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;
    const ids = Array.from(new Set(orders.map(order => String(order.providerId)).filter(Boolean)));
    if (!ids.length) return;

    const fetchFor = async (id: string) => {
      try {
        const [methodsRes, providerRes] = await Promise.all([
          fetch(`${API_BASE}/api/providers/${id}/network_types`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/providers/${id}`),
        ]);

        if (methodsRes.ok) {
          const data = await methodsRes.json();
          if (mounted) {
            setProviderMethods(prev => ({ ...(prev || {}), [id]: data.methods || {} }));
          }
        }

        if (providerRes.ok) {
          const provider = await providerRes.json();
          if (mounted) {
            setProviderContacts(prev => ({ ...(prev || {}), [id]: provider }));
          }
        }
      } catch {
        // ignore per-provider errors
      }
    };

    ids.forEach(id => {
      if (!providerMethods[id] || !providerContacts[id]) {
        fetchFor(id);
      }
    });

    return () => {
      mounted = false;
    };
  }, [orders, token, providerMethods, providerContacts]);

  useEffect(() => {
    if (!customerId || orders.length === 0) return;
    let mounted = true;

    const fetchOrderCounts = async () => {
      const updates: Record<string, number> = {};

      await Promise.all(orders.map(async order => {
        const providerId = order.providerId ? String(order.providerId) : '';
        if (!providerId) return;

        try {
          const response = await fetch(`${API_BASE}/api/messages?providerId=${providerId}&customerId=${customerId}`);
          if (!response.ok) return;
          const data = await response.json();

          const lastSeen = orderLastSeenAt[order.orderUuid];
          const count = Array.isArray(data)
            ? data.filter((msg: any) => msg.sender === 'provider' && (!lastSeen || new Date(msg.timestamp) > new Date(lastSeen))).length
            : 0;

          updates[order.orderUuid] = activeChatOrderUuid === order.orderUuid ? 0 : count;
        } catch {
          // ignore fetch failures
        }
      }));

      if (mounted) {
        setOrderMessageCounts(prev => ({ ...prev, ...updates }));
      }
    };

    fetchOrderCounts();
    const interval = setInterval(fetchOrderCounts, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [customerId, orders, orderLastSeenAt, activeChatOrderUuid]);

  const placedOrder = useMemo(
    () => orders.find(order => order.orderUuid === placedOrderId),
    [orders, placedOrderId]
  );

  const openChatForOrder = (order: OrderRecord) => {
    setActiveChatOrderUuid(order.orderUuid);
    setOrderMessageCounts(prev => ({ ...prev, [order.orderUuid]: 0 }));
    setOrderLastSeenAt(prev => ({ ...prev, [order.orderUuid]: new Date().toISOString() }));
  };

  const bgColor = darkMode ? 'bg-gray-955 text-gray-100' : 'bg-gray-50 text-gray-900';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-250';
  const cardBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  const openWhatsApp = (rawNumber?: string | null) => {
    if (!rawNumber) return;
    const phone = rawNumber.replace(/\D/g, '');
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  };

  const confirmReceipt = async (orderUuid: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderUuid}/received`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to confirm receipt');
      }

      const data = await response.json();
      setOrders(prev => prev.map(order => (order.orderUuid === orderUuid ? {
        ...order,
        status: data.order?.status || 'received',
        customerAcknowledgedAt: data.order?.customer_acknowledged_at || new Date().toISOString(),
        updatedAt: data.order?.updated_at || new Date().toISOString(),
      } : order)));
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Failed to confirm receipt');
    }
  };

  const acceptQuote = async (orderUuid: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderUuid}/accept-quote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to accept quote');
      }

      const data = await response.json();
      setOrders(prev => prev.map(order => (order.orderUuid === orderUuid ? {
        ...order,
        status: data.order?.status || 'quote_accepted',
        updatedAt: data.order?.updated_at || new Date().toISOString(),
      } : order)));
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept quote');
    }
  };

  const markPaymentDone = async (orderUuid: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderUuid}/payment-done`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to mark payment as done');
      }

      const data = await response.json();
      setOrders(prev => prev.map(order => (order.orderUuid === orderUuid ? {
        ...order,
        customerPaymentDoneAt: data.order?.customer_payment_done_at || new Date().toISOString(),
        updatedAt: data.order?.updated_at || new Date().toISOString(),
      } : order)));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Failed to mark payment as done');
    }
  };

  const deleteOrder = async (orderUuid: string) => {
    if (!token) return;
    try {
      setError('');
      setDeletingOrderUuid(orderUuid);
      const response = await fetch(`${API_BASE}/api/orders/${orderUuid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete order');
      }

      setOrders(prev => prev.filter(order => order.orderUuid !== orderUuid));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete order');
    } finally {
      setDeletingOrderUuid(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'placed':
        return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Awaiting Payment' };
      case 'order_received':
        return { color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', label: 'Order Received' };
      case 'quoted':
        return { color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', label: 'Quoted Price' };
      case 'quote_accepted':
        return { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Quote Accepted' };
      case 'payment_done':
        return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Payment Sent' };
      case 'payment_received':
        return { color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'Payment Confirmed' };
      case 'delivery_pending':
        return { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Delivery Pending' };
      case 'delivered':
        return { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Delivered' };
      default:
        return { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: status };
    }
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto min-h-screen ${bgColor}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            <span>My Orders</span>
          </h1>
          <p className={`text-xs uppercase tracking-wider font-semibold ${secondaryTextColor} mt-1`}>
            Track and manage your requested products and services
          </p>
        </div>
        <Link
          to="/cart"
          className={`inline-flex items-center justify-center border text-xs font-bold uppercase tracking-wider px-4 py-2 transition-all hover:scale-102
            ${darkMode 
              ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850' 
              : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
          style={{ borderRadius: '2px' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Link>
      </div>

      {/* Success Message Banner */}
      {placedOrder && (
        <div className="mb-6 border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm font-semibold text-emerald-500 flex items-center gap-2" style={{ borderRadius: '2px' }}>
          <CheckCircle className="w-5 h-5" />
          <span>Order #{placedOrder.orderUuid.slice(0, 8)} has been placed successfully.</span>
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" message="Loading your orders..." variant="dots" />
        </div>
      ) : error ? (
        <div className={`border p-8 text-center ${cardBg}`} style={{ borderRadius: '2px' }}>
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-bold uppercase tracking-wider text-sm text-red-500">Unable to load orders</p>
          <p className={`text-xs mt-1 ${secondaryTextColor}`}>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={`border p-12 text-center flex flex-col items-center justify-center ${cardBg}`} style={{ borderRadius: '2px' }}>
          <Package className="w-12 h-12 text-gray-500 mb-3 opacity-30" />
          <p className="font-bold uppercase tracking-wider text-sm text-gray-500">No orders yet</p>
          <p className={`text-xs mt-1 ${secondaryTextColor} mb-4`}>
            Orders or requests you place from your cart will appear here.
          </p>
          <Link
            to="/cart"
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition-colors"
            style={{ borderRadius: '2px' }}
          >
            Browse Cart
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2 border-b dark:border-gray-800 pb-4">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'unpaid', label: 'Awaiting Payment', count: orders.filter(o => ['placed', 'order_received', 'quote_accepted'].includes(o.status)).length },
              { id: 'quoted', label: 'Quoted Price', count: orders.filter(o => o.status === 'quoted').length },
              { id: 'payment_sent', label: 'Payment Sent', count: orders.filter(o => o.status === 'payment_done').length },
              { id: 'processing', label: 'Processing', count: orders.filter(o => ['payment_received', 'delivery_pending'].includes(o.status)).length },
              { id: 'completed', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
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
            <div className={`border p-12 text-center flex flex-col items-center justify-center ${cardBg}`} style={{ borderRadius: '2px' }}>
              <Package className="w-12 h-12 text-gray-500 mb-3 opacity-30" />
              <p className="font-bold uppercase tracking-wider text-sm text-gray-500">No orders found</p>
              <p className={`text-xs mt-1 ${secondaryTextColor}`}>
                There are no orders matching this filter tab.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map(order => {
                const providerId = order.providerId ? String(order.providerId) : '';
            const provider = providerId ? providerContacts[providerId] : undefined;
            const methods = providerId ? providerMethods[providerId] : undefined;
            const hasMethods = !!methods && Object.keys(methods).length > 0;
            const statusConfig = getStatusConfig(order.status);
            
            const serviceItems = order.items.filter(item => item.type === 'service');
            const needsServiceQuote = serviceItems.some(item => item.serviceCustomization && !item.serviceCustomization.noCustomizationNeeded && item.serviceCustomization.quotedPrice == null);
            const hasQuotedServicePrice = serviceItems.some(item => item.serviceCustomization?.quotedPrice != null);
            
            const originalTotal = order.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
            const quotedTotal = order.items.reduce((sum, item) => {
              const unitPrice = item.type === 'service' && item.serviceCustomization?.quotedPrice != null
                ? Number(item.serviceCustomization.quotedPrice)
                : Number(item.price);
              return sum + (unitPrice * Number(item.quantity));
            }, 0);
            
            const canShowPaymentButton = (order.status === 'order_received' && !needsServiceQuote) || order.status === 'quote_accepted';
            const canShowConfirmDeliveryButton = ['payment_done', 'payment_received', 'delivery_pending'].includes(order.status);
            const showCancelButton = order.status === 'placed';
            const chatOpen = activeChatOrderUuid === order.orderUuid;

            return (
              <div key={order.orderUuid} className={`border shadow-sm transition-all duration-300 hover:shadow-md ${cardBg}`} style={{ borderRadius: '2px' }}>
                
                {/* Header */}
                <div className={`flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 ${borderColor}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-mono font-bold select-all ${textColor}`}>
                        #{order.orderUuid.slice(0, 12).toUpperCase()}…
                      </span>
                      <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`} style={{ borderRadius: '2px' }}>
                        {statusConfig.label}
                      </span>
                      {order.notifyWhatsApp && (
                        <span className="inline-flex items-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderRadius: '2px' }}>
                          WhatsApp Confirmed
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-medium ${secondaryTextColor} flex items-center gap-1`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-500">
                      RWF {quotedTotal.toLocaleString()}
                    </div>
                    {hasQuotedServicePrice && (
                      <div className={`text-[11px] line-through ${secondaryTextColor}`}>
                        Original: RWF {originalTotal.toLocaleString()}
                      </div>
                    )}
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${secondaryTextColor}`}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <div className={`grid grid-cols-1 gap-6 ${chatOpen ? 'lg:grid-cols-[1fr_360px_320px]' : 'lg:grid-cols-[1fr_320px]'}`}>
                    
                    {/* Column 1: Items list */}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {order.items.map(item => (
                          <div key={`${order.orderUuid}-${item.id}-${item.size || 'default'}`} className="flex flex-col gap-2">
                            <div className="flex gap-4 items-center">
                              <img src={item.image} alt={item.name} className="h-14 w-14 border dark:border-gray-800 object-cover shrink-0" style={{ borderRadius: '2px' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold uppercase tracking-tight truncate">{item.name}</p>
                                {item.description && (
                                  <p className={`text-xs ${secondaryTextColor} line-clamp-1 mt-0.5`}>
                                    {item.description}
                                  </p>
                                )}
                                <div className={`flex items-center gap-3 text-xs mt-1 ${secondaryTextColor}`}>
                                  <span>Quantity: <strong className="text-emerald-500 font-bold">{item.quantity}</strong></span>
                                  {item.size && <span>Size: <strong className={textColor}>{item.size}</strong></span>}
                                </div>
                              </div>
                              <div className="text-sm font-semibold shrink-0">
                                RWF {(item.price * item.quantity).toLocaleString()}
                              </div>
                            </div>

                            {/* Service Details */}
                            {item.type === 'service' && item.serviceCustomization && (
                              <div className={`ml-18 p-3 text-xs border-l-2 bg-emerald-500/5 ${darkMode ? 'border-l-emerald-500 text-gray-300' : 'border-l-emerald-600 text-gray-800'}`} style={{ borderRadius: '2px' }}>
                                <div className="font-bold uppercase text-[9px] tracking-wider text-emerald-500 mb-1">Service Specifications:</div>
                                {item.serviceCustomization.noCustomizationNeeded ? (
                                  <span>No custom requirements requested.</span>
                                ) : item.serviceCustomization.customizationRequest ? (
                                  <div className="whitespace-pre-wrap">{item.serviceCustomization.customizationRequest}</div>
                                ) : null}
                                
                                <div className="mt-3 p-2 bg-gray-950/20 border border-gray-800 flex justify-between gap-4 text-[10px]" style={{ borderRadius: '2px' }}>
                                  <div>
                                    <span className="text-gray-400">Regular Quote:</span>{' '}
                                    <strong>RWF {Number(item.price).toLocaleString()}</strong>
                                  </div>
                                  {item.serviceCustomization.quotedPrice != null && (
                                    <div>
                                      <span className="text-emerald-500">Provider Offer:</span>{' '}
                                      <strong className="text-emerald-500">RWF {Number(item.serviceCustomization.quotedPrice).toLocaleString()}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Contact metadata */}
                      <div className={`rounded p-4 border text-xs space-y-1.5 ${borderColor} ${darkMode ? 'bg-gray-950/30' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
                        <div className="flex justify-between items-center">
                          <span className={secondaryTextColor}>Client Name:</span>
                          <span className="font-semibold">{order.customerName}</span>
                        </div>
                        {provider?.name && (
                          <div className="flex justify-between items-center">
                            <span className={secondaryTextColor}>Seller Name:</span>
                            <span className="font-semibold">{provider.name}</span>
                          </div>
                        )}
                        {order.updatedAt && (
                          <div className="flex justify-between items-center">
                            <span className={secondaryTextColor}>Last Updated:</span>
                            <span className="font-medium">{new Date(order.updatedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Chat dialog inline */}
                    {chatOpen && (
                      <div className={`border p-3 ${borderColor} ${darkMode ? 'bg-gray-950/20' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
                        <ChatBox
                          providerId={providerId}
                          customerId={customerId}
                          currentUserRole="customer"
                          partnerName={provider?.name}
                          onClose={() => {
                            setActiveChatOrderUuid(null);
                            setOrderLastSeenAt(prev => ({ ...prev, [order.orderUuid]: new Date().toISOString() }));
                            setOrderMessageCounts(prev => ({ ...prev, [order.orderUuid]: 0 }));
                          }}
                          inline
                        />
                      </div>
                    )}

                    {/* Column 3: Actions & Pay credentials */}
                    <div className="space-y-4">
                      {/* Payment credentials */}
                      <div className={`border overflow-hidden ${borderColor}`} style={{ borderRadius: '2px' }}>
                        <div className={`border-b px-3 py-2 bg-emerald-500/5 ${borderColor}`}>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                            Pay Account Details
                          </h4>
                        </div>
                        <div className="p-3 space-y-2">
                          {hasMethods ? (
                            Object.entries(methods as Record<string, any>)
                              .filter(([, val]) => val && Object.keys(val).length > 0)
                              .map(([method, val]) => (
                                <div key={method} className={`p-2 border text-xs ${borderColor} ${darkMode ? 'bg-gray-950/20' : 'bg-white'}`} style={{ borderRadius: '2px' }}>
                                  <div className="flex justify-between font-bold">
                                    <span className="uppercase text-[9px] tracking-wide text-emerald-500">{getMethodDisplayName(method)}</span>
                                    <span className="text-[9px] text-gray-500">{method === 'momoPay' ? 'CODE' : 'PHONE'}</span>
                                  </div>
                                  <div className="font-mono font-semibold mt-1 text-sm select-all">
                                    {method === 'momoPay' ? val?.code : val?.phone}
                                  </div>
                                  {val?.registeredName && (
                                    <div className="text-[10px] text-gray-500 mt-0.5">{val.registeredName}</div>
                                  )}
                                </div>
                              ))
                          ) : (
                            <div className={`text-center text-xs py-3 text-gray-500`}>
                              No payment accounts available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        {canShowPaymentButton && (
                          <button
                            onClick={() => markPaymentDone(order.orderUuid)}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider"
                            style={{ borderRadius: '2px' }}
                          >
                             Confirm Payment Sent
                          </button>
                        )}

                        {order.status === 'quoted' && (
                          <button
                            onClick={() => acceptQuote(order.orderUuid)}
                            className="w-full py-2.5 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold uppercase tracking-wider"
                            style={{ borderRadius: '2px' }}
                          >
                            Accept Offered Quote
                          </button>
                        )}
                        
                        {canShowConfirmDeliveryButton && (
                          <button
                            onClick={() => confirmReceipt(order.orderUuid)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider"
                            style={{ borderRadius: '2px' }}
                          >
                            Confirm Delivery Received
                          </button>
                        )}

                        {showCancelButton && (
                          <button
                            onClick={() => deleteOrder(order.orderUuid)}
                            disabled={deletingOrderUuid === order.orderUuid}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                            style={{ borderRadius: '2px' }}
                          >
                            {deletingOrderUuid === order.orderUuid ? 'Cancelling…' : 'Cancel Request'}
                          </button>
                        )}

                        {providerId && customerId && (
                          <div className="w-full">
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
                              onClick={() => openChatForOrder(order)}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black uppercase tracking-widest shadow-md chat-wave-shake hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                              style={{ borderRadius: '2px' }}
                            >
                              <MessageSquare className="w-4 h-4 animate-bounce" />
                              <span>Chat with  seller or service provider {orderMessageCounts[order.orderUuid] ? `(${orderMessageCounts[order.orderUuid]} New)` : ''}</span>
                            </button>
                          </div>
                        )}

                        {/* Informational Alerts */}
                        {['order_received', 'quoted', 'quote_accepted', 'payment_done', 'payment_received'].includes(order.status) && (
                          <div className={`p-3 border text-[11px] leading-relaxed ${borderColor} ${darkMode ? 'bg-gray-950/20 text-gray-400' : 'bg-gray-50 text-gray-600'}`} style={{ borderRadius: '2px' }}>
                            {order.status === 'order_received' && 'The provider has acknowledged this order. You may now complete the payment via coordinates above and confirm.'}
                            {order.status === 'quoted' && 'The provider has updated the request quote. Please accept the quote to proceed.'}
                            {order.status === 'quote_accepted' && 'Quote accepted. Please perform the transaction transfer.'}
                            {order.status === 'payment_done' && 'Payment marked as completed. Awaiting delivery receipt.'}
                            {order.status === 'payment_received' && 'Payment verified by seller. Awaiting transport dispatch.'}
                          </div>
                        )}

                        {order.status === 'delivered' && (
                          <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 text-[11px] text-emerald-500 font-medium" style={{ borderRadius: '2px' }}>
                            Order fully completed! Thank you for choosing HafiConnect.
                          </div>
                        )}

                        {/* Seller Information Card */}
                        <div className={`border p-4 text-xs space-y-2 ${borderColor} ${darkMode ? 'bg-gray-955 text-gray-300' : 'bg-gray-50 text-gray-850'}`} style={{ borderRadius: '2px' }}>
                          <div className="font-bold text-[10px] uppercase tracking-widest text-emerald-500 border-b pb-1.5 dark:border-gray-850">Seller Information</div>
                          <div className="space-y-1.5 mt-2">
                            <div className="flex justify-between items-center">
                              <span className={secondaryTextColor}>Name:</span>
                              <span className="font-bold text-emerald-500">{provider?.name || 'Loading...'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={secondaryTextColor}>Phone:</span>
                              {provider?.phone_number ? (
                                <a href={`tel:${provider.phone_number}`} className="font-semibold text-emerald-500 hover:underline">
                                  {provider.phone_number}
                                </a>
                              ) : (
                                <span className="font-semibold text-gray-500">Not Available</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={secondaryTextColor}>WhatsApp:</span>
                              {provider?.whatsapp_number ? (
                                <button
                                  type="button"
                                  onClick={() => openWhatsApp(provider.whatsapp_number)}
                                  className="font-semibold text-emerald-500 hover:underline"
                                >
                                  {provider.whatsapp_number}
                                </button>
                              ) : (
                                <span className="font-semibold text-gray-500">Not Available</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={secondaryTextColor}>Email:</span>
                              <span className="font-semibold select-all">{provider?.email || 'Not Available'}</span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                              <span className={secondaryTextColor}>Address:</span>
                              <div className="max-w-[180px] break-words">
                                {formatAddress(provider?.address || provider?.location)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Call / WA buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {provider?.phone_number ? (
                            <a
                              href={`tel:${provider.phone_number}`}
                              className={`flex items-center justify-center border text-xs font-bold uppercase tracking-wider py-2 transition-all
                                ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-850' : 'border-gray-250 text-gray-700 hover:bg-gray-50'}`}
                              style={{ borderRadius: '2px' }}
                            >
                              Call
                            </a>
                          ) : (
                            <div className={`p-2 border text-center text-xs text-gray-500 ${borderColor}`} style={{ borderRadius: '2px' }}>Locked</div>
                          )}

                          {provider?.whatsapp_number ? (
                            <button
                              onClick={() => openWhatsApp(provider.whatsapp_number)}
                              className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider py-2"
                              style={{ borderRadius: '2px' }}
                            >
                              <FaWhatsapp className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>
                          ) : (
                            <div className={`p-2 border text-center text-xs text-gray-500 ${borderColor}`} style={{ borderRadius: '2px' }}>Locked</div>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* Delivery footer info */}
                <div className={`px-5 py-2.5 border-t text-[10px] uppercase font-bold tracking-wider ${borderColor} ${darkMode ? 'bg-gray-950/20 text-gray-500' : 'bg-gray-50 text-gray-400'}`} style={{ borderRadius: '2px' }}>
                   Negotiate dispatch and shipping specifics directly with the seller
                </div>
              </div>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;