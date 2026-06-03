import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const ResetPassword = () => {
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

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow-md rounded-md mt-8">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

      {!success && step === 1 && (
        <>
          <p className="text-gray-600 mb-2">
            Enter your registered email and the verification code sent to it.
          </p>
          <input
            type="email"
            placeholder="Registered Email"
            className="w-full p-2 mb-2 border rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Verification Code"
            className="w-full p-2 mb-2 border rounded"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          {codeError && <div className="text-red-500 mb-2">{codeError}</div>}

          <button
            onClick={handleVerifyCode}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Verify Code
          </button>

          <div className="mt-4 text-sm text-gray-700 flex flex-col gap-2 items-center">
            <span>Haven&apos;t received the code?</span>
            <button
              className="text-blue-600 underline"
              disabled={resending || !email}
              onClick={handleResendCode}
              type="button"
            >
              {resending ? "Resending..." : "Resend code"}
            </button>
            {resendMsg && (
              <span className="text-green-600">{resendMsg}</span>
            )}
          </div>
        </>
      )}

      {!success && step === 2 && (
        <>
          <p className="text-gray-600 mb-2">Enter your new password below.</p>
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full p-2 border rounded pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.959 9.959 0 011.176-4.824m2.675-2.675A9.959 9.959 0 0112 1c5.523 0 10 4.477 10 10a9.96 9.96 0 01-2.674 6.823M3 3l18 18"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-.73 2.685-2.885 5.06-5.542 6.456"/>
                </svg>
              )}
            </button>
          </div>
          <div className="relative mb-2">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              className="w-full p-2 border rounded pr-10"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.959 9.959 0 011.176-4.824m2.675-2.675A9.959 9.959 0 0112 1c5.523 0 10 4.477 10 10a9.96 9.96 0 01-2.674 6.823M3 3l18 18"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-.73 2.685-2.885 5.06-5.542 6.456"/>
                </svg>
              )}
            </button>
          </div>
          {passwordError && <div className="text-red-500 mb-2">{passwordError}</div>}
          <button
            onClick={handleResetPassword}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Reset Password
          </button>
        </>
      )}

      {success && (
        <div className="text-center">
          <div className="text-green-600 mb-4 font-semibold">
            Password has been successfully reset!
          </div>
          <button
            className="p-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;