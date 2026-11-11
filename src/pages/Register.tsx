import { useDarkMode } from '@/context/DarkMode';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Lock,
  Mail,
  MapPin,
  Navigation,
  ShoppingCart,
  Target,
  User,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getNavigationPath } from '../utils/navigationUtils';
import { cachedFetch } from '../utils/cachedFetch';
import VerifyEmailForm from './VerifyEmailForm';
import { API_BASE } from '../api/apiClient';

type Service = {
  id: string;
  title: string;
};

export default function RegisterPage() {
  const [step, setStep] = useState<'register' | 'verify' | 'google-role-select'>('register');
  const [userEmail, setUserEmail] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    role: '',
    service: '',
    shopping_type_id: '',
    email: '',
    password: '',
    location: '',
    locationOption: 'skip',
  });
  const [error, setError] = useState('');
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await cachedFetch<Service[] | { services: Service[] }>(`${API_BASE}/api/services`);
        const list = Array.isArray(data) ? data : ((data as any).services || []);
        setServices(list);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  const [shoppingTypes, setShoppingTypes] = useState<{ id: number; name: string; key?: string }[]>([]);
  const [shopPlan, setShopPlan] = useState<any>(null);
  const [loadingShoppingTypes, setLoadingShoppingTypes] = useState(true);

  useEffect(() => {
    async function fetchShoppingTypes() {
      try {
        const res = await fetch(`${API_BASE}/api/shopping-types`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.shopping_types || []);
        setShoppingTypes(list);
        setShopPlan(data.shop_plan || null);
      } catch (err) {
        console.error('Failed to fetch shopping types:', err);
      } finally {
        setLoadingShoppingTypes(false);
      }
    }
    fetchShoppingTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLocationOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, locationOption: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!agreeToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    if (!form.role) {
      setError('Please select how you want to use HafiConnect.');
      setLoading(false);
      return;
    }

    if (form.role === 'seller' && !form.shopping_type_id) {
      setError('Please select a shop type to continue.');
      setLoading(false);
      return;
    }

    if (form.role === 'service_provider' && !form.service) {
      setError('Please select a service to continue.');
      setLoading(false);
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    let location = null;
    const isPremiumSeller = form.role === 'seller' && selectedShopType && selectedShopType.key !== 'other';
    const requiresLocation = form.role === 'service_provider' || isPremiumSeller;

    if (requiresLocation && form.locationOption === 'auto') {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        setError("Failed to get your location automatically.");
        setLoading(false);
        return;
      }
    } else if (requiresLocation && form.locationOption === 'manual') {
      const [lat, lng] = form.location.split(',').map(s => s.trim());
      location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.role === 'service_provider' || form.role === 'seller') {
        payload.business_name = form.businessName;
      }

      if (form.role === 'service_provider') {
        payload.service_id = form.service;
        payload.location = location;
      } else if (form.role === 'seller') {
        payload.shopping_type_id = form.shopping_type_id ? parseInt(form.shopping_type_id) : null;
        if (isPremiumSeller) {
          payload.location = location;
        }
      }

      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setUserEmail(form.email);
        setStep('verify');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Server error.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.isExistingUser) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Check for return path
          const returnPath = (routerLocation.state as any)?.from;
          const path = returnPath || getNavigationPath(data.user?.roles || []);
          navigate(path);
        } else {
          setGoogleUserData(data.user);
          setForm(prev => ({
            ...prev,
            role: '',
            service: '',
            location: '',
            locationOption: 'skip'
          }));
          setStep('google-role-select');
        }
      } else {
        setError(data.error || 'Google sign-in failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }

    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  const handleGoogleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!agreeToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to complete registration.');
      setLoading(false);
      return;
    }

    if (!form.role) {
      setError('Please select how you want to use HafiConnect.');
      setLoading(false);
      return;
    }

    if (form.role === 'seller' && !form.shopping_type_id) {
      setError('Please select a shop type to continue.');
      setLoading(false);
      return;
    }

    if (form.role === 'service_provider' && !form.service) {
      setError('Please select a service to continue.');
      setLoading(false);
      return;
    }

    let location = null;
    const isPremiumSeller = form.role === 'seller' && selectedShopType && selectedShopType.key !== 'other';
    const requiresLocation = form.role === 'service_provider' || isPremiumSeller;

    if (requiresLocation && form.locationOption === 'auto') {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        setError("Failed to get your location automatically.");
        setLoading(false);
        return;
      }
    } else if (requiresLocation && form.locationOption === 'manual') {
      const [lat, lng] = form.location.split(',').map(s => s.trim());
      location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    try {
      const payload: any = {
        userId: googleUserData.id,
        role: form.role,
      };

      if (form.role === 'service_provider' || form.role === 'seller') {
        payload.business_name = form.businessName;
      }

      if (form.role === 'service_provider') {
        payload.service_id = form.service;
        payload.location = location;
      } else if (form.role === 'seller') {
        payload.shopping_type_id = form.shopping_type_id ? parseInt(form.shopping_type_id) : null;
        if (isPremiumSeller) {
          payload.location = location;
        }
      }

      const res = await fetch(`${API_BASE}/api/auth/google/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Check for return path
        const returnPath = (routerLocation.state as any)?.from;
        const path = returnPath || getNavigationPath(data.user?.roles || []);
        navigate(path);
      } else {
        setError(data.error || 'Failed to complete registration');
      }
    } catch {
      setError('Server error');
    }

    setLoading(false);
  };

  const selectedShopType = shoppingTypes.find(st => String(st.id) === String(form.shopping_type_id));
  const isPremiumSeller = form.role === 'seller' && selectedShopType && selectedShopType.key !== 'other';
  const showLocationFields = form.role === 'service_provider' || isPremiumSeller;
  const isRoleDetailsComplete =
    Boolean(form.role) &&
    (form.role !== 'seller' || Boolean(form.shopping_type_id)) &&
    (form.role !== 'service_provider' || Boolean(form.service));

  return (
    <div className={`min-h-screen pt-8 pb-16 px-4 transition-colors duration-200 ${darkMode ? 'bg-gray-950 text-white' : 'bg-[#F5F5F5] text-[#151515]'}`}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Back Button */}
        {step === 'verify' && (
          <button
            onClick={() => setStep('register')}
            className={`mb-4 inline-flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${
              darkMode ? 'text-gray-400 hover:text-[#E5252A]' : 'text-gray-600 hover:text-[#E5252A]'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </button>
        )}

        {/* Main Card */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border transition-all duration-200 ${
            darkMode ? 'bg-gray-900 border-gray-800 shadow-xs' : 'bg-white border-[#E5E5E5] shadow-xs'
          }`}
        >
          {step === 'register' ? (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-2.5 shadow-xs">
                  Get Started
                </div>
                <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                  Create Your Account<span className="text-[#E5252A]">.</span>
                </h1>
                <p className={`text-xs font-semibold uppercase tracking-wider mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Join HafiConnect to provide services, sell products, or browse Rwanda's markets
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-[#E5252A] mb-6">
                  <AlertCircle className="w-5 h-5 text-[#E5252A] flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold">{error}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Google Sign-In Button */}
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme={darkMode ? 'filled_black' : 'outline'}
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    logo_alignment="center"
                  />
                </div>

                {/* Divider */}
                <div className="relative flex items-center py-2">
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-800' : 'border-[#E5E5E5]'}`}></div>
                  <span className={`flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    OR
                  </span>
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-800' : 'border-[#E5E5E5]'}`}></div>
                </div>

                {/* Name Field */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="name"
                      placeholder="ENTER YOUR FULL NAME..."
                      value={form.name}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Choose how you want to use HafiConnect
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'service_provider', label: 'Service provider and selling related products', icon: Building },
                      { value: 'seller', label: 'Selling products and goods', icon: ShoppingCart },
                      { value: 'customer', label: 'Buying products and find services', icon: Users },
                    ].map((role) => {
                      const isSelected = form.role === role.value;
                      return (
                        <div
                          key={role.value}
                          className={`flex flex-col rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20 shadow-xs'
                              : darkMode
                              ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/40'
                              : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/40'
                          }`}
                          onClick={() => setForm({ ...form, role: role.value })}
                        >
                          <div className="flex items-center gap-4 p-4">
                            {/* Check selection indicator */}
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                              isSelected
                                ? 'border-[#E5252A] bg-[#E5252A]'
                                : darkMode ? 'border-gray-600 bg-transparent' : 'border-gray-300 bg-transparent'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            {/* Icon */}
                            <role.icon className={`w-5 h-5 flex-shrink-0 ${
                              isSelected
                                ? 'text-[#E5252A]'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />

                            {/* Label */}
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'text-[#E5252A]'
                                : darkMode ? 'text-white' : 'text-[#151515]'
                            }`}>
                              {role.label}
                            </span>
                          </div>

                          {/* Nested dropdown for Service Provider */}
                          {role.value === 'service_provider' && isSelected && (
                            <div className="px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Select service to provide
                              </label>
                              {loadingServices ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E5252A] border-t-transparent"></div>
                              ) : (
                                <select
                                  name="service"
                                  value={form.service}
                                  onChange={handleChange}
                                  required
                                  className={`w-full p-2.5 rounded-xl border text-xs transition-colors ${
                                    darkMode
                                      ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]'
                                      : 'bg-white border-[#E5E5E5] text-[#151515] focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]'
                                  }`}
                                >
                                  <option value="">-- Select a service --</option>
                                  {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                      {service.title}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}

                          {/* Shop type selection for Seller */}
                          {role.value === 'seller' && isSelected && (
                            <div className="px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Select Shop Type
                              </label>
                              {loadingShoppingTypes ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E5252A] border-t-transparent"></div>
                              ) : (
                                <div className="space-y-2" role="radiogroup" aria-label="Shop type">
                                  {[...shoppingTypes]
                                    .sort((a, b) => {
                                      const aIsOther = a.name.toLowerCase().includes('other');
                                      const bIsOther = b.name.toLowerCase().includes('other');
                                      if (aIsOther && !bIsOther) return -1;
                                      if (!aIsOther && bIsOther) return 1;
                                      return 0;
                                    })
                                    .map(st => {
                                      const isShopTypeSelected = String(st.id) === String(form.shopping_type_id);
                                      return (
                                        <label
                                          key={st.id}
                                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                            isShopTypeSelected
                                              ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                                              : darkMode
                                              ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                                              : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name="shopping_type_id"
                                            value={st.id}
                                            checked={isShopTypeSelected}
                                            onChange={handleChange}
                                            className="accent-[#E5252A]"
                                          />
                                          <span className={`text-xs font-bold uppercase tracking-wider ${
                                            isShopTypeSelected
                                              ? 'text-[#E5252A]'
                                              : darkMode ? 'text-white' : 'text-[#151515]'
                                          }`}>
                                            {st.name}
                                          </span>
                                        </label>
                                      );
                                    })}
                                </div>
                              )}
                              
                              {/* Selected Premium Shop Type Details */}
                              {selectedShopType && selectedShopType.key !== 'other' && (
                                <div className="mt-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 space-y-1.5">
                                  <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#E5252A]">
                                   Premium Seller Shop
                                  </div>
                                  <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    The selected shop type is a Premium Seller Shop that provides outstanding VIP features. 
                                    All of your products will be displayed in the shops workspace, and you can easily change your options later.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Business Name Field */}
                {(form.role === 'service_provider' || form.role === 'seller') && (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Business Name {form.role === 'seller' && selectedShopType?.key === 'other' ? '(Optional)' : ''}
                    </label>
                    <div className="relative">
                      <Building className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        name="businessName"
                        placeholder="ENTER YOUR BUSINESS NAME..."
                        value={form.businessName}
                        onChange={handleChange}
                        required={!(form.role === 'seller' && selectedShopType?.key === 'other')}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                          darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="email"
                      placeholder="YOU@EXAMPLE.COM"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="CREATE A PASSWORD..."
                      value={form.password}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-[#E5252A] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="CONFIRM YOUR PASSWORD..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-[#E5252A] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Location Fields */}
                {showLocationFields && (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location Settings
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.locationOption === 'auto'
                            ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                            : darkMode
                            ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="locationOption"
                          value="auto"
                          checked={form.locationOption === 'auto'}
                          onChange={handleLocationOptionChange}
                          className="accent-[#E5252A]"
                        />
                        <Target className={`w-4 h-4 ${
                          form.locationOption === 'auto' ? 'text-[#E5252A]' : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            form.locationOption === 'auto'
                              ? 'text-[#E5252A]'
                              : darkMode ? 'text-white' : 'text-[#151515]'
                          }`}>
                            Auto-detect location
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.locationOption === 'manual'
                            ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                            : darkMode
                            ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="locationOption"
                          value="manual"
                          checked={form.locationOption === 'manual'}
                          onChange={handleLocationOptionChange}
                          className="accent-[#E5252A]"
                        />
                        <Navigation className={`w-4 h-4 ${
                          form.locationOption === 'manual' ? 'text-[#E5252A]' : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            form.locationOption === 'manual'
                              ? 'text-[#E5252A]'
                              : darkMode ? 'text-white' : 'text-[#151515]'
                          }`}>
                            Enter manually
                          </div>
                        </div>
                      </label>

                      {form.locationOption === 'manual' && (
                        <div className="relative">
                          <MapPin className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <input
                            name="location"
                            placeholder="e.g., -1.946, 30.128"
                            value={form.location}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                              darkMode
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                          />
                        </div>
                      )}

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.locationOption === 'skip'
                            ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                            : darkMode
                            ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="locationOption"
                          value="skip"
                          checked={form.locationOption === 'skip'}
                          onChange={handleLocationOptionChange}
                          className="accent-[#E5252A]"
                        />
                        <div className="text-sm">⏭️</div>
                        <div className="flex-1">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            form.locationOption === 'skip'
                              ? 'text-[#E5252A]'
                              : darkMode ? 'text-white' : 'text-[#151515]'
                          }`}>
                            Skip for now
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions and Privacy Policy Agreement */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="registerAgreeTerms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-xs border-gray-300 dark:border-gray-700 text-[#E5252A] focus:ring-[#E5252A] accent-[#E5252A] cursor-pointer"
                  />
                  <label
                    htmlFor="registerAgreeTerms"
                    className={`text-xs cursor-pointer select-none leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    I have read and agree to HafiConnect's{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#E5252A] hover:underline"
                    >
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#E5252A] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isRoleDetailsComplete}
                  className={`w-full py-3 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl shadow-xs active:scale-[0.99] ${
                    loading || !isRoleDetailsComplete
                      ? 'bg-gray-400 dark:bg-gray-800 text-gray-200 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-[#E5252A] hover:bg-[#c91d22]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              {/* Links */}
              <div className="mt-6 pt-4 border-t border-[#E5E5E5] dark:border-gray-800 text-center space-y-3">
                <div>
                  <Link
                    to="/login"
                    className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      darkMode ? 'text-gray-300 hover:text-[#E5252A]' : 'text-gray-600 hover:text-[#E5252A]'
                    }`}
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
                <div>
                  <Link
                    to="/agent/register"
                    className="text-xs font-bold uppercase tracking-wider transition-colors text-[#E5252A] hover:text-[#c91d22] hover:underline"
                  >
                    Register as HafiConnect Agent →
                  </Link>
                </div>
              </div>
            </>
          ) : step === 'google-role-select' ? (
            /* Google Role Selection Step */
            <div>
              <div className="mb-6">
                <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-2.5 shadow-xs">
                  Account Setup
                </div>
                <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                  Select Your Role<span className="text-[#E5252A]">.</span>
                </h1>
                <p className={`text-xs font-semibold uppercase tracking-wider mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Welcome, {googleUserData?.name}! Choose how you want to use HafiConnect
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-[#E5252A] mb-6">
                  <AlertCircle className="w-5 h-5 text-[#E5252A] flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleGoogleRoleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select your role
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'service_provider', label: 'Service provider and selling related products', icon: Building },
                      { value: 'seller', label: 'Selling products and goods', icon: ShoppingCart },
                      { value: 'customer', label: 'Buying products and find services', icon: Users },
                    ].map((role) => {
                      const isSelected = form.role === role.value;
                      return (
                        <div
                          key={role.value}
                          className={`flex flex-col rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20 shadow-xs'
                              : darkMode
                              ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/40'
                              : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/40'
                          }`}
                          onClick={() => setForm({ ...form, role: role.value })}
                        >
                          <div className="flex items-center gap-4 p-4">
                            {/* Check selection indicator */}
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                              isSelected
                                ? 'border-[#E5252A] bg-[#E5252A]'
                                : darkMode ? 'border-gray-600 bg-transparent' : 'border-gray-300 bg-transparent'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            {/* Icon */}
                            <role.icon className={`w-5 h-5 flex-shrink-0 ${
                              isSelected
                                ? 'text-[#E5252A]'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />

                            {/* Label */}
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'text-[#E5252A]'
                                : darkMode ? 'text-white' : 'text-[#151515]'
                            }`}>
                              {role.label}
                            </span>
                          </div>

                          {/* Nested dropdown for Service Provider */}
                          {role.value === 'service_provider' && isSelected && (
                            <div className="px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Select service to provide
                              </label>
                              {loadingServices ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E5252A] border-t-transparent"></div>
                              ) : (
                                <select
                                  name="service"
                                  value={form.service}
                                  onChange={handleChange}
                                  required
                                  className={`w-full p-2.5 rounded-xl border text-xs transition-colors ${
                                    darkMode
                                      ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]'
                                      : 'bg-white border-[#E5E5E5] text-[#151515] focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]'
                                  }`}
                                >
                                  <option value="">-- Select a service --</option>
                                  {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                      {service.title}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}

                          {/* Shop type selection for Seller */}
                          {role.value === 'seller' && isSelected && (
                            <div className="px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Select Shop Type
                              </label>
                              {loadingShoppingTypes ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E5252A] border-t-transparent"></div>
                              ) : (
                                <div className="space-y-2" role="radiogroup" aria-label="Shop type">
                                  {[...shoppingTypes]
                                    .sort((a, b) => {
                                      const aIsOther = a.name.toLowerCase().includes('other');
                                      const bIsOther = b.name.toLowerCase().includes('other');
                                      if (aIsOther && !bIsOther) return -1;
                                      if (!aIsOther && bIsOther) return 1;
                                      return 0;
                                    })
                                    .map(st => {
                                      const isShopTypeSelected = String(st.id) === String(form.shopping_type_id);
                                      return (
                                        <label
                                          key={st.id}
                                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                            isShopTypeSelected
                                              ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                                              : darkMode
                                              ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                                              : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name="shopping_type_id"
                                            value={st.id}
                                            checked={isShopTypeSelected}
                                            onChange={handleChange}
                                            className="accent-[#E5252A]"
                                          />
                                          <span className={`text-xs font-bold uppercase tracking-wider ${
                                            isShopTypeSelected
                                              ? 'text-[#E5252A]'
                                              : darkMode ? 'text-white' : 'text-[#151515]'
                                          }`}>
                                            {st.name}
                                          </span>
                                        </label>
                                      );
                                    })}
                                </div>
                              )}
                              
                              {/* Selected Premium Shop Type Details */}
                              {selectedShopType && selectedShopType.key !== 'other' && (
                                <div className="mt-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 space-y-1.5">
                                  <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#E5252A]">
                                   Premium Seller Shop
                                  </div>
                                  <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    The selected shop type is a Premium Seller Shop that provides outstanding VIP features. 
                                    All of your products will be displayed in the shops workspace, and you can easily change your options later.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Business Name Field for Google Sign-In */}
                {(form.role === 'service_provider' || form.role === 'seller') && (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Business Name {form.role === 'seller' && selectedShopType?.key === 'other' ? '(Optional)' : ''}
                    </label>
                    <div className="relative">
                      <Building className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        name="businessName"
                        placeholder="ENTER YOUR BUSINESS NAME..."
                        value={form.businessName}
                        onChange={handleChange}
                        required={!(form.role === 'seller' && selectedShopType?.key === 'other')}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                          darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                      />
                    </div>
                  </div>
                )}

                {/* Location Fields - Only for Service Providers */}
                {showLocationFields && (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location Settings
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.locationOption === 'auto'
                            ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                            : darkMode
                            ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="locationOption"
                          value="auto"
                          checked={form.locationOption === 'auto'}
                          onChange={handleLocationOptionChange}
                          className="accent-[#E5252A]"
                        />
                        <Target className={`w-4 h-4 ${
                          form.locationOption === 'auto' ? 'text-[#E5252A]' : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            form.locationOption === 'auto'
                              ? 'text-[#E5252A]'
                              : darkMode ? 'text-white' : 'text-[#151515]'
                          }`}>
                            Auto-detect location
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.locationOption === 'manual'
                            ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                            : darkMode
                            ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="locationOption"
                          value="manual"
                          checked={form.locationOption === 'manual'}
                          onChange={handleLocationOptionChange}
                          className="accent-[#E5252A]"
                        />
                        <Navigation className={`w-4 h-4 ${
                          form.locationOption === 'manual' ? 'text-[#E5252A]' : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            form.locationOption === 'manual'
                              ? 'text-[#E5252A]'
                              : darkMode ? 'text-white' : 'text-[#151515]'
                          }`}>
                            Enter manually
                          </div>
                        </div>
                      </label>

                      {form.locationOption === 'manual' && (
                        <div className="relative">
                          <MapPin className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <input
                            name="location"
                            placeholder="e.g., -1.946, 30.128"
                            value={form.location}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                              darkMode
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                          />
                        </div>
                      )}

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.locationOption === 'skip'
                            ? 'border-[#E5252A] bg-red-500/5 dark:bg-red-950/20'
                            : darkMode
                            ? 'border-gray-800 bg-gray-800/40 hover:border-[#E5252A]/50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="locationOption"
                          value="skip"
                          checked={form.locationOption === 'skip'}
                          onChange={handleLocationOptionChange}
                          className="accent-[#E5252A]"
                        />
                        <div className="text-sm">⏭️</div>
                        <div className="flex-1">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            form.locationOption === 'skip'
                              ? 'text-[#E5252A]'
                              : darkMode ? 'text-white' : 'text-[#151515]'
                          }`}>
                            Skip for now
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions and Privacy Policy Agreement */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="registerAgreeTerms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-xs border-gray-300 dark:border-gray-700 text-[#E5252A] focus:ring-[#E5252A] accent-[#E5252A] cursor-pointer"
                  />
                  <label
                    htmlFor="registerAgreeTerms"
                    className={`text-xs cursor-pointer select-none leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    I have read and agree to HafiConnect's{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#E5252A] hover:underline"
                    >
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#E5252A] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isRoleDetailsComplete}
                  className={`w-full py-3.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl shadow-xs active:scale-[0.99] ${
                    loading || !isRoleDetailsComplete
                      ? 'bg-gray-400 dark:bg-gray-800 text-gray-200 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-[#E5252A] hover:bg-[#c91d22]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Completing registration...</span>
                    </div>
                  ) : (
                    'Complete registration'
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Verification Step */
            <div>
              <VerifyEmailForm email={userEmail} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Secure registration powered by HafiConnect<span className="text-[#E5252A]">.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
