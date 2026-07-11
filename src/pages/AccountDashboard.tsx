import PaymentSettingsCard from '@/components/DashboardParts/PaymentCredentials';
import { useDarkMode } from '@/context/DarkMode';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RoleManagement from '../components/RoleManagement';
import { useAuth } from '../context/AuthContext';

import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Crown,
  Database,
  Download,
  FileImage,
  FileVideo,
  HardDrive,
  Headphones,
  PieChart,
  Shield,
  TrendingUp,
  Upload
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// Types for the dashboard data
type StorageUsage = {
  totalSizeBytes: number;
  totalSizeMB: number;
  totalSizeGB: string;
  storageLimit: number;
  storageLimitGB: string;
  usagePercentage: number;
  remainingMB: string;
  fileCount: {
    total: number;
    images: number;
    videos: number;
  };
  breakdown: {
    averageFileSize: string;
    baseStorageMB: number;
    purchasedStorageMB: number;
    purchasedStorageStatus?: 'active' | 'expired' | 'none';
  };
};

type PlanInfo = {
  plan_name: string;
  plan_display_name: string;
  monthly_fee: number;
  subscription_start: string;
  subscription_end: string;
  days_remaining: number;
  hours_remaining: number;
  minutes_remaining: number;
  status?: 'active' | 'expired' | 'expiring_soon' | 'none';
  recent_plan?: string | null;
  features: {
    can_upload_images: boolean;
    can_upload_videos: boolean;
    max_image_size_mb: number;
    max_video_size_mb: number;
    max_products: number;
    support_level: string;
  };
};

type AccountDashboardData = {
  storage: StorageUsage;
  plan: PlanInfo;
  referral_code?: { code: string; expires_at: string } | null;
  recent_uploads: Array<{
    filename: string;
    size_mb: number;
    type: 'image' | 'video';
    uploaded_at: string;
  }>;
  user_profile: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    shopping_type_id?: number | null;
    shopping_type_name?: string | null;
    shopping_type_key?: string | null;
  };
};

export default function AccountDashboard() {
  const [data, setData] = useState<AccountDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { darkMode } = useDarkMode();
  const { token } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
    isExpired: true
  });

  useEffect(() => {
    if (!data?.plan?.subscription_end) {
      setTimeRemaining({
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        isExpired: true
      });
      return;
    }

    const calculateCountdown = () => {
      const endTime = new Date(data.plan.subscription_end).getTime();
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
          isExpired: true
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 3600 * 24));
      const hours = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600));
      const minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        isExpired: false
      });
    };

    calculateCountdown(); // Run immediately
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [data?.plan?.subscription_end]);

  useEffect(() => {
    async function fetchAccountData() {
      try {
        setLoading(true);
        setError(null);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await fetch(`${API_BASE}/api/users/account-dashboard`, { headers });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to view your account dashboard');
          }
          throw new Error('Failed to fetch account data');
        }

        const result = await response.json();
        console.log('Account Dashboard Data:', result);
        setData(result);
      } catch (err) {
        console.error('Error fetching account data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load account data');
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, []);

  // Separate function to fetch storage data for real-time updates
  const fetchStorageData = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Fetch real-time storage usage data
      const storageResponse = await fetch(`${API_BASE}/api/users/storage-usage`, { headers });

      console.log('received storage response:', storageResponse);

      if (storageResponse.ok) {
        const storageData = await storageResponse.json();

        // Update the data state with real storage information
        setData(prevData => prevData ? {
          ...prevData,
          storage: {
            ...prevData.storage,
            totalSizeMB: storageData.usedMB,
            totalSizeBytes: Math.round(storageData.usedMB * 1024 * 1024),
            totalSizeGB: (storageData.usedMB / 1024).toFixed(3),
            storageLimit: storageData.totalMB,
            storageLimitGB: (storageData.totalMB / 1024).toFixed(3),
            usagePercentage: storageData.usagePercentage,
            remainingMB: storageData.remainingMB.toFixed(2),
            breakdown: {
              ...prevData.storage.breakdown,
              baseStorageMB: storageData.baseStorageMB || 0,
              purchasedStorageMB: storageData.purchasedStorageMB || 0,
              purchasedStorageStatus: storageData.purchasedStorageStatus || 'none'
            }
          }
        } : null);
      }
    } catch (err) {
      console.error('Error fetching storage data:', err);
    }
  };

  // Function to refresh storage calculation
  const refreshStorage = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await fetch(`${API_BASE}/api/users/refresh-storage`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        // Fetch updated data after refresh
        await fetchStorageData();
        console.log('Storage refreshed successfully');
      }
    } catch (err) {
      console.error('Error refreshing storage:', err);
    }
  };

  const formatFileSize = (sizeInGB: number): string => {
    if (sizeInGB < 0.001) {
      return `${(sizeInGB * 1024 * 1024).toFixed(1)} MB`;
    }
    return `${sizeInGB.toFixed(2)} GB`;
  };

  const formatTimeRemaining = (days: number, hours: number, minutes: number): string => {
    if (days > 0) {
      return `${days} days, ${hours} hours`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-605 dark:text-green-400 text-green-600';
      case 'expiring_soon': return 'text-yellow-605 dark:text-yellow-400 text-yellow-600';
      case 'expired': return 'text-red-605 dark:text-red-400 text-red-600';
      default: return 'text-gray-500 dark:text-gray-450';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'expiring_soon': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'expired': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const handleSavePaymentCredentials = async (creds: any) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/profile/payment-credentials`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save payment credentials");
      alert("Payment credentials saved successfully!");
    } catch (err) {
      alert(`Failed to save credentials: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-850'} flex items-center justify-center`}>
        <div className="text-center py-16">
          <LoadingSpinner size="lg" message="Loading account dashboard..." variant="dots" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-600 text-lg font-bold mb-4 uppercase tracking-tighter">Error loading account data</div>
          <p className={`mb-6 text-sm ${darkMode ? 'text-gray-450' : 'text-gray-550'}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 transition-all font-semibold"
            style={{ borderRadius: '2px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { storage, plan, recent_uploads, user_profile } = data!;

  // Check if the user is only a customer (no provider/seller roles)
  const userRoles = user_profile?.roles || [];
  const isPureCustomer = userRoles.length === 1 && userRoles.includes('customer');

  // Defensive plan status values
  const status = plan?.status ?? 'unknown';
  const displayStatus = typeof status === 'string' ? status.replace('_', ' ') : String(status);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-850'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Styled like standard dashboard page titles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <Link
              to="/profile"
              className={`flex items-center text-sm font-semibold transition-colors ${darkMode ? 'text-emerald-400 hover:text-emerald-350' : 'text-emerald-600 hover:text-emerald-700'} mr-4`}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Profile
            </Link>
            <div>
              <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Account Dashboard
              </h1>
              {user_profile?.shopping_type_name && (
                <div className="flex mt-1.5 animate-fadeIn">
                  <span 
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                      darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-805'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    Premium Shop Category: {user_profile.shopping_type_name}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!isPureCustomer && (
            <div className="flex gap-2">
              <Link
                to="/dashboard/upgrade"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 font-semibold text-xs transition-all flex items-center shadow-sm uppercase tracking-wider"
                style={{ borderRadius: '2px' }}
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Upgrade Plan
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 border font-semibold text-xs transition-all flex items-center shadow-sm uppercase tracking-wider
                  ${darkMode
                    ? 'bg-gray-850 hover:bg-gray-800 border-gray-700 text-white'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-750'}`}
                style={{ borderRadius: '2px' }}
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Main Dashboard
              </Link>
            </div>
          )}
        </div>

        {!isPureCustomer && (
          <div
            className={`p-4 mb-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ borderRadius: '2px' }}
          >
            <div className="text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-450 dark:text-gray-450 block mb-1">
                Subscription Time Remaining
              </span>
              <div className={`text-3xl font-mono font-extrabold tracking-widest leading-none ${timeRemaining.isExpired ? 'text-red-505' : 'text-emerald-505 animate-pulse'}`}>
                {timeRemaining.days}:{timeRemaining.hours}:{timeRemaining.minutes}:{timeRemaining.seconds}
              </div>
              <div className="flex justify-center gap-6 mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-450 dark:text-gray-550">
                <span>Days</span>
                <span>Hours</span>
                <span>Mins</span>
                <span>Secs</span>
              </div>
            </div>
          </div>
        )}

        {/* Agent Referral Code Card */}
        {data?.referral_code && (
          <div 
            className={`p-6 border border-emerald-500 shadow-md mb-6 ${darkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'}`}
            style={{ borderRadius: '2px' }}
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-500 text-white rounded" style={{ borderRadius: '2px' }}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-805'}`}>
                  Agent Referral Code
                </h4>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                  Valid for 24 hours after first payment
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-emerald-500/20 py-3 px-4 text-center select-all cursor-pointer hover:border-emerald-500 transition-colors" style={{ borderRadius: '2px' }} onClick={() => {
              navigator.clipboard.writeText(data.referral_code?.code || '');
              alert('Referral code copied to clipboard!');
            }}>
              <span className={`text-xl font-mono font-extrabold tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {data.referral_code.code}
              </span>
            </div>

            <p className={`text-[10px] font-semibold text-center mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Give this code to the agent who registered you. They will claim a registration reward!
            </p>
            <p className={`text-[9px] font-bold text-center mt-1 text-red-500 dark:text-red-400`}>
              Expires: {new Date(data.referral_code.expires_at).toLocaleString()}
            </p>
          </div>
        )}

        {/* Payment Settings Card */}
        {!isPureCustomer && (user_profile?.roles?.includes('service_provider') || user_profile?.roles?.includes('seller')) && (
          <div 
            className={`border p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            <div className="flex items-center mb-6">
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                style={{ borderRadius: '2px' }}
              >
                <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className={`text-base font-bold uppercase tracking-tight ml-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Settings
              </h3>
            </div>
            <PaymentSettingsCard
              onSave={handleSavePaymentCredentials}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Role Management Section */}
        <div className="mt-8">
          <RoleManagement
            currentRoles={user_profile.roles || []}
            onRoleUpdate={() => window.location.reload()}
          />
        </div>

        {!isPureCustomer && (
          <>
            {/* Section Header - Standard clean format */}
            <h2 className={`text-lg font-bold tracking-tighter uppercase mt-8 mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Storage Usage & Plan Analytics
            </h2>

            {/* Horizontal Subscription Status Header */}
            <div 
              className={`p-6 mb-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-center">
                
                {/* Col 1: Plan Icon & Name */}
                <div className="flex items-center lg:col-span-2">
                  <div 
                    className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-205 text-emerald-650'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Crown className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {plan.status === 'none' || plan.status === 'expired' ? 'No Active Plan' : plan.plan_display_name}
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-50'}`}>
                      Current Plan
                    </p>
                  </div>
                </div>

                {/* Col 2: Shop Category / Recent Subscribed */}
                <div>
                  {user_profile?.shopping_type_name ? (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-400 block">
                        Shop Category
                      </span>
                      <span className={`text-sm font-bold block mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user_profile.shopping_type_name}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-455 dark:text-gray-400 block">
                        Recent Subscribed
                      </span>
                      <span className={`text-sm font-bold block mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {plan.status === 'expired' && plan.recent_plan ? plan.recent_plan : (plan.status === 'none' ? 'None' : 'N/A')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Col 3: Pricing Plan Fee */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-455 dark:text-gray-400 block">
                    Pricing
                  </span>
                  <span className={`text-sm font-extrabold block mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {plan.status !== 'none' && plan.status !== 'expired' ? `${plan.monthly_fee?.toLocaleString()} RWF` : '0 RWF'}
                  </span>
                  <span className="text-[9px] font-bold text-gray-450 dark:text-gray-450 uppercase tracking-widest block leading-none mt-0.5">
                    {plan.status !== 'none' && plan.status !== 'expired' ? 'per month' : 'Free Tier'}
                  </span>
                </div>

                {/* Col 4: Subscription Details & Status */}
                <div className="flex flex-col gap-1 text-xs">
                  {plan.subscription_start && (
                    <div className="flex justify-between">
                      <span className="text-gray-455 dark:text-gray-400 font-medium">Subscribed:</span>
                      <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(plan.subscription_start).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {plan.subscription_end && (
                    <div className="flex justify-between">
                      <span className="text-gray-455 dark:text-gray-400 font-medium">Expires:</span>
                      <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(plan.subscription_end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-455 dark:text-gray-400 font-medium">Status:</span>
                    <span className={`font-bold uppercase text-[9px] ${getStatusColor(plan.status || 'none')}`}>
                      {plan.status === 'none' ? 'no active plan' : (plan.status === 'expired' ? 'expired' : 'active')}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column - Storage & Usage */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Storage Overview Card */}
                <div 
                  className={`border p-6 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div 
                        className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <HardDrive className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="ml-4">
                        <h3 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Storage Usage
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Total storage limit: {storage.storageLimitGB} GB
                        </p>
                      </div>
                    </div>
                    
                    <span 
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${getStatusBg('active')} ${getStatusColor('active')}`}
                      style={{ borderRadius: '2px' }}
                    >
                      {storage.usagePercentage}% Used
                    </span>
                  </div>

                  {/* Storage Progress Bars */}
                  <div className="space-y-6 mb-8">
                    
                    {/* 1. Subscription/Base Storage Plan */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'} mr-2`}>
                            Subscription Plan Storage
                          </span>
                          {plan.status === 'expired' && (
                            <span 
                              className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                              style={{ borderRadius: '2px' }}
                            >
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {(storage.breakdown.baseStorageMB / 1024).toFixed(2)} GB
                        </span>
                      </div>
                      <div className={`w-full h-3 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                        <div
                          className={`h-full transition-all duration-700 ${plan.status === 'expired'
                            ? 'bg-gray-400 dark:bg-gray-650'
                            : 'bg-emerald-500'
                            }`}
                          style={{
                            width: `${Math.min((storage.totalSizeMB / (storage.breakdown.baseStorageMB || 1)) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* 2. Bought/Extra Storage */}
                    {storage.breakdown.purchasedStorageMB > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'} mr-2`}>
                              Extra Purchased Storage
                            </span>
                            {storage.breakdown.purchasedStorageStatus === 'expired' && (
                              <span 
                                className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200"
                                style={{ borderRadius: '2px' }}
                              >
                                EXPIRED
                              </span>
                            )}
                            {storage.breakdown.purchasedStorageStatus === 'active' && (
                              <span 
                                className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-800"
                                style={{ borderRadius: '2px' }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {(storage.breakdown.purchasedStorageMB / 1024).toFixed(2)} GB
                          </span>
                        </div>
                        <div className={`w-full h-3 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                          <div
                            className={`h-full transition-all duration-700 ${storage.breakdown.purchasedStorageStatus === 'expired'
                              ? 'bg-gray-400 dark:bg-gray-650'
                              : 'bg-emerald-600'
                              }`}
                            style={{
                              width: `${Math.min(
                                Math.max(0, storage.totalSizeMB - storage.breakdown.baseStorageMB) / (storage.breakdown.purchasedStorageMB || 1) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* 3. Total Storage */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Total Storage Usage
                        </span>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mr-1.5`}>
                            {storage.totalSizeGB} GB
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            / {storage.storageLimitGB} GB
                          </span>
                        </div>
                      </div>
                      <div className={`w-full h-3.5 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                          style={{ width: `${Math.min(storage.usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-right mt-1.5">
                        <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-550' : 'text-gray-450'}`}>
                          {(parseFloat(storage.remainingMB) / 1024).toFixed(2)} GB free
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Breakdown Grid - Sharp Flat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div 
                      className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center mb-3">
                        <FileImage className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Images</span>
                      </div>
                      <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.images}
                      </div>
                    </div>

                    <div 
                      className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center mb-3">
                        <FileVideo className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Videos</span>
                      </div>
                      <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.videos}
                      </div>
                    </div>

                    <div 
                      className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center mb-3">
                        <Database className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Files</span>
                      </div>
                      <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.total}
                      </div>
                    </div>

                    <div 
                      className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg File Size</span>
                      </div>
                      <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.breakdown.averageFileSize}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Features & Recent Uploads Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Plan Features Card */}
                  <div 
                    className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className="flex items-center mb-6">
                      <div 
                        className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <Shield className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h3 className={`text-base font-bold ml-4 uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Plan Features
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <Upload className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Image Uploads</span>
                        </div>
                        <span 
                          className={`px-2 py-0.5 text-[10px] font-bold border ${plan.features.can_upload_images
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-red-100 text-red-650 border-red-200'
                            }`}
                          style={{ borderRadius: '2px' }}
                        >
                          {plan.features.can_upload_images ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <Download className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Video Uploads</span>
                        </div>
                        <span 
                          className={`px-2 py-0.5 text-[10px] font-bold border ${plan.features.can_upload_videos
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-red-100 text-red-650 border-red-200'
                            }`}
                          style={{ borderRadius: '2px' }}
                        >
                          {plan.features.can_upload_videos ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <FileImage className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Max Image Size</span>
                        </div>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.max_image_size_mb === 'Unlimited' ? 'Unlimited' : `${plan.features.max_image_size_mb} MB`}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <FileVideo className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Max Video Size</span>
                        </div>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.max_video_size_mb === 'Unlimited' ? 'Unlimited' : `${plan.features.max_video_size_mb} MB`}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <Database className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Max Products</span>
                        </div>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.max_products}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <Headphones className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Support Level</span>
                        </div>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.support_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Uploads Card */}
                  <div 
                    className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div 
                          className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                          style={{ borderRadius: '2px' }}
                        >
                          <PieChart className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className={`text-base font-bold ml-4 uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Recent Uploads
                        </h3>
                      </div>
                      <span 
                        className={`px-2 py-0.5 text-[10px] font-bold border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400`}
                        style={{ borderRadius: '2px' }}
                      >
                        {recent_uploads.length} files
                      </span>
                    </div>
                    <div className="space-y-3">
                      {recent_uploads.slice(0, 4).map((upload, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 border transition-all duration-200 hover:-translate-y-0.5
                            ${darkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}
                          style={{ borderRadius: '2px' }}
                        >
                          <div className="flex items-center">
                            {upload.type === 'image' ? (
                              <div className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded mr-3" style={{ borderRadius: '2px' }}>
                                <FileImage className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            ) : (
                              <div className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded mr-3" style={{ borderRadius: '2px' }}>
                                <FileVideo className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            )}
                            <div>
                              <div className={`font-bold text-xs uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {upload.filename}
                              </div>
                              <div className={`text-[10px] ${darkMode ? 'text-gray-450' : 'text-gray-450'}`}>
                                {new Date(upload.uploaded_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {upload.size_mb} MB
                          </div>
                        </div>
                      ))}

                      {recent_uploads.length === 0 && (
                        <div className={`text-center py-8 ${darkMode ? 'text-gray-555' : 'text-gray-455'} border border-dashed border-gray-200 dark:border-gray-700`} style={{ borderRadius: '2px' }}>
                          <FileImage className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                          <p className="text-xs font-semibold">No recent uploads</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Payment */}
              <div className="space-y-6">


                {/* Storage Subscription Status Card (Right Column) */}
                {storage.breakdown.purchasedStorageMB > 0 && (
                  <div 
                    className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className="flex items-center mb-6">
                      <div 
                        className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <Database className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="ml-4">
                        <h3 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Extra Storage Plan
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Subscription Status
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <HardDrive className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Amount Bought</span>
                        </div>
                        <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-905'}`}>
                          {(storage.breakdown.purchasedStorageMB / 1024).toFixed(2)} GB
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>Status</span>
                        </div>
                        <span 
                          className={`px-2 py-0.5 text-[9px] font-bold border uppercase ${storage.breakdown.purchasedStorageStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                          style={{ borderRadius: '2px' }}
                        >
                          {storage.breakdown.purchasedStorageStatus || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Statistics Card */}
                <div 
                  className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-center mb-6">
                    <div 
                      className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <Database className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className={`text-base font-bold ml-4 uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      File Statistics
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center">
                        <FileImage className="w-4 h-4 text-emerald-500 mr-3" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Images</span>
                      </div>
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.images}
                      </span>
                    </div>

                    <div 
                      className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center">
                        <FileVideo className="w-4 h-4 text-emerald-500 mr-3" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Videos</span>
                      </div>
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.videos}
                      </span>
                    </div>

                    <div 
                      className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center">
                        <Database className="w-4 h-4 text-emerald-500 mr-3" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Files</span>
                      </div>
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.total}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
