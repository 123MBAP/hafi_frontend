import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  HardDrive,
  Loader2,
  Package,
  X,
  XCircle,
  Zap,
  Shield,
  Cloud,
  DollarSign
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

type DbPlan = {
  id: number;
  name?: string;
  display_name?: string;
  price_monthly?: number;
  price_yearly?: number;
  base_storage_mb?: number;
  max_file_size_mb?: number;
  max_products?: number;
  max_services?: number;
  can_upload_videos?: boolean;
  can_use_analytics?: boolean;
  is_active?: boolean;
  sort_order?: number;
  features?: string | string[];
  created_at?: string;
  updated_at?: string;
  fee?: number;
  price?: number;
  amount?: number;
};

type AdminPlan = {
  id: number;
  name: string;
  display_name: string;
  monthly_fee: number;
  base_storage_gb: number;
  features: {
    can_upload_images: boolean;
    can_upload_videos: boolean;
    max_image_size_mb: number;
    max_video_size_mb: number;
    max_products: number;
    support_level: string;
    analytics_enabled: boolean;
  };
  feature_list: string[];
  is_active: boolean;
};

type StoragePricing = {
  price_per_gb_rwf: number;
  min_purchase_gb: number;
  max_purchase_gb: number;
  available_units: string[];
};

type UserPlanInfo = {
  current_plan: AdminPlan | null;
  current_storage_gb: number;
  used_storage_gb: number;
  additional_storage_purchased_gb: number;
  subscription_status: 'active' | 'inactive' | 'expired';
};

type StoragePlan = {
  storage_plan: number;
  status: 'active' | 'expired';
  storagePlanGb?: number;
  expires_at?: string;
};

type StorageUsage = {
  used_storage_gb: number;
  total_storage_gb: number;
  usage_percentage: number;
};

const convertDbPlanToAdminPlan = (dbPlan: DbPlan): AdminPlan => {
  let parsedFeatures: any = {};
  let featureList: string[] = [];

  if (dbPlan.features) {
    try {
      if (typeof dbPlan.features === 'string') {
        const parsed = JSON.parse(dbPlan.features);
        if (Array.isArray(parsed)) {
          featureList = parsed;
        } else {
          parsedFeatures = parsed;
          featureList = Object.values(parsed).filter(v => typeof v === 'string') as string[];
        }
      } else if (Array.isArray(dbPlan.features)) {
        featureList = dbPlan.features;
      } else {
        parsedFeatures = dbPlan.features;
        featureList = Object.values(dbPlan.features).filter(v => typeof v === 'string') as string[];
      }
    } catch {
      parsedFeatures = {};
      featureList = [];
    }
  }

  return {
    id: dbPlan.id,
    name: dbPlan.name || `plan_${dbPlan.id}`,
    display_name: dbPlan.display_name || dbPlan.name || `Plan ${dbPlan.id}`,
    monthly_fee: dbPlan.price_monthly || dbPlan.fee || dbPlan.price || dbPlan.amount || 0,
    base_storage_gb: dbPlan.base_storage_mb ? Math.round(dbPlan.base_storage_mb / 1024 * 100) / 100 : 1,
    features: {
      can_upload_images: parsedFeatures.can_upload_images ?? true,
      can_upload_videos: dbPlan.can_upload_videos ?? parsedFeatures.can_upload_videos ?? false,
      max_image_size_mb: dbPlan.max_file_size_mb || parsedFeatures.max_image_size_mb || 10,
      max_video_size_mb: dbPlan.can_upload_videos ? (dbPlan.max_file_size_mb || parsedFeatures.max_video_size_mb || 50) : 0,
      max_products: dbPlan.max_products ?? parsedFeatures.max_products ?? 50,
      support_level: parsedFeatures.support_level || (dbPlan.can_use_analytics ? 'Premium' : 'Basic'),
      analytics_enabled: dbPlan.can_use_analytics ?? parsedFeatures.analytics_enabled ?? false
    },
    feature_list: featureList,
    is_active: dbPlan.is_active ?? true
  };
};

