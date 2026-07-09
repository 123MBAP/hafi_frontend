import LoadingSpinner from '@/components/LoadingSpinner';
import { useDarkMode } from '@/context/DarkMode';
import {
  Briefcase,
  Calendar,
  Clock,
  Compass,
  DollarSign,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Store,
  User,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  X,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function AgentDashboard() {
  const { darkMode } = useDarkMode();
  const { token, fetchWithAutoLogout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  // Referral Claiming State
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  // Withdrawal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // Sub-tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'profile'>('overview');

  // Configuration Settings State
  const [minWithdraw, setMinWithdraw] = useState(5000);
  const [rewardAmount, setRewardAmount] = useState(1000);

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      if (!token) return;
      setLoading(true);
      setError('');

      try {
        const res = await fetchWithAutoLogout(`${API_BASE}/api/agent/dashboard`);
        if (!res.ok) {
          throw new Error('Failed to retrieve dashboard details');
        }
        const result = await res.json();
        if (active) {
          setData(result);
          setProfileName(result.agent?.fullName || '');
          setProfileEmail(result.agent?.email || '');
          setProfilePhone(result.agent?.phoneNumber || '');
          setProfileLocation(result.agent?.location || '');
        }

        const settingsRes = await fetch(`${API_BASE}/api/agent/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (settingsRes.ok && active) {
          const settings = await settingsRes.json();
          setMinWithdraw(settings.minimumWithdrawalAmount || 5000);
          setRewardAmount(settings.referralRewardAmount || 1000);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'Failed to connect to server');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim()) return;

    setClaiming(true);
    setClaimSuccess('');
    setClaimError('');

    try {
      const res = await fetch(`${API_BASE}/api/agent/claim-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: claimCode.trim() }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to claim code');
      }

      setClaimSuccess(result.message);
      setClaimCode('');
      triggerRefresh();
    } catch (err: any) {
      setClaimError(err.message || 'Error claiming referral code.');
    } finally {
      setClaiming(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawPhone || !withdrawName) {
      setWithdrawError('All withdrawal fields are required.');
      return;
    }

    setWithdrawing(true);
    setWithdrawSuccess('');
    setWithdrawError('');

    try {
      const res = await fetch(`${API_BASE}/api/agent/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          phoneNumber: withdrawPhone.trim(),
          phoneName: withdrawName.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit withdrawal');
      }

      setWithdrawSuccess(result.message);
      setWithdrawAmount('');
      setWithdrawPhone('');
      setWithdrawName('');
      triggerRefresh();
      // Wait a moment then close modal
      setTimeout(() => {
        setWithdrawModalOpen(false);
        setWithdrawSuccess('');
      }, 2000);
    } catch (err: any) {
      setWithdrawError(err.message || 'Error processing withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim() || !profilePhone.trim() || !profileLocation.trim()) {
      setProfileError('All profile fields are required.');
      return;
    }

    setUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await fetch(`${API_BASE}/api/agent/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileName.trim(),
          email: profileEmail.trim().toLowerCase(),
          phoneNumber: profilePhone.trim(),
          location: profileLocation.trim(),
          password: profilePassword.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setProfileSuccess(result.message);
      setProfilePassword('');
      setIsEditingProfile(false);
      triggerRefresh();
    } catch (err: any) {
      setProfileError(err.message || 'Error updating profile details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading && refreshKey === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-55 text-gray-800'}`}>
        <LoadingSpinner size="lg" message="Configuring Agent Portal..." variant="dots" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-red-400' : 'bg-gray-55 text-red-655'}`}>
        <div className="text-center p-6 border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800 max-w-md mx-auto" style={{ borderRadius: '2px' }}>
          <p className="font-bold mb-2">Error Loading Dashboard</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={triggerRefresh}
            className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors"
            style={{ borderRadius: '2px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const agent = data?.agent || {};
  const claims = data?.claims || [];
  const withdrawals = data?.withdrawals || [];

  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === 'approved')
    .reduce((sum: number, w: any) => sum + parseFloat(w.amount || 0), 0);
  
  const totalWithdrawalRequests = withdrawals.length;
  const totalClaims = claims.length;

  return (
    <div className={`min-h-screen -mx-4 sm:mx-0 overflow-x-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
        
        {/* Title Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Agent Portal
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-505'} mt-1`}>
              Regional operations and directory verification dashboard
            </p>
          </div>
          <button
            onClick={triggerRefresh}
            className={`px-3 py-2 border transition-all flex items-center gap-1.5 text-sm font-medium shadow-sm
              ${darkMode 
                ? 'bg-gray-850 hover:bg-gray-800 border-gray-700 text-emerald-400 hover:text-emerald-350' 
                : 'bg-white hover:bg-gray-55 border-gray-200 text-emerald-600 hover:text-emerald-700'}`}
            style={{ borderRadius: '2px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Portal
          </button>
        </div>

        {/* Agent Profile Banner */}
        <div 
          className={`relative overflow-hidden border p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6
            ${darkMode ? 'bg-gray-850 border-gray-850' : 'bg-white border-gray-200'} border-l-4 border-l-emerald-500`}
          style={{ borderRadius: '2px' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 shadow-sm
                  ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}
                style={{ borderRadius: '2px' }}
              >
                HafiConnect Agent
              </span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Joined: {new Date(agent.created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Welcome, {agent.fullName || agent.username}!
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-500" /> Sector: <strong className="text-gray-800 dark:text-gray-200">{agent.location}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-emerald-500" /> Phone: <strong className="text-gray-800 dark:text-gray-200">{agent.phoneNumber || 'Not Set'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-emerald-500" /> Email: <strong className="text-gray-800 dark:text-gray-200">{agent.email}</strong>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 p-4" style={{ borderRadius: '2px' }}>
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">Authorized Sector Agent</p>
              <p className="text-[10px] text-gray-550">Verified status allows listing curation.</p>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all
              ${activeSubTab === 'overview'
                ? 'border-emerald-500 text-emerald-500 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all
              ${activeSubTab === 'profile'
                ? 'border-emerald-500 text-emerald-500 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Profile Settings
          </button>
        </div>

        {activeSubTab === 'overview' && (
          <div className="animate-fadeIn">
            {/* Action Block - Claim Referral and Account Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Account Balance Card */}
              <div 
                className={`border p-6 flex flex-col justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
                style={{ borderRadius: '2px' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-550'}`}>
                      Account Balance
                    </h4>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-emerald-500">
                    RWF {agent.balance?.toLocaleString()}
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-gray-450 mt-1 flex justify-between">
                    <span>From claimed registrations</span>
                    <span className="text-emerald-500">Min Cashout: RWF {minWithdraw.toLocaleString()}</span>
                  </p>
                </div>
                
                <button
                  onClick={() => setWithdrawModalOpen(true)}
                  className="mt-6 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                  style={{ borderRadius: '2px' }}
                >
                  Request Withdrawal
                </button>
              </div>

              {/* Claim Referral Card */}
              <div 
                className={`md:col-span-2 border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
                style={{ borderRadius: '2px' }}
              >
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-555'}`}>
                  Claim User Referral Code
                </h4>
                
                <form onSubmit={handleClaimCode} className="space-y-4">
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Enter the 8-character code (e.g. H0P98K34) given by the subscriber within 24 hours of their registration payment to claim your reward of <strong>RWF {rewardAmount.toLocaleString()}</strong>.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. H0P98K34"
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      disabled={claiming}
                      maxLength={15}
                      className={`flex-1 px-4 py-2 border font-mono text-sm font-bold uppercase tracking-widest outline-none transition-colors
                        ${darkMode 
                          ? 'bg-gray-900 border-gray-700 text-white focus:border-emerald-500' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-600'}`}
                      style={{ borderRadius: '2px' }}
                    />
                    
                    <button
                      type="submit"
                      disabled={claiming || !claimCode.trim()}
                      className={`px-6 py-2 text-white text-xs font-bold uppercase tracking-wider transition-colors border
                        ${claiming || !claimCode.trim()
                          ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      {claiming ? 'Claiming...' : 'Claim Code'}
                    </button>
                  </div>

                  {/* Action Messages */}
                  {claimSuccess && (
                    <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold" style={{ borderRadius: '2px' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{claimSuccess}</span>
                    </div>
                  )}
                  {claimError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold" style={{ borderRadius: '2px' }}>
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>{claimError}</span>
                    </div>
                  )}
                </form>
              </div>

            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              
              {/* Total Amount Withdrawn */}
              <div 
                className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                  ${darkMode ? 'bg-gray-800 border-gray-755' : 'bg-white border-gray-200'}`}
                style={{ borderRadius: '2px' }}
              >
                <div className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`} style={{ borderRadius: '2px' }}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Withdrawn</p>
                  <h3 className="text-2xl font-bold mt-0.5">RWF {totalWithdrawn.toLocaleString()}</h3>
                </div>
              </div>

              {/* Total Withdrawal Requests */}
              <div 
                className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                  ${darkMode ? 'bg-gray-800 border-gray-755' : 'bg-white border-gray-200'}`}
                style={{ borderRadius: '2px' }}
              >
                <div className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-650'}`} style={{ borderRadius: '2px' }}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Withdrawal Requests</p>
                  <h3 className="text-2xl font-bold mt-0.5">{totalWithdrawalRequests}</h3>
                </div>
              </div>

              {/* Referral Codes Claimed */}
              <div 
                className={`p-5 border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5
                  ${darkMode ? 'bg-gray-800 border-gray-755' : 'bg-white border-gray-200'}`}
                style={{ borderRadius: '2px' }}
              >
                <div className={`p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-455' : 'bg-gray-50 border-gray-200 text-emerald-650'}`} style={{ borderRadius: '2px' }}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Referrals Claimed</p>
                  <h3 className="text-2xl font-bold mt-0.5">{totalClaims}</h3>
                </div>
              </div>

            </div>

            {/* Claimed Referrals & Withdrawal Requests Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Claimed Referrals List */}
              <div className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} style={{ borderRadius: '2px' }}>
                <h3 className={`text-lg font-bold uppercase tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Claimed Referral Codes
                </h3>
                
                {claims.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-300 dark:border-gray-700 p-4" style={{ borderRadius: '2px' }}>
                    <Compass className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold">No claimed referrals yet</p>
                    <p className="text-xs text-gray-550 mt-1">Claimed user codes will be logged here with dates and rewards.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim: any, idx: number) => (
                      <div 
                        key={idx}
                        className={`p-3 border flex items-center justify-between gap-4 transition-all
                          ${darkMode ? 'bg-gray-900/40 border-gray-750' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div>
                          <span className="font-mono text-sm font-extrabold text-emerald-500 tracking-wider">
                            {claim.code}
                          </span>
                          <div className="mt-1 text-xs font-semibold">
                            Registered User: {claim.user_name} ({claim.user_email})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-500">+1,000 RWF</div>
                          <div className="text-[9px] text-gray-500">
                            {new Date(claim.claimed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Withdrawal Requests List */}
              <div className={`p-6 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} style={{ borderRadius: '2px' }}>
                <h3 className={`text-lg font-bold uppercase tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Withdrawal Requests
                </h3>
                
                {withdrawals.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-300 dark:border-gray-700 p-4" style={{ borderRadius: '2px' }}>
                    <DollarSign className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold">No withdrawal requests found</p>
                    <p className="text-xs text-gray-550 mt-1">Requests submitted to admin will appear here with statuses.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((w: any) => (
                      <div 
                        key={w.id}
                        className={`p-3 border flex items-center justify-between gap-4 transition-all
                          ${darkMode ? 'bg-gray-900/40 border-gray-755' : 'bg-white border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div>
                          <div className="text-sm font-extrabold text-emerald-500">
                            RWF {parseFloat(w.amount).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-gray-500 mt-1">
                            To: {w.phone_name} ({w.phone_number})
                          </div>
                        </div>
                        <div className="text-right">
                          <span 
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 border
                              ${w.status === 'approved' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : w.status === 'rejected' 
                                ? 'bg-red-500/10 text-red-655 border-red-500/20' 
                                : 'bg-yellow-500/10 text-yellow-605 border-yellow-500/20'}`}
                            style={{ borderRadius: '2px' }}
                          >
                            {w.status}
                          </span>
                          <div className="text-[9px] text-gray-500 mt-2">
                            {new Date(w.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Profile Settings Tab */}
        {activeSubTab === 'profile' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div 
              className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
              style={{ borderRadius: '2px' }}
            >
              <h3 className={`text-lg font-bold uppercase tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit Agent Profile
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    disabled={!isEditingProfile || updatingProfile}
                    className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                      ${darkMode 
                        ? 'bg-gray-900 border-gray-755 text-white focus:border-emerald-500' 
                        : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      disabled={!isEditingProfile || updatingProfile}
                      className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                        ${darkMode 
                          ? 'bg-gray-900 border-gray-755 text-white focus:border-emerald-500' 
                          : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      disabled={!isEditingProfile || updatingProfile}
                      className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                        ${darkMode 
                          ? 'bg-gray-900 border-gray-755 text-white focus:border-emerald-500' 
                          : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                    Location (Kigali Region Sector)
                  </label>
                  <select
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    disabled={!isEditingProfile || updatingProfile}
                    required
                    className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                      ${darkMode 
                        ? 'bg-gray-900 border-gray-755 text-white focus:border-emerald-500' 
                        : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <option value="Kigali-Kimironko">Kigali-Kimironko</option>
                    <option value="Kigali-Kicukiro">Kigali-Kicukiro</option>
                    <option value="Kigali-Remera">Kigali-Remera</option>
                    <option value="Kigali-Kacyiru">Kigali-Kacyiru</option>
                    <option value="Kigali-Nyarugenge">Kigali-Nyarugenge</option>
                    <option value="Kigali-Gisozi">Kigali-Gisozi</option>
                    <option value="Kigali-Nyamirambo">Kigali-Nyamirambo</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    disabled={!isEditingProfile || updatingProfile}
                    className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                      ${darkMode 
                        ? 'bg-gray-900 border-gray-755 text-white focus:border-emerald-500' 
                        : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                    style={{ borderRadius: '2px' }}
                  />
                </div>

                {/* Status Messages */}
                {profileSuccess && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold" style={{ borderRadius: '2px' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold" style={{ borderRadius: '2px' }}>
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {!isEditingProfile ? (
                    <button
                      key="profile-edit-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditingProfile(true);
                        setProfileSuccess('');
                        setProfileError('');
                      }}
                      className={`w-full py-2.5 text-white font-bold text-xs uppercase tracking-wider transition-colors border bg-emerald-500 hover:bg-emerald-600 border-emerald-500`}
                      style={{ borderRadius: '2px' }}
                    >
                      Edit Profile Settings
                    </button>
                  ) : (
                    <>
                      <button
                        key="profile-save-btn"
                        type="submit"
                        disabled={updatingProfile}
                        className={`flex-1 py-2.5 text-white font-bold text-xs uppercase tracking-wider transition-colors border
                          ${updatingProfile
                            ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                      <button
                        key="profile-cancel-btn"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditingProfile(false);
                          setProfileSuccess('');
                          setProfileError('');
                          // Restore from data
                          setProfileName(agent.fullName || '');
                          setProfileEmail(agent.email || '');
                          setProfilePhone(agent.phoneNumber || '');
                          setProfileLocation(agent.location || '');
                          setProfilePassword('');
                        }}
                        disabled={updatingProfile}
                        className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors border
                          ${darkMode
                            ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300'
                            : 'bg-white hover:bg-gray-55 border-gray-300 text-gray-600'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

              </form>
            </div>
          </div>
        )}

      </div>

      {/* Withdrawal Request Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className={`w-full max-w-md border p-6 shadow-2xl relative animate-fadeIn
              ${darkMode ? 'bg-gray-850 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            style={{ borderRadius: '2px' }}
          >
            <button 
              onClick={() => setWithdrawModalOpen(false)} 
              className={`absolute top-4 right-4 p-1 hover:opacity-80 transition-opacity ${darkMode ? 'text-gray-400' : 'text-gray-550'}`}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className={`text-base font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Request Balance Withdrawal
            </h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
              Submit a mobile money withdrawal request. Your current balance is <strong>RWF {agent.balance?.toLocaleString()}</strong>. The minimum withdrawal amount is <strong>RWF {minWithdraw.toLocaleString()}</strong>.
            </p>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Amount to Withdraw (RWF)
                </label>
                <input
                  type="number"
                  required
                  placeholder={`Min: RWF ${minWithdraw}`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={minWithdraw}
                  max={agent.balance}
                  disabled={withdrawing}
                  className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                    ${darkMode 
                      ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                      : 'bg-white border-gray-300 text-gray-850 focus:border-emerald-600'}`}
                  style={{ borderRadius: '2px' }}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Receiver Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 078XXXXXXX"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  disabled={withdrawing}
                  className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                    ${darkMode 
                      ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                      : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                  style={{ borderRadius: '2px' }}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Phone Registered Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patrick Niyonsaba"
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  disabled={withdrawing}
                  className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                    ${darkMode 
                      ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                      : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                  style={{ borderRadius: '2px' }}
                />
              </div>

              {/* Status Messages */}
              {withdrawSuccess && (
                <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold" style={{ borderRadius: '2px' }}>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}
              {withdrawError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold" style={{ borderRadius: '2px' }}>
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  disabled={withdrawing}
                  className={`flex-1 py-2 border font-bold text-xs uppercase tracking-wider transition-colors
                    ${darkMode 
                      ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300' 
                      : 'bg-white hover:bg-gray-550 border-gray-300 text-gray-600'}`}
                  style={{ borderRadius: '2px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawing || !withdrawAmount || !withdrawPhone || !withdrawName}
                  className={`flex-1 py-2 text-white font-bold text-xs uppercase tracking-wider transition-colors border
                    ${withdrawing || !withdrawAmount || !withdrawPhone || !withdrawName
                      ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500'}`}
                  style={{ borderRadius: '2px' }}
                >
                  {withdrawing ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
