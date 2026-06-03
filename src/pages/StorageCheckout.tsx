import { useDarkMode } from '@/context/DarkMode';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AirtelIcon from '../pages/images/airtel money.png';
import MtnIcon from '../pages/images/mtn.png';

type PaymentMethod = 'mtn' | 'airtel' | 'wallet';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function StorageCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const storageAmount = parseFloat(params.get('storage_amount') || '0');
  const storageUnit = params.get('storage_unit') || 'GB';
  const renewOnly = params.get('renew_only') === 'true';
  // price_new: price for newly added storage only; price_total: total to charge (existing + new when applicable)
  const priceNew = parseFloat(params.get('price_new') || params.get('price') || '0');
  const priceTotal = parseFloat(params.get('price_total') || params.get('price') || '0');

  const requestedType = params.get('type'); // 'base' or 'addon'

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mtn');
  const [formData, setFormData] = useState({ mtnPhone: '', airtelPhone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [userStoragePlan, setUserStoragePlan] = useState<any>(null);
  const [planInfo, setPlanInfo] = useState<any>(null);

  const { darkMode } = useDarkMode();

  // Convert storage to GB for backend
  const convertToGB = (amount: number, unit: string): number => {
    switch (unit.toUpperCase()) {
      case 'MB': return amount / 1024;
      case 'GB': return amount;
      case 'TB': return amount * 1024;
      default: return amount;
    }
  };

  const formatStorageAmount = (amount: number, unit: string): string => {
    if (amount < 1 && unit === 'GB') {
      return `${Math.round(amount * 1024)}MB`;
    }
    return `${amount}${unit}`;
  };

  // Fetch user's current storage plan and plan-info (add-ons) to show checkout context
  useEffect(() => {
    const loadStorageContext = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        // Current storage plan
        try {
          const res = await fetch(`${API_BASE}/api/storage-plan`, { headers });
          if (res.ok) {
            const data = await res.json();
            console.log('Fetched user storage plan:', data);
            if (data.success) {
              setUserStoragePlan(data.data);
            }
          }
        } catch (err) {
          console.error('Error checking storage plan:', err);
        }

        // Plan info (includes additional_storage_purchased_gb)
        try {
          const res2 = await fetch(`${API_BASE}/api/user/plan-info`, { headers });
          if (res2.ok) {
            const data2 = await res2.json();
            console.log('Fetched user plan info for storage checkout:', data2);
            if (data2?.plan_info) {
              setPlanInfo(data2.plan_info);
            }
          }
        } catch (err) {
          console.error('Error fetching user plan-info for storage checkout:', err);
        }
      } catch (e) {
        console.error('Error loading storage checkout context:', e);
      }
    };

    loadStorageContext();
  }, []);

  // Validate purchase parameters
  useEffect(() => {
    // Always require type and total price
    if (!requestedType || !priceTotal) {
      setError('Invalid storage purchase parameters');
      return;
    }

    // For add-on purchases we may allow 0 new amount if renew_only=true and an existing add-on > 0
    if (requestedType === 'addon') {
      const existingAddonGb = planInfo?.additional_storage_purchased_gb ?? 0;

      if (storageAmount <= 0) {
        if (!renewOnly) {
          setError('Please enter a storage amount greater than 0 GB.');
          return;
        }

        if (renewOnly && existingAddonGb <= 0) {
          setError('You have no existing add-on to renew. Please add some storage.');
          return;
        }
      }
    } else {
      // Base plan purchase must always have a positive storage amount
      if (storageAmount <= 0) {
        setError('Please enter a storage amount greater than 0 GB.');
        return;
      }
    }

    // If we reach here, parameters are valid
    setError(null);
  }, [requestedType, storageAmount, priceTotal, renewOnly, planInfo]);

  // Poll for payment status
  const pollPaymentStatus = async (refId: string, attempts = 0) => {
    const maxAttempts = 20; // 2 minutes of polling (6 seconds intervals)

    if (attempts >= maxAttempts) {
      setResultMsg('Payment verification timed out. Please check your storage balance.');
      setPolling(false);
      return;
    }

    // Polling is intentionally disabled in strict callback-only mode.
    // The server will finalize the transaction only when the MoMo provider posts to the
    // /api/storage/purchase/momo/callback webhook. This client-side poll remains here
    // for reference but will not perform completion actions to avoid double-finalization.
    return;
  };

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limited = digits.slice(0, 10);
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

  const handleStoragePurchase = async () => {
    // Validate phone for mobile money
    if ((selectedMethod === 'mtn' && !formData.mtnPhone) ||
      (selectedMethod === 'airtel' && !formData.airtelPhone)) {
      setResultMsg('Please enter your phone number for the selected mobile money.');
      return;
    }

    setSubmitting(true);
    setResultMsg(null);

    try {
      const token = localStorage.getItem('token');
      let storageGB = convertToGB(storageAmount, storageUnit);

      // For renew-only addon payments, use the existing add-on size so size_gb is positive
      if (requestedType === 'addon' && renewOnly) {
        const existingAddonGb = planInfo?.additional_storage_purchased_gb ?? 0;
        storageGB = existingAddonGb > 0 ? existingAddonGb : storageGB;
      }

      let endpoint = '';
      const payload: any = {
        storage_gb: storageGB,
        amount: priceTotal,
        storage_display: formatStorageAmount(storageAmount, storageUnit),
        purchase_type: requestedType, // 'base' or 'addon'
        renew_only: renewOnly
      };

      if (selectedMethod === 'mtn') {
        endpoint = `${API_BASE}/api/storage/purchase/mtn`;
        payload.phone = formData.mtnPhone;
      } else if (selectedMethod === 'airtel') {
        endpoint = `${API_BASE}/api/storage/purchase/airtel`;
        payload.phone = formData.airtelPhone;
      } else if (selectedMethod === 'wallet') {
        endpoint = `${API_BASE}/api/storage/purchase/wallet`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setResultMsg(`Storage purchase failed: ${data.error || 'Unknown error'}`);
        setSubmitting(false);
        return;
      }

      if (selectedMethod === 'wallet') {
        setResultMsg('Storage purchased successfully with wallet!');
        setTimeout(() => navigate('/storage-dashboard'), 2000);
      } else {
        // Handle MoMo response
        if (data.success && data.data.referenceId) {
          setReferenceId(data.data.referenceId);
          setResultMsg('Payment initiated. Please check your phone for the payment prompt. The purchase will be completed when the mobile payment is confirmed by the provider.');
          // Do NOT poll the status endpoint to mark completion here. Completion must come from the provider webhook.
        } else {
          setResultMsg('Failed to initiate payment. Please try again.');
        }
      }

    } catch (err: any) {
      setResultMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-900'}`}>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-md mx-auto">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Purchase Storage
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
              Add more storage to your account
            </p>
          </div>

          {/* Storage Details */}
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              Storage Purchase Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Type:</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {requestedType === 'base' ? 'Base Storage Plan' : 'Additional Storage'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Amount:</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatStorageAmount(storageAmount, storageUnit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Price (new add-on):</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {priceNew.toLocaleString()} RWF
                </span>
              </div>
            </div>

            {/* Add-on summary when purchasing additional storage */}
            {requestedType === 'addon' && (
              <div className={`mt-4 pt-3 border-t text-xs ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}>
                {(() => {
                  const currentAddonGb = planInfo?.additional_storage_purchased_gb ?? 0;
                  const purchasedAddonGb = convertToGB(storageAmount, storageUnit) || 0;
                  const totalAddonGb = currentAddonGb + purchasedAddonGb;

                  return (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>Total Add-on after purchase:</span>
                        <span className="font-semibold">{totalAddonGb.toFixed(2)} GB</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Total Price:</span>
                        <span className="font-semibold">{priceTotal.toLocaleString()} RWF</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Current Plan Status */}
            {userStoragePlan && (
              <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                <h4 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Current Storage Plan
                </h4>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Storage:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {userStoragePlan.storagePlanGb}GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status:</span>
                    <span className={`font-medium ${userStoragePlan.status === 'active'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                      }`}>
                      {userStoragePlan.status === 'active' ? 'Active' : 'Expired'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Informational Messages */}
            {requestedType === 'addon' && userStoragePlan?.status === 'expired' && (
              <div className={`mt-3 p-2 rounded text-xs ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-900'}`}>
                ℹ️ Your base plan has expired. This will add storage as an addon to your account.
              </div>
            )}

            {requestedType === 'base' && userStoragePlan?.status === 'active' && (
              <div className={`mt-3 p-2 rounded text-xs ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-900'}`}>
                ℹ️ You already have an active plan. This will replace your current base storage.
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Choose Payment Method
            </h3>
            <div className="space-y-3">
              {/* MTN Option */}
              <div
                onClick={() => setSelectedMethod('mtn')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'mtn'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : `border-gray-300 ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'hover:border-gray-400'}`
                  }`}
              >
                <div className="flex items-center">
                  <img src={MtnIcon} alt="MTN MoMo" className="w-8 h-8 mr-3" />
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    MTN Mobile Money
                  </span>
                </div>
              </div>

              {/* Airtel Option */}
              <div
                onClick={() => setSelectedMethod('airtel')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'airtel'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : `border-gray-300 ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'hover:border-gray-400'}`
                  }`}
              >
                <div className="flex items-center">
                  <img src={AirtelIcon} alt="Airtel Money" className="w-8 h-8 mr-3" />
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Airtel Money
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Phone Input for Mobile Money */}
          {(selectedMethod === 'mtn' || selectedMethod === 'airtel') && (
            <div className="mb-6">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
              </label>
              <input
                type="text"
                placeholder="078 123 4567"
                value={selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone}
                onChange={(e) => handleInputChange(e, selectedMethod)}
                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handleStoragePurchase}
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
              }`}
          >
            {submitting
              ? 'Processing...'
              : `Purchase ${requestedType === 'base' ? 'Base Plan' : 'Additional Storage'} for ${priceTotal.toLocaleString()} RWF`
            }
          </button>

          {/* Result Message */}
          {resultMsg && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${resultMsg.includes('failed') || resultMsg.includes('Error')
                ? darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-900'
                : darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-900'
              }`}>
              <div className="flex items-center">
                {polling && (
                  <div className="mr-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  </div>
                )}
                {resultMsg}
              </div>
              {/* In strict callback-only mode we don't poll. Show simulation button in dev only. */}
              {import.meta.env.DEV && referenceId && (
                <div className="mt-2">
                  <button
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        const res = await fetch(`${API_BASE}/api/storage/purchase/momo/callback`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ referenceId, status: 'SUCCESSFUL', reason: 'dev-simulated' })
                        });
                        const d = await res.json();
                        if (res.ok) {
                          setResultMsg('Simulated callback: purchase completed.');
                          setTimeout(() => navigate('/storage-dashboard'), 1200);
                        } else {
                          setResultMsg(`Simulate callback failed: ${d.error || d.message || res.status}`);
                        }
                      } catch (e: any) {
                        setResultMsg(`Simulate callback error: ${e.message}`);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="mt-2 px-3 py-1 rounded bg-gray-200 text-sm"
                  >
                    Simulate MoMo Callback (dev only)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}