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
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNavigationPath } from '../utils/navigationUtils';
import { cachedFetch } from '../utils/cachedFetch';
import VerifyEmailForm from './VerifyEmailForm';

type Service = {
  id: string;
  title: string;
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function RegisterPage() {
  const [step, setStep] = useState<'register' | 'verify' | 'google-role-select'>('register');
  const [userEmail, setUserEmail] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    service: '',
    email: '',
    password: '',
    location: '',
    locationOption: 'skip',
  });
  const [error, setError] = useState('');
  const [googleUserData, setGoogleUserData] = useState<any>(null);

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

    let location = null;
    if (form.role === 'service_provider' && form.locationOption === 'auto') {
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
    } else if (form.role === 'service_provider' && form.locationOption === 'manual') {
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

      if (form.role === 'service_provider') {
        payload.service_id = form.service;
        payload.location = location;
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

    let location = null;
    if (form.role === 'service_provider' && form.locationOption === 'auto') {
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
    } else if (form.role === 'service_provider' && form.locationOption === 'manual') {
      const [lat, lng] = form.location.split(',').map(s => s.trim());
      location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    try {
      const payload: any = {
        userId: googleUserData.id,
        role: form.role,
      };

      if (form.role === 'service_provider') {
        payload.service_id = form.service;
        payload.location = location;
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'service_provider': return 'Offer services to customers';
      case 'seller': return 'Sell products and manage inventory';
      case 'customer': return 'Browse and book services';
      default: return '';
    }
  };

  const showServiceField = form.role === 'service_provider';
  const showLocationFields = form.role === 'service_provider';

  return (
    <div className={`min-h-screen pt-2 pb-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Back Button */}
        {step === 'verify' && (
          <button
            onClick={() => setStep('register')}
            className={`mb-4 flex items-center text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </button>
        )}

        {/* Main Card */}
        <div className={`rounded-lg p-8 ${darkMode
          ? 'bg-gray-900 border border-gray-700'
          : 'bg-white border border-gray-200'
          }`}>
          {step === 'register' ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  Create your account
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join HafiConnect and start your journey
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`flex items-start gap-3 p-3 rounded-lg mb-6 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}>
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Google Sign-In Button */}
                <div>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme={darkMode ? 'filled_black' : 'outline'}
                    size="large"
                    text="continue_with"
                    shape="pill"
                    logo_alignment="center"
                  />
                </div>

                {/* Divider */}
                <div className="relative flex items-center py-2">
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                  <span className={`flex-shrink mx-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    or
                  </span>
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                </div>

                {/* Name Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="name"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select your role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'service_provider', label: 'Service Provider', icon: Building },
                      { value: 'seller', label: 'Seller', icon: ShoppingCart },
                      { value: 'customer', label: 'Customer', icon: Users },
                    ].map((role) => (
                      <div
                        key={role.value}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${form.role === role.value
                          ? darkMode
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-blue-500 bg-blue-50'
                          : darkMode
                            ? 'border-gray-700 bg-gray-900 hover:border-gray-600'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                        onClick={() => setForm({ ...form, role: role.value })}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <role.icon className={`w-5 h-5 ${form.role === role.value
                            ? 'text-blue-500'
                            : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                          <span className={`text-xs font-medium ${form.role === role.value
                            ? darkMode ? 'text-blue-300' : 'text-blue-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {role.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Selection */}
                {showServiceField && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select service to provide
                    </label>
                    {loadingServices ? (
                      <div className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
                        }`}>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                      </div>
                    ) : (
                      <select
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        required
                        className={`w-full p-2.5 rounded-lg border text-sm transition-colors ${darkMode
                          ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
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

                {/* Email Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="email"
                      placeholder="you@example.com"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                {/* Location Fields */}
                {showLocationFields && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location settings
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.locationOption === 'auto'
                        ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="locationOption"
                          value="auto"
                          checked={form.locationOption === 'auto'}
                          onChange={handleLocationOptionChange}
                          className="text-blue-600"
                        />
                        <Target className={`w-4 h-4 ${form.locationOption === 'auto' ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${form.locationOption === 'auto'
                            ? darkMode ? 'text-blue-300' : 'text-blue-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Auto-detect location
                          </div>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.locationOption === 'manual'
                        ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="locationOption"
                          value="manual"
                          checked={form.locationOption === 'manual'}
                          onChange={handleLocationOptionChange}
                          className="text-blue-600"
                        />
                        <Navigation className={`w-4 h-4 ${form.locationOption === 'manual' ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${form.locationOption === 'manual'
                            ? darkMode ? 'text-blue-300' : 'text-blue-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Enter manually
                          </div>
                        </div>
                      </label>

                      {form.locationOption === 'manual' && (
                        <div className="relative">
                          <MapPin className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <input
                            name="location"
                            placeholder="e.g., -1.946, 30.128"
                            value={form.location}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                          />
                        </div>
                      )}

                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.locationOption === 'skip'
                        ? darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-400 bg-gray-100'
                        : darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="locationOption"
                          value="skip"
                          checked={form.locationOption === 'skip'}
                          onChange={handleLocationOptionChange}
                          className="text-gray-600"
                        />
                        <div className="text-lg">⏭️</div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Skip for now
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-colors ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>
            </>
          ) : step === 'google-role-select' ? (
            /* Google Role Selection Step */
            <div>
              <div className="mb-8">
                <h1 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select your role
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Welcome, {googleUserData?.name}! Choose how you want to use HafiConnect
                </p>
              </div>

              {error && (
                <div className={`flex items-start gap-3 p-3 rounded-lg mb-6 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}>
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
                </div>
              )}

              <form onSubmit={handleGoogleRoleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select your role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'service_provider', label: 'Service Provider', icon: Building },
                      { value: 'seller', label: 'Seller', icon: ShoppingCart },
                      { value: 'customer', label: 'Customer', icon: Users },
                    ].map((role) => (
                      <div
                        key={role.value}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${form.role === role.value
                          ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                          : darkMode ? 'border-gray-700 bg-gray-900 hover:border-gray-600' : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                        onClick={() => setForm({ ...form, role: role.value })}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <role.icon className={`w-5 h-5 ${form.role === role.value ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                          <span className={`text-xs font-medium ${form.role === role.value
                            ? darkMode ? 'text-blue-300' : 'text-blue-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {role.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Selection - Only for Service Providers */}
                {showServiceField && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select service to provide
                    </label>
                    {loadingServices ? (
                      <div className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
                        }`}>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                      </div>
                    ) : (
                      <select
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        required
                        className={`w-full p-2.5 rounded-lg border text-sm transition-colors ${darkMode
                          ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
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

                {/* Location Fields - Only for Service Providers */}
                {showLocationFields && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location settings
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.locationOption === 'auto'
                        ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="locationOption"
                          value="auto"
                          checked={form.locationOption === 'auto'}
                          onChange={handleLocationOptionChange}
                          className="text-blue-600"
                        />
                        <Target className={`w-4 h-4 ${form.locationOption === 'auto' ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${form.locationOption === 'auto'
                            ? darkMode ? 'text-blue-300' : 'text-blue-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Auto-detect location
                          </div>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.locationOption === 'manual'
                        ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="locationOption"
                          value="manual"
                          checked={form.locationOption === 'manual'}
                          onChange={handleLocationOptionChange}
                          className="text-blue-600"
                        />
                        <Navigation className={`w-4 h-4 ${form.locationOption === 'manual' ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${form.locationOption === 'manual'
                            ? darkMode ? 'text-blue-300' : 'text-blue-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Enter manually
                          </div>
                        </div>
                      </label>

                      {form.locationOption === 'manual' && (
                        <div className="relative">
                          <MapPin className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <input
                            name="location"
                            placeholder="e.g., -1.946, 30.128"
                            value={form.location}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                          />
                        </div>
                      )}

                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.locationOption === 'skip'
                        ? darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-400 bg-gray-100'
                        : darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="locationOption"
                          value="skip"
                          checked={form.locationOption === 'skip'}
                          onChange={handleLocationOptionChange}
                          className="text-gray-600"
                        />
                        <div className="text-lg">⏭️</div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Skip for now
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !form.role}
                  className={`w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-colors ${loading || !form.role
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Completing registration...
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
              <div className="mb-8">
                <h1 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Verify your email
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  We've sent a verification code to {userEmail}
                </p>
              </div>

              <VerifyEmailForm email={userEmail} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Secure registration powered by encryption
          </p>
        </div>
      </div>
    </div>
  );
}