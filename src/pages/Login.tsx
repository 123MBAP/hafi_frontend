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
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNavigationPath } from '../utils/navigationUtils';
import { API_BASE } from '../api/apiClient';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
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
    const savedEmail = localStorage.getItem('hafi_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

  const handleClose = () => {
    const fromPath = (location.state as any)?.from;
    const bgLocation = (location.state as any)?.backgroundLocation;
    if (bgLocation?.pathname) {
      navigate(
        bgLocation.pathname + (bgLocation.search || '') + (bgLocation.hash || ''),
        { replace: true }
      );
    } else if (fromPath && typeof fromPath === 'string') {
      navigate(fromPath, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!agreeTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to login.');
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const loginRes = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.token || !loginData.refreshToken) {
        setError(loginData.error || 'Login failed.');
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('hafi_remember_email', email.trim());
      } else {
        localStorage.removeItem('hafi_remember_email');
      }

      login(loginData.user, loginData.token, loginData.refreshToken);

      const roles = loginData.user?.roles;

      if (roles) {
        const returnPath = (location.state as any)?.from;
        const bgPath = (location.state as any)?.backgroundLocation?.pathname;
        const path = returnPath || bgPath || getNavigationPath(roles);

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
    setError('');

    if (!agreeTerms) {
      setError('Please check and agree to the Terms & Conditions and Privacy Policy before continuing with Google.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        if (!data.token) {
          setError(data.error || 'Sign-in incomplete. Please try again.');
          setLoading(false);
          return;
        }

        login(data.user, data.token, data.refreshToken || data.token);

        const roles = data.user?.roles || [];
        const returnPath = (location.state as any)?.from;
        const bgPath = (location.state as any)?.backgroundLocation?.pathname;
        const path = returnPath || bgPath || getNavigationPath(roles);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={containerRef}
        className={`w-full max-w-[380px] sm:max-w-[400px] p-6 sm:p-7 border shadow-2xl relative transition-all duration-200 ${
          darkMode
            ? 'bg-black border-white/20 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
            : 'bg-white border-black text-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]'
        }`}
        style={{ borderRadius: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black uppercase tracking-wider text-black dark:text-white">
            {showRecovery ? (
              <>
                Reset Password<span className="text-red-600">.</span>
              </>
            ) : (
              <>
                LOGIN<span className="text-red-600">.</span>
              </>
            )}
          </h1>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-black/50 dark:text-white/50 hover:text-red-600 dark:hover:text-red-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div
            className="flex items-start gap-2.5 p-3 border border-red-600/30 bg-red-600/10 text-red-600 dark:text-red-400 mb-4"
            style={{ borderRadius: '6px' }}
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
        )}

        {recoveryMessage && (
          <div
            className={`flex items-start gap-2.5 p-3 border mb-4 ${
              darkMode ? 'border-white/30 bg-zinc-950 text-white' : 'border-black bg-zinc-50 text-black'
            }`}
            style={{ borderRadius: '6px' }}
          >
            <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold">{recoveryMessage}</span>
          </div>
        )}

        {/* Recovery Form */}
        {showRecovery ? (
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  type="email"
                  placeholder="Enter your email..."
                  className={`w-full pl-9 pr-3.5 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '6px' }}
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRecover}
              className="w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all border bg-red-600 hover:bg-red-700 border-red-600 shadow-md active:scale-[0.99]"
              style={{ borderRadius: '6px' }}
            >
              Send Recovery Email
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 dark:text-white/60 hover:text-red-600 dark:hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full pl-9 pr-3.5 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '6px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full pl-9 pr-10 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '6px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 transition-colors ${
                    darkMode ? 'text-white/60 hover:text-red-600' : 'text-black/60 hover:text-red-600'
                  }`}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Terms Agreement Checkboxes */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-black/30 dark:border-white/30 text-red-600 focus:ring-red-600 accent-red-600 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className={`text-xs font-semibold cursor-pointer select-none ${
                    darkMode ? 'text-white/80' : 'text-black/80'
                  }`}
                >
                  Remember me?
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="loginTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-xs border-black/30 dark:border-white/30 text-red-600 focus:ring-red-600 accent-red-600 cursor-pointer"
                />
                <label
                  htmlFor="loginTerms"
                  className={`text-[11px] leading-tight cursor-pointer select-none ${
                    darkMode ? 'text-white/70' : 'text-black/70'
                  }`}
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-red-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-red-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-2.5 px-4 text-white text-xs font-black uppercase tracking-wider transition-all border ${
                loading
                  ? 'bg-black/50 border-zinc-700 text-white/50 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 border-red-600 shadow-md active:scale-[0.99]'
              }`}
              style={{ borderRadius: '6px' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'LOGIN'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="text-xs font-semibold text-black/60 dark:text-white/60 hover:text-red-600 dark:hover:text-red-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className={`flex-grow border-t ${darkMode ? 'border-white/20' : 'border-black/20'}`}></div>
              <span className={`flex-shrink mx-3 text-[10px] font-bold uppercase tracking-widest ${
                darkMode ? 'text-white/50' : 'text-black/50'
              }`}>
                OR
              </span>
              <div className={`flex-grow border-t ${darkMode ? 'border-white/20' : 'border-black/20'}`}></div>
            </div>

            {/* Only Continue with Google */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme={darkMode ? 'filled_black' : 'outline'}
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
                logo_alignment="center"
              />
            </div>

            {/* Need an account? SIGN UP */}
            <div className="text-center text-xs text-black/70 dark:text-white/70 pt-1">
              Need an account?{' '}
              <Link
                to="/register"
                state={{ backgroundLocation: (location.state as any)?.backgroundLocation }}
                className="font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:underline"
              >
                SIGN UP
              </Link>
            </div>

            {/* Login as HafiConnect Agent */}
            <div className={`pt-2.5 border-t text-center ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
              <Link
                to="/agent/login"
                className="text-xs font-black uppercase tracking-wider transition-colors text-red-600 hover:text-red-700 hover:underline"
              >
                Login as HafiConnect Agent →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
