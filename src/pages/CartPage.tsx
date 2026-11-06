import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";
import { usePhases } from "@/context/PhaseContext";
import { Loader2, Trash2, ShoppingCart, Info, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useCart } from "../context/CartContext";
import { createOrder } from "../utils/orderStorage";

const CartPage = () => {
  const { darkMode } = useDarkMode();
  const { cart, updateQuantity, toggleCheck, removeItem, setCart } = useCart();
  const { isLoggedIn, user, token } = useAuth();
  const { isPhaseEnabled } = usePhases();
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);

  const checkedItems = cart.filter(i => i.checked);

  const itemsTotal = checkedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsOldTotal = checkedItems.reduce((sum, i) => sum + (i.oldPrice ?? i.price) * i.quantity, 0);
  const itemsDiscount = itemsOldTotal - itemsTotal;
  const estimatedTotal = itemsTotal;

  const hasServices = checkedItems.some(item => item.type === 'service');
  const buttonText = hasServices ? 'Request Service' : 'Place Order';

  // Design tokens
  const bgColor = darkMode ? 'bg-gray-950 text-white' : 'bg-[#F5F5F5] text-[#151515]';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-[#666666]';
  const borderColor = darkMode ? 'border-gray-800' : 'border-[#E5E5E5]';
  const cardBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]';
  const inputBg = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515]';

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
    <div className={`p-4 sm:p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-200 ${bgColor}`}>
      {/* Title */}
      <div className="mb-6">
        <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-2 shadow-xs">
          Shopping & Orders
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-[#E5252A] flex-shrink-0" />
          <span>Your Cart<span className="text-[#E5252A]">.</span></span>
        </h1>
        <p className={`text-xs font-semibold uppercase tracking-wider mt-1 ${secondaryTextColor}`}>
          Review your selected items and proceed to checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.length === 0 ? (
            <div className={`text-center py-16 border rounded-2xl ${borderColor} ${cardBg} flex flex-col items-center justify-center shadow-xs`}>
              <ShoppingCart className="w-12 h-12 text-[#E5252A] mb-3 opacity-60" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Your cart is currently empty</p>
              <button 
                onClick={() => navigate('/market')} 
                className="mt-4 px-5 py-2.5 bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl shadow-xs active:scale-[0.99]"
              >
                Explore Marketplace →
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className={`border rounded-2xl p-4 sm:p-5 gap-4 flex flex-col md:flex-row items-stretch md:items-center relative transition-all duration-300 hover:shadow-md ${cardBg}`}
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
                    <div className={`w-5 h-5 border rounded-lg transition-all flex items-center justify-center
                      ${item.checked 
                        ? 'bg-[#E5252A] border-[#E5252A] text-white shadow-xs' 
                        : darkMode ? 'border-gray-700 bg-gray-800 hover:border-[#E5252A]' : 'border-gray-300 bg-white hover:border-[#E5252A]'}`}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </label>
                </div>

                {/* Item Image */}
                <div className="w-20 h-20 shrink-0 bg-[#F5F5F5] dark:bg-gray-950 border border-[#E5E5E5] dark:border-gray-800 rounded-xl overflow-hidden self-center">
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
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-sm font-extrabold text-[#E5252A]">
                      RWF {item.price.toLocaleString()}
                      <span className={`text-[10px] font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
                        / {item.pricingUnit || 'Per Item / Piece'}
                      </span>
                    </span>
                    {item.oldPrice && (
                      <span className={`line-through text-[11px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        RWF {item.oldPrice.toLocaleString()}
                      </span>
                    )}
                    {item.used && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        USED
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-0 pt-3 md:pt-0 border-[#E5E5E5] dark:border-gray-800">
                  {/* Quantity picker */}
                  <div className="flex items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-500 mr-2">Qty:</span>
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={e => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className={`w-14 text-center border p-1 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] ${inputBg}`}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                    className={`p-2 transition-colors duration-200 border rounded-xl ${
                      darkMode 
                        ? 'border-gray-800 bg-gray-800/60 text-gray-400 hover:text-[#E5252A] hover:border-[#E5252A]/40' 
                        : 'border-[#E5E5E5] bg-white text-gray-500 hover:text-[#E5252A] hover:border-[#E5252A]/40'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Service Customization Display */}
                {item.type === 'service' && item.serviceCustomization && (
                  <div className={`p-3 rounded-xl border mt-3 w-full border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    <div className="text-[10px] uppercase font-bold text-[#E5252A] mb-1">
                      Services Requested:
                    </div>
                    {item.serviceCustomization.noCustomizationNeeded ? (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        ✓ No customization needed
                      </div>
                    ) : item.serviceCustomization.customizationRequest ? (
                      <div className="text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400 leading-relaxed">
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
          <div className={`border rounded-2xl p-6 shadow-xs ${cardBg}`}>
            <h2 className="text-sm font-extrabold uppercase tracking-wider mb-4 border-b pb-2.5 border-[#E5E5E5] dark:border-gray-800">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className={secondaryTextColor}>Subtotal:</span>
                <span className="font-bold">{itemsTotal.toLocaleString()} RWF</span>
              </div>
              
              {itemsDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#E5252A] font-bold">Discount:</span>
                  <span className="font-bold text-[#E5252A]">-RWF {itemsDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl text-[11px] leading-relaxed border border-[#E5E5E5] dark:border-gray-800 bg-[#F5F5F5] dark:bg-gray-800/40 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#E5252A] mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Transport Info</span>
                </div>
                Transport and delivery are negotiated directly between the customer and the provider after ordering.
              </div>

              <hr className="border-[#E5E5E5] dark:border-gray-800" />
              
              <div className="flex justify-between text-sm font-extrabold uppercase tracking-wide">
                <span>Estimated Total:</span>
                <span className="text-[#E5252A] font-black">RWF {estimatedTotal.toLocaleString()}</span>
              </div>

              <button
                className={`w-full py-3.5 mt-4 text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 rounded-xl shadow-xs ${
                  checkedItems.length === 0 || placingOrder
                    ? 'bg-gray-400 dark:bg-gray-800 text-gray-200 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-[#E5252A] hover:bg-[#c91d22] active:scale-[0.99]'
                }`}
                disabled={checkedItems.length === 0 || placingOrder}
                onClick={handleCheckout}
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : usePaymentFlow ? (
                  'Proceed to Payment →'
                ) : (
                  `${buttonText} →`
                )}
              </button>

              {!usePaymentFlow && checkedItems.length > 0 && (
                <p className={`text-[10px] font-medium text-center mt-2 ${secondaryTextColor}`}>
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
