import { useDarkMode } from '@/context/DarkMode';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AirtelIcon from '../../pages/images/airtel money.png';
import MtnIcon from '../../pages/images/mtn.png';
import StorageCheckout from '../../pages/StorageCheckout';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  const navigate = useNavigate();
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
        payload.phone = formData.mtnPhone.replace(/\D/g, "");
      } else if (selectedMethod === 'airtel') {
        endpoint = `${API_BASE}/api/provider/upgrade/subscribe/airtel`;
        payload.phone = formData.airtelPhone.replace(/\D/g, "");
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
      <div className={`p-6 max-w-xl mx-auto min-h-screen ${bgColor} ${textColor} flex flex-col justify-center items-center`}>
        <h1 className="text-2xl font-bold text-center mb-4">Upgrade</h1>
        <div className="text-red-600 text-center mb-6">{error}</div>
        <button
          onClick={() => navigate('/dashboard/upgrade')}
          className={`w-full py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider transition-colors ${
            darkMode ? 'bg-gray-850 hover:bg-gray-750 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          style={{ borderRadius: '2px' }}
        >
          Back to Plans
        </button>
      </div>
    );
  }

  if (plans === null) {
       return (
         <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
           <div className="text-center py-16">
             <LoadingSpinner size="lg" message="Processing plan..." variant="dots" />
           </div>
         </div>
       );
     }
   

  if (plans.length === 0) {
    return (
      <div className={`p-6 max-w-xl mx-auto min-h-screen ${bgColor} ${textColor} flex flex-col justify-center items-center`}>
        <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Subscribe
        </h1>
        <div className="text-center mb-6">No plans available.</div>
        <button
          onClick={() => navigate('/dashboard/upgrade')}
          className={`w-full py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider transition-colors ${
            darkMode ? 'bg-gray-850 hover:bg-gray-750 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          style={{ borderRadius: '2px' }}
        >
          Back to Plans
        </button>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-xl mx-auto min-h-screen ${bgColor}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/upgrade')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
            darkMode 
              ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
          style={{ borderRadius: '2px' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plans</span>
        </button>
        <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Subscribe
        </h1>
        <div className="hidden sm:block w-[110px]" /> {/* Spacer to balance flex header alignment */}
      </div>

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
              className={`text-left p-4 border transition-all duration-300 ${
                active 
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm font-bold' 
                  : `${borderColor} ${cardBg} ${textColor} hover:border-emerald-400`
              }`}
              style={{ borderRadius: '2px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider">{title}</div>
                  <div className={`text-xs mt-1 ${active ? 'text-emerald-100' : secondaryTextColor}`}>
                    {price.toLocaleString()} RWF / month
                  </div>
                </div>
                {active && (
                  <div className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-emerald-600'}`}>
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
        <div className={`mb-6 p-6 border ${borderColor} ${cardBg}`} style={{ borderRadius: '2px' }}>
          <h2 className={`font-bold text-base uppercase tracking-tight mb-4 ${textColor}`}>
            {getTitle(selectedPlan)} - {getPrice(selectedPlan).toLocaleString()} RWF
          </h2>
          
          <div className="mb-6">
            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${textColor}`}>Features:</h3>
            <div className={`text-xs ${secondaryTextColor} space-y-1.5`}>
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
            <h3 className={`text-[12px] font-bold uppercase tracking-wider mb-3 ${textColor}`}>Payment Method:</h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <button 
                onClick={() => setSelectedMethod('mtn')} 
                className={`flex-1 p-3 border transition-colors flex items-center justify-center ${
                  selectedMethod === 'mtn' 
                    ? 'bg-yellow-500 text-white border-yellow-500 font-bold shadow-sm' 
                    : `${borderColor} ${cardBg} ${textColor} hover:border-yellow-450`
                }`}
                style={{ borderRadius: '2px' }}
              >
                <img src={MtnIcon} alt="MTN" className="w-6 h-6 mr-2" /> 
                <span className="text-xs uppercase tracking-wider">MTN</span>
              </button>
              <button 
                onClick={() => setSelectedMethod('airtel')} 
                className={`flex-1 p-3 border transition-colors flex items-center justify-center ${
                  selectedMethod === 'airtel' 
                    ? 'bg-red-600 text-white border-red-600 font-bold shadow-sm' 
                    : `${borderColor} ${cardBg} ${textColor} hover:border-red-450`
                }`}
                style={{ borderRadius: '2px' }}
              >
                <img src={AirtelIcon} alt="Airtel" className="w-6 h-6 mr-2" /> 
                <span className="text-xs uppercase tracking-wider">Airtel</span>
              </button>
            </div>

            {/* Phone input for mobile money */}
            {(selectedMethod === 'mtn' || selectedMethod === 'airtel') && (
              <div className="mb-4">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textColor}`}>
                  {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`text-sm ${secondaryTextColor}`}>+250</span>
                  </div>
                  <input
                    type="text"
                    placeholder={selectedMethod === 'mtn' ? "078 123 4567" : "073 123 4567"}
                    value={selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone}
                    onChange={(e) => handleInputChange(e, selectedMethod as 'mtn' | 'airtel')}
                    disabled={status === 'processing'}
                    className={`w-full pl-14 pr-3 py-2.5 border text-sm ${
                      darkMode
                        ? 'bg-gray-900 text-white border-gray-750'
                        : 'bg-white text-gray-900 border-gray-250'
                    } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                    style={{ borderRadius: '2px' }}
                  />
                </div>
                <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${secondaryTextColor}`}>
                  Enter your {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} mobile money number
                </p>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className={`mb-4 p-3 border ${darkMode ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`} style={{ borderRadius: '2px' }}>
                <div className="text-xs font-bold uppercase tracking-wider">
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
              className={`flex-1 py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-colors ${
                submitting
                  ? 'bg-gray-450 cursor-not-allowed text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {submitting ? 'Processing…' : `Pay ${getPrice(selectedPlan).toLocaleString()} RWF`}
            </button>
          </div>

          {/* Result message */}
          {resultMsg && (
            <div className={`mt-4 p-3 text-center text-xs font-bold uppercase tracking-wider border ${
              resultMsg.includes('failed') || resultMsg.includes('error')
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : resultMsg.includes('successful') || resultMsg.includes('Success')
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`} style={{ borderRadius: '2px' }}>
              {resultMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}