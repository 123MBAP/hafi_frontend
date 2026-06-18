import { useDarkMode } from '@/context/DarkMode';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNavigationPath } from '../utils/navigationUtils';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { darkMode } = useDarkMode();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    const stateMessage = (location.state as any)?.message;

    if (message === 'session_expired') {
      setError('Your session has expired. Please login again.');
      setEmail('');
      setPassword('');
      setLoading(false);
    } else if (stateMessage) {
      setError(stateMessage);
    }
  }, [searchParams, location.state]);

  const cleanupAndRedirect = (message = 'session_expired') => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    navigate(`/login?message=${message}`, {
      replace: true,
      state: { forceReset: true }
    });
  };

  const getStoredToken = (): string => {
    const token = localStorage.getItem('token');
    if (!token) {
      cleanupAndRedirect();
      throw new Error("No token available. Please login again.");
    }
    return token;
  };

  const getStoredRefreshToken = (): string => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      cleanupAndRedirect();
      throw new Error("No refresh token available. Please login again.");
    }
    return refreshToken;
  };

  const fetchWithRefresh = async (url: string, options: RequestInit = {}) => {
    let token = getStoredToken();

    let res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      const refreshToken = getStoredRefreshToken();

      try {
        const refreshRes = await fetch(`${API_BASE}/api/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshRes.json();

        if (refreshRes.status === 403) {
          if (refreshData.code === 'REFRESH_TOKEN_EXPIRED') {
            cleanupAndRedirect('session_expired');
          } else {
            cleanupAndRedirect('invalid_session');
          }
          throw new Error("Session expired. Please login again.");
        }

        if (!refreshRes.ok || !refreshData.token) {
          cleanupAndRedirect();
          throw new Error("Session expired. Please login again.");
        }

        token = refreshData.token;
        localStorage.setItem("token", token);

        res = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        });

      } catch (error) {
        cleanupAndRedirect();
        throw new Error("Session expired. Please login again.");
      }
    }

    return res;
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const loginRes = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.token || !loginData.refreshToken) {
        setError(loginData.error || 'Login failed.');
        setLoading(false);
        return;
      }

      // Login sets the user data in context
      login(loginData.user, loginData.token, loginData.refreshToken);

      // Get roles from the login response
      const roles = loginData.user?.roles;

      if (roles) {
        // Check if there's a return path from navigation state
        const returnPath = (location.state as any)?.from;
        const path = returnPath || getNavigationPath(roles);

        setTimeout(() => {
          navigate(path, {
            state: {
              loginSuccess: true,
              userName: loginData.user?.name || 'User'
            }
          });
        }, 300);
      } else {
        setError('Could not fetch user profile.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setError('');
    setRecoveryMessage('');
    if (!recoveryEmail) {
      setError('Please enter your registered email.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setRecoveryMessage('Check your email for recovery instructions.');
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(recoveryEmail.trim())}`);
        }, 2000);
      } else {
        setError(data.error || data.message || 'Recovery failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showRecovery) {
        handleRecover();
      } else {
        handleLogin();
      }
    }
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
        if (!data.token) {
          // Google account exists but backend didn't return a token yet
          // (e.g. awaiting role selection) — don't call login with undefined
          setError(data.error || 'Sign-in incomplete. Please try again.');
          setLoading(false);
          return;
        }

        login(data.user, data.token, data.refreshToken || data.token);

        const roles = data.user?.roles || [];
        const returnPath = (location.state as any)?.from;
        const path = returnPath || getNavigationPath(roles);
        navigate(path);
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
  return (
    <div
      ref={containerRef}
      className={`min-h-screen pt-2 pb-8 p-0 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="w-full max-w-md mx-auto">
        {/* Back Button for Recovery */}
        {showRecovery && (
          <button
            onClick={() => setShowRecovery(false)}
            className={`mb-4 flex items-center text-sm font-medium transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-650 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        )}

        {/* Main Card */}
        <div
          className={`p-6 border transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 shadow-sm' : 'bg-white border-gray-250 shadow-sm'
          }`}
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-2xl font-bold uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {showRecovery ? 'Reset Password' : 'Welcome back'}
            </h1>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-455' : 'text-gray-500'}`}>
              {showRecovery
                ? 'Enter your email to reset your password'
                : 'Sign in to continue to HafiConnect'
              }
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div
              className={`flex items-start gap-3 p-3 border mb-6 ${
                darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-655'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {recoveryMessage && (
            <div
              className={`flex items-start gap-3 p-3 border mb-6 ${
                darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-505 text-emerald-600'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{recoveryMessage}</span>
            </div>
          )}

          {/* Recovery Form */}
          {showRecovery ? (
            <div className="space-y-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              <button
                onClick={handleRecover}
                className={`w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-colors border ${
                  darkMode
                    ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500'
                    : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm'
                }`}
                style={{ borderRadius: '2px' }}
              >
                Send recovery email
              </button>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-4">
              {/* Google Sign-In Button */}
              <div>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme={darkMode ? 'filled_black' : 'outline'}
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="center"
                />
              </div>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                <span className={`flex-shrink mx-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>or</span>
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>

              {/* Email Field */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-12 py-2.5 border text-sm transition-colors ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-555'
                        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-2.5 transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-gray-350' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRecovery(true)}
                  className={`text-sm font-medium transition-colors ${
                    darkMode ? 'text-emerald-450 hover:text-emerald-350' : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-colors border ${
                  loading
                    ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm'
                }`}
                style={{ borderRadius: '2px' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <Link
                  to="/register"
                  className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-650 hover:text-gray-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Don't have an account? Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;