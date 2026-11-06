import { useDarkMode } from '@/context/DarkMode';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
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
import { API_BASE } from '../api/apiClient';


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
              {name && <span className="text-xs text-black/60 dark:text-white/60 text-right">{name}</span>}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline font-bold text-xs inline-flex items-center gap-0.5 mt-0.5"
              >
                Google Maps ({Number(lat).toFixed(5)}, {Number(lng).toFixed(5)})
              </a>
            </div>
          );
        }

        const locationParts = [
          parsed.district,
          parsed.sector,
          parsed.cell,
          parsed.village,
          parsed.known_place,
        ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

        if (locationParts.length > 0) {
          return <span className="font-semibold">{locationParts.join(', ')}</span>;
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

  const bgColor = darkMode ? 'bg-black text-white' : 'bg-white text-black';
  const textColor = darkMode ? 'text-white' : 'text-black';
  const secondaryTextColor = darkMode ? 'text-white/70' : 'text-black/70';
  const borderColor = darkMode ? 'border-white/30' : 'border-black';
  const cardBg = darkMode ? 'bg-black border-white/30' : 'bg-white border-black';

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
        return { color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800', label: 'Awaiting Payment' };
      case 'order_received':
        return { color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', label: 'Order Received' };
      case 'quoted':
        return { color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800', label: 'Quoted Price' };
      case 'quote_accepted':
        return { color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800', label: 'Quote Accepted' };
      case 'payment_done':
        return { color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800', label: 'Payment Sent' };
      case 'payment_received':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', label: 'Payment Confirmed' };
      case 'delivery_pending':
        return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800', label: 'Delivery Pending' };
      case 'delivered':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', label: 'Delivered' };
      default:
        return { color: darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  };

  return (
    <div className={`p-4 sm:p-6 max-w-7xl mx-auto min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Editorial Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Orders' },
        ]}
        title="My Orders & Requests"
        subtitle="Track and manage your order statuses, custom quotes, payments, and provider communications."
        badge={`${orders.length} total orders`}
        actions={
          <Link
            to="/cart"
            className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#151515] dark:text-white hover:border-[#E5252A] shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Back to Cart
          </Link>
        }
      />

      {/* Success Message Banner */}
      {placedOrder && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center gap-2 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300 shadow-sm">
          <CheckCircle className="w-5 h-5 text-[#E5252A]" />
          <span>Order #{placedOrder.orderUuid.slice(0, 8)} has been placed successfully.</span>
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" message="Loading your orders..." variant="dots" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-8 text-center bg-white dark:bg-zinc-900 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-bold uppercase tracking-wider text-sm text-red-500">Unable to load orders</p>
          <p className="text-xs sm:text-sm mt-1 text-[#666666] dark:text-zinc-400">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900 shadow-sm">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <Package className="w-7 h-7 text-[#E5252A]" />
          </div>
          <p className="font-bold uppercase tracking-wider text-sm text-[#151515] dark:text-white">No orders yet</p>
          <p className="text-xs sm:text-sm mt-1 text-[#666666] dark:text-zinc-400 mb-4 max-w-sm">
            Orders or requests you place from your cart will appear here.
          </p>
          <Link
            to="/cart"
            className="bg-[#E5252A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Browse Cart
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2 pb-2">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'unpaid', label: 'Awaiting Payment', count: orders.filter(o => ['placed', 'order_received', 'quote_accepted'].includes(o.status)).length },
              { id: 'quoted', label: 'Quoted Price', count: orders.filter(o => o.status === 'quoted').length },
              { id: 'payment_sent', label: 'Payment Sent', count: orders.filter(o => o.status === 'payment_done').length },
              { id: 'processing', label: 'Processing', count: orders.filter(o => ['payment_received', 'delivery_pending'].includes(o.status)).length },
              { id: 'completed', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 border flex items-center gap-2 shadow-sm ${
                    isActive
                      ? 'bg-[#E5252A] border-[#E5252A] text-white'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-[#E5252A]'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#E5252A]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-black/20 text-white'
                      : darkMode
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900 shadow-sm">
              <Package className="w-12 h-12 text-[#E5252A] mb-3 opacity-60" />
              <p className="font-bold uppercase tracking-wider text-sm text-[#E5252A]">No orders found</p>
              <p className="text-xs sm:text-sm mt-1 text-[#666666] dark:text-zinc-400">
                There are no orders matching this filter tab.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
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
              <div key={order.orderUuid} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden">
                
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 px-5 py-4 bg-gray-50/50 dark:bg-zinc-950/40">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-mono font-bold select-all text-[#151515] dark:text-white">
                        #{order.orderUuid.slice(0, 12).toUpperCase()}…
                      </span>
                      <span className={`inline-flex items-center border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      {order.notifyWhatsApp && (
                        <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          WhatsApp Confirmed
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#666666] dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      RWF {quotedTotal.toLocaleString()}
                    </div>
                    {hasQuotedServicePrice && (
                      <div className={`text-xs line-through ${secondaryTextColor}`}>
                        Original: RWF {originalTotal.toLocaleString()}
                      </div>
                    )}
                    <div className={`text-xs uppercase font-bold tracking-wider ${secondaryTextColor}`}>
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
                              <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg border border-gray-200 dark:border-zinc-800 object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold uppercase tracking-tight truncate text-[#151515] dark:text-white">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-[#666666] dark:text-zinc-400 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs mt-1 text-[#666666] dark:text-zinc-400">
                                  <span>Quantity: <strong className="text-[#E5252A] font-bold">{item.quantity}</strong></span>
                                  {item.size && <span>Size: <strong className="text-[#151515] dark:text-white">{item.size}</strong></span>}
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-[#151515] dark:text-white shrink-0">
                                RWF {(item.price * item.quantity).toLocaleString()}
                              </div>
                            </div>

                            {/* Service Details */}
                            {item.type === 'service' && item.serviceCustomization && (
                              <div className="ml-14 p-3 rounded-lg text-xs border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-black dark:text-zinc-200">
                                <div className="font-bold uppercase text-[10px] tracking-wider text-[#E5252A] mb-1">Service Specifications:</div>
                                {item.serviceCustomization.noCustomizationNeeded ? (
                                  <span>No custom requirements requested.</span>
                                ) : item.serviceCustomization.customizationRequest ? (
                                  <div className="whitespace-pre-wrap">{item.serviceCustomization.customizationRequest}</div>
                                ) : null}
                                
                                <div className="mt-2.5 p-2 rounded-md bg-white/70 dark:bg-zinc-900/80 border border-red-100 dark:border-zinc-800 flex justify-between gap-4 text-xs">
                                  <div>
                                    <span className="text-gray-500">Regular Quote:</span>{' '}
                                    <strong>RWF {Number(item.price).toLocaleString()}</strong>
                                  </div>
                                  {item.serviceCustomization.quotedPrice != null && (
                                    <div>
                                      <span className="text-[#E5252A]">Provider Offer:</span>{' '}
                                      <strong className="text-[#E5252A]">RWF {Number(item.serviceCustomization.quotedPrice).toLocaleString()}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Contact metadata */}
                      <div className="rounded-xl p-4 border border-gray-200 dark:border-zinc-800 text-xs sm:text-sm space-y-1.5 bg-[#F5F5F5] dark:bg-zinc-950/40">
                        <div className="flex justify-between items-center">
                          <span className="text-[#666666] dark:text-zinc-400">Client Name:</span>
                          <span className="font-semibold text-[#151515] dark:text-white">{order.customerName}</span>
                        </div>
                        {provider?.name && (
                          <div className="flex justify-between items-center">
                            <span className="text-[#666666] dark:text-zinc-400">Seller Name:</span>
                            <span className="font-semibold text-[#151515] dark:text-white">{provider.name}</span>
                          </div>
                        )}
                        {order.updatedAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-[#666666] dark:text-zinc-400">Last Updated:</span>
                            <span className="font-medium">{new Date(order.updatedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Chat dialog inline */}
                    {chatOpen && (
                      <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-3 bg-white dark:bg-zinc-900 shadow-sm">
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
                      <div className="rounded-xl border border-red-200 dark:border-red-900/60 overflow-hidden shadow-sm bg-red-50/50 dark:bg-red-950/20">
                        <div className="border-b border-red-200 dark:border-red-900/40 px-4 py-3 bg-red-500/10">
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#E5252A]">
                            Payment Account Details
                          </h4>
                          <p className="mt-0.5 text-xs text-[#666666] dark:text-zinc-400">
                            Use one of the accounts below to complete your payment.
                          </p>
                        </div>
                        <div className="p-3 space-y-2.5">
                          {hasMethods ? (
                            Object.entries(methods as Record<string, any>)
                              .filter(([, val]) => val && Object.keys(val).length > 0)
                              .map(([method, val]) => (
                                <div key={method} className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                  <div className="flex items-center justify-between gap-2 font-bold">
                                    <span className="uppercase text-xs font-black tracking-wide text-[#E5252A]">{getMethodDisplayName(method)}</span>
                                    <span className="shrink-0 rounded-full bg-red-50 dark:bg-red-950 px-2 py-0.5 text-[10px] font-black text-[#E5252A]">{method === 'momoPay' ? 'CODE' : 'PHONE'}</span>
                                  </div>
                                  <div className="mt-1.5 break-all font-mono text-lg font-black tracking-wide text-[#151515] select-all dark:text-white">
                                    {method === 'momoPay' ? val?.code : val?.phone}
                                  </div>
                                  {val?.registeredName && (
                                    <div className="mt-1 text-xs text-[#666666] dark:text-zinc-400">{val.registeredName}</div>
                                  )}
                                </div>
                              ))
                          ) : (
                            <div className="text-center text-xs py-3 text-[#666666] dark:text-zinc-400">
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
                            className="w-full py-2.5 rounded-lg bg-[#E5252A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                             Confirm Payment Sent
                          </button>
                        )}

                        {order.status === 'quoted' && (
                          <button
                            onClick={() => acceptQuote(order.orderUuid)}
                            className="w-full py-2.5 rounded-lg bg-black hover:bg-[#E5252A] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Accept Offered Quote
                          </button>
                        )}
                        
                        {canShowConfirmDeliveryButton && (
                          <button
                            onClick={() => confirmReceipt(order.orderUuid)}
                            className="w-full py-2.5 rounded-lg bg-[#E5252A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Confirm Delivery Received
                          </button>
                        )}

                        {showCancelButton && (
                          <button
                            onClick={() => deleteOrder(order.orderUuid)}
                            disabled={deletingOrderUuid === order.orderUuid}
                            className="w-full py-2.5 rounded-lg border border-red-300 dark:border-red-900/60 text-[#E5252A] hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            {deletingOrderUuid === order.orderUuid ? 'Cancelling…' : 'Cancel Request'}
                          </button>
                        )}

                        {providerId && customerId && (
                          <div className="w-full">
                            <button
                              onClick={() => openChatForOrder(order)}
                              className="w-full py-2.5 rounded-lg bg-[#E5252A] text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat with Provider {orderMessageCounts[order.orderUuid] ? `(${orderMessageCounts[order.orderUuid]} New)` : ''}</span>
                            </button>
                          </div>
                        )}

                        {/* Informational Alerts */}
                        {['order_received', 'quoted', 'quote_accepted', 'payment_done', 'payment_received'].includes(order.status) && (
                          <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs leading-relaxed bg-[#F5F5F5] dark:bg-zinc-950/60 text-[#666666] dark:text-zinc-400">
                            {order.status === 'order_received' && 'The provider has acknowledged this order. You may now complete the payment via coordinates above and confirm.'}
                            {order.status === 'quoted' && 'The provider has updated the request quote. Please accept the quote to proceed.'}
                            {order.status === 'quote_accepted' && 'Quote accepted. Please perform the transaction transfer.'}
                            {order.status === 'payment_done' && 'Payment marked as completed. Awaiting delivery receipt.'}
                            {order.status === 'payment_received' && 'Payment verified by seller. Awaiting transport dispatch.'}
                          </div>
                        )}

                        {order.status === 'delivered' && (
                          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 font-medium dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Order fully completed! Thank you for choosing HafiConnect.
                          </div>
                        )}

                        {/* Seller Information Card */}
                        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-xs space-y-2 bg-[#F5F5F5] dark:bg-zinc-950/40">
                          <div className="font-bold text-[10px] uppercase tracking-wider text-[#E5252A] border-b pb-1.5 border-gray-200 dark:border-zinc-800">Seller Information</div>
                          <div className="space-y-1.5 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[#666666] dark:text-zinc-400">Name:</span>
                              <span className="font-bold text-[#151515] dark:text-white">{provider?.name || 'Loading...'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#666666] dark:text-zinc-400">Phone:</span>
                              {provider?.phone_number ? (
                                <a href={`tel:${provider.phone_number}`} className="font-semibold text-[#E5252A] hover:underline">
                                  {provider.phone_number}
                                </a>
                              ) : (
                                <span className="font-medium text-gray-400">Not Available</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#666666] dark:text-zinc-400">WhatsApp:</span>
                              {provider?.whatsapp_number ? (
                                <button
                                  type="button"
                                  onClick={() => openWhatsApp(provider.whatsapp_number)}
                                  className="font-semibold text-[#E5252A] hover:underline"
                                >
                                  {provider.whatsapp_number}
                                </button>
                              ) : (
                                <span className="font-medium text-gray-400">Not Available</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#666666] dark:text-zinc-400">Email:</span>
                              <span className="font-medium select-all text-[#151515] dark:text-white">{provider?.email || 'Not Available'}</span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[#666666] dark:text-zinc-400">Address:</span>
                              <div className="max-w-[180px] break-words text-right">
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
                              className="flex items-center justify-center border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wider py-2 transition-all bg-white dark:bg-zinc-900 text-[#151515] dark:text-white hover:border-[#E5252A]"
                            >
                              Call
                            </a>
                          ) : (
                            <div className="p-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-center text-xs text-gray-400">Locked</div>
                          )}

                          {provider?.whatsapp_number ? (
                            <button
                              onClick={() => openWhatsApp(provider.whatsapp_number)}
                              className="flex items-center justify-center gap-1.5 bg-[#E5252A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-2 rounded-lg transition-colors"
                            >
                              <FaWhatsapp className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          ) : (
                            <div className="p-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-center text-xs text-gray-400">Locked</div>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* Delivery footer info */}
                <div className="px-5 py-2.5 border-t border-gray-100 dark:border-zinc-800 text-[11px] uppercase font-semibold tracking-wider bg-gray-50/50 dark:bg-zinc-950/40 text-[#666666] dark:text-zinc-400">
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