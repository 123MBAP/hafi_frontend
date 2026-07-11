import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';
import { 
  Lock, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft 
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const ResetPassword = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract email and code from query params if present
  const params = new URLSearchParams(location.search);
  const emailFromLink = params.get('email') || '';
  const codeFromLink = params.get('code') || '';

  const [step, setStep] = useState(codeFromLink ? 2 : 1);
  const [email, setEmail] = useState(emailFromLink);
  const [code, setCode] = useState(codeFromLink);
  const [codeError, setCodeError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);

  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Enter email and code
  const handleVerifyCode = async () => {
    setCodeError('');
    if (!email || !code) {
      setCodeError('Please enter your email and verification code.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
      } else {
        setCodeError(data.error || 'Invalid code or email.');
      }
    } catch (err) {
      setCodeError('Network error. Please try again.');
    }
  };

  // Step 2: Enter new password
  const handleResetPassword = async () => {
    setPasswordError('');
    if (!password || !confirmPassword) {
      setPasswordError('Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setPasswordError(data.error || 'Password reset failed.');
      }
    } catch (err) {
      setPasswordError('Network error. Please try again.');
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    setResendMsg('');
    setResending(true);
    try {
      const response = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setResendMsg("A new verification code has been sent to your email.");
      } else {
        setResendMsg(data.error || "Could not resend code.");
      }
    } catch (err) {
      setResendMsg('Network error. Please try again.');
    }
    setResending(false);
  };

  const inputBg = darkMode
    ? 'bg-gray-955 bg-gray-950 border-gray-700 text-white placeholder-gray-550'
    : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400';

  return (
    <div className={`min-h-screen pt-4 pb-12 transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="w-full max-w-md mx-auto px-0">
        {/* Back Link */}
        <Link
          to="/login"
          className={`mb-4 inline-flex items-center text-sm font-medium transition-colors ${
            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-650 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to standard login
        </Link>

        {/* Card */}
        <div
          className={`p-0 sm:p-8 border-0 sm:border transition-all duration-300 ${
            darkMode ? 'bg-gray-955 bg-gray-955 bg-gray-950 sm:bg-gray-900 sm:border-gray-700 shadow-sm' : 'bg-white border-gray-250 shadow-sm'
          }`}
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-2xl font-bold uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Reset Password
            </h1>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-emerald-450' : 'text-emerald-600'}`}>
              Securely retrieve access to your account
            </p>
          </div>

          {/* Verification Code Errors */}
          {codeError && (
            <div
              className={`flex items-start gap-3 p-3 border mb-4 text-xs font-semibold ${
                darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-655'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{codeError}</span>
            </div>
          )}

          {/* Password Reset Errors */}
          {passwordError && (
            <div
              className={`flex items-start gap-3 p-3 border mb-4 text-xs font-semibold ${
                darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-655'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Resend Notifications */}
          {resendMsg && (
            <div
              className={`flex items-start gap-3 p-3 border mb-4 text-xs font-semibold ${
                darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{resendMsg}</span>
            </div>
          )}

          {!success && step === 1 && (
            <div className="space-y-4">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter your registered email and the verification code sent to it.
              </p>

              {/* Email Input */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    placeholder="Registered Email"
                    className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Code Input */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                  Verification Code
                </label>
                <div className="relative">
                  <Key className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Verification Code"
                    className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyCode}
                className="w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-colors border bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm"
                style={{ borderRadius: '2px' }}
              >
                Verify Reset Code
              </button>

              {/* Resend actions */}
              <div className="mt-4 text-xs flex flex-col gap-2 items-center border-t pt-4 border-gray-200 dark:border-gray-800">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Haven't received the code?</span>
                <button
                  className="text-emerald-500 hover:text-emerald-600 font-bold uppercase tracking-wider text-[11px]"
                  disabled={resending || !email}
                  onClick={handleResendCode}
                  type="button"
                >
                  {resending ? "Resending..." : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {!success && step === 2 && (
            <div className="space-y-4">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-650'}`}>Enter your new password below.</p>

              {/* Password field */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    className={`w-full pl-10 pr-10 py-2.5 border text-sm transition-colors ${inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-650"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    className={`w-full pl-10 pr-10 py-2.5 border text-sm transition-colors ${inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                    style={{ borderRadius: '2px' }}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-655"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Reset button */}
              <button
                onClick={handleResetPassword}
                className="w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-colors border bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm"
                style={{ borderRadius: '2px' }}
              >
                Reset Password
              </button>
            </div>
          )}

          {success && (
            <div className="text-center space-y-4">
              <div className="text-emerald-500 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Password reset successfully!
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                You can now log in to HafiConnect with your new credentials.
              </p>
              <button
                className="w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-colors border bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm"
                style={{ borderRadius: '2px' }}
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;