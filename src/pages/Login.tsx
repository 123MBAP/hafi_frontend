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
      className={`min-h-screen pt-2  pb-8 p-0 ${darkMode
        ? 'bg-gray-900'
        : 'bg-gray-50'
        }`}
    >
      <div className="w-full max-w-md mx-auto">
        {/* Back Button for Recovery */}
        {showRecovery && (
          <button
            onClick={() => setShowRecovery(false)}
            className={`mb-4 flex items-center text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        )}

        {/* Main Card */}
        <div className={`rounded-lg p-4 ${darkMode
          ? 'bg-gray-900 border border-gray-800 border-2'
          : 'bg-white border border-gray-200'
          }`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
              }`}>
              {showRecovery ? 'Reset Password' : 'Welcome back'}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {showRecovery
                ? 'Enter your email to reset your password'
                : 'Sign in to continue to HafiConnect'
              }
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className={`flex items-start gap-3 p-3 rounded-lg mb-6 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
            </div>
          )}

          {recoveryMessage && (
            <div className={`flex items-start gap-3 p-3 rounded-lg mb-6 ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
              }`}>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{recoveryMessage}</span>
            </div>
          )}

          {/* Recovery Form */}
          {showRecovery ? (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              <button
                onClick={handleRecover}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                  shape="pill"
                  logo_alignment="center"
                />
              </div>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}></div>
                <span className={`flex-shrink mx-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>or</span>
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}></div>
              </div>

              {/* Email Field */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-12 py-2.5 rounded-lg border text-sm transition-colors ${darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-2.5 transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
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
                  className={`text-sm font-medium transition-colors ${darkMode
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                    }`}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-colors ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}></div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <Link
                  to="/register"
                  className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-'
                    }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Don't have an account? Sign up
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Secure login powered by encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;