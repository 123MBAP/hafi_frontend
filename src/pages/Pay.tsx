import { useDarkMode } from '@/context/DarkMode';
import { useEffect, useState } from 'react';
import AirtelIcon from './images/airtel money.png';
import MtnIcon from './images/mtn.png';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface PayProps {
  totalAmount: number;
  onSuccess?: (payload: {
    network_type: 'mtn' | 'airtel';
    phone: string;
    amount: number;
    escrowDetails?: any;
    paymentMethod: 'direct' | 'escrow';
    onClose?: () => void;
    onBack?: () => void;
  }) => Promise<void> | void;
  paymentMethod: 'direct' | 'escrow';
  escrowDetails?: any;
  onClose?: () => void;
  onBack?: () => void;
  providerId?: string;
    loading?: boolean; // <-- add this
  error?: string | null; // <-- add this
}

const icons: Record<string, string> = {
  mtn: MtnIcon,
  airtel: AirtelIcon,
};

export default function Pay({
  totalAmount,
  onSuccess,
  paymentMethod,
  escrowDetails,
  providerId,
  onBack,
  onClose,
}: PayProps) {
  const [activeNetwork, setActiveNetwork] = useState<'mtn' | 'airtel'>('mtn');
  const { darkMode } = useDarkMode();
  const [availableNetworkTypes, setAvailableNetworkTypes] = useState<('mtn' | 'airtel')[]>(['mtn', 'airtel']);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  type FormData = {
    mtnPhone: string;
    airtelPhone: string;
    [key: string]: string;
  };

  const [formData, setFormData] = useState<FormData>({
    mtnPhone: '',
    airtelPhone: '',
  });

  useEffect(() => {
    async function loadNetworkTypes() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/providers/${providerId}/network_types`);
        const data = await res.json();
        
        if (Array.isArray(data.types)) {
          setAvailableNetworkTypes(data.types as ('mtn' | 'airtel')[]);
        } else if (data.methods) {
          setAvailableNetworkTypes(Object.keys(data.methods) as ('mtn' | 'airtel')[]);
        } else if (data.networks) {
          setAvailableNetworkTypes(data.networks as ('mtn' | 'airtel')[]);
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMessage('Failed to load payment options');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (providerId) {
      loadNetworkTypes();
    }
  }, [providerId]);

  // Reset Pay state whenever paymentMethod changes
  useEffect(() => {
    setActiveNetwork('mtn');
    setFormData({ mtnPhone: '', airtelPhone: '' });
    setStatus('idle');
  }, [paymentMethod]);

  // Utility: format as 078 123 4567
  const formatPhoneNumber = (value: string) => {
    // Strip non-digits
    const digits = value.replace(/\D/g, "");
    // Limit to 10 digits max
    const limited = digits.slice(0, 10);

    // Add spaces after 3rd and 6th digit
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    networkType: 'mtn' | 'airtel'
  ) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = formatPhoneNumber(raw);

    setFormData((prev) => ({
      ...prev,
      [networkType + 'Phone']: formatted,
    }));
  };

  const handlePay = async (network_type: 'mtn' | 'airtel') => {
    const formatted = formData[network_type + 'Phone'];
    const phone = formatted.replace(/\s/g, "");

    // Basic validation: must start with 07 and be 10 digits
    const phoneRegex = /^07\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setStatus('error');
      setErrorMessage('Please enter a valid Rwandan phone number (format: 07XXXXXXXX).');
      return;
    }

    try {
      setStatus('processing');
      setIsLoading(true);
      
      if (onSuccess) {
        await onSuccess({
          network_type,
          phone,
          amount: totalAmount,
          escrowDetails,
          paymentMethod,
        });
      }

      setStatus('success');
      
      // Reset after success
      setTimeout(() => {
        setActiveNetwork('mtn');
        setFormData({ mtnPhone: '', airtelPhone: '' });
        setStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Payment failed:', error);
      setStatus('error');
      setErrorMessage('Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={() => onBack()}
                className={`p-2 rounded-full mr-2 transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold">Payment</h2>
          </div>
          {onClose && (
            <button
              onClick={() => onClose()}
              className={`p-2 rounded-full transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Method Info */}
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            darkMode
              ? 'bg-gray-700'
              : 'bg-blue-50 border border-blue-100'
          }`}>
            <div className={`p-2 rounded-full mr-3 ${
              paymentMethod === 'direct' 
                ? (darkMode ? 'bg-blue-600' : 'bg-blue-100 text-blue-600')
                : (darkMode ? 'bg-purple-600' : 'bg-purple-100 text-purple-600')
            }`}>
              {paymentMethod === 'direct' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium">
                {paymentMethod === 'direct'
                  ? 'Direct to Provider'
                  : 'Escrow Protection'}
              </p>
              {paymentMethod === 'escrow' && escrowDetails && (
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Expected arrival: {escrowDetails.expectedArrival}
                </p>
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div className={`mb-6 p-4 rounded-lg text-center ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Total Amount</p>
            <p className="text-2xl font-bold">{totalAmount.toLocaleString()} RWF</p>
          </div>

          {/* Status Indicators */}
          {status === 'processing' && (
            <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800 dark:border-blue-200 mr-2"></div>
              Processing your payment...
            </div>
          )}

          {status === 'success' && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Payment successful!
            </div>
          )}

          {status === 'error' && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Network Selection */}
          <div className="mb-6">
            <p className={`mb-3 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select Payment Method</p>
            <div className="flex gap-3">
              {isLoading ? (
                <div className="flex justify-center w-full py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                </div>
              ) : (
                availableNetworkTypes
                  .filter((networkType) => networkType === "mtn" || networkType === "airtel")
                  .map((networkType: "mtn" | "airtel") => (
                    <button
                      key={networkType}
                      onClick={() => setActiveNetwork(networkType)}
                      disabled={status === 'processing'}
                      className={`flex-1 p-3 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                        activeNetwork === networkType
                          ? networkType === "mtn"
                            ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                            : 'border-red-500 bg-red-500 bg-opacity-10'
                          : darkMode
                          ? 'border-gray-700 bg-gray-700'
                          : 'border-gray-200 bg-gray-100'
                      } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                    >
                      <div className={`p-2 rounded-full ${networkType === "mtn" ? 'bg-yellow-100' : 'bg-red-100'}`}>
                        <img
                          src={icons[networkType]}
                          alt={networkType.toUpperCase()}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <span className="font-medium text-sm">
                        {networkType.toUpperCase()}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div className={`p-5 rounded-xl ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              activeNetwork === 'mtn' 
                ? (darkMode ? 'text-yellow-400' : 'text-yellow-600')
                : (darkMode ? 'text-red-400' : 'text-red-600')
            }`}>
              {activeNetwork === 'mtn' ? 'MTN MoMo Payment' : 'Airtel Money Payment'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block mb-2 text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>+250</span>
                  </div>
                  <input
                    type="text"
                    placeholder={activeNetwork === 'mtn' ? "78XXXXXXX" : "73XXXXXXX"}
                    value={formData[activeNetwork + 'Phone']}
                    onChange={(e) => handleInputChange(e, activeNetwork)}
                    disabled={status === 'processing'}
                    className={`w-full pl-14 pr-3 py-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-600 text-gray-100 border-gray-500'
                        : 'bg-white text-gray-900 border-gray-300'
                    } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block mb-2 text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Amount
                </label>
                <input
                  type="text"
                  value={`${totalAmount.toLocaleString()} RWF`}
                  readOnly
                  className={`w-full px-3 py-3 rounded-lg border cursor-not-allowed ${
                    darkMode
                      ? 'bg-gray-600 text-gray-100 border-gray-500'
                      : 'bg-gray-100 text-gray-900 border-gray-300'
                  }`}
                />
              </div>
              
              <button
                onClick={() => handlePay(activeNetwork)}
                disabled={status === 'processing' || !formData[activeNetwork + 'Phone']}
                className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center ${
                  activeNetwork === 'mtn'
                    ? darkMode
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : darkMode
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                } ${status === 'processing' || !formData[activeNetwork + 'Phone'] ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {status === 'processing' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>

          {/* Payment Notice */}
          <p className={`text-xs mt-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            You will receive a confirmation message on your phone to complete the payment
          </p>
        </div>
      </div>
    </div>
  );
}