import { useDarkMode } from '@/context/DarkMode';
import { useState } from 'react';

interface PaymentOptionsProps {
  totalAmount: number;
  isService?: boolean;
  onNext: (method: 'direct' | 'escrow', details?: any) => void;
  onClose: () => void;
}

export function PaymentOptions({ totalAmount, isService, onNext, onClose }: PaymentOptionsProps) {
  const { darkMode } = useDarkMode();
  const [paymentMethod, setPaymentMethod] = useState<'direct' | 'escrow'>('direct');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [autoReleaseDateTime, setAutoReleaseDateTime] = useState('');

  // Helper to enforce min release date >= expected arrival
  const minAutoReleaseDateTime = expectedArrival || new Date().toISOString().slice(0,16); // YYYY-MM-DDTHH:mm

  return (
    <div className={`space-y-4 p-6 rounded-md ${darkMode ? 'bg-gray-900 text-gray-100 border border-gray-700' : 'bg-white text-gray-900 shadow'}`}>

      {/* Payment Method Selection */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100'}`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-black'}`}>
          Select Payment Method
        </h3>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              checked={paymentMethod === 'direct'}
              onChange={() => setPaymentMethod('direct')}
              className={`form-radio h-4 w-4 ${darkMode ? 'text-hafi-teal bg-gray-700 border-gray-600' : 'text-hafi-teal'}`}
            />
            <div>
              <span className={darkMode ? 'text-white' : 'text-black'}>Direct to Provider</span>
              <p className={darkMode ? 'text-gray-300 text-sm' : 'text-gray-500 text-sm'}>Money sent immediately to the service provider</p>
            </div>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              checked={paymentMethod === 'escrow'}
              onChange={() => setPaymentMethod('escrow')}
              className={`form-radio h-4 w-4 ${darkMode ? 'text-hafi-teal bg-gray-700 border-gray-600' : 'text-hafi-teal'}`}
            />
            <div>
              <span className={darkMode ? 'text-white' : 'text-black'}>Haficonnect Secure Hold</span>
              <p className={darkMode ? 'text-gray-300 text-sm' : 'text-gray-500 text-sm'}>
                Money is held until you confirm receipt or auto-release date.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Escrow Options */}
      {paymentMethod === 'escrow' && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-black'}`}>
            Delivery & Auto-Release Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                Expected Arrival Date & Time
              </label>
              <input
                type="datetime-local"
                value={expectedArrival}
                onChange={(e) => setExpectedArrival(e.target.value)}
                min={new Date().toISOString().slice(0,16)}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                Auto-Release Date & Time
              </label>
              <input
                type="datetime-local"
                value={autoReleaseDateTime}
                onChange={(e) => setAutoReleaseDateTime(e.target.value)}
                min={minAutoReleaseDateTime}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              {autoReleaseDateTime && autoReleaseDateTime < expectedArrival && (
                <p className="text-red-500 text-sm mt-1">Auto-release must be after expected arrival</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100'}`}>
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
          Payment Summary
        </h3>
        <p className={darkMode ? 'text-gray-100' : 'text-black'}>Total Amount: {totalAmount} RWF</p>
        {paymentMethod === 'escrow' && (
          <p className="text-sm text-hafi-teal mt-1">
            Your payment will be held securely until delivery confirmation or auto-release.
          </p>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={() => onNext(paymentMethod, { expectedArrival, autoReleaseDateTime })}
        disabled={paymentMethod === 'escrow' && (!expectedArrival || !autoReleaseDateTime || autoReleaseDateTime < expectedArrival)}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          darkMode
            ? 'bg-hafi-teal text-white hover:bg-hafi-teal-dark'
            : 'bg-hafi-green text-white hover:bg-hafi-teal'
        } ${paymentMethod === 'escrow' && (!expectedArrival || !autoReleaseDateTime || autoReleaseDateTime < expectedArrival) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Continue to Payment
      </button>
    </div>
  );
}
