import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';
import { useAuth } from '@/context/AuthContext';
import { usePhases } from '@/context/PhaseContext';
import SubscriptionBanner from '@/components/DashboardParts/PlansScrollingBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { API_BASE } from '../api/apiClient';
import {
  User,
  Store,
  Briefcase,
  ShoppingBag,
  MessageCircle,
  Crown,
  HardDrive,
  FileImage,
  FileVideo,
  Database,
  ArrowRight,
  Calendar,
  Sparkles,
  Clock,
  RefreshCw,
  TrendingUp
} from 'lucide-react';


export default function DashboardOverviewPage() {
  const { darkMode } = useDarkMode();
  const { user, token } = useAuth();
  const { isPhaseEnabled } = usePhases();
  const navigate = useNavigate();

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isSeller = roles.includes('seller');
  const isServiceProvider = roles.includes('service_provider');
  const providerId = localStorage.getItem('providerId');

  // Show Bookings and Requests based on Phase 2 feature flag
  const showPhase2Features = isPhaseEnabled('phase_2');

  // State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [customRequestCount, setCustomRequestCount] = useState<number | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState<number | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (roles.includes('agent')) {
      navigate('/dashboard/agent', { replace: true });
      return;
    }
    let active = true;
    const loadOverviewData = async () => {
      if (!token) return;
      setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };

      // Safe fetch helper
      const safeFetch = async (url: string, options: any = {}) => {
        try {
          const res = await fetch(url, options);
          if (res.ok) return await res.json();
        } catch (e) {
          console.error(`Error fetching: ${url}`, e);
        }
        return null;
      };

      // 1. Fetch account dashboard data (Storage, Plan, User Profile)
      const acctData = await safeFetch(`${API_BASE}/api/users/account-dashboard`, { headers });
      if (!active) return;
      if (acctData) setDashboardData(acctData);

      // 2. Fetch Seller products if applicable
      if (isSeller) {
        const prodData = await safeFetch(`${API_BASE}/api/seller/products/images`, { headers });
        if (!active) return;
        if (prodData && Array.isArray(prodData.products)) {
          setProductCount(prodData.products.length);
        } else {
          setProductCount(0);
        }
      }

      // 3. Fetch Service Provider media/portfolio if applicable
      if (isServiceProvider && providerId) {
        const mediaData = await safeFetch(`${API_BASE}/api/providers/${providerId}/media`);
        if (!active) return;
        if (mediaData) {
          let count = 0;
          if (Array.isArray(mediaData.product)) count += mediaData.product.length;
          if (Array.isArray(mediaData.service)) count += mediaData.service.length;
          setServiceCount(count);
        } else {
          setServiceCount(0);
        }

        // 4. Fetch Bookings if Phase 2 is enabled
        if (showPhase2Features) {
          const bookingData = await safeFetch(`${API_BASE}/api/provider-bookings`, { headers });
          if (!active) return;
          if (bookingData && Array.isArray(bookingData.bookings)) {
            // Count pending bookings
            const pending = bookingData.bookings.filter((b: any) => b.status === 'pending').length;
            setBookingCount(pending);
          } else {
            setBookingCount(0);
          }
        }

        // 5. Fetch Custom Requests if Phase 2 is enabled
        if (showPhase2Features) {
          const reqData = await safeFetch(`${API_BASE}/api/custom-service-request/provider`, { headers });
          if (!active) return;
          if (reqData && Array.isArray(reqData)) {
            // Count pending requests
            const pending = reqData.filter((r: any) => r.status === 'pending').length;
            setCustomRequestCount(pending);
          } else {
            setCustomRequestCount(0);
          }
        }
      }

      // 6. Fetch Orders (Seller & Provider share provider/orders)
      if (isSeller || isServiceProvider) {
        const orderData = await safeFetch(`${API_BASE}/api/provider/orders`, { headers });
        if (!active) return;
        if (orderData && Array.isArray(orderData.orders)) {
          // Count active orders (non-delivered)
          const activeOrders = orderData.orders.filter((o: any) => o.status !== 'delivered').length;
          setActiveOrderCount(activeOrders);
        } else {
          setActiveOrderCount(0);
        }
      }

      // 7. Fetch Customer Chats for Message badges
      if (isSeller || isServiceProvider) {
        const chatData = await safeFetch(`${API_BASE}/api/messages/provider/customers`, { headers });
        if (!active) return;
        if (chatData && Array.isArray(chatData)) {
          const unread = chatData.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
          setUnreadChatCount(unread);
        } else {
          setUnreadChatCount(0);
        }
      }

      setLoading(false);
    };

    loadOverviewData();

    return () => {
      active = false;
    };
  }, [token, isSeller, isServiceProvider, providerId, showPhase2Features, refreshKey]);

  // Extract Plan information defensively
  const plan = dashboardData?.plan || {
    plan_name: 'basic',
    plan_display_name: 'Basic',
    monthly_fee: 0,
    days_remaining: 0,
    hours_remaining: 0,
    status: 'active'
  };

  // Extract Storage info defensively
  const storage = dashboardData?.storage || {
    totalSizeGB: '0.00',
    storageLimitGB: '0.00',
    usagePercentage: 0,
    fileCount: { total: 0, images: 0, videos: 0 }
  };

  // Get dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading && refreshKey === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="text-center py-16">
          <LoadingSpinner size="lg" message="Loading dashboard..." variant="dots" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen -mx-4 sm:mx-0 overflow-x-hidden transition-colors duration-200 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Plans scrolling banner at navbar top */}
      <div
        className="sticky z-30 w-full overflow-x-hidden overflow-y-visible bg-red-50 border-b border-red-300 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">

        {/* Page Header */}
        <PageHeader
          badge="Control Panel"
          title="Overview"
          subtitle="Real-time summary of your HafiConnect accounts, listings, appointments, and data."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Overview' }
          ]}
          actions={
            <button
              onClick={triggerRefresh}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          }
        />

        {/* 1. Hero Welcoming Card */}
        <div className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm border-l-4 border-l-brand-red ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
          <div className="relative z-10">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-brand-red border border-red-100 dark:bg-red-950/40 dark:border-red-900/40">
              Control Panel
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-3 tracking-tight text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name || 'User'}!
            </h2>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              Here is a unified look at your listings, appointments, statistics, and billing profiles.
            </p>
          </div>

          {/* Roles container */}
          <div className="flex flex-wrap gap-2 md:self-end z-10">
            {roles.map(role => {
              let label = role;
              if (role === 'customer') label = 'Client';
              else if (role === 'seller') label = 'Merchant';
              else if (role === 'service_provider') label = 'Service Provider';
              return (
                <span
                  key={role}
                  className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-700 bg-[#F5F5F5] dark:bg-zinc-800 text-gray-800 dark:text-gray-200 uppercase tracking-wide"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* 2. Core Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Merchant Products listing count */}
          {isSeller && (
            <div className={`p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red shrink-0">
                <Store className="w-5 h-5 text-brand-red" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Products Listed</p>
                <h3 className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">{productCount !== null ? productCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Service Provider portfolio count */}
          {isServiceProvider && (
            <div className={`p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red shrink-0">
                <Briefcase className="w-5 h-5 text-brand-red" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Services & Media</p>
                <h3 className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">{serviceCount !== null ? serviceCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Active Orders count */}
          {(isSeller || isServiceProvider) && (
            <div className={`p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red shrink-0">
                <ShoppingBag className="w-5 h-5 text-brand-red" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Active Orders</p>
                <h3 className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">{activeOrderCount !== null ? activeOrderCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Unread customer chats count */}
          {(isSeller || isServiceProvider) && (
            <div className={`p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red shrink-0">
                <MessageCircle className="w-5 h-5 text-brand-red" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Unread Messages</p>
                <h3 className={`text-2xl font-bold mt-0.5 ${unreadChatCount && unreadChatCount > 0 ? 'text-brand-red' : 'text-gray-900 dark:text-white'}`}>
                  {unreadChatCount !== null ? unreadChatCount : '...'}
                </h3>
              </div>
            </div>
          )}

          {/* Pending Bookings count (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div className={`p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red shrink-0">
                <Calendar className="w-5 h-5 text-brand-red" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending Bookings</p>
                <h3 className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">{bookingCount !== null ? bookingCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Pending Customization requests count (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div className={`p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red shrink-0">
                <Sparkles className="w-5 h-5 text-brand-red" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Custom Inquiries</p>
                <h3 className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">{customRequestCount !== null ? customRequestCount : '...'}</h3>
              </div>
            </div>
          )}
        </div>

        {/* 3. Subscription Plan and Storage Meter Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Subscription Plan details */}
          <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <Crown className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                      Subscription Plan
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Plan restrictions and billing metrics</p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${plan.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'}`}>
                  {plan.status || 'Active'}
                </span>
              </div>

              {/* Pricing Display */}
              <div className={`mb-4 p-4 rounded-lg border ${darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-[#F5F5F5] border-gray-200/70'}`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">Current Pricing Tier</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {plan.monthly_fee?.toLocaleString() || '0'}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">RWF/month</span>
                </div>
              </div>

              {/* Expiry / Days Remaining */}
              <div className={`p-4 rounded-lg border flex items-center justify-between mb-5 ${darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-[#F5F5F5] border-gray-200/70'}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-brand-red shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Expiration Countdown</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {plan.days_remaining > 0
                        ? `${plan.days_remaining} days remaining`
                        : plan.hours_remaining > 0
                          ? `${plan.hours_remaining} hours remaining`
                          : 'Expired or Unknown'}
                    </p>
                  </div>
                </div>
                {plan.days_remaining <= 5 && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900 animate-pulse">
                    Expiring soon
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/dashboard/upgrade"
              className="w-full py-2.5 px-4 font-semibold text-center text-sm rounded-lg bg-brand-red hover:bg-red-700 text-white shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Manage Subscription Plan
            </Link>
          </div>

          {/* Storage Usage progress bar */}
          <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <HardDrive className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                      Storage Usage
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allocated and used server storage</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                  {storage.usagePercentage}% Used
                </span>
              </div>

              {/* Storage Stats details */}
              <div className="mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Data Capacity</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {storage.totalSizeGB} GB
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {' '}/ {storage.storageLimitGB} GB
                    </span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <div
                    className="h-full bg-brand-red rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(storage.usagePercentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Media Counts Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-[#F5F5F5] border-gray-200/70'}`}>
                  <FileImage className="w-4 h-4 text-brand-red mx-auto mb-1" />
                  <p className="text-[10px] uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400">Images</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{storage.fileCount?.images || 0}</p>
                </div>

                <div className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-[#F5F5F5] border-gray-200/70'}`}>
                  <FileVideo className="w-4 h-4 text-brand-red mx-auto mb-1" />
                  <p className="text-[10px] uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400">Videos</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{storage.fileCount?.videos || 0}</p>
                </div>

                <div className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-[#F5F5F5] border-gray-200/70'}`}>
                  <Database className="w-4 h-4 text-brand-red mx-auto mb-1" />
                  <p className="text-[10px] uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400">Total files</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{storage.fileCount?.total || 0}</p>
                </div>
              </div>
            </div>

            <Link
              to="/dashboard/account"
              className={`w-full py-2.5 px-4 rounded-lg border font-semibold text-center text-sm transition-all duration-200 flex items-center justify-center gap-2 ${darkMode
                  ? 'border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 text-white'
                  : 'border-gray-200 bg-white hover:bg-[#F5F5F5] text-gray-900'}`}
            >
              <User className="w-4 h-4" />
              View Account Storage Details
            </Link>
          </div>
        </div>

        {/* 4. Active Area Navigation Shortcuts */}
        <h3 className="text-base font-bold tracking-tight uppercase mb-4 text-gray-900 dark:text-white">
          Dashboards & Navigation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Seller catalog manager */}
          {isSeller && (
            <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <Store className="w-4 h-4 text-brand-red" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Merchant Catalog Area</h4>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Manage product categories, configure catalog uploads, set product pricing, and upload product views.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/seller')}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
              >
                Open Merchant Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Service provider manager */}
          {isServiceProvider && (
            <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <Briefcase className="w-4 h-4 text-brand-red" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Service Provider Area</h4>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Describe your main service category, upload portfolio images/videos, and configure custom services variables.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/provider')}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
              >
                Open Service Provider Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Client orders & fulfillment */}
          {(isSeller || isServiceProvider) && (
            <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <ShoppingBag className="w-4 h-4 text-brand-red" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Clients Orders Ledger</h4>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Fulfill customer orders, review pricing quotes, acknowledge client payments, and track delivery status.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/orders')}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
              >
                Open Orders Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Service appointments / ledger (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <Calendar className="w-4 h-4 text-brand-red" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Service Bookings</h4>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Review direct bookings from clients, verify arrival logs, and inspect escrow balance records.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/payments')}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
              >
                Open Booking Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Custom service request quotes (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <Sparkles className="w-4 h-4 text-brand-red" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Customization Requests</h4>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Address customer customization parameters, propose quoted prices, and accept custom contracts.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/requests')}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
              >
                Open Customization Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Center */}
          {(isSeller || isServiceProvider) && (
            <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                    <MessageCircle className="w-4 h-4 text-brand-red" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Customer Communications</h4>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Converse with buyers and clients directly, address support inquiries, and arrange shipping routes.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/messages')}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
              >
                Open Message Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* General accounts setting */}
          <div className={`p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-brand-red">
                  <User className="w-4 h-4 text-brand-red" />
                </div>
                <h4 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Profile and Security</h4>
              </div>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Set payout credentials, request provider role updates, inspect recent uploads, and review privacy limits.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/account')}
              className="mt-5 w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60 text-gray-800 dark:text-gray-200 hover:border-brand-red hover:text-brand-red"
            >
              Open Account Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}