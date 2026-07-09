import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';
import { useAuth } from '@/context/AuthContext';
import { usePhases } from '@/context/PhaseContext';
import SubscriptionBanner from '@/components/DashboardParts/PlansScrollingBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
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

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
        <div className="text-center py-16">
          <LoadingSpinner size="lg" message="Loading dashboard..." variant="dots" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen -mx-4 sm:mx-0 overflow-x-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Plans scrolling banner at navbar top */}
      <div
        className="sticky z-30 w-full overflow-x-hidden overflow-y-visible bg-yellow-100 border-b border-yellow-400 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
        
        {/* Title Bar - Matching Services page uppercase bold style */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Overview
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Real-time summary of your HafiConnect accounts and data
            </p>
          </div>
          <button
            onClick={triggerRefresh}
            className={`px-3 py-2 border transition-all flex items-center gap-1.5 text-sm font-medium shadow-sm
              ${darkMode 
                ? 'bg-gray-850 hover:bg-gray-800 border-gray-700 text-emerald-400 hover:text-emerald-350' 
                : 'bg-white hover:bg-gray-50 border-gray-200 text-emerald-600 hover:text-emerald-700'}`}
            style={{ borderRadius: '2px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* 1. Hero Welcoming Card - Matching Homepage clean card borders with flat accent border */}
        <div 
          className={`relative overflow-hidden border p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6
            ${darkMode ? 'bg-gray-850 border-gray-800' : 'bg-white border-gray-200'} border-l-4 border-l-emerald-500`}
          style={{ borderRadius: '2px' }}
        >
          <div className="relative z-10">
            <span 
              className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 shadow-sm
                ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}
              style={{ borderRadius: '2px' }}
            >
              Control Panel
            </span>
            <h2 className="text-xl font-bold mt-3 tracking-tight">
              {getGreeting()}, {user?.name || 'User'}!
            </h2>
            <p className={`mt-1.5 text-sm leading-relaxed max-w-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Here is a unified look at your listings, appointments, statistics, and billing profiles.
            </p>
          </div>
          
          {/* Roles container */}
          <div className="flex flex-wrap gap-2 md:self-end z-10">
            {roles.map(role => {
              let colorClass = '';
              let label = role;
              if (role === 'customer') {
                colorClass = darkMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200';
                label = 'Client';
              } else if (role === 'seller') {
                colorClass = darkMode ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
                label = 'Merchant';
              } else if (role === 'service_provider') {
                colorClass = darkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
                label = 'Service Provider';
              } else {
                colorClass = darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200';
              }
              return (
                <span
                  key={role}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${colorClass}`}
                  style={{ borderRadius: '2px' }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* 2. Core Stats Grid - Flat boxes with borderRadius: '2px' */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Merchant Products listing count */}
          {isSeller && (
            <div 
              className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                ${darkMode ? 'bg-gray-800 border-gray-750' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products Listed</p>
                <h3 className="text-2xl font-bold mt-0.5">{productCount !== null ? productCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Service Provider portfolio count */}
          {isServiceProvider && (
            <div 
              className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                ${darkMode ? 'bg-gray-800 border-gray-750' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Services & Media</p>
                <h3 className="text-2xl font-bold mt-0.5">{serviceCount !== null ? serviceCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Active Orders count */}
          {(isSeller || isServiceProvider) && (
            <div 
              className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                ${darkMode ? 'bg-gray-800 border-gray-750' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Orders</p>
                <h3 className="text-2xl font-bold mt-0.5">{activeOrderCount !== null ? activeOrderCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Unread customer chats count */}
          {(isSeller || isServiceProvider) && (
            <div 
              className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                ${darkMode ? 'bg-gray-800 border-gray-750' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unread Messages</p>
                <h3 className={`text-2xl font-bold mt-0.5 ${unreadChatCount && unreadChatCount > 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
                  {unreadChatCount !== null ? unreadChatCount : '...'}
                </h3>
              </div>
            </div>
          )}

          {/* Pending Bookings count (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div 
              className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                ${darkMode ? 'bg-gray-800 border-gray-750' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending Bookings</p>
                <h3 className="text-2xl font-bold mt-0.5">{bookingCount !== null ? bookingCount : '...'}</h3>
              </div>
            </div>
          )}

          {/* Pending Customization requests count (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div 
              className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                ${darkMode ? 'bg-gray-800 border-gray-750' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div 
                className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Custom Inquiries</p>
                <h3 className="text-2xl font-bold mt-0.5">{customRequestCount !== null ? customRequestCount : '...'}</h3>
              </div>
            </div>
          )}
        </div>

        {/* 3. Subscription Plan and Storage Meter Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Subscription Plan details */}
          <div 
            className={`p-6 border shadow-sm flex flex-col justify-between
              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ borderRadius: '2px' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Subscription Plan
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Plan restrictions and billing metrics</p>
                  </div>
                </div>
                
                <span 
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border
                    ${plan.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-600 border-red-500/20'}`}
                  style={{ borderRadius: '2px' }}
                >
                  {plan.status || 'Active'}
                </span>
              </div>

              {/* Pricing Display */}
              <div 
                className={`mb-5 p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                style={{ borderRadius: '2px' }}
              >
                <span className={`text-[10px] font-bold uppercase tracking-widest block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Pricing Tier</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {plan.monthly_fee?.toLocaleString() || '0'}
                  </span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>RWF/month</span>
                </div>
              </div>

              {/* Expiry / Days Remaining */}
              <div 
                className={`p-4 border flex items-center justify-between mb-4
                  ${darkMode ? 'bg-gray-900/30 border-gray-750' : 'bg-gray-50/50 border-gray-150'}`}
                style={{ borderRadius: '2px' }}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expiration Countdown</p>
                    <p className="text-sm font-bold mt-0.5">
                      {plan.days_remaining > 0 
                        ? `${plan.days_remaining} days remaining`
                        : plan.hours_remaining > 0 
                          ? `${plan.hours_remaining} hours remaining`
                          : 'Expired or Unknown'}
                    </p>
                  </div>
                </div>
                {plan.days_remaining <= 5 && (
                  <span 
                    className="text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 border border-amber-500/20 animate-pulse"
                    style={{ borderRadius: '2px' }}
                  >
                    Expiring soon
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/dashboard/upgrade"
              className={`w-full py-2.5 px-4 font-semibold text-center text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5
                ${darkMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
              style={{ borderRadius: '2px' }}
            >
              <TrendingUp className="w-4 h-4" />
              Manage Subscription Plan
            </Link>
          </div>

          {/* Storage Usage progress bar */}
          <div 
            className={`p-6 border shadow-sm flex flex-col justify-between
              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ borderRadius: '2px' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Storage Usage
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Allocated and used server storage</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-450 text-gray-450' : 'text-gray-500'}`}>
                  {storage.usagePercentage}% Used
                </span>
              </div>

              {/* Storage Stats details */}
              <div className="mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Data Capacity</span>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {storage.totalSizeGB} GB
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {' '}/ {storage.storageLimitGB} GB
                    </span>
                  </div>
                </div>

                {/* Progress bar container - flat sharp corners */}
                <div className={`w-full h-3 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(storage.usagePercentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Media Counts Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div 
                  className={`p-3 border text-center ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <FileImage className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className={`text-[9px] uppercase font-bold tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Images</p>
                  <p className="text-sm font-bold mt-0.5">{storage.fileCount?.images || 0}</p>
                </div>
                
                <div 
                  className={`p-3 border text-center ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <FileVideo className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className={`text-[9px] uppercase font-bold tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Videos</p>
                  <p className="text-sm font-bold mt-0.5">{storage.fileCount?.videos || 0}</p>
                </div>

                <div 
                  className={`p-3 border text-center ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <Database className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className={`text-[9px] uppercase font-bold tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total files</p>
                  <p className="text-sm font-bold mt-0.5">{storage.fileCount?.total || 0}</p>
                </div>
              </div>
            </div>

            <Link
              to="/dashboard/account"
              className={`w-full py-2.5 px-4 border font-semibold text-center text-sm transition-all duration-200 flex items-center justify-center gap-1.5
                ${darkMode 
                  ? 'bg-gray-850 hover:bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white hover:bg-gray-550 hover:bg-gray-50 border-gray-200 text-gray-700'}`}
              style={{ borderRadius: '2px' }}
            >
              <User className="w-4 h-4" />
              View Account Storage Details
            </Link>
          </div>
        </div>

        {/* 4. Active Area Navigation Shortcuts */}
        <h3 className={`text-lg font-bold tracking-tighter uppercase mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Dashboards & Navigation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Seller catalog manager */}
          {isSeller && (
            <div 
              className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Store className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Merchant Catalog Area</h4>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Manage product categories, configure catalog uploads, set product pricing, and upload product views.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/seller')}
                className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
                style={{ borderRadius: '2px' }}
              >
                Open Merchant Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Service provider manager */}
          {isServiceProvider && (
            <div 
              className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Service Provider Area</h4>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Describe your main service category, upload portfolio images/videos, and configure custom services variables.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/provider')}
                className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
                style={{ borderRadius: '2px' }}
              >
                Open Service Provider Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Client orders & fullfillment */}
          {(isSeller || isServiceProvider) && (
            <div 
              className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Clients Orders Ledger</h4>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Fulfill customer orders, review pricing quotes, acknowledge client payments, and track delivery status.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/orders')}
                className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
                style={{ borderRadius: '2px' }}
              >
                Open Orders Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Service appointments / ledger (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div 
              className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
                ${darkMode ? 'bg-gray-850 bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Service Bookings</h4>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Review direct bookings from clients, verify arrival logs, and inspect escrow balance records.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/payments')}
                className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
                style={{ borderRadius: '2px' }}
              >
                Open Booking Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Custom service request quotes (Phase 2 feature) */}
          {isServiceProvider && showPhase2Features && (
            <div 
              className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
                ${darkMode ? 'bg-gray-850 bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Customization Requests</h4>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Address customer customization parameters, propose quoted prices, and accept custom contracts.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/requests')}
                className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
                style={{ borderRadius: '2px' }}
              >
                Open Customization Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Center */}
          {(isSeller || isServiceProvider) && (
            <div 
              className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
                ${darkMode ? 'bg-gray-850 bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ borderRadius: '2px' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Customer Communications</h4>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Converse with buyers and clients directly, address support inquiries, and arrange shipping routes.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/messages')}
                className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
                style={{ borderRadius: '2px' }}
              >
                Open Message Center
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* General accounts setting */}
          <div 
            className={`p-6 border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between
              ${darkMode ? 'bg-gray-850 bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ borderRadius: '2px' }}
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className={`p-2.5 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-600'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm uppercase tracking-tight">Profile and Security</h4>
              </div>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Set payout credentials, request provider role updates, inspect recent uploads, and review privacy limits.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/account')}
              className={`mt-5 w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-205 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white`}
              style={{ borderRadius: '2px' }}
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