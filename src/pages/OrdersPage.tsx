import { useDarkMode } from '@/context/DarkMode';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Link, useSearchParams } from 'react-router-dom';
import ChatBox from './ChatBox';
import { loadOrders, type OrderRecord } from '../utils/orderStorage';

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

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardBorder = darkMode ? 'border-gray-700' : 'border-gray-100';

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

  // Status color and icon mapping
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'placed':
        return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: '🕒', label: 'Awaiting Payment' };
      case 'order_received':
        return { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', icon: '✅', label: 'Order Received by Provider' };
      case 'quoted':
        return { color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', icon: '💬', label: 'Quoted Price' };
      case 'quote_accepted':
        return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: '✅', label: 'Quote Accepted' };
      case 'payment_done':
        return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: '💰', label: 'Payment Sent' };
      case 'payment_received':
        return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', icon: '✅', label: 'Payment Confirmed' };
      case 'delivery_pending':
        return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: '📦', label: 'Delivery Pending' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: '🎉', label: 'Delivered' };
      default:
        return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: '📋', label: status };
    }
  };

  return (
    <div className={`p-4 md:p-6 max-w-7xl mx-auto min-h-screen ${bgColor}`}>
      {/* Header - More Compact */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-hafi-teal-light' : 'text-hafi-teal'}`}>
            Orders
          </h1>
          <p className={`text-sm ${secondaryTextColor}`}>
            Track and manage your orders
          </p>
        </div>
        <Link
          to="/cart"
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${darkMode
            ? 'bg-hafi-teal/20 text-white hover:bg-hafi-teal/35'
            : 'bg-hafi-teal text-white hover:bg-hafi-green shadow-sm'
            }`}
        >
          ← Back to Cart
        </Link>
      </div>

      {/* Success Message */}
      {placedOrder && (
        <div className={`mb-5 rounded-xl border-l-4 border-l-green-500 px-4 py-3 text-sm ${darkMode ? 'bg-green-600/10 border-green-600/40 text-green-100' : 'bg-green-50 border-green-200 text-green-800'}`}>
          Order {placedOrder.orderUuid.slice(0, 8)}… placed successfully.
        </div>
      )}

      {/* Loading / Error / Empty States */}
      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="lg" message="Loading your orders..." variant="dots" />
        </div>
      ) : error ? (
        <div className={`rounded-xl border p-8 text-center ${cardBorder} ${cardBg}`}>
          <p className={`font-semibold ${textColor}`}>Unable to load orders</p>
          <p className={`text-sm mt-1 ${secondaryTextColor}`}>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${cardBorder} ${cardBg}`}>
          <p className={`font-semibold ${textColor}`}>No orders yet</p>
          <p className={`text-sm mt-1 ${secondaryTextColor}`}>
            Orders you place from your cart will appear here.
          </p>
          <Link
            to="/cart"
            className={`mt-4 inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition-all ${darkMode
              ? 'bg-hafi-teal/20 text-white hover:bg-hafi-teal/35'
              : 'bg-hafi-teal text-white hover:bg-hafi-green'
              }`}
          >
            Browse Cart
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
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
            const isPaymentDoneOrLater = ['order_received', 'payment_done', 'payment_received', 'delivery_pending', 'delivered'].includes(order.status);
            const showCancelButton = order.status === 'placed';
            const chatOpen = activeChatOrderUuid === order.orderUuid;

            return (
              <div key={order.orderUuid} className={`rounded-xl border shadow-sm transition-all hover:shadow-md ${cardBorder} ${cardBg}`}>
                {/* Order Header - Compact with Status */}
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${borderColor}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono ${secondaryTextColor}`}>
                        #{order.orderUuid.slice(0, 12)}…
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                        <span>{statusConfig.icon}</span>
                        <span>{statusConfig.label}</span>
                      </span>
                      {order.notifyWhatsApp && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          📱 WA
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${secondaryTextColor}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold ${textColor}`}>
                      RWF {quotedTotal.toLocaleString()}
                    </div>
                    {hasQuotedServicePrice && (
                      <div className={`text-xs ${secondaryTextColor}`}>
                        Original: RWF {originalTotal.toLocaleString()}
                      </div>
                    )}
                    <div className={`text-xs ${secondaryTextColor}`}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="p-4">
                  <div className={`grid grid-cols-1 gap-4 ${chatOpen ? 'md:grid-cols-[1fr_360px_280px]' : 'md:grid-cols-[1fr_280px]'}`}>
                    {/* Left Column: Items and Customer Info */}
                    <div className="space-y-3">
                      {/* Items List - Compact */}
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={`${order.orderUuid}-${item.id}-${item.size || 'default'}`} className="space-y-1">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="h-10 w-10 rounded-md object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${textColor}`}>{item.name}</p>
                                {item.description && (
                                  <p className={`text-xs ${secondaryTextColor} mt-1 line-clamp-2`}>
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs mt-1">
                                  <span className={secondaryTextColor}>Qty {item.quantity}</span>
                                  {item.size && <span className={secondaryTextColor}>Size {item.size}</span>}
                                </div>
                              </div>
                              <div className={`text-sm font-medium ${textColor}`}>
                                RWF {(item.price * item.quantity).toLocaleString()}
                              </div>
                            </div>

                            {/* Service Customization Display */}
                            {item.type === 'service' && item.serviceCustomization && (
                              <div className={`ml-13 text-xs p-2 rounded-md border-l-2 ${
                                darkMode
                                  ? 'border-l-hafi-teal bg-blue-900/20 text-blue-100'
                                  : 'border-l-hafi-teal bg-blue-50 text-blue-900'
                              }`}>
                                <span className="font-semibold">Services Requested: </span>
                                {item.serviceCustomization.noCustomizationNeeded ? (
                                  <span>✓ No customization needed</span>
                                ) : item.serviceCustomization.customizationRequest ? (
                                  <div className="mt-1 whitespace-pre-wrap">{item.serviceCustomization.customizationRequest}</div>
                                ) : null}
                                <div className="mt-2 rounded-md border border-current/20 bg-white/40 p-2 dark:bg-black/10">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold">Previous price</span>
                                    <span>RWF {Number(item.price).toLocaleString()}</span>
                                  </div>
                                  {item.serviceCustomization.quotedPrice != null && (
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                      <span className="font-semibold">New price</span>
                                      <span>RWF {Number(item.serviceCustomization.quotedPrice).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Customer Details */}
                      <div className={`mt-3 rounded-lg border px-3 py-2 ${borderColor} ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={secondaryTextColor}>Customer:</span>
                          <span className={`font-medium ${textColor}`}>{order.customerName}</span>
                        </div>
                        {provider?.name && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className={secondaryTextColor}>Provider:</span>
                            <span className={`font-medium ${textColor}`}>{provider.name}</span>
                          </div>
                        )}
                        {order.updatedAt && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className={secondaryTextColor}>Updated:</span>
                            <span className={secondaryTextColor}>{new Date(order.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {chatOpen && (
                      <div className="space-y-3">
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

                    {/* Right Column: Payment & Actions - Compact */}
                    <div className="space-y-3">
                      {/* Payment Methods - Prominently Displayed */}
                      <div className={`rounded-lg border ${borderColor} ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50'} overflow-hidden`}>
                        <div className={`border-b px-3 py-2 ${borderColor}`}>
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-semibold uppercase tracking-wide ${secondaryTextColor}`}>
                              Payment Methods
                            </h4>
                            {hasMethods && (
                              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">✓ Available</span>
                            )}
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {hasMethods ? (
                            Object.entries(methods as Record<string, any>)
                              .filter(([, value]) => value && Object.keys(value).length > 0)
                              .map(([method, value]) => (
                                <div key={method} className={`rounded-md border px-2 py-1.5 ${borderColor} ${darkMode ? 'bg-gray-800/40' : 'bg-white'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${textColor}`}>{getMethodDisplayName(method)}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {method === 'momoPay' ? 'Code' : 'Phone'}
                                    </span>
                                  </div>
                                  <div className={`text-xs truncate ${secondaryTextColor}`}>
                                    {method === 'momoPay' ? value?.code || '—' : value?.phone || '—'}
                                  </div>
                                  <div className={`text-[10px] truncate ${secondaryTextColor}`}>
                                    {value?.registeredName || ''}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className={`text-center text-xs py-2 ${secondaryTextColor}`}>
                              No payment methods available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions and Support */}
                      <div className="space-y-2">
                        {canShowPaymentButton && (
                          <button
                            type="button"
                            onClick={() => markPaymentDone(order.orderUuid)}
                            className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                          >
                            💰 Mark Payment Done
                          </button>
                        )}

                        {order.status === 'quoted' && (
                          <button
                            type="button"
                            onClick={() => acceptQuote(order.orderUuid)}
                            className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                          >
                            ✅ Accept Quote
                          </button>
                        )}
                        
                        {canShowConfirmDeliveryButton && (
                          <button
                            type="button"
                            onClick={() => confirmReceipt(order.orderUuid)}
                            className="w-full rounded-lg bg-hafi-teal px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-hafi-green"
                          >
                            📦 I have received the delivery
                          </button>
                        )}

                        {showCancelButton && (
                          <button
                            type="button"
                            onClick={() => deleteOrder(order.orderUuid)}
                            disabled={deletingOrderUuid === order.orderUuid}
                            className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                          >
                            {deletingOrderUuid === order.orderUuid ? 'Cancelling…' : 'Cancel Order'}
                          </button>
                        )}

                        {providerId && customerId && (
                          <button
                            type="button"
                            onClick={() => openChatForOrder(order)}
                            className="w-full rounded-lg bg-hafi-teal px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-hafi-green"
                          >
                            💬 Chat with provider{orderMessageCounts[order.orderUuid] ? ` (${orderMessageCounts[order.orderUuid]})` : ''}
                          </button>
                        )}

                        {/* Status Info */}
                        {['order_received', 'quoted', 'quote_accepted', 'payment_done', 'payment_received'].includes(order.status) && order.status !== 'delivered' && order.status !== 'delivery_pending' && (
                          <div className={`rounded-lg border px-3 py-2 text-xs ${borderColor} ${darkMode ? 'bg-gray-800/40 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            {order.status === 'order_received' && '✅ The service provider has received your order. You can now mark payment as done.'}
                            {order.status === 'quoted' && '💬 A new price has been quoted. Please review and accept it to continue.'}
                            {order.status === 'quote_accepted' && '✅ Quote accepted. You can now proceed with payment.'}
                            {order.status === 'payment_done' && '📦 Your delivery confirmation button is now active. You can finish the order whenever you have received it.'}
                            {order.status === 'payment_received' && '✅ Payment confirmed. You can now confirm delivery when it arrives.'}
                          </div>
                        )}
                        {order.status === 'delivery_pending' && (
                          <div className={`rounded-lg border px-3 py-2 text-xs ${borderColor} ${darkMode ? 'bg-gray-800/40 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            📦 The order is ready for delivery. You can now close the order by confirming receipt.
                          </div>
                        )}
                        {order.status === 'delivered' && (
                          <div className={`rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800/40 dark:bg-green-950/20 dark:text-green-400`}>
                            🎉 Order completed. Thank you for shopping with us!
                          </div>
                        )}

                        {/* Provider Contact */}
                        <div className={`rounded-lg border px-3 py-2 text-sm ${borderColor} ${darkMode ? 'bg-gray-900/30 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                          <div className="font-semibold text-xs uppercase tracking-wide text-gray-400">Provider contact</div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={secondaryTextColor}>Phone</span>
                              <a href={provider?.phone_number ? `tel:${provider.phone_number}` : '#'} className={`text-xs font-medium ${provider?.phone_number ? 'text-hafi-teal hover:underline' : secondaryTextColor}`}>
                                {provider?.phone_number || 'Not available'}
                              </a>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={secondaryTextColor}>WhatsApp</span>
                              {provider?.whatsapp_number ? (
                                <button
                                  type="button"
                                  onClick={() => openWhatsApp(provider.whatsapp_number)}
                                  className="text-xs font-medium text-emerald-600 hover:underline"
                                >
                                  {provider.whatsapp_number}
                                </button>
                              ) : (
                                <span className={secondaryTextColor}>Not available</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Support Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {provider?.phone_number ? (
                            <a
                              href={`tel:${provider.phone_number}`}
                              className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${darkMode ? 'border-gray-600 text-gray-100 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                            >
                              📞 Call
                            </a>
                          ) : (
                            <div className={`rounded-lg border px-2 py-1.5 text-center text-xs ${borderColor} ${secondaryTextColor}`}>
                              No call
                            </div>
                          )}
                          {provider?.whatsapp_number ? (
                            <button
                              type="button"
                              onClick={() => openWhatsApp(provider.whatsapp_number)}
                              className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                            >
                              💬 WhatsApp
                            </button>
                          ) : (
                            <div className={`rounded-lg border px-2 py-1.5 text-center text-xs ${borderColor} ${secondaryTextColor}`}>
                              No WhatsApp
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery Note */}
                  <div className={`mt-3 rounded-lg border px-3 py-1.5 text-[11px] ${borderColor} ${darkMode ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                    🚚 Transport and delivery are negotiated directly with the service provider.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;