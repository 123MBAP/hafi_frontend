import Modal from "@/components/ui/PayModal";
import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { cachedFetch } from '../utils/cachedFetch';
import Pay from "./Pay";
import { PaymentOptions } from "./PaymentOptions";

// Define strict types
type ProductServiceType = "product" | "service";

interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  providerId: string;
  type: ProductServiceType;
}

interface Provider {
  providerId: string;
  name: string;
  contactNumber: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface PaymentPageProps {
  onPaymentSuccess?: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onPaymentSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const { darkMode } = useDarkMode();

  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [customizations, setCustomizations] = useState<string[]>([]);
  const [customizationInput, setCustomizationInput] = useState("");
  const [isCustomizationSubmitted, setIsCustomizationSubmitted] = useState(false);
  const [customQuote, setCustomQuote] = useState<number | null>(null);
  const [isCustomizationMode, setIsCustomizationMode] = useState(false);

  const [paymentStage, setPaymentStage] = useState<'options' | 'provider'>('options');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'direct' | 'escrow'>('direct');
  const [escrowDetails, setEscrowDetails] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'product' | 'service' | 'custom_service'>('product');

  // New: Loading and error state for payment
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // State for login prompt modal
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check if this is a custom service payment (coming from CustomerStatements)
  const isCustomServicePayment = () => {
    const customRequest = sessionStorage.getItem('customServiceRequest');
    return customRequest !== null;
  };

  // Type guard function
  const isProductServiceType = (type: string): type is ProductServiceType => {
    return type === "product" || type === "service";
  };

  // Theme colors
  const bgColor = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-100" : "text-gray-800";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";

  // Handle navigation to login with state preservation
  const handleLoginNavigation = () => {
    // Store the current path and any relevant state
    const returnPath = location.pathname + location.search;
    navigate('/login', {
      state: {
        from: returnPath,
        message: 'Please log in to proceed with payment'
      }
    });
  };

  useEffect(() => {
    // If this is a custom service payment, skip the normal flow
    if (isCustomServicePayment()) {
      const customRequest = JSON.parse(sessionStorage.getItem('customServiceRequest') || '{}');
      setCustomQuote(customRequest.custom_price || 0);
      setCustomizations(customRequest.customizations || []);
      setIsCustomizationSubmitted(true);
      setPaymentType('custom_service');

      // Fetch provider info
      if (customRequest.provider_id) {
        fetchProvider(customRequest.provider_id);
      }
      return;
    }

    // Normal flow for regular products/services from cart
    interface CheckoutItemStorage {
      id: string;
      productId: string;
      name: string;
      price: string | number;
      quantity: number;
      image: string;
      providerId: string;
      type: string;
    }

    const stored = (JSON.parse(sessionStorage.getItem("checkoutItems") || "[]") as CheckoutItemStorage[])
      .map((item: CheckoutItemStorage) => {
        const itemType = isProductServiceType(item.type) ? item.type : "product";
        return {
          ...item,
          price: Number(item.price),
          type: itemType,
          productId: item.productId,
        };
      });

    if (stored.length > 0) {
      // Merge duplicates
      const merged: CheckoutItem[] = [];
      stored.forEach(item => {
        const exist = merged.find(i => i.id === item.id && i.providerId === item.providerId);
        if (exist) {
          exist.quantity += item.quantity;
          exist.price = item.price;
        } else {
          merged.push({
            ...item,
            type: isProductServiceType(item.type) ? item.type : "product"
          });
        }
      });

      setCheckoutItems(merged);
      fetchProvider(merged[0].providerId);
    } else {
      navigate("/cart");
    }
  }, [navigate]);

  const fetchProvider = async (providerId: string) => {
    try {
      const data = await cachedFetch<any>(`${API_BASE}/api/providers/${providerId}`);
      setProvider({
        providerId: data.id,
        name: data.name,
        contactNumber: data.contactNumber || "N/A",
      });
    } catch (error) {
      console.error("Failed to fetch provider:", error);
    }
  };

  // const totalAmount = checkoutItems.reduce(
  //   (sum, i) => sum + i.price * i.quantity,
  //   0
  // );

  const handlePayment = (type: 'product' | 'service' | 'custom_service' = 'product') => {
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    setPaymentType(type);
    setModalOpen(true);
    if (type === 'product') {
      sessionStorage.removeItem("checkoutItems");
    }
  };

  // DIRECT PAYMENT
  const handleDirectPayment = async (payload: {
    network_type: 'mtn' | 'airtel';
    phone: string;
    amount: number;
  }) => {
    setPayLoading(true);
    setPayError(null);
    if (!provider?.providerId) {
      setPayError("Provider not loaded yet");
      setPayLoading(false);
      return;
    }
    if (!payload.amount || !payload.phone || !payload.network_type) {
      setPayError("Please provide phone, amount, and network type");
      setPayLoading(false);
      return;
    }

    try {
      let paymentData: any = {
        providerId: provider?.providerId,
        amount: payload.amount,
        phone: payload.phone,
        network_type: payload.network_type
      };

      if (paymentType === 'custom_service') {
        const customRequest = JSON.parse(
          sessionStorage.getItem('customServiceRequest') || '{}'
        );

        paymentData = {
          type: 'custom_service',
          providerId: provider?.providerId,
          amount: customQuote,
          phone: payload.phone,
          customQuote,
          customizations,
          serviceId: checkoutItems[0]?.productId || customRequest.service_id,
          network_type: payload.network_type
        };
      }

      const response = await fetch(`${API_BASE}/api/payments/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('customServiceRequest');
        setPayLoading(false);
        setPayError(null);
        setModalOpen(false); // Only close modal on actual success
        setPaymentStage('options');
        setSelectedPaymentMethod('direct');
        setEscrowDetails(null);
        onPaymentSuccess?.();
      } else {
        setPayLoading(false);
        const errorMsg = await response.text();
        setPayError(errorMsg || 'Payment failed.');
      }
    } catch (error) {
      setPayLoading(false);
      setPayError('Payment error: ' + error);
    }
  };

  // ESCROW PAYMENT
  const handleEscrowPayment = async (settings: {
    expectedArrival: string;
    autoReleaseDateTime: number;
    amount: number;
    phone: string;
    network_type?: 'mtn' | 'airtel';
  }) => {
    setPayLoading(true);
    setPayError(null);

    try {
      let paymentData: any = {
        items: checkoutItems,
        providerId: provider?.providerId,
        amount: settings.amount,
        expectedArrival: settings.expectedArrival,
        autoReleaseDatetime: settings.autoReleaseDateTime,
        phone: settings.phone,
        network_type: settings.network_type
      };

      if (paymentType === 'custom_service') {
        paymentData = {
          type: 'custom_service',
          customQuote,
          customizations,
          amount: customQuote,
          serviceId: checkoutItems[0]?.productId || JSON.parse(sessionStorage.getItem('customServiceRequest') || '{}').service_id,
          providerId: provider?.providerId,
          expectedArrival: settings.expectedArrival,
          autoReleaseDatetime: settings.autoReleaseDateTime,
          phone: settings.phone,
          network_type: settings.network_type
        };
      }

      const response = await fetch(`${API_BASE}/api/payments/escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('customServiceRequest');
        setPayLoading(false);
        setPayError(null);
        setModalOpen(false); // Only close modal on actual success
        setPaymentStage('options');
        setSelectedPaymentMethod('direct');
        setEscrowDetails(null);
        onPaymentSuccess?.();
      } else {
        setPayLoading(false);
        const errorMsg = await response.text();
        setPayError(errorMsg || 'Payment failed.');
      }
    } catch (error) {
      setPayLoading(false);
      setPayError('Escrow payment error: ' + error);
    }
  };

  // Calculate amounts separately
  const productItems = checkoutItems.filter(item => item.type === "product");
  const serviceItems = checkoutItems.filter(item => item.type === "service");

  const productTotal = productItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceTotal = serviceItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const customServiceTotal = customQuote !== null ? customQuote : 0;

  // Get the appropriate total amount based on payment type
  const getPaymentTotal = () => {
    switch (paymentType) {
      case 'custom_service':
        return customServiceTotal;
      case 'service':
        return serviceTotal;
      case 'product':
      default:
        return productTotal;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Only poll for quotes if it's NOT a custom service payment
    if (!isCustomServicePayment() && isCustomizationSubmitted && serviceItems.length > 0) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/custom-service-request/customer`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const data = await res.json();
          const request = data.find(
            (r: any) =>
              r.service_id === serviceItems[0].productId &&
              r.customer_id === localStorage.getItem("userId")
          );
          if (request && request.custom_price) {
            setCustomQuote(request.custom_price);
            clearInterval(interval);
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isCustomizationSubmitted, serviceItems]);

  // Add customization
  const handleCustomiseAdd = () => {
    if (customizationInput.trim()) {
      setCustomizations([...customizations, customizationInput.trim()]);
      setCustomizationInput("");
    }
  };

  // Delete customization
  const handleCustomiseDelete = (index: number) => {
    setCustomizations(customizations.filter((_, i) => i !== index));
  };

  // Handle clicking "Customize Service" button
  const handleCustomizeClick = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // If logged in, show customization mode
    setIsCustomizationMode(true);
  };

  // Submit customization
  const handleServiceCustomise = async () => {
    if (!serviceItems[0] || customizations.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/api/custom-service-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          serviceId: serviceItems[0].productId,
          customizations,
        }),
      });

      if (response.ok) {
        setIsCustomizationSubmitted(true);
      } else {
        console.error("Failed to submit customization");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // For custom service payments, show a simplified UI
  if (isCustomServicePayment()) {
    return (
      <div className={`p-6 max-w-6xl mx-auto min-h-screen ${bgColor}`}>
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? "text-hafi-teal-light" : "text-hafi-teal"}`}>
          Custom Service Payment
        </h1>

        {/* Provider Info */}
        {provider && (
          <div className={`border ${borderColor} rounded-lg p-4 mb-6 ${cardBg}`}>
            <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>Service Provider</h2>
            <p className={textColor}>Name: {provider.name}</p>
            <p className={textColor}>Contact: {provider.contactNumber}</p>
          </div>
        )}

        {/* Custom Service Summary */}
        <div className={`border ${borderColor} rounded-lg p-6 mb-6 ${cardBg}`}>
          <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>Service Summary</h2>

          <div className="mb-4">
            <h3 className={`font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Customizations
            </h3>
            <ul className={`space-y-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {customizations.map((customization, index) => (
                <li key={index} className="text-sm">
                  • {customization}
                </li>
              ))}
            </ul>
          </div>

          <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <p className={`text-lg font-semibold mb-4 ${textColor}`}>
              Final Price: ${Number(customServiceTotal).toFixed(2)}
            </p>
            <button
              onClick={() => handlePayment('custom_service')}
              className={`w-full py-3 rounded-lg font-semibold ${darkMode
                ? "bg-hafi-teal text-white hover:bg-teal-600"
                : "bg-hafi-teal text-white hover:bg-teal-600"
                } transition-colors`}
            >
              Proceed to Payment
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            setPaymentStage('options');
          }}
          title={paymentStage === 'options' ? 'Payment Options' : 'Mobile Money Payment'}
        >
          {paymentStage === 'options' ? (
            <PaymentOptions
              totalAmount={getPaymentTotal()}
              isService={true}
              onNext={(method, details) => {
                setSelectedPaymentMethod(method);
                setEscrowDetails(details);
                setPaymentStage('provider');
              }}
              onClose={() => setModalOpen(false)}
            />
          ) : (
            <Pay
              totalAmount={getPaymentTotal()}
              paymentMethod={selectedPaymentMethod}
              escrowDetails={escrowDetails}
              providerId={provider?.providerId}
              loading={payLoading}
              error={payError}
              onSuccess={async ({ network_type, phone, amount, escrowDetails, paymentMethod }) => {
                if (paymentMethod === "direct") {
                  await handleDirectPayment({ network_type, phone, amount });
                } else if (paymentMethod === "escrow") {
                  await handleEscrowPayment({
                    expectedArrival: escrowDetails.expectedArrival,
                    autoReleaseDateTime: escrowDetails.autoReleaseDateTime,
                    phone,
                    amount,
                    network_type,
                  });
                }
                // Do NOT close modal here, only in handlers if success.
              }}
            />
          )}
        </Modal>

        {/* Login Prompt Modal */}
        <Modal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="Login Required"
        >
          <div className="text-center py-6">
            <div className="mb-6">
              <svg
                className={`mx-auto h-16 w-16 ${darkMode ? "text-hafi-teal-light" : "text-hafi-teal"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              You need to have an account and be logged in to proceed with payment.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleLoginNavigation}
                className={`w-full px-8 py-3 rounded-lg font-semibold ${darkMode
                  ? "bg-hafi-teal text-white hover:bg-teal-600"
                  : "bg-hafi-teal text-white hover:bg-teal-600"
                  } transition-colors`}
              >
                Proceed to Login
              </button>

              <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Don't have an account?{" "}
                <button
                  onClick={() => navigate('/register', { state: { from: location.pathname + location.search } })}
                  className={`font-medium ${darkMode ? "text-hafi-teal-light hover:text-teal-400" : "text-hafi-teal hover:text-teal-600"
                    }`}
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Original PaymentPage UI for regular products/services from cart
  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen ${bgColor}`}>
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? "text-hafi-teal-light" : "text-hafi-teal"}`}>
        Payment
      </h1>

      {/* Provider Info */}
      {provider && (
        <div className={`border ${borderColor} rounded-lg p-4 mb-6 ${cardBg}`}>
          <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>Service Provider</h2>
          <p className={textColor}>Name: {provider.name}</p>
          <p className={textColor}>Contact: {provider.contactNumber}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Card - Left Side */}
        {productItems.length > 0 && (
          <div className={`border ${borderColor} rounded-lg p-4 ${cardBg}`}>
            <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>Products</h2>

            {productItems.map((item) => (
              <div key={item.id} className={`flex items-center gap-4 border-b ${borderColor} pb-4 mb-4`}>
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${textColor}`}>{item.name}</h3>
                  <p className={textColor}>
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            <div className={`border-t ${borderColor} pt-4`}>
              <p className={`text-lg font-semibold mb-4 ${textColor}`}>
                Product Total: ${productTotal.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mb-4">Paid immediately to provider</p>
              <button
                onClick={() => handlePayment('product')}
                className={`w-full py-2 rounded ${darkMode
                  ? "bg-hafi-teal/50 text-white hover:bg-hafi-teal"
                  : "bg-hafi-teal text-white hover:bg-hafi-green"
                  } transition-colors`}
              >
                Pay Now
              </button>
            </div>
          </div>
        )}

        {/* Services Card - Right Side - ONLY show customization for regular services */}
        {serviceItems.length > 0 && (
          <div className={`border ${borderColor} rounded-lg p-4 ${cardBg}`}>
            <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>Services</h2>

            {serviceItems.map((item) => (
              <div key={item.id} className={`flex items-center gap-4 border-b ${borderColor} pb-4 mb-4`}>
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${textColor}`}>{item.name}</h3>
                  <p className={textColor}>
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            <div className={`border-t ${borderColor} pt-4`}>
              <p className={`text-lg font-semibold mb-4 ${textColor}`}>
                Service Total: ${serviceTotal.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mb-4">Held in escrow until completion</p>

              {!isCustomizationSubmitted ? (
                <>
                  {!isCustomizationMode ? (
                    <div className="flex gap-3 ">
                      <button
                        onClick={() => handlePayment('service')}
                        className="flex-1 w-full py-2 bg-hafi-teal text-white rounded"
                      >
                        Book Without Customization
                      </button>
                      <button
                        onClick={handleCustomizeClick}
                        className="flex-1 w-full py-2 bg-hafi-green text-white rounded"
                      >
                        Customize Service
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-lg font-semibold ${textColor}`}>
                          Customization Requests
                        </h3>
                        <button
                          onClick={() => setIsCustomizationMode(false)}
                          className="px-3 py-1 text-hafi-teal hover:text-hafi-green"
                        >
                          ← Back
                        </button>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={customizationInput}
                          onChange={(e) => setCustomizationInput(e.target.value)}
                          placeholder="Enter customization (e.g. Extra colors)"
                          className={`flex-1 border p-2 rounded 
      ${darkMode
                              ? "text-white bg-gray-800 placeholder-gray-400 border-gray-600"
                              : "text-black bg-white placeholder-gray-500 border-gray-300"
                            }`}
                        />

                        <button
                          onClick={handleCustomiseAdd}
                          className={`px-4 py-2 text-white rounded 
      ${darkMode ? "bg-hafi-teal-light" : "bg-hafi-teal"}
    `}
                        >
                          Add
                        </button>
                      </div>


                      {customizations.length > 0 && (
                        <ul className="mb-4 space-y-2">
                          {customizations.map((c, idx) => (
                            <li key={idx} className={`flex items-center justify-between ${textColor}`}>
                              <span>{idx + 1}. {c}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setCustomizationInput(c);
                                    setCustomizations(customizations.filter((_, i) => i !== idx));
                                  }}
                                  className="px-2 text-sm text-hafi-teal hover:text-hafi-green"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCustomiseDelete(idx)}
                                  className="px-2 text-sm text-red-500 hover:text-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        onClick={handleServiceCustomise}
                        disabled={customizations.length === 0}
                        className={`w-full py-2 bg-hafi-teal text-white rounded ${customizations.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                      >
                        Submit Customization
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>
                    Waiting for Provider Quote...
                  </h3>
                  {customQuote !== null && (
                    <>
                      <div className="mb-4">
                        <p className={`font-medium mb-2 ${textColor}`}>Custom Price: ${customQuote.toFixed(2)}</p>
                        <ul className="space-y-1">
                          {customizations.map((c, idx) => (
                            <li key={idx} className={textColor}>
                              {idx + 1}. {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => handlePayment('service')}
                        className="w-full py-2 bg-hafi-teal text-white rounded"
                      >
                        Accept & Pay
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setPaymentStage('options');
        }}
        title={paymentStage === 'options' ? 'Payment Options' : 'Mobile Money Payment'}
      >
        {paymentStage === 'options' ? (
          <PaymentOptions
            totalAmount={getPaymentTotal()}
            isService={paymentType === 'service' || paymentType === 'custom_service'}
            onNext={(method, details) => {
              setSelectedPaymentMethod(method);
              setEscrowDetails(details);
              setPaymentStage('provider');
            }}
            onClose={() => setModalOpen(false)}
          />
        ) : (
          <Pay
            totalAmount={getPaymentTotal()}
            paymentMethod={selectedPaymentMethod}
            escrowDetails={escrowDetails}
            providerId={provider?.providerId}
            loading={payLoading}
            error={payError}
            onSuccess={async ({ network_type, phone, amount, escrowDetails, paymentMethod }) => {
              if (paymentMethod === "direct") {
                await handleDirectPayment({ network_type, phone, amount });
              } else if (paymentMethod === "escrow") {
                await handleEscrowPayment({
                  expectedArrival: escrowDetails.expectedArrival,
                  autoReleaseDateTime: escrowDetails.autoReleaseDateTime,
                  phone,
                  amount,
                  network_type,
                });
              }
              // Do NOT close modal here, only in handlers if success.
            }}
          />
        )}
      </Modal>
      {/* Optionally show error at the modal level too */}
      {payError && (
        <div className="mt-4 text-red-600 text-center">{payError}</div>
      )}

      {/* Login Prompt Modal */}
      <Modal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Login Required"
      >
        <div className="text-center py-6">
          <div className="mb-6">
            <svg
              className={`mx-auto h-16 w-16 ${darkMode ? "text-hafi-teal-light" : "text-hafi-teal"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            You need to have an account and be logged in to proceed with payment.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleLoginNavigation}
              className={`w-full px-8 py-3 rounded-lg font-semibold ${darkMode
                ? "bg-hafi-teal text-white hover:bg-teal-600"
                : "bg-hafi-teal text-white hover:bg-teal-600"
                } transition-colors`}
            >
              Proceed to Login
            </button>

            <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              Don't have an account?{" "}
              <button
                onClick={() => navigate('/register', { state: { from: location.pathname + location.search } })}
                className={`font-medium ${darkMode ? "text-hafi-teal-light hover:text-teal-400" : "text-hafi-teal hover:text-teal-600"
                  }`}
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentPage;