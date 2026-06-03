import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";
import { usePhases } from "@/context/PhaseContext";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useCart } from "../context/CartContext";
import { createOrder } from "../utils/orderStorage";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const CartPage = () => {
  const { darkMode } = useDarkMode();
  const { cart, updateQuantity, toggleCheck, removeItem, setCart } = useCart();
  const { isLoggedIn, user, token } = useAuth();
  const { isPhaseEnabled } = usePhases();
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

  const checkedItems = cart.filter(i => i.checked);

  const itemsTotal = checkedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsOldTotal = checkedItems.reduce((sum, i) => sum + (i.oldPrice ?? i.price) * i.quantity, 0);
  const itemsDiscount = itemsOldTotal - itemsTotal;
  const estimatedTotal = itemsTotal;

  // Check if there are any services in checked items
  const hasServices = checkedItems.some(item => item.type === 'service');
  const buttonText = hasServices ? 'Request Service' : 'Place Order';

  // Dark mode colors
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputBg = darkMode ? 'bg-gray-700 text-white' : 'bg-white';

  // Phase 2 = full payment flow; Phase 1 (or no phase) = order placement flow
  const usePaymentFlow = isPhaseEnabled('phase_2');

  const handleCheckout = async () => {
    if (checkedItems.length === 0) return;

    if (usePaymentFlow) {
      // ── Phase 2: navigate to payment page ──
      const itemsWithType = checkedItems.map(item => ({
        ...item,
        type: item.type || 'product',
        productId: item.productId,
      }));
      sessionStorage.setItem('checkoutItems', JSON.stringify(itemsWithType));
      navigate('/book/payment');
      return;
    }

    if (!isLoggedIn || !user) {
      navigate('/login');
      return;
    }

    try {
      setPlacingOrder(true);

      const order = await createOrder(
        token,
        checkedItems,
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        notifyWhatsApp
      );

      const remainingItems = cart.filter(item => !item.checked);
      setCart(remainingItems);

      if (notifyWhatsApp) {
        const providerId = checkedItems[0]?.providerId || (checkedItems[0] as any)?.provider_id || (checkedItems[0] as any)?.seller_id;

        if (providerId) {
          try {
            const res = await fetch(`${API_BASE}/api/providers/${providerId}`);
            const data = await res.json();
            const rawNumber: string = data?.whatsapp_number || data?.provider?.whatsapp_number || '';
            const phone = rawNumber.replace(/\D/g, '');

            const message = [
              `Client ${user.name} has placed an order.`,
              `Order ID: ${order.orderUuid}`,
              `Total: RWF ${order.total.toLocaleString()}`,
              `Items: ${checkedItems.map(item => `${item.name} x ${item.quantity}`).join(', ')}`,
            ].join('\n');

            const waUrl = phone
              ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
              : `https://wa.me/?text=${encodeURIComponent(message)}`;

            window.open(waUrl, '_blank', 'noopener,noreferrer');
          } catch (error) {
            console.error('WhatsApp notification error:', error);
          }
        }
      }

      navigate(`/orders?placed=${order.orderUuid}`);
    } catch (err) {
      console.error('Order placement error:', err);
      alert('Could not place the order. Please try again.');

    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen ${bgColor}`}>
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-hafi-teal-light' : 'text-hafi-teal'}`}>
        Your Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {cart.length === 0 ? (
            <div className={`text-center py-10 ${secondaryTextColor}`}>
              Your cart is empty
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className={`border ${borderColor} p-4 rounded-lg gap-4 ${cardBg}`}
              >
                <div className="flex items-start gap-4 mb-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(item.id)}
                    className={`h-5 w-5 rounded mt-1 ${darkMode ? 'accent-hafi-teal-light' : 'accent-hafi-teal'}`}
                  />
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h2 className={`text-lg font-semibold ${textColor}`}>{item.name}</h2>
                    {item.description && (
                      <p className={`text-sm mt-1 ${secondaryTextColor}`}>{item.description}</p>
                    )}
                    <div className={`${secondaryTextColor} mt-1`}>Price: RWF {item.price.toLocaleString()}</div>
                    {item.oldPrice && (
                      <div className={`line-through text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Was: RWF {item.oldPrice.toLocaleString()}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className={secondaryTextColor}>Qty:</span>
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                        className={`ml-2 w-16 border ${borderColor} rounded px-2 py-1 ${inputBg}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className={`p-2 rounded-full ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                  >
                    <Trash2 />
                  </button>
                </div>

                {/* Service Customization Display */}
                {item.type === 'service' && item.serviceCustomization && (
                  <div className={`p-3 rounded-lg border-l-4 ${
                    darkMode
                      ? 'border-l-hafi-teal bg-gray-800 text-gray-100'
                      : 'border-l-hafi-teal bg-blue-50 text-gray-900'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${darkMode ? 'text-hafi-teal-light' : 'text-hafi-teal'}`}>
                      Services Requested:
                    </div>
                    {item.serviceCustomization.noCustomizationNeeded ? (
                      <div className={`text-sm ${secondaryTextColor}`}>
                        ✓ No customization needed
                      </div>
                    ) : item.serviceCustomization.customizationRequest ? (
                      <div className={`text-sm whitespace-pre-wrap ${secondaryTextColor}`}>
                        {item.serviceCustomization.customizationRequest}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className={`border ${borderColor} p-4 rounded-lg ${cardBg} h-fit sticky top-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={secondaryTextColor}>Items Total:</span>
              <span className={textColor}>RWF {itemsTotal.toLocaleString()}</span>
            </div>
            {itemsDiscount > 0 && (
              <div className="flex justify-between">
                <span className={secondaryTextColor}>Discount:</span>
                <span className="text-green-500">-RWF {itemsDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className={`rounded-lg border px-3 py-3 text-sm ${borderColor} ${darkMode ? 'bg-gray-800/60 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
              Transport and delivery are negotiated directly between the customer and the service provider.
            </div>
            <hr className={borderColor} />
            <div className="flex justify-between font-bold">
              <span className={textColor}>Estimated Total:</span>
              <span className={textColor}>RWF {estimatedTotal.toLocaleString()}</span>
            </div>

            <button
              className={`w-full py-3 mt-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${darkMode
                ? 'bg-hafi-teal/50 text-white hover:bg-hafi-teal'
                : 'bg-hafi-teal text-white hover:bg-hafi-green'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={checkedItems.length === 0 || placingOrder}
              onClick={handleCheckout}
            >
              {placingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {hasServices ? 'Requesting Service…' : 'Placing Order…'}
                </>
              ) : usePaymentFlow ? (
                'Checkout'
              ) : (
                buttonText
              )}
            </button>

            {!usePaymentFlow && (
              <label className={`mt-3 flex items-start gap-3 rounded-lg border px-3 py-3 text-sm ${borderColor} ${darkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={e => setNotifyWhatsApp(e.target.checked)}
                  className={`mt-1 h-4 w-4 rounded ${darkMode ? 'accent-hafi-teal-light' : 'accent-hafi-teal'}`}
                />
                <span className={secondaryTextColor}>
                  Also open WhatsApp with a notification message for the provider after the order is placed.
                </span>
              </label>
            )}

            {!usePaymentFlow && checkedItems.length > 0 && (
              <p className={`text-xs text-center mt-2 ${secondaryTextColor}`}>
                Your order will be saved to your orders page.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
