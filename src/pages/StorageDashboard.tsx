import { useDarkMode } from '@/context/DarkMode';
import { ArrowLeft, Calendar, Clock, Database, FileImage, FileVideo, HardDrive, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// Types for the dashboard data
type StorageUsage = {
  total_storage_gb: number;
  used_storage_gb: number;
  remaining_storage_gb: number;
  usage_percentage: number;
  files_count: {
    images: number;
    videos: number;
    total: number;
  };
  breakdown: {
    product_images_gb: number;
    service_images_gb: number;
    videos_gb: number;
    profile_images_gb: number;
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
  status: 'active' | 'expired' | 'expiring_soon';
  features: {
    can_upload_images: boolean;
    can_upload_videos: boolean;
    max_image_size_mb: number;
    max_video_size_mb: number;
    max_products: number;
    support_level: string;
  };
};

type StorageDashboardData = {
  storage: StorageUsage;
  plan: PlanInfo;
  recent_uploads: Array<{
    filename: string;
    size_mb: number;
    type: 'image' | 'video';
    uploaded_at: string;
  }>;
};

export default function StorageDashboard() {
  const [data, setData] = useState<StorageDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    async function fetchStorageData() {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await fetch(`${API_BASE}/api/users/storage-dashboard`, { headers });

        if (!response.ok) {
          throw new Error('Failed to fetch storage data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching storage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load storage data');

        // Mock data for development/testing
        setData({
          storage: {
            total_storage_gb: 5.0,
            used_storage_gb: 2.3,
            remaining_storage_gb: 2.7,
            usage_percentage: 46,
            files_count: {
              images: 145,
              videos: 12,
              total: 157
            },
            breakdown: {
              product_images_gb: 1.8,
              service_images_gb: 0.3,
              videos_gb: 0.15,
              profile_images_gb: 0.05
            }
          },
          plan: {
            plan_name: "premium",
            plan_display_name: "Premium Plan",
            monthly_fee: 2500,
            subscription_start: "2024-10-01T00:00:00Z",
            subscription_end: "2024-11-01T00:00:00Z",
            days_remaining: 12,
            hours_remaining: 8,
            minutes_remaining: 45,
            status: 'active',
            features: {
              can_upload_images: true,
              can_upload_videos: true,
              max_image_size_mb: 10,
              max_video_size_mb: 50,
              max_products: 100,
              support_level: "Premium"
            }
          },
          recent_uploads: [
            {
              filename: "product-showcase.jpg",
              size_mb: 2.4,
              type: 'image',
              uploaded_at: "2024-10-03T14:30:00Z"
            },
            {
              filename: "service-demo.mp4",
              size_mb: 15.8,
              type: 'video',
              uploaded_at: "2024-10-02T09:15:00Z"
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStorageData();
  }, []);

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
      case 'active': return 'text-green-600';
      case 'expiring_soon': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100';
      case 'expiring_soon': return 'bg-yellow-100';
      case 'expired': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading storage dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading storage data</div>
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

  const { storage, plan, recent_uploads } = data!;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/profile"
            className={`flex items-center ${darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} mr-4`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Profile
          </Link>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Storage Dashboard
          </h1>
        </div>

        {/* Plan Status Banner */}
        <div className={`mb-8 p-6 rounded-xl ${getStatusBg(plan.status)} border-l-4 ${plan.status === 'active' ? 'border-green-500' :
            plan.status === 'expiring_soon' ? 'border-yellow-500' : 'border-red-500'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${getStatusColor(plan.status)}`}>
                {plan.plan_display_name}
              </h2>
              <p className="text-gray-700 mt-1">
                {plan.status === 'active' && `${formatTimeRemaining(plan.days_remaining, plan.hours_remaining, plan.minutes_remaining)} remaining`}
                {plan.status === 'expiring_soon' && 'Expires soon - Consider upgrading'}
                {plan.status === 'expired' && 'Plan expired - Please renew'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{plan.monthly_fee} RWF</div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Storage Usage Card */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 lg:col-span-2`}>
            <div className="flex items-center mb-6">
              <HardDrive className="w-6 h-6 text-teal-600 mr-3" />
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Storage Usage
              </h3>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {formatFileSize(storage.used_storage_gb)} of {formatFileSize(storage.total_storage_gb)} used
                </span>
                <span className={`font-semibold ${storage.usage_percentage > 80 ? 'text-red-600' : 'text-teal-600'}`}>
                  {storage.usage_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${storage.usage_percentage > 90 ? 'bg-red-500' :
                      storage.usage_percentage > 80 ? 'bg-yellow-500' : 'bg-teal-500'
                    }`}
                  style={{ width: `${Math.min(storage.usage_percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Storage Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <FileImage className="w-4 h-4 text-blue-500 mr-2" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Product Images</span>
                </div>
                <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatFileSize(storage.breakdown.product_images_gb)}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <FileVideo className="w-4 h-4 text-purple-500 mr-2" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Videos</span>
                </div>
                <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatFileSize(storage.breakdown.videos_gb)}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <Database className="w-4 h-4 text-green-500 mr-2" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Service Images</span>
                </div>
                <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatFileSize(storage.breakdown.service_images_gb)}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <Zap className="w-4 h-4 text-orange-500 mr-2" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Profile Images</span>
                </div>
                <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatFileSize(storage.breakdown.profile_images_gb)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-teal-600 mr-2" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Subscription</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Days Left</span>
                  <span className={`font-semibold ${getStatusColor(plan.status)}`}>{plan.days_remaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Hours Left</span>
                  <span className={`font-semibold ${getStatusColor(plan.status)}`}>{plan.hours_remaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status</span>
                  <span className={`font-semibold capitalize ${getStatusColor(plan.status)}`}>{plan.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-teal-600 mr-2" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>File Count</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Images</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{storage.files_count.images}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Videos</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{storage.files_count.videos}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Total Files</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{storage.files_count.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Features & Recent Uploads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Features */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Plan Features
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Image Uploads</span>
                <span className={`px-3 py-1 rounded-full text-sm ${plan.features.can_upload_images
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}>
                  {plan.features.can_upload_images ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Video Uploads</span>
                <span className={`px-3 py-1 rounded-full text-sm ${plan.features.can_upload_videos
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}>
                  {plan.features.can_upload_videos ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Max Image Size</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {plan.features.max_image_size_mb} MB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Max Video Size</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {plan.features.max_video_size_mb} MB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Max Products</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {plan.features.max_products}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Support Level</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {plan.features.support_level}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Uploads
            </h3>
            <div className="space-y-4">
              {recent_uploads.map((upload, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center">
                    {upload.type === 'image' ? (
                      <FileImage className="w-5 h-5 text-blue-500 mr-3" />
                    ) : (
                      <FileVideo className="w-5 h-5 text-purple-500 mr-3" />
                    )}
                    <div>
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {upload.filename}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(upload.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {upload.size_mb} MB
                  </div>
                </div>
              ))}

              {recent_uploads.length === 0 && (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No recent uploads
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/dashboard/upgrade-plans"
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            Upgrade Plan
          </Link>
          <Link
            to="/dashboard"
            className={`px-6 py-3 rounded-lg transition-colors font-medium ${darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}