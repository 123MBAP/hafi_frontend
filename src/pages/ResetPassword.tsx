import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';
import { API_BASE } from '../api/apiClient';
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
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
    : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400';

  return (
    <div className={`min-h-screen pt-8 pb-16 transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-[#F5F5F5] text-[#151515]'}`}>
      <div className="w-full max-w-md mx-auto px-4">
        {/* Back Link */}
        <Link
          to="/login"
          className={`mb-4 inline-flex items-center text-xs font-semibold uppercase tracking-wider transition-colors ${
            darkMode ? 'text-gray-400 hover:text-[#E5252A]' : 'text-gray-600 hover:text-[#E5252A]'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to standard login
        </Link>

        {/* Card */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
            darkMode ? 'bg-gray-900 border-gray-800 shadow-xs' : 'bg-white border-[#E5E5E5] shadow-xs'
          }`}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-2.5 shadow-xs">
              Account Recovery
            </div>
            <h1 className={`text-2xl font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
              Reset Password<span className="text-[#E5252A]">.</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-[#E5252A]">
              Securely retrieve access to your account
            </p>
          </div>

          {/* Verification Code Errors */}
          {codeError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-[#E5252A] mb-4 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-[#E5252A] flex-shrink-0 mt-0.5" />
              <span>{codeError}</span>
            </div>
          )}

          {/* Password Reset Errors */}
          {passwordError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-[#E5252A] mb-4 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-[#E5252A] flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Resend Notifications */}
          {resendMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 mb-4 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
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
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    placeholder="Registered Email"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Code Input */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Verification Code
                </label>
                <div className="relative">
                  <Key className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Verification Code"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyCode}
                className="w-full py-3 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl bg-[#E5252A] hover:bg-[#c91d22] shadow-xs active:scale-[0.99]"
              >
                Verify Reset Code
              </button>

              {/* Resend actions */}
              <div className="mt-4 text-xs flex flex-col gap-1.5 items-center border-t pt-4 border-[#E5E5E5] dark:border-gray-800">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Haven't received the code?</span>
                <button
                  className="text-[#E5252A] hover:text-[#c91d22] font-bold uppercase tracking-wider text-xs transition-colors"
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
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enter your new password below.</p>

              {/* Password field */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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

              {/* Confirm Password field */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
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

              {/* Reset button */}
              <button
                onClick={handleResetPassword}
                className="w-full py-3 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl bg-[#E5252A] hover:bg-[#c91d22] shadow-xs active:scale-[0.99]"
              >
                Reset Password
              </button>
            </div>
          )}

          {success && (
            <div className="text-center space-y-4 py-4">
              <div className="text-green-600 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" /> Password reset successfully!
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                You can now log in to HafiConnect with your new credentials.
              </p>
              <button
                className="w-full py-3 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl bg-[#E5252A] hover:bg-[#c91d22] shadow-xs"
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