import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";
import { usePhases } from "@/context/PhaseContext";
import { Loader2, Trash2, ShoppingCart, Info, Check } from "lucide-react";
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
  const notifyWhatsApp = false;

  const checkedItems = cart.filter(i => i.checked);

  const itemsTotal = checkedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsOldTotal = checkedItems.reduce((sum, i) => sum + (i.oldPrice ?? i.price) * i.quantity, 0);
  const itemsDiscount = itemsOldTotal - itemsTotal;
  const estimatedTotal = itemsTotal;

  const hasServices = checkedItems.some(item => item.type === 'service');
  const buttonText = hasServices ? 'Request Service' : 'Place Order';

  // Dark mode colors
  const bgColor = darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-250';
  const cardBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-900';

  const usePaymentFlow = isPhaseEnabled('phase_2');

  const handleCheckout = async () => {
    if (checkedItems.length === 0) return;

    if (usePaymentFlow) {
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
        false
      );

      const remainingItems = cart.filter(item => !item.checked);
      setCart(remainingItems);

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
      {/* Title */}
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-emerald-500" />
        <span>Your Cart</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.length === 0 ? (
            <div className={`text-center py-16 border ${borderColor} ${cardBg} flex flex-col items-center justify-center`} style={{ borderRadius: '2px' }}>
              <ShoppingCart className="w-12 h-12 text-gray-500 mb-3 opacity-40" />
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Your cart is currently empty</p>
              <button 
                onClick={() => navigate('/market')} 
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Go to Marketplace
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className={`border p-4 gap-4 flex flex-col md:flex-row items-stretch md:items-center relative transition-all duration-300 hover:shadow-sm ${cardBg}`}
                style={{ borderRadius: '2px' }}
              >
                {/* Checkbox */}
                <div className="flex items-center shrink-0">
                  <label className="relative flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleCheck(item.id)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border transition-all flex items-center justify-center
                      ${item.checked 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : darkMode ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-white'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </label>
                </div>

                {/* Item Image */}
                <div className="w-20 h-20 shrink-0 bg-gray-150 dark:bg-gray-800 border dark:border-gray-800 overflow-hidden self-center" style={{ borderRadius: '2px' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-sm font-bold uppercase tracking-tight">{item.name}</h2>
                  {item.description && (
                    <p className={`text-xs line-clamp-1 mt-0.5 ${secondaryTextColor}`}>{item.description}</p>
                  )}
                  
                  {/* Prices */}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-emerald-500">RWF {item.price.toLocaleString()}</span>
                    {item.oldPrice && (
                      <span className={`line-through text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        RWF {item.oldPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 dark:border-gray-800">
                  {/* Quantity picker */}
                  <div className="flex items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-500 mr-2">Qty:</span>
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={e => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className={`w-14 text-center border p-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${inputBg}`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className={`p-2 transition-colors duration-200 border ${darkMode ? 'border-gray-850 bg-gray-950 text-red-400 hover:bg-red-500/10' : 'border-gray-200 bg-gray-50 text-red-500 hover:bg-red-50'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Service Customization Display */}
                {item.type === 'service' && item.serviceCustomization && (
                  <div className={`p-3 border-t md:absolute md:left-0 md:bottom-0 md:right-0 md:top-auto border-t-emerald-500/10 bg-emerald-500/5 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">
                      Services Requested:
                    </div>
                    {item.serviceCustomization.noCustomizationNeeded ? (
                      <div className="text-xs text-gray-500">
                        ✓ No customization needed
                      </div>
                    ) : item.serviceCustomization.customizationRequest ? (
                      <div className="text-xs whitespace-pre-wrap text-gray-500">
                        {item.serviceCustomization.customizationRequest}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="space-y-4">
          <div className={`border p-6 shadow-sm ${cardBg}`} style={{ borderRadius: '2px' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 dark:border-gray-800">Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className={secondaryTextColor}>Subtotal:</span>
                <span className="font-semibold">{itemsTotal.toLocaleString()} RWF</span>
              </div>
              
              {itemsDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-500">Discount:</span>
                  <span className="font-semibold text-green-500">-RWF {itemsDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className={`p-3 text-[11px] leading-relaxed border border-emerald-500/15 bg-emerald-500/5 text-gray-500`} style={{ borderRadius: '2px' }}>
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-500 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Transport Info</span>
                </div>
                Transport and delivery are negotiated directly between the customer and the provider after ordering.
              </div>

              <hr className="dark:border-gray-800 border-gray-200" />
              
              <div className="flex justify-between text-sm font-bold uppercase tracking-wide">
                <span>Estimated Total:</span>
                <span className="text-emerald-500">RWF {estimatedTotal.toLocaleString()}</span>
              </div>

              <button
                className={`w-full py-3 mt-4 text-xs font-bold uppercase tracking-wider text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2`}
                disabled={checkedItems.length === 0 || placingOrder}
                onClick={handleCheckout}
                style={{ borderRadius: '2px' }}
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : usePaymentFlow ? (
                  'Proceed to Payment'
                ) : (
                  buttonText
                )}
              </button>



              {!usePaymentFlow && checkedItems.length > 0 && (
                <p className={`text-[10px] text-center mt-2 ${secondaryTextColor}`}>
                  Your order details will update in the Account Dashboard.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CartPage;