export default function UpgradePlans() {
  const [adminPlans, setAdminPlans] = useState<AdminPlan[]>([]);
  const [storagePricing, setStoragePricing] = useState<StoragePricing | null>(null);
  const [userPlanInfo, setUserPlanInfo] = useState<UserPlanInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageAmount, setStorageAmount] = useState<number>(1);
  const [storageUnit, setStorageUnit] = useState<string>('GB');
  const [canPurchaseBase, setCanPurchaseBase] = useState(false);
  const [userStoragePlan, setUserStoragePlan] = useState<StoragePlan | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [renewPhone, setRenewPhone] = useState<string>("");
  const [renewLoading, setRenewLoading] = useState<boolean>(false);
  const [renewMessage, setRenewMessage] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [renewAddonAmount, setRenewAddonAmount] = useState<number>(0);
  const [renewAddonUnit, setRenewAddonUnit] = useState<string>('GB');
  const [editingStorage, setEditingStorage] = useState<boolean>(false);

  const { darkMode } = useDarkMode();
  const { token } = useAuth();

  const pageBg = darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBase = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const mutedText = darkMode ? "text-gray-300" : "text-gray-600";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBase = darkMode
    ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20"
    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:ring-emerald-600/20";
  const buttonPrimary = darkMode
    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
    : "bg-emerald-600 hover:bg-emerald-700 text-white";
  const buttonSecondary = darkMode
    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
    : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-900";

  useEffect(() => {
    async function fetchData() {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        try {
          const plansRes = await fetch(`${API_BASE}/api/provider/upgrade/plans`, { headers });
          if (plansRes.ok) {
            const plansData = await plansRes.json();
            const convertedPlans = plansData.map(convertDbPlanToAdminPlan);
            setAdminPlans(convertedPlans);
          } else {
            setAdminPlans(getDefaultAdminPlans());
          }
        } catch {
          setAdminPlans(getDefaultAdminPlans());
        }

        try {
          const pricingRes = await fetch(`${API_BASE}/api/user/storage-pricing`, { headers });
          if (pricingRes.ok) {
            const pricingData = await pricingRes.json();
            setStoragePricing(pricingData.pricing);
          } else {
            setStoragePricing(getDefaultStoragePricing());
          }
        } catch {
          setStoragePricing(getDefaultStoragePricing());
        }

        try {
          const userRes = await fetch(`${API_BASE}/api/user/plan-info`, { headers });
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserPlanInfo(userData.plan_info);
          } else {
            setUserPlanInfo(getDefaultUserPlanInfo());
          }
        } catch {
          setUserPlanInfo(getDefaultUserPlanInfo());
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch plan data");
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const currentId = (userPlanInfo as any)?.current_plan?.id as number | undefined;
    const fallback = adminPlans.find(p => p.is_active)?.id;
    setSelectedPlanId(currentId ?? fallback ?? null);
  }, [userPlanInfo, adminPlans]);

  useEffect(() => {
    const fetchPlanAndUsage = async () => {
      try {
        const planRes = await fetch(`${API_BASE}/api/storage/plan`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.success) {
            const plan = planData.data;
            setUserStoragePlan(plan);

            const now = new Date();
            if (!plan.expires_at || new Date(plan.expires_at) <= now) {
              setCanPurchaseBase(true);
            } else {
              setCanPurchaseBase(false);
            }

            const usageRes = await fetch(`${API_BASE}/api/users/storage-usage`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (usageRes.ok) {
              const usageData = await usageRes.json();
              if (usageData.success) {
                setStorageUsage(usageData.data);
              }
            }
          } else {
            setCanPurchaseBase(true);
          }
        } else {
          setCanPurchaseBase(true);
        }
      } catch (err) {
        console.error(err);
        setCanPurchaseBase(true);
      }
    };

    fetchPlanAndUsage();
  }, []);

  const getDefaultAdminPlans = (): AdminPlan[] => [
    {
      id: 1,
      name: 'basic',
      display_name: 'Basic',
      monthly_fee: 0,
      base_storage_gb: 1,
      features: {
        can_upload_images: true,
        can_upload_videos: false,
        max_image_size_mb: 5,
        max_video_size_mb: 0,
        max_products: 50,
        support_level: 'Basic',
        analytics_enabled: false
      },
      feature_list: ['Basic Support', 'Image Upload', 'Up to 50 Products'],
      is_active: true
    }
  ];

  const getDefaultStoragePricing = (): StoragePricing => ({
    price_per_gb_rwf: 500,
    min_purchase_gb: 0.1,
    max_purchase_gb: 1000,
    available_units: ['MB', 'GB', 'TB']
  });

  const getDefaultUserPlanInfo = (): UserPlanInfo => ({
    current_plan: null,
    current_storage_gb: 1,
    used_storage_gb: 0.3,
    additional_storage_purchased_gb: 0,
    subscription_status: 'inactive'
  });

  const convertToGB = (amount: number, unit: string): number => {
    switch (unit) {
      case 'MB': return amount / 1024;
      case 'TB': return amount * 1024;
      case 'GB':
      default: return amount;
    }
  };

  const formatStorage = (gb: number): string => {
    if (gb < 1) return `${Math.round(gb * 1024)}MB`;
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)}TB`;
    return `${gb.toFixed(1)}GB`;
  };

  const formatFileSize = (sizeInGB: number): string => {
    if (sizeInGB < 0.001) return `${(sizeInGB * 1024 * 1024).toFixed(1)} MB`;
    return `${sizeInGB.toFixed(2)} GB`;
  };

  const hasActivePlan = userStoragePlan?.status === 'active';
  const hasExpiredPlan = userStoragePlan?.status === 'expired';
  const hasNoPlan = !userStoragePlan;
  const addonGb = userPlanInfo?.additional_storage_purchased_gb ?? 0;
  const primaryPlanActive = userPlanInfo?.subscription_status === 'active';

  if (error) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className={`p-6 border-0 shadow-sm text-center`} style={{ borderRadius: '2px' }}>
            <XCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className={mutedText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Plans & Storage
            </h1>
            <p className={`text-sm ${mutedText} mt-1`}>
              Manage your subscription and storage add-ons
            </p>
          </div>
          <Link
            to="/dashboard/upgrade/pending"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${buttonSecondary}`}
            style={{ borderRadius: '2px' }}
          >
            <ClipboardList className="w-4 h-4" />
            Pending
          </Link>
        </div>

        {/* Current Plan Summary */}
        <div className={`border-0 shadow-sm overflow-hidden`} style={{ borderRadius: '2px' }}>
          <div className={`p-5 ${cardBase}`}>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-semibold">Current Subscription</h2>
            </div>

            {(() => {
              const currentPlan = userPlanInfo?.current_plan || null;
              const planDisplay = currentPlan?.display_name || currentPlan?.name || 'No plan';
              const baseStorageGb = userPlanInfo?.current_storage_gb ?? (userStoragePlan?.storagePlanGb ?? 0);
              const subscriptionStatus = userPlanInfo?.subscription_status || (hasActivePlan ? 'active' : hasExpiredPlan ? 'expired' : 'inactive');
              
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Current Plan</div>
                    <div className="mt-1 text-lg font-semibold">{planDisplay}</div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${
                        subscriptionStatus === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : subscriptionStatus === "expired"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`} style={{ borderRadius: '2px' }}>
                        {subscriptionStatus === "active" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {subscriptionStatus}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-100 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Storage</div>
                    <div className="mt-1 text-lg font-semibold">{formatStorage(baseStorageGb)} base</div>
                    <div className="text-sm text-gray-400 mt-1">Add-ons: {addonGb} GB</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Renewal Section (when not active) */}
        {userPlanInfo?.subscription_status !== "active" && (
          <div className={`p-5 border-0 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ borderRadius: '2px' }}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold">Renew Your Plan</h3>
                <p className={`text-sm ${mutedText} mt-1`}>
                  Your subscription is not active. Renew to restore uploads and visibility.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Plan Selection */}
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Select Plan</label>
                <div className="space-y-2">
                  {adminPlans.filter(p => p.is_active).map(p => {
                    const selected = selectedPlanId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`w-full text-left p-3 border transition-colors ${selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="text-sm font-semibold">{p.display_name}</div>
                        <div className={`text-xs ${subText}`}>{p.monthly_fee.toLocaleString()} RWF / month</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Storage Add-on */}
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Storage Add-on</label>
                {!editingStorage ? (
                  <div className="p-3 border border-gray-200 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                    <div className="text-sm">Current: {addonGb} GB</div>
                    <button
                      onClick={() => setEditingStorage(true)}
                      className={`mt-2 w-full px-3 py-1.5 text-sm transition-colors ${buttonSecondary}`}
                      style={{ borderRadius: '2px' }}
                    >
                      Add Storage
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={renewAddonAmount}
                        onChange={(e) => setRenewAddonAmount(parseFloat(e.target.value) || 0)}
                        className={`flex-1 px-3 py-1.5 text-sm border ${inputBase}`}
                        style={{ borderRadius: '2px' }}
                      />
                      <select
                        value={renewAddonUnit}
                        onChange={(e) => setRenewAddonUnit(e.target.value)}
                        className={`px-3 py-1.5 text-sm border ${inputBase}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {storagePricing?.available_units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => setEditingStorage(false)}
                      className={`w-full px-3 py-1.5 text-sm transition-colors ${buttonPrimary}`}
                      style={{ borderRadius: '2px' }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Payment</label>
                <div className="space-y-3">
                  <input
                    type="tel"
                    value={renewPhone}
                    onChange={(e) => setRenewPhone(e.target.value)}
                    placeholder="Phone (MTN MoMo)"
                    className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                    style={{ borderRadius: '2px' }}
                  />
                  <div className="p-3 border border-gray-200 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                    {(() => {
                      const selectedPlan = adminPlans.find(p => p.id === selectedPlanId);
                      const planFee = Number(selectedPlan?.monthly_fee ?? 0);
                      const addedGb = convertToGB(renewAddonAmount, renewAddonUnit);
                      const totalAddonGb = addonGb + addedGb;
                      const addonFee = Math.round(totalAddonGb * (storagePricing?.price_per_gb_rwf ?? 500));
                      const total = planFee + addonFee;
                      return (
                        <>
                          <div className="text-xs text-gray-400">Total</div>
                          <div className="text-xl font-bold text-emerald-500">{total.toLocaleString()} RWF</div>
                          <div className="text-xs text-gray-400 mt-1">Plan: {planFee} + Storage: {addonFee}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                setRenewMessage(null);
                setRenewLoading(true);
                try {
                  const token = localStorage.getItem('token');
                  const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  };
                  if (!selectedPlanId) throw new Error('Please select a plan');
                  const addedGb = convertToGB(renewAddonAmount, renewAddonUnit);
                  const totalAddonGb = addonGb + addedGb;
                  const body = {
                    plan_id: selectedPlanId,
                    phone: renewPhone,
                    provider: 'mtn',
                    addon_gb: addedGb,
                    addon_gb_total: totalAddonGb,
                    price_per_gb: storagePricing?.price_per_gb_rwf ?? 500,
                  };
                  const res = await fetch(`${API_BASE}/api/provider/upgrade/combined/momo/initiate`, {
                    method: 'POST', headers, body: JSON.stringify(body)
                  });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const data = await res.json();
                  setRenewMessage(`Payment initiated. Ref: ${data?.data?.referenceId}`);
                } catch (e: any) {
                  setRenewMessage(e?.message || 'Failed to initiate renewal');
                } finally {
                  setRenewLoading(false);
                }
              }}
              disabled={renewLoading || !renewPhone || !selectedPlanId}
              className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${buttonPrimary} disabled:opacity-50`}
              style={{ borderRadius: '2px' }}
            >
              {renewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Renew Now <ArrowRight className="w-4 h-4" /></>}
            </button>
            {renewMessage && (
              <div className={`mt-3 p-3 text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} style={{ borderRadius: '2px' }}>
                {renewMessage}
              </div>
            )}
          </div>
        )}

        {/* Base Plans */}
        {canPurchaseBase && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-semibold">Base Plans</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {adminPlans.filter(plan => plan.is_active).map((plan, index) => (
                <div
                  key={plan.id}
                  className={`p-4 border-0 shadow-sm relative ${cardBase}`}
                  style={{ borderRadius: '2px' }}
                >
                  {index === 1 && (
                    <div className="absolute -top-2 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white" style={{ borderRadius: '2px' }}>
                        <Zap className="w-3 h-3" />
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-base font-bold">{plan.display_name}</h3>
                    <div className="mt-2 text-2xl font-bold">
                      {plan.monthly_fee.toLocaleString()} <span className="text-sm font-normal text-gray-400">RWF</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700" style={{ borderRadius: '2px' }}>
                      <Cloud className="w-3 h-3" />
                      {formatStorage(plan.base_storage_gb)} included
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {plan.feature_list.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className={mutedText}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/checkout?plan=${plan.id}&type=base`}
                    className={`mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${buttonPrimary}`}
                    style={{ borderRadius: '2px' }}
                  >
                    {plan.monthly_fee === 0 ? "Get Started" : "Subscribe"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage Add-ons */}
        {storagePricing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-semibold">Storage Add-ons</h2>
            </div>

            {/* Usage Bar */}
            {storageUsage && (
              <div className="p-4 border border-gray-100 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={mutedText}>Used: {formatFileSize(storageUsage.used_storage_gb)}</span>
                  <span className={mutedText}>Total: {formatFileSize(storageUsage.total_storage_gb)}</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden" style={{ borderRadius: '2px' }}>
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(storageUsage.usage_percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className={`p-5 border-0 shadow-sm ${!primaryPlanActive ? 'opacity-60' : ''} ${cardBase}`} style={{ borderRadius: '2px' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Amount</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={storageAmount}
                      onChange={(e) => setStorageAmount(parseFloat(e.target.value) || 0)}
                      disabled={!primaryPlanActive}
                      className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Unit</label>
                    <select
                      value={storageUnit}
                      onChange={(e) => setStorageUnit(e.target.value)}
                      disabled={!primaryPlanActive}
                      className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                      style={{ borderRadius: '2px' }}
                    >
                      {storagePricing.available_units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </div>
                  <div className="p-3 border border-gray-100 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                    <div className={`text-sm ${mutedText}`}>Price: {storagePricing.price_per_gb_rwf.toLocaleString()} RWF/GB</div>
                    <div className={`text-xs ${subText} mt-1`}>Min: {formatStorage(storagePricing.min_purchase_gb)}</div>
                  </div>
                </div>

                <div>
                  <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700" style={{ borderRadius: '2px' }}>
                    <h3 className="text-sm font-semibold mb-3">Summary</h3>
                    {(() => {
                      const addedGb = convertToGB(storageAmount, storageUnit);
                      const unitPrice = storagePricing.price_per_gb_rwf;
                      const totalPrice = Math.round(addedGb * unitPrice);
                      return (
                        <>
                          <div className="flex justify-between py-2 text-sm">
                            <span className={mutedText}>Additional Storage:</span>
                            <span className="font-medium">{storageAmount} {storageUnit}</span>
                          </div>
                          <div className="flex justify-between py-2 text-sm">
                            <span className={mutedText}>Equivalent in GB:</span>
                            <span className="font-medium">{addedGb.toFixed(2)} GB</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                            <div className="flex justify-between py-2">
                              <span className="font-semibold">Total:</span>
                              <span className="text-lg font-bold text-emerald-500">{totalPrice.toLocaleString()} RWF</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {primaryPlanActive ? (
                    <Link
                      to={`/storage-checkout?storage_amount=${storageAmount}&storage_unit=${storageUnit}&type=addon`}
                      className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${storageAmount > 0 ? buttonPrimary : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')}`}
                      style={{ borderRadius: '2px', pointerEvents: storageAmount > 0 ? 'auto' : 'none' }}
                    >
                      Purchase Add-on <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="mt-4 w-full text-center px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500" style={{ borderRadius: '2px' }}>
                      Subscribe to a plan first
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}