import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ArrowRight,
  Check,
  ClipboardList,
  Loader2,
  XCircle,
  Shield,
  X,
} from "lucide-react";
import MtnIcon from "../../pages/images/mtn.png";
import AirtelIcon from "../../pages/images/airtel money.png";

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
    max_image_size_mb: number | string;
    max_video_size_mb: number | string;
    max_products: number | string;
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
  usedMB:number;
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
  const [renewLoading, setRenewLoading] = useState<boolean>(false);
  const [renewMessage, setRenewMessage] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [renewAddonAmount, setRenewAddonAmount] = useState<number>(0);
  const [renewAddonUnit, setRenewAddonUnit] = useState<string>('GB');
  const [selectedPlanForRenewal, setSelectedPlanForRenewal] = useState<AdminPlan | null>(null);
  const [renewalModalOpen, setRenewalModalOpen] = useState<boolean>(false);
  const [isAddingMoreStorage, setIsAddingMoreStorage] = useState<boolean>(false);
  const [storageActionType, setStorageActionType] = useState<'purchase' | 'reduce'>('purchase');
  const [reductionLoading, setReductionLoading] = useState<boolean>(false);
  const [reductionMessage, setReductionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isReducingStorage, setIsReducingStorage] = useState<boolean>(false);
  const [renewReductionAmount, setRenewReductionAmount] = useState<number>(0);
  const [renewReductionUnit, setRenewReductionUnit] = useState<string>('GB');
  const [formData, setFormData] = useState({ mtnPhone: '', airtelPhone: '' });
  const [selectedMethod, setSelectedMethod] = useState<'mtn' | 'airtel'>('mtn');

 
  const { darkMode } = useDarkMode();
  const { token, user } = useAuth();
  const visiblePlans = useMemo(() => {
    const isSeller = user?.roles?.includes('seller');
    const shoppingTypeKey = (userPlanInfo as any)?.shopping_type_key || null;
    const shoppingTypeName = (userPlanInfo as any)?.shopping_type_name || null;
    const isCustomSeller = isSeller && (
      (shoppingTypeKey && shoppingTypeKey !== 'other') ||
      (shoppingTypeName && shoppingTypeName.toLowerCase() !== 'other')
    );

    return adminPlans.filter(plan => {
      if (!plan.is_active) return false;
      if (isCustomSeller) {
        return plan.name === 'PREMIUM_SHOP';
      } else {
        return plan.name !== 'PREMIUM_SHOP';
      }
    });
  }, [adminPlans, userPlanInfo, user]);

  const pageBg = darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900";
  const cardBase = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const mutedText = darkMode ? "text-gray-300" : "text-gray-600";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBase = darkMode
    ? "bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20"
    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:ring-emerald-600/20";
  const buttonPrimary = darkMode
    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
    : "bg-emerald-600 hover:bg-emerald-700 text-white";
  const buttonSecondary = darkMode
    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
    : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-900";

  const fetchData = useCallback(async () => {
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
  }, [token]);

  const fetchPlanAndUsage = useCallback(async () => {
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
          if (!plan || !plan.expires_at || new Date(plan.expires_at) <= now) {
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
  }, [token]);

  useEffect(() => {
    fetchData();
    fetchPlanAndUsage();
  }, [fetchData, fetchPlanAndUsage]);

  useEffect(() => {
    const currentId = (userPlanInfo as any)?.current_plan?.id as number | undefined;
    const fallback = visiblePlans[0]?.id;
    setSelectedPlanId(currentId ?? fallback ?? null);
  }, [userPlanInfo, visiblePlans]);

  const getDefaultAdminPlans = (): AdminPlan[] => [];

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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-800'}`}>
        <div className="text-center py-16">
          <LoadingSpinner size="lg" message="Loading plans..." variant="dots" />
        </div>
      </div>
    );
  }

  const calculatedAddedGb = convertToGB(storageAmount, storageUnit);
  const calculatedUnitPrice = storagePricing?.price_per_gb_rwf ?? 500;
  const calculatedTotalPrice = Math.round(calculatedAddedGb * calculatedUnitPrice);

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

  

        {/* Two-Column Grid: Plans on Left (3/5), Storage Add-ons on Right (2/5) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column: Base Plans or Active Plan Info (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            { (canPurchaseBase || userPlanInfo?.subscription_status !== "active") ? (
              <>
                <div className="flex items-center gap-2">
          
                  <h2 className="text-base font-semibold">Base Plans</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visiblePlans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`p-4 border shadow-sm relative ${cardBase}`}
                      style={{ borderRadius: '2px' }}
                    >
                      {index === 1 && (
                        <div className="absolute -top-2 left-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white" style={{ borderRadius: '2px' }}>
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
                      
                      {userPlanInfo?.subscription_status !== "active" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanForRenewal(plan);
                            setRenewalModalOpen(true);
                            setRenewAddonAmount(0);
                            setIsAddingMoreStorage(false);
                            setRenewMessage(null);
                          }}
                          className={`mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${buttonPrimary}`}
                          style={{ borderRadius: '2px' }}
                        >
                          {plan.monthly_fee === 0 ? "Get Started" : "Subscribe"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Link
                          to={`/checkout?plan=${plan.id}&type=base`}
                          className={`mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${buttonPrimary}`}
                          style={{ borderRadius: '2px' }}
                        >
                          {plan.monthly_fee === 0 ? "Get Started" : "Subscribe"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              userPlanInfo?.current_plan && (
                <>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-base font-semibold">Active Plan Info</h2>
                  </div>
                  <div className={`p-5 border shadow-sm relative ${cardBase}`} style={{ borderRadius: '2px' }}>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 mb-4" style={{ borderRadius: '2px' }}>
                      <h4 className="text-lg font-bold text-emerald-500">{userPlanInfo.current_plan.display_name}</h4>
                      <p className={`text-xs ${mutedText} mt-1`}>Active Subscription</p>
                    </div>
                    <ul className="space-y-2 mt-4 text-xs">
                      <li className="flex justify-between py-1 border-b border-gray-150 dark:border-gray-700/50">
                        <span className={subText}>Monthly Fee:</span>
                        <span className="font-semibold">{userPlanInfo.current_plan.monthly_fee.toLocaleString()} RWF</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-gray-150 dark:border-gray-700/50">
                        <span className={subText}>Base Storage:</span>
                        <span className="font-semibold">{formatStorage(userPlanInfo.current_plan.base_storage_gb)}</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-gray-150 dark:border-gray-700/50">
                        <span className={subText}>Support Level:</span>
                        <span className="font-semibold">{userPlanInfo.current_plan.features.support_level}</span>
                      </li>
                      <li className="flex justify-between py-1">
                        <span className={subText}>Analytics:</span>
                        <span className="font-semibold">{userPlanInfo.current_plan.features.analytics_enabled ? 'Enabled' : 'Disabled'}</span>
                      </li>
                    </ul>
                  </div>
                </>
              )
            )}
          </div>

          {/* Right Column: Storage Add-ons (2/5) */}
          <div className="lg:col-span-2 space-y-4">
            {storagePricing && (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">Storage Add-ons</h2>
                </div>

                {/* Usage Bar */}
                {storageUsage && (
                  <div className={`p-4 border ${cardBase}`} style={{ borderRadius: '2px' }}>
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

                <div className={`p-5 border shadow-sm ${!primaryPlanActive ? 'opacity-60' : ''} ${cardBase}`} style={{ borderRadius: '2px' }}>
                  <div className="space-y-6">
                    {/* Action Tabs: Purchase vs Reduce */}
                    {primaryPlanActive && (
                      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStorageActionType('purchase');
                            setReductionMessage(null);
                          }}
                          className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-colors ${
                            storageActionType === 'purchase'
                              ? 'border-emerald-500 text-emerald-500'
                              : 'border-transparent text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          Purchase
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStorageActionType('reduce');
                            setReductionMessage(null);
                          }}
                          className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-colors ${
                            storageActionType === 'reduce'
                              ? 'border-emerald-500 text-emerald-500'
                              : 'border-transparent text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          Reduce
                        </button>
                      </div>
                    )}

                    {storageActionType === 'purchase' ? (
                      <>
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
                          <div className="p-3 border border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/30" style={{ borderRadius: '2px' }}>
                            <div className={`text-sm ${mutedText}`}>Price: {storagePricing.price_per_gb_rwf.toLocaleString()} RWF/GB</div>
                            <div className={`text-xs ${subText} mt-1`}>Min: {formatStorage(storagePricing.min_purchase_gb)}</div>
                          </div>
                        </div>

                        <div>
                          <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-950/10" style={{ borderRadius: '2px' }}>
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
                              to={`/storage-checkout?storage_amount=${storageAmount}&storage_unit=${storageUnit}&type=addon&price=${calculatedTotalPrice}&price_total=${calculatedTotalPrice}`}
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
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Amount to Remove</label>
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
                          
                          <div className={`p-3 border text-[11px] leading-relaxed ${darkMode ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'}`} style={{ borderRadius: '2px' }}>
                            ⚠️ You can reduce free/unoccupied space only. If you try to remove space that is currently holding uploaded files, the request will fail.
                          </div>
                        </div>

                        <div>
                          {reductionMessage && (
                            <div className={`p-3 border text-xs font-semibold mb-4 leading-relaxed ${
                              reductionMessage.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                              style={{ borderRadius: '2px' }}
                            >
                              {reductionMessage.text}
                            </div>
                          )}

                          {primaryPlanActive ? (
                            <button
                              type="button"
                              onClick={async () => {
                                setReductionLoading(true);
                                setReductionMessage(null);
                                try {
                                  const res = await fetch(`${API_BASE}/api/storage/reduce`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ amount: storageAmount, unit: storageUnit })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) {
                                    throw new Error(data.error || 'Failed to reduce storage');
                                  }
                                  setReductionMessage({ type: 'success', text: data.message || 'Storage reduced successfully!' });
                                  
                                  // Refresh user data
                                  fetchData();
                                  fetchPlanAndUsage();
                                } catch (err: any) {
                                  setReductionMessage({ type: 'error', text: err.message });
                                } finally {
                                  setReductionLoading(false);
                                }
                              }}
                              disabled={reductionLoading || storageAmount <= 0}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${storageAmount > 0 ? buttonPrimary : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')}`}
                              style={{ borderRadius: '2px' }}
                            >
                              {reductionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Reduction <ArrowRight className="w-4 h-4" /></>}
                            </button>
                          ) : (
                            <div className="mt-4 w-full text-center px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500" style={{ borderRadius: '2px' }}>
                              Subscribe to a plan first
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Combined Renewal Modal */}
      {renewalModalOpen && selectedPlanForRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className={`w-full max-w-md p-6 border shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            style={{ borderRadius: '2px' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold uppercase tracking-wider text-emerald-500">
                Renew Subscription & Storage
              </h3>
              <button 
                onClick={() => {
                  setRenewalModalOpen(false);
                  setSelectedPlanForRenewal(null);
                }} 
                className="p-1 hover:opacity-70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan Summary */}
              <div className="p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/30" style={{ borderRadius: '2px' }}>
                <div className="flex justify-between text-sm py-1">
                  <span className="font-semibold">{selectedPlanForRenewal.display_name} Plan:</span>
                  <span>{selectedPlanForRenewal.monthly_fee.toLocaleString()} RWF</span>
                </div>
                {addonGb > 0 && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="font-semibold">Existing Storage Add-on ({addonGb} GB):</span>
                    <span>{(addonGb * (storagePricing?.price_per_gb_rwf ?? 500)).toLocaleString()} RWF</span>
                  </div>
                )}
              </div>

              {/* Add/Reduce Storage Options */}
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAddingMoreStorage}
                      onChange={(e) => {
                        setIsAddingMoreStorage(e.target.checked);
                        if (e.target.checked) {
                          setIsReducingStorage(false);
                          setRenewAddonAmount(0);
                          setRenewReductionAmount(0);
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Add/Expand storage add-on</span>
                  </label>

                  {addonGb > 0 && (
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isReducingStorage}
                        onChange={(e) => {
                          setIsReducingStorage(e.target.checked);
                          if (e.target.checked) {
                            setIsAddingMoreStorage(false);
                            setRenewAddonAmount(0);
                            setRenewReductionAmount(0);
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Reduce storage add-on</span>
                    </label>
                  )}
                </div>

                {isAddingMoreStorage && (
                  <div className="flex gap-2 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-950/20" style={{ borderRadius: '2px' }}>
                    <div className="flex-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Extra Storage</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={renewAddonAmount}
                        onChange={(e) => setRenewAddonAmount(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                        style={{ borderRadius: '2px' }}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Unit</label>
                      <select
                        value={renewAddonUnit}
                        onChange={(e) => setRenewAddonUnit(e.target.value)}
                        className={`px-3 py-1.5 text-sm border ${inputBase}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {storagePricing?.available_units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {isReducingStorage && (
                  <div className="flex gap-2 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-950/20" style={{ borderRadius: '2px' }}>
                    <div className="flex-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Amount to Remove</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={renewReductionAmount}
                        onChange={(e) => setRenewReductionAmount(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                        style={{ borderRadius: '2px' }}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Unit</label>
                      <select
                        value={renewReductionUnit}
                        onChange={(e) => setRenewReductionUnit(e.target.value)}
                        className={`px-3 py-1.5 text-sm border ${inputBase}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {storagePricing?.available_units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              {/* Total Summary & Validation */}
              {(() => {
                if (isReducingStorage) {
                  const reductionGb = convertToGB(renewReductionAmount, renewReductionUnit);
                  const totalNewStorageMB = (selectedPlanForRenewal.base_storage_gb * 1024) + ((addonGb - reductionGb) * 1024);
                  const usedStorageMB = storageUsage ? storageUsage.usedMB : 0;
                  const isOverLimit = totalNewStorageMB < usedStorageMB;

                  return (
                    <div className="space-y-4">
                      {isOverLimit && (
                        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold leading-relaxed" style={{ borderRadius: '2px' }}>
                          ⚠️ You need to first delete the uploaded products/services occupying this storage you want to reduce to be able to reduce the storage (you can reduce the free space only)
                        </div>
                      )}

                      {renewMessage && (
                        <div className={`p-3 border text-xs font-semibold ${
                          renewMessage.startsWith('✅')
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                          style={{ borderRadius: '2px' }}
                        >
                          {renewMessage}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setRenewMessage(null);
                            setRenewLoading(true);
                            try {
                              const res = await fetch(`${API_BASE}/api/storage/reduce`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ amount: renewReductionAmount, unit: renewReductionUnit })
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                throw new Error(data.error || 'Failed to reduce storage');
                              }
                              setRenewMessage('✅ Storage reduced successfully! You can now proceed to renew your plan.');
                              
                              // Refresh plan & usage
                              await fetchData();
                              await fetchPlanAndUsage();

                              // Reset checkboxes
                              setIsReducingStorage(false);
                              setRenewReductionAmount(0);
                            } catch (err: any) {
                              setRenewMessage(`❌ ${err.message}`);
                            } finally {
                              setRenewLoading(false);
                            }
                          }}
                          disabled={renewLoading || renewReductionAmount <= 0 || isOverLimit}
                          className={`flex-grow py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5`}
                          style={{ borderRadius: '2px' }}
                        >
                          {renewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reduction'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRenewalModalOpen(false);
                            setSelectedPlanForRenewal(null);
                            setRenewMessage(null);
                          }}
                          disabled={renewLoading}
                          className={`px-4 py-2 border font-bold text-xs uppercase tracking-wider transition-colors
                            ${darkMode ? 'bg-gray-700 hover:bg-gray-650 border-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-600'}`}
                          style={{ borderRadius: '2px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                // Normal Pay/Renewal Flow (when not reducing)
                let changeGb = 0;
                let totalAddonGb = addonGb;

                if (isAddingMoreStorage) {
                  changeGb = convertToGB(renewAddonAmount, renewAddonUnit);
                  totalAddonGb = addonGb + changeGb;
                }

                const planFee = Number(selectedPlanForRenewal.monthly_fee);
                const addonFee = Math.round(totalAddonGb * (storagePricing?.price_per_gb_rwf ?? 500));
                const total = planFee + addonFee;

                return (
                  <div className="space-y-4">
                    <div className="p-3 border border-emerald-500/25 bg-emerald-500/5 text-emerald-500 flex justify-between items-center" style={{ borderRadius: '2px' }}>
                      <span className="font-extrabold uppercase text-xs tracking-wider">Total Combined Price</span>
                      <div className="text-right">
                        <div className="text-xl font-black">{total.toLocaleString()} RWF</div>
                        {totalAddonGb > 0 && (
                          <div className="text-[10px] opacity-80">Incl. {totalAddonGb.toFixed(2)} GB Storage</div>
                        )}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-4">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${subText}`}>
                        Choose Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* MTN Option */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('mtn')}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                            selectedMethod === 'mtn'
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                              : `border-gray-200 ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'hover:border-gray-300'}`
                          }`}
                        >
                          <img src={MtnIcon} alt="MTN MoMo" className="w-6 h-6 object-contain" />
                          <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            MTN MoMo
                          </span>
                        </button>

                        {/* Airtel Option */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('airtel')}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                            selectedMethod === 'airtel'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : `border-gray-200 ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'hover:border-gray-300'}`
                          }`}
                        >
                          <img src={AirtelIcon} alt="Airtel Money" className="w-6 h-6 object-contain" />
                          <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Airtel Money
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Phone Input for Mobile Money */}
                    <div className="mb-4">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${subText}`}>
                        {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className={`text-sm ${subText}`}>+250</span>
                        </div>
                        <input
                          type="text"
                          placeholder={selectedMethod === 'mtn' ? '078 123 4567' : '073 123 4567'}
                          value={selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone}
                          onChange={(e) => handleInputChange(e, selectedMethod)}
                          className={`w-full pl-14 pr-3 py-2 border outline-none text-sm ${inputBase}`}
                          style={{ borderRadius: '2px' }}
                        />
                      </div>
                    </div>

                    {renewMessage && (
                      <div className={`p-3 border text-xs font-semibold ${
                        renewMessage.includes('initiated') || renewMessage.startsWith('✅')
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                          : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                        style={{ borderRadius: '2px' }}
                      >
                        {renewMessage}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          setRenewMessage(null);
                          setRenewLoading(true);
                          try {
                            if (!selectedPlanForRenewal.id) throw new Error('Please select a plan');
                            const activePhone = selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone;
                            const cleanPhone = activePhone.replace(/\D/g, "");
                            if (!cleanPhone) throw new Error('Please enter a valid phone number');

                            const body = {
                              plan_id: selectedPlanForRenewal.id,
                              phone: cleanPhone,
                              provider: selectedMethod,
                              addon_gb: changeGb,
                              addon_gb_total: totalAddonGb,
                              price_per_gb: storagePricing?.price_per_gb_rwf ?? 500,
                            };
                            const res = await fetch(`${API_BASE}/api/provider/upgrade/combined/momo/initiate`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify(body)
                            });
                            if (!res.ok) {
                              const errData = await res.json();
                              throw new Error(errData.error || `HTTP ${res.status}`);
                            }
                            const data = await res.json();
                            setRenewMessage(`✅ Payment initiated. Ref: ${data?.data?.referenceId}`);
                            // Refresh plan status after payment trigger
                            setTimeout(() => {
                              setRenewalModalOpen(false);
                              setSelectedPlanForRenewal(null);
                              setRenewMessage(null);
                              fetchData();
                              fetchPlanAndUsage();
                            }, 4000);
                          } catch (e: any) {
                            setRenewMessage(`❌ ${e?.message || 'Failed to initiate renewal'}`);
                          } finally {
                            setRenewLoading(false);
                          }
                        }}
                        disabled={renewLoading || !(selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone)}
                        className={`flex-grow py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5`}
                        style={{ borderRadius: '2px' }}
                      >
                        {renewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Pay'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenewalModalOpen(false);
                          setSelectedPlanForRenewal(null);
                          setRenewMessage(null);
                        }}
                        disabled={renewLoading}
                        className={`px-4 py-2 border font-bold text-xs uppercase tracking-wider transition-colors
                          ${darkMode ? 'bg-gray-700 hover:bg-gray-650 border-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-600'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}