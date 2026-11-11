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
import MtnIcon from "../../pages/images/mtn.jpg";
import AirtelIcon from "../../pages/images/airtel_logo.png";
import MastercardIcon from "@/assets/images/master_card.png";
import VisaIcon from "@/assets/images/visa.png";
import { API_BASE } from '../../api/apiClient';


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

type PaymentMethod = 'mtn' | 'airtel' | 'card';

type PaymentFormData = {
  mtnPhone: string;
  airtelPhone: string;
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
  const [formData, setFormData] = useState<PaymentFormData>({
    mtnPhone: '',
    airtelPhone: ''
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mtn');

 
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

  const pageBg = darkMode ? "bg-black text-white" : "bg-[#F5F5F5] text-[#151515]";
  const cardBase = darkMode ? "bg-gray-900 border-gray-800 rounded-xl" : "bg-white border-[#E5E5E5] rounded-xl";
  const mutedText = darkMode ? "text-gray-400" : "text-[#666666]";
  const subText = darkMode ? "text-gray-500" : "text-[#666666]";
  const inputBase = darkMode
    ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:border-[#E5252A] focus:ring-[#E5252A]"
    : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-[#666666] rounded-lg focus:border-[#E5252A] focus:ring-[#E5252A]";
  const buttonPrimary = "bg-[#E5252A] hover:bg-[#c91d22] text-white rounded-lg shadow-xs active:scale-[0.99]";
  const buttonSecondary = darkMode
    ? "bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg"
    : "bg-white hover:bg-gray-50 border border-[#E5E5E5] text-[#151515] rounded-lg";

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
          <div className={`p-6 border-0 shadow-sm text-center`}>
            <XCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className={mutedText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-600/30 bg-red-600/10 text-red-600 text-xs font-semibold uppercase tracking-wider mb-2">
              Subscription & Add-ons
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
              Plans & Storage<span className="text-red-600">.</span>
            </h1>
            <p className={`text-sm ${mutedText} mt-1`}>
              Manage your subscription and storage add-ons
            </p>
          </div>
          <Link
            to="/dashboard/upgrade/pending"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${buttonSecondary}`}
           
          >
            <ClipboardList className="w-4 h-4 text-red-600" />
            Pending Transactions
          </Link>
        </div>

  

        {/* Two-Column Grid: Plans on Left (3/5), Storage Add-ons on Right (2/5) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column: Base Plans or Active Plan Info (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            {userPlanInfo?.subscription_status === "active" && userPlanInfo?.current_plan && (
              <>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h2 className="text-base font-bold uppercase tracking-wider">Active Plan Info<span className="text-red-600">.</span></h2>
                </div>
                <div className={`p-5 border shadow-sm relative ${cardBase}`}>
                  <div className="p-4 bg-red-600/10 border border-red-600/25 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-red-600">{userPlanInfo.current_plan.display_name}</h4>
                      <p className={`text-xs ${mutedText} mt-1`}>Active Subscription</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const planToRenew = visiblePlans.find(p => p.id === userPlanInfo.current_plan?.id) || visiblePlans[0] || (userPlanInfo.current_plan as AdminPlan);
                        if (planToRenew) {
                          setSelectedPlanForRenewal(planToRenew as AdminPlan);
                          setRenewalModalOpen(true);
                          setRenewAddonAmount(0);
                          setIsAddingMoreStorage(false);
                          setRenewMessage(null);
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${buttonPrimary}`}
                    >
                      Renew / Extend Plan
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
            )}

            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold uppercase tracking-wider">
                {userPlanInfo?.subscription_status === "active" ? "Available Plans" : "Base Plans"}
                <span className="text-red-600">.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visiblePlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`p-4 border shadow-sm relative ${cardBase}`}
                >
                  {index === 1 && (
                    <div className="absolute -top-2 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-600 text-white">
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-base font-bold">{plan.display_name}</h3>
                    <div className="mt-2 text-2xl font-bold">
                      {plan.monthly_fee.toLocaleString()} <span className="text-sm font-normal text-gray-400">RWF</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-black dark:text-white">
                      {formatStorage(plan.base_storage_gb)} included
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {plan.feature_list.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-red-600" />
                        <span className={mutedText}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
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
                  >
                    {plan.monthly_fee === 0
                      ? "Get Started"
                      : userPlanInfo?.subscription_status === "active"
                        ? (plan.id === userPlanInfo?.current_plan?.id ? "Renew Plan" : "Switch Plan")
                        : "Subscribe"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Storage Add-ons (2/5) */}
          <div className="lg:col-span-2 space-y-4">
            {storagePricing && (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold uppercase tracking-wider">Storage Add-ons<span className="text-red-600">.</span></h2>
                </div>

                {/* Usage Bar */}
                {storageUsage && (
                  <div className={`p-4 border ${cardBase}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={mutedText}>Used: {formatFileSize(storageUsage.used_storage_gb)}</span>
                      <span className={mutedText}>Total: {formatFileSize(storageUsage.total_storage_gb)}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{ width: `${Math.min(storageUsage.usage_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className={`p-5 border shadow-sm ${!primaryPlanActive ? 'opacity-60' : ''} ${cardBase}`}>
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
                              ? 'border-red-600 text-red-600'
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
                              ? 'border-red-600 text-red-600'
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
                             
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Unit</label>
                            <select
                              value={storageUnit}
                              onChange={(e) => setStorageUnit(e.target.value)}
                              disabled={!primaryPlanActive}
                              className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                             
                            >
                              {storagePricing.available_units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                          </div>
                          <div className="p-3 border border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/30">
                            <div className={`text-sm ${mutedText}`}>Price: {storagePricing.price_per_gb_rwf.toLocaleString()} RWF/GB</div>
                            <div className={`text-xs ${subText} mt-1`}>Min: {formatStorage(storagePricing.min_purchase_gb)}</div>
                          </div>
                        </div>

                        <div>
                          <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-950/10">
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
                                      <span className="text-lg font-bold text-red-600">{totalPrice.toLocaleString()} RWF</span>
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
                              style={{ pointerEvents: storageAmount > 0 ? 'auto' : 'none' }}
                            >
                              Purchase Add-on <ArrowRight className="w-4 h-4" />
                            </Link>
                          ) : (
                            <div className="mt-4 w-full text-center px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500">
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
                             
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${subText}`}>Unit</label>
                            <select
                              value={storageUnit}
                              onChange={(e) => setStorageUnit(e.target.value)}
                              disabled={!primaryPlanActive}
                              className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                             
                            >
                              {storagePricing.available_units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                          </div>
                          
                          <div className={`p-3 border text-[11px] leading-relaxed ${darkMode ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            ⚠️ You can reduce free/unoccupied space only. If you try to remove space that is currently holding uploaded files, the request will fail.
                          </div>
                        </div>

                        <div>
                          {reductionMessage && (
                            <div className={`p-3 border text-xs font-semibold mb-4 leading-relaxed ${
                              reductionMessage.type === 'success' 
                                ? 'bg-red-600/10 border-red-600/20 text-red-600' 
                                : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                             
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
                             
                            >
                              {reductionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Reduction <ArrowRight className="w-4 h-4" /></>}
                            </button>
                          ) : (
                            <div className="mt-4 w-full text-center px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 border shadow-2xl rounded-xl ${darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-[#E5E5E5] text-black'}`}
           
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-600/30 bg-red-600/10 text-red-600 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Selected plan
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight">
                  Complete your subscription
                </h3>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Review your plan and choose a payment method.
                </p>
              </div>
              <button 
                onClick={() => {
                  setRenewalModalOpen(false);
                  setSelectedPlanForRenewal(null);
                }} 
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                aria-label="Close payment dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan Summary */}
              <div className={`p-4 sm:p-5 border rounded-xl ${cardBase}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-base font-bold">{selectedPlanForRenewal.display_name}</h4>
                    <div className="mt-1 text-2xl font-bold">
                      {selectedPlanForRenewal.monthly_fee.toLocaleString()} <span className="text-sm font-normal text-gray-400">RWF / month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10">
                      {formatStorage(selectedPlanForRenewal.base_storage_gb)} included
                    </div>
                  </div>
                  {addonGb > 0 && (
                    <div className={`text-left sm:text-right text-xs ${mutedText}`}>
                      <div className="font-semibold">Existing storage add-on</div>
                      <div className="mt-1">{formatStorage(addonGb)} · {(addonGb * (storagePricing?.price_per_gb_rwf ?? 500)).toLocaleString()} RWF</div>
                    </div>
                  )}
                </div>
                {selectedPlanForRenewal.feature_list.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    {selectedPlanForRenewal.feature_list.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className={mutedText}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add/Reduce Storage Options */}
              <div className={`space-y-3 p-4 border rounded-xl ${cardBase}`}>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider">Storage options<span className="text-red-600">.</span></h4>
                  <p className={`text-xs mt-1 ${mutedText}`}>Adjust your storage before confirming payment.</p>
                </div>
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
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
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
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                      <span>Reduce storage add-on</span>
                    </label>
                  )}
                </div>

                {isAddingMoreStorage && (
                  <div className="flex gap-2 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-950/20">
                    <div className="flex-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Extra Storage</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={renewAddonAmount}
                        onChange={(e) => setRenewAddonAmount(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                       
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Unit</label>
                      <select
                        value={renewAddonUnit}
                        onChange={(e) => setRenewAddonUnit(e.target.value)}
                        className={`px-3 py-1.5 text-sm border ${inputBase}`}
                       
                      >
                        {storagePricing?.available_units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {isReducingStorage && (
                  <div className="flex gap-2 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-950/20">
                    <div className="flex-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Amount to Remove</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={renewReductionAmount}
                        onChange={(e) => setRenewReductionAmount(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 text-sm border ${inputBase}`}
                       
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${subText}`}>Unit</label>
                      <select
                        value={renewReductionUnit}
                        onChange={(e) => setRenewReductionUnit(e.target.value)}
                        className={`px-3 py-1.5 text-sm border ${inputBase}`}
                       
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
                  const isOverPurchasedAddon = reductionGb > addonGb;

                  return (
                    <div className="space-y-4">
                      {isOverPurchasedAddon && (
                        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold leading-relaxed">
                          You cannot reduce storage by more than your purchased add-on storage ({formatStorage(addonGb)}).
                        </div>
                      )}

                      {isOverLimit && (
                        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold leading-relaxed">
                          ⚠️ You need to first delete the uploaded products/services occupying this storage you want to reduce to be able to reduce the storage (you can reduce the free space only)
                        </div>
                      )}

                      {renewMessage && (
                        <div className={`p-3 border text-xs font-semibold ${
                          renewMessage.startsWith('✅')
                            ? 'bg-red-600/10 border-red-600/20 text-red-600' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                         
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
                          disabled={renewLoading || renewReductionAmount <= 0 || isOverLimit || isOverPurchasedAddon}
                          className={`flex-grow py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5`}
                         
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
                            ${buttonSecondary}`}
                         
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
                const isPaymentReady = selectedMethod === 'card'
                  ? true
                  : Boolean((selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone).replace(/\D/g, ''));
                const paymentDashboard = user?.roles?.includes('service_provider')
                  ? '/dashboard/provider'
                  : '/dashboard/seller';
                const waitForPaymentCompletion = async (referenceId: string) => {
                  for (let attempt = 0; attempt < 30; attempt += 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const statusRes = await fetch(
                      `${API_BASE}/api/provider/upgrade/transactions/${encodeURIComponent(referenceId)}/status`,
                      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                    );
                    if (!statusRes.ok) continue;
                    const statusData = await statusRes.json();
                    if (statusData.status === 'completed') {
                      window.location.assign(`${paymentDashboard}?payment=success`);
                      return;
                    }
                    if (['failed', 'cancelled'].includes(statusData.status)) {
                      setRenewMessage('❌ Payment was not completed.');
                      return;
                    }
                  }
                  setRenewMessage('⏳ Payment is still pending. You can check its status from Pending Transactions.');
                };
                const initiatePayment = async (method: PaymentMethod) => {
                  setRenewMessage(null);
                  setRenewLoading(true);
                  setRenewMessage('⏳ Initiating payment...');
                  try {
                    if (!selectedPlanForRenewal.id) throw new Error('Please select a plan');
                    const activePhone = method === 'mtn' || method === 'airtel'
                      ? (method === 'mtn' ? formData.mtnPhone : formData.airtelPhone)
                      : '';
                    const cleanPhone = activePhone.replace(/\D/g, '');
                    if (method !== 'card' && !cleanPhone) throw new Error('Please enter a valid phone number');

                    const res = await fetch(`${API_BASE}/api/provider/upgrade/combined/momo/initiate`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : ''
                      },
                      body: JSON.stringify({
                        plan_id: selectedPlanForRenewal.id,
                        phone: cleanPhone,
                        provider: method,
                        payment_method: method === 'card' ? 'card' : 'momo',
                        addon_gb: changeGb,
                        addon_gb_total: totalAddonGb,
                        price_per_gb: storagePricing?.price_per_gb_rwf ?? 500
                      })
                    });
                    if (!res.ok) {
                      const errData = await res.json();
                      throw new Error(errData.error || `HTTP ${res.status}`);
                    }
                    const data = await res.json();
                    if (method === 'card' && data?.data?.paymentUrl) {
                      window.location.assign(data.data.paymentUrl);
                      return;
                    }
                    const referenceId = data?.data?.referenceId;
                    setRenewMessage(`⏳ Payment is pending. Approve the payment on your phone. Phone: +250 ${cleanPhone}`);
                    if (referenceId) void waitForPaymentCompletion(referenceId);
                  } catch (e: any) {
                    setRenewMessage(`❌ ${e?.message || 'Failed to initiate renewal'}`);
                  } finally {
                    setRenewLoading(false);
                  }
                };

                return (
                  <div className="space-y-4">
                    <div className="p-3 border border-red-600/25 bg-red-600/5 text-red-600 flex justify-between items-center">
                      <span className="font-extrabold uppercase text-xs tracking-wider">Total Combined Price</span>
                      <div className="text-right">
                        <div className="text-xl font-black">{total.toLocaleString()} RWF</div>
                        {totalAddonGb > 0 && (
                          <div className="text-[10px] opacity-80">Incl. {totalAddonGb.toFixed(2)} GB Storage</div>
                        )}
                      </div>
                    </div>

                    {/* Payment method selector and details */}
                    <div className="mb-8">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-3 ${subText}`}>
                        Choose Payment Method
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {([
                          { id: 'mtn' as const, label: 'MTN MoMo', icon: MtnIcon, header: 'bg-yellow-400', active: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
                          { id: 'airtel' as const, label: 'Airtel Money', icon: AirtelIcon, header: 'bg-red-500', active: 'border-red-500 bg-red-50 dark:bg-red-900/20' }
                        ]).map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id)}
                            className={`w-full h-full min-w-0 overflow-hidden border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                              selectedMethod === method.id
                                ? `${method.active} ring-2 ring-offset-1 ${darkMode ? 'ring-offset-black' : 'ring-offset-white'}`
                                : `${darkMode ? 'border-white/20 bg-black' : 'border-black bg-white'}`
                            }`}
                            style={{ borderRadius: '6px' }}
                          >
                            <div className={`px-4 py-3 text-center text-white font-semibold ${method.header}`}>
                              {method.label}
                            </div>
                            <div className="p-4 flex min-h-[190px] flex-1 flex-col items-center justify-between">
                              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${method.id === 'mtn' ? (darkMode ? 'bg-yellow-900/40' : 'bg-yellow-100') : (darkMode ? 'bg-red-900/40' : 'bg-red-100')}`}>
                                <img src={method.icon} alt={method.label} className="w-16 h-16 object-contain" />
                              </div>
                              <span className={`px-8 py-2 border rounded-full text-sm ${
                                selectedMethod === method.id
                                  ? 'border-red-600 bg-red-600 text-white'
                                  : darkMode ? 'border-white/30 text-white/70' : 'border-black/30 text-black/70'
                              }`}>
                                {selectedMethod === method.id ? 'Selected' : 'Select'}
                              </span>
                            </div>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod('card');
                            void initiatePayment('card');
                          }}
                          disabled={renewLoading}
                          className={`w-full h-full min-w-0 overflow-hidden border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                            selectedMethod === 'card'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-offset-1'
                              : `${darkMode ? 'border-white/20 bg-black' : 'border-black bg-white'}`
                          }`}
                          style={{ borderRadius: '6px' }}
                        >
                          <div className="px-4 py-3 text-center text-white font-semibold bg-blue-600">
                            Card Payment
                          </div>
                          <div className="p-4 flex min-h-[190px] flex-1 flex-col items-center justify-between">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center gap-1 ${darkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                              <img src={VisaIcon} alt="Visa" className="w-10 h-7 object-contain" />
                              <img src={MastercardIcon} alt="Mastercard" className="w-10 h-7 object-contain" />
                            </div>
                            <span className={`px-8 py-2 border rounded-full text-sm ${darkMode ? 'border-white/30 text-white/70' : 'border-black/30 text-black/70'}`}>
                              {renewLoading ? 'Opening...' : 'Select'}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 mb-12 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                      {selectedMethod !== 'card' && (
                        <div className="md:col-span-2">
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${subText}`}>
                            {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} mobile money number
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
                              className={`w-full pl-14 pr-3 py-3 text-sm border outline-none ${inputBase}`}
                              aria-label={`${selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} phone number`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {renewMessage && (
                      <div className={`p-3 border text-xs font-semibold ${
                        renewMessage.includes('initiated') || renewMessage.startsWith('✅') || renewMessage.startsWith('⏳')
                          ? 'bg-red-600/10 border-red-600/20 text-red-600' 
                          : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                       
                      >
                        {renewMessage}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
                      {selectedMethod !== 'card' && <button
                        onClick={async () => {
                          setRenewMessage(null);
                          setRenewLoading(true);
                          setRenewMessage('⏳ Initiating payment...');
                          try {
                            if (!selectedPlanForRenewal.id) throw new Error('Please select a plan');
                            const activePhone = selectedMethod === 'mtn' || selectedMethod === 'airtel'
                              ? (selectedMethod === 'mtn' ? formData.mtnPhone : formData.airtelPhone)
                              : '';
                            const cleanPhone = activePhone.replace(/\D/g, "");
                            if (selectedMethod !== 'card' && !cleanPhone) throw new Error('Please enter a valid phone number');

                            const body = {
                              plan_id: selectedPlanForRenewal.id,
                              phone: cleanPhone,
                              provider: selectedMethod,
                              payment_method: selectedMethod === 'card' ? 'card' : 'momo',
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
                            const referenceId = data?.data?.referenceId;
                            setRenewMessage(`⏳ Payment is pending. Approve the payment on your phone. Phone: +250 ${cleanPhone}`);
                            if (referenceId) void waitForPaymentCompletion(referenceId);
                            // Keep the modal open while XentriPay waits for the customer's approval.
                            // The webhook will update the transaction and subscription asynchronously.
                          } catch (e: any) {
                            setRenewMessage(`❌ ${e?.message || 'Failed to initiate renewal'}`);
                          } finally {
                            setRenewLoading(false);
                          }
                        }}
                        disabled={renewLoading || !isPaymentReady || renewMessage?.startsWith('⏳') === true}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                       
                      >
                        {renewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : renewMessage?.startsWith('⏳') ? 'Payment Pending' : 'Confirm & Pay'}
                      </button>
                      }
                      <button
                        type="button"
                        onClick={() => {
                          setRenewalModalOpen(false);
                          setSelectedPlanForRenewal(null);
                          setRenewMessage(null);
                        }}
                        disabled={renewLoading}
                        className={`px-5 py-2.5 text-sm font-semibold transition-colors
                          ${buttonSecondary}`}
                       
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
