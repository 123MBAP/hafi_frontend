import PaymentSettingsCard from '@/components/DashboardParts/PaymentCredentials';
import { useDarkMode } from '@/context/DarkMode';
import { ArrowLeft, Calendar, Clock, CreditCard, Crown, Database, Download, FileImage, FileVideo, HardDrive, Headphones, PieChart, Shield, TrendingUp, Upload } from 'lucide-react';
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
        console.log('Account Dashboard Data:', result);
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
      // Keep existing data if real fetch fails
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
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'expiring_soon': return 'text-yellow-600 dark:text-yellow-400';
      case 'expired': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/20';
      case 'expiring_soon': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'expired': return 'bg-red-100 dark:bg-red-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
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
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading account dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading account data</div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
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

  // Defensive plan status values: API may not include `status` in some responses
  const status = plan?.status ?? 'unknown';
  const displayStatus = typeof status === 'string' ? status.replace('_', ' ') : String(status);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/profile"
              className={`flex items-center ${darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} mr-4`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Profile
            </Link>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Account Dashboard
            </h1>
          </div>
          {!isPureCustomer && (
            <div className="flex space-x-3">
              <Link
                to="/dashboard/upgrade"
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium flex items-center shadow-lg"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Link>
              <Link
                to="/dashboard"
                className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium flex items-center border ${darkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  } shadow-sm`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Main Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Payment Settings Card */}
        {!isPureCustomer && (user_profile?.roles?.includes('service_provider') || user_profile?.roles?.includes('seller')) && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 borde ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl mr-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
            <h1 className={`text-4xl font-bold text-center mt-8 mb-8 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent ${darkMode ? 'from-teal-400 via-blue-400 to-purple-400' : ''}`}>
              Storage Usage and Plan Analytics
            </h1>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
              {/* Left Column - Storage & Usage */}
              <div className="xl:col-span-2 space-y-6">
                {/* Storage Overview Card */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4">
                        <HardDrive className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Storage Usage
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Total storage: {storage.storageLimitGB} GB
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${getStatusBg('active')} ${getStatusColor('active')} font-medium flex items-center`}>
                      <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
                      {storage.usagePercentage}% Used
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {/* Storage Progress Bars */}
                  <div className="space-y-6 mb-8">
                    {/* 1. Subscription/Base Storage Plan */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mr-2`}>
                            Subscription Plan Storage
                          </span>
                          {plan.status === 'expired' && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {(storage.breakdown.baseStorageMB / 1024).toFixed(2)} GB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ease-out ${plan.status === 'expired'
                            ? 'bg-gray-400 dark:bg-gray-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-400'
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
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mr-2`}>
                              Extra Purchased Storage
                            </span>
                            {storage.breakdown.purchasedStorageStatus === 'expired' && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                                EXPIRED
                              </span>
                            )}
                            {storage.breakdown.purchasedStorageStatus === 'active' && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {(storage.breakdown.purchasedStorageMB / 1024).toFixed(2)} GB
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-1000 ease-out ${storage.breakdown.purchasedStorageStatus === 'expired'
                              ? 'bg-gray-400 dark:bg-gray-600'
                              : 'bg-gradient-to-r from-purple-500 to-purple-400'
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
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Total Storage Usage
                        </span>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mr-2`}>
                            {storage.totalSizeGB} GB
                          </span>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            / {storage.storageLimitGB} GB
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-4 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(storage.usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-right mt-1">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {(parseFloat(storage.remainingMB) / 1024).toFixed(2)} GB free
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Breakdown Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center mb-3">
                        <FileImage className="w-5 h-5 text-blue-500 mr-2" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Images</span>
                      </div>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.images}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-purple-50 border-purple-200'}`}>
                      <div className="flex items-center mb-3">
                        <FileVideo className="w-5 h-5 text-purple-500 mr-2" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Videos</span>
                      </div>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.videos}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center mb-3">
                        <Database className="w-5 h-5 text-green-500 mr-2" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Files</span>
                      </div>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.total}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="flex items-center mb-3">
                        <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg File Size</span>
                      </div>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.breakdown.averageFileSize}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Features & Recent Uploads Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Plan Features Card */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mr-4">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Plan Features
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <Upload className="w-4 h-4 text-green-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Image Uploads</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${plan.features.can_upload_images
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {plan.features.can_upload_images ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <Download className="w-4 h-4 text-blue-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Video Uploads</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${plan.features.can_upload_videos
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {plan.features.can_upload_videos ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <FileImage className="w-4 h-4 text-orange-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Max Image Size</span>
                        </div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.max_image_size_mb} MB
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <FileVideo className="w-4 h-4 text-purple-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Max Video Size</span>
                        </div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.max_video_size_mb} MB
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <Database className="w-4 h-4 text-teal-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Max Products</span>
                        </div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.max_products}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <Headphones className="w-4 h-4 text-pink-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Support Level</span>
                        </div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.features.support_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Uploads Card */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mr-4">
                          <PieChart className="w-6 h-6 text-white" />
                        </div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Recent Uploads
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}>
                        {recent_uploads.length} files
                      </span>
                    </div>
                    <div className="space-y-4">
                      {recent_uploads.slice(0, 4).map((upload, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                          } transition-all hover:scale-[1.02]`}>
                          <div className="flex items-center">
                            {upload.type === 'image' ? (
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                                <FileImage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            ) : (
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                                <FileVideo className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                            )}
                            <div>
                              <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {upload.filename}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(upload.uploaded_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {upload.size_mb} MB
                          </div>
                        </div>
                      ))}

                      {recent_uploads.length === 0 && (
                        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'} border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-600`}>
                          <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          No recent uploads
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Payment */}
              <div className="space-y-6">
                {/* Subscription Status Card */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mr-4">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {plan.plan_display_name}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Current Plan
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                    <div className="text-3xl font-bold mb-1">{plan.monthly_fee} RWF</div>
                    <div className="text-orange-100 text-sm">per month</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-teal-500 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Days Remaining</span>
                      </div>
                      <span className={`font-bold text-lg ${getStatusColor(status)}`}>
                        {plan.days_remaining}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-blue-500 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Hours Remaining</span>
                      </div>
                      <span className={`font-bold text-lg ${getStatusColor(status)}`}>
                        {plan.hours_remaining}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status</span>
                      </div>
                      <span className={`font-bold text-lg capitalize ${getStatusColor(status)}`}>
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Storage Subscription Status Card (Right Column) */}
                {storage.breakdown.purchasedStorageMB > 0 && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl mr-4">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Extra Storage Plan
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Subscription Status
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <HardDrive className="w-4 h-4 text-purple-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Amount Bought</span>
                        </div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {(storage.breakdown.purchasedStorageMB / 1024).toFixed(2)} GB
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-teal-500 mr-3" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-bold uppercase ${storage.breakdown.purchasedStorageStatus === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {storage.breakdown.purchasedStorageStatus || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Statistics Card */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl mr-4">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      File Statistics
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center">
                        <FileImage className="w-4 h-4 text-blue-500 mr-3" />
                        <span className={darkMode ? 'text-blue-300' : 'text-blue-700'}>Total Images</span>
                      </div>
                      <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.images}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center">
                        <FileVideo className="w-4 h-4 text-purple-500 mr-3" />
                        <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>Total Videos</span>
                      </div>
                      <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {storage.fileCount.videos}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center">
                        <HardDrive className="w-4 h-4 text-green-500 mr-3" />
                        <span className={darkMode ? 'text-green-300' : 'text-green-700'}>Total Files</span>
                      </div>
                      <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
