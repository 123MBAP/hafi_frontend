import { useDarkMode } from '@/context/DarkMode';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AirtelIcon from '../../pages/images/airtel money.png';
import MtnIcon from '../../pages/images/mtn.png';
import StorageCheckout from '../../pages/StorageCheckout';
import { useAuth } from '@/context/AuthContext';
// import WalletIcon from '../../pages/images/wallet.png';

type PaymentMethod = 'mtn' | 'airtel' | 'wallet';
type PlanFromDB = {
  id?: number;
  name?: string;
  display_name?: string;
  fee?: number;
  price?: number;
  amount?: number;
  features?: string | string[];
};
type FormData = { mtnPhone: string; airtelPhone: string };

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function ProviderUpgradePaymentPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const planParam = params.get('plan') || '';
  const typeParam = params.get('type') || '';

  // If this is a storage purchase, render the StorageCheckout component
  if (typeParam === 'storage_addon') {
    return <StorageCheckout />;
  }

  const [plans, setPlans] = useState<PlanFromDB[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mtn');
  const [formData, setFormData] = useState<FormData>({ mtnPhone: '', airtelPhone: '' });
  const [selectedPlan, setSelectedPlan] = useState<PlanFromDB | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing'>('idle');
  const { token } = useAuth();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const referenceIdRef = useRef<string | null>(null);
  const { darkMode } = useDarkMode();



  // Fetch plans
  useEffect(() => {
    let mounted = true;
    async function fetchPlans() {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch(`${API_BASE}/api/provider/upgrade/plans`, { headers });
        const text = await res.text().catch(() => null);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
          throw new Error(`Failed to load plans (${res.status}) ${text || ''}`);
        }
        const data: PlanFromDB[] = text ? JSON.parse(text) : [];
        if (mounted) {
          setPlans(data);
          const selected =
            data.find(p =>
              String(p.name ?? p.display_name ?? p.id ?? '')
                .toLowerCase()
                .localeCompare(planParam.toLowerCase(), undefined, { sensitivity: 'base' }) === 0
            ) || data[0] || null;
          setSelectedPlan(selected);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch plans');
          setPlans([]);
        }
      }
    }
    fetchPlans();
    return () => {
      mounted = false;
    };
  }, [planParam, token]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const parseFeatures = (raw?: string | string[]) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw as string);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return String(raw).split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const getPrice = (p?: PlanFromDB) => (p?.fee ?? p?.price ?? p?.amount ?? 0);
  const getTitle = (p?: PlanFromDB) => (p?.display_name ?? p?.name ?? 'Plan');

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

  const pollPaymentStatus = async (refId: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE}/api/provider/upgrade/status/${refId}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'SUCCESSFUL' || data.status === 'FAILED') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setResultMsg(`Payment ${data.status}`);
        setSubmitting(false);
        setStatus('idle');
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    // Validate phone for mobile money
    if ((selectedMethod === 'mtn' && !formData.mtnPhone) || 
        (selectedMethod === 'airtel' && !formData.airtelPhone)) {
      setResultMsg('Please enter your phone number for the selected mobile money.');
      return;
    }

    setSubmitting(true);
    setStatus('processing');
    setResultMsg(null);

    try {
      let endpoint = '';
      const payload: any = {
        amount: getPrice(selectedPlan),
        planId: selectedPlan.id ?? null,
        plan: getTitle(selectedPlan),
      };

      if (selectedMethod === 'mtn') {
        endpoint = `${API_BASE}/api/provider/upgrade/subscribe/mtn`;
        payload.phone = formData.mtnPhone;
      } else if (selectedMethod === 'airtel') {
        endpoint = `${API_BASE}/api/provider/upgrade/subscribe/airtel`;
        payload.phone = formData.airtelPhone;
      } else if (selectedMethod === 'wallet') {
        endpoint = `${API_BASE}/api/provider/upgrade/subscribe/wallet`;
      }

      if (!endpoint) return;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => null);
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        setResultMsg(`Subscription failed (${res.status}) ${text || ''}`);
        setSubmitting(false);
        setStatus('idle');
      } else {
        if ((selectedMethod === 'mtn' || selectedMethod === 'airtel') && data?.success && data.referenceId) {
          referenceIdRef.current = data.referenceId;
          setResultMsg(`Pending payment…`);
          // Start polling every 5 seconds
          pollingRef.current = setInterval(() => {
            if (referenceIdRef.current) pollPaymentStatus(referenceIdRef.current);
          }, 5000);
        } else if (data?.success) {
          setResultMsg('Subscription successful.');
          setSubmitting(false);
          setStatus('idle');
        } else {
          setResultMsg('Subscription request submitted.');
          setSubmitting(false);
          setStatus('idle');
        }
      }
    } catch (err: any) {
      setResultMsg(err.message || 'Network error while subscribing');
      setSubmitting(false);
      setStatus('idle');
    }
  };

  // Dark mode colors
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-[#fafafa]';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  if (error) {
    return (
      <div className={`p-6 max-w-xl mx-auto min-h-screen ${bgColor} ${textColor}`}>
        <h1 className="text-2xl font-bold text-center mb-4">Upgrade</h1>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (plans === null) {
    return (
      <div className={`p-6 max-w-xl mx-auto min-h-screen ${bgColor} ${textColor}`}>
        <h1 className="text-2xl font-bold text-center mb-4">Upgrade</h1>
        <div className="text-center">Loading plans…</div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className={`p-6 max-w-xl mx-auto min-h-screen ${bgColor} ${textColor}`}>
        <h1 className="text-2xl font-bold text-center mb-4">Upgrade</h1>
        <div className="text-center">No plans available.</div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-3xl mx-auto min-h-screen ${bgColor}`}>
      <h1 className={`text-2xl font-bold text-center mb-6 ${textColor}`}>Upgrade</h1>

      {/* Plans selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {plans.map(p => {
          const title = getTitle(p);
          const price = getPrice(p);
          const active = p.id === selectedPlan?.id;
          return (
            <button
              key={p.id ?? title}
              onClick={() => setSelectedPlan(p)}
              className={`text-left p-4 rounded-lg border transition-colors ${
                active 
                  ? 'border-green-600 bg-green-500 text-white' 
                  : `${borderColor} ${cardBg} ${textColor} hover:border-green-400`
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className={`text-sm ${active ? 'text-green-100' : secondaryTextColor}`}>
                    {price.toLocaleString()} RWF / month
                  </div>
                </div>
                {active && (
                  <div className={`text-sm font-medium ${active ? 'text-white' : 'text-green-700'}`}>
                    Selected
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected plan details */}
      {selectedPlan && (
        <div className={`mb-6 p-6 rounded-lg border ${borderColor} ${cardBg}`}>
          <h2 className={`font-semibold text-lg mb-4 ${textColor}`}>
            {getTitle(selectedPlan)} - {getPrice(selectedPlan).toLocaleString()} RWF
          </h2>
          
          <div className="mb-6">
            <h3 className={`font-medium mb-3 ${textColor}`}>Features:</h3>
            <div className={`text-sm ${secondaryTextColor} space-y-1`}>
              {(parseFeatures(selectedPlan.features) || []).map((f, i) => (
                <div key={i} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="mb-6">
            <h3 className={`font-medium mb-3 ${textColor}`}>Payment Method:</h3>
            <div className="flex gap-3 mb-4">
              <button 
                onClick={() => setSelectedMethod('mtn')} 
                className={`flex-1 p-3 rounded-lg border transition-colors flex items-center justify-center ${
                  selectedMethod === 'mtn' 
                    ? 'bg-yellow-500 text-white border-yellow-500' 
                    : `${borderColor} ${cardBg} ${textColor} hover:border-yellow-400`
                }`}
              >
                <img src={MtnIcon} alt="MTN" className="w-6 h-6 mr-2" /> 
                <span className="font-semibold">MTN</span>
              </button>
              <button 
                onClick={() => setSelectedMethod('airtel')} 
                className={`flex-1 p-3 rounded-lg border transition-colors flex items-center justify-center ${
                  selectedMethod === 'airtel' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : `${borderColor} ${cardBg} ${textColor} hover:border-red-400`
                }`}
              >
                <img src={AirtelIcon} alt="Airtel" className="w-6 h-6 mr-2" /> 
                <span className="font-semibold">Airtel</span>
              </button>
              {/* <button 
                onClick={() => setSelectedMethod('wallet')} 
                className={`flex-1 p-3 rounded-lg border transition-colors flex items-center justify-center ${
                  selectedMethod === 'wallet' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : `${borderColor} ${cardBg} ${textColor} hover:border-blue-400`
                }`}
              >
                <img src={WalletIcon} alt="Wallet" className="w-6 h-6 mr-2" /> 
                <span className="font-semibold">Wallet</span>
              </button> */}
            </div>

            {/* Phone input for mobile money */}
            {(selectedMethod === 'mtn' || selectedMethod === 'airtel') && (
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${textColor}`}>
                  {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={secondaryTextColor}>+25</span>
                  </div>
                  <input
                    type="text"
                    placeholder={selectedMethod === 'mtn' ? "078 123 4567" : "073 123 4567"}
                    value={formData[selectedMethod + 'Phone' as keyof FormData]}
                    onChange={(e) => handleInputChange(e, selectedMethod)}
                    disabled={status === 'processing'}
                    className={`w-full pl-14 pr-3 py-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 text-gray-100 border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  />
                </div>
                <p className={`text-xs mt-1 ${secondaryTextColor}`}>
                  Enter your {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} mobile money number
                </p>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                <div className="text-sm">
                  Payment will be taken from your wallet balance.
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex gap-2">
            <button
              onClick={handleSubscribe}
              disabled={submitting}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {submitting ? 'Processing…' : `Pay ${getPrice(selectedPlan).toLocaleString()} RWF`}
            </button>
          </div>

          {/* Result message */}
          {resultMsg && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
              resultMsg.includes('failed') || resultMsg.includes('error')
                ? 'bg-red-100 text-red-700 border border-red-200'
                : resultMsg.includes('successful') || resultMsg.includes('Success')
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {resultMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}