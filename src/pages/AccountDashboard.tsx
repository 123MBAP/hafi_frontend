import PaymentSettingsCard from '@/components/DashboardParts/PaymentCredentials';
import { useDarkMode } from '@/context/DarkMode';
import LoadingSpinner from '@/components/LoadingSpinner';
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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RoleManagement from '../components/RoleManagement';
import { useAuth } from '../context/AuthContext';

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
  status?: 'active' | 'expired' | 'expiring_soon';
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
  };
};

export default function AccountDashboard() {
  const [data, setData] = useState<AccountDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { darkMode } = useDarkMode();
  const { token } = useAuth();

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
            <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Account Dashboard
            </h1>
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
                          {plan.features.max_image_size_mb} MB
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
                          {plan.features.max_video_size_mb} MB
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
                
                {/* Subscription Status Card */}
                <div 
                  className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-center mb-6">
                    <div 
                      className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <Crown className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {plan.plan_display_name}
                      </h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Current Plan
                      </p>
                    </div>
                  </div>

                  <div 
                    className={`mb-5 p-4 border ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className="text-2xl font-bold">{plan.monthly_fee?.toLocaleString()} RWF</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-85 mt-0.5">per month</div>
                  </div>

                  <div className="space-y-3">
                    <div 
                      className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-emerald-500 mr-3" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>Days Remaining</span>
                      </div>
                      <span className={`font-bold text-sm ${getStatusColor(status)}`}>
                        {plan.days_remaining}
                      </span>
                    </div>

                    <div 
                      className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-emerald-500 mr-3" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>Hours Remaining</span>
                      </div>
                      <span className={`font-bold text-sm ${getStatusColor(status)}`}>
                        {plan.hours_remaining}
                      </span>
                    </div>

                    <div 
                      className={`flex items-center justify-between p-3 border ${darkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>Status</span>
                      </div>
                      <span className={`font-bold text-xs capitalize ${getStatusColor(status)}`}>
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                </div>

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
