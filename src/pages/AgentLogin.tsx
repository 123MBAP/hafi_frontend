import { useDarkMode } from '@/context/DarkMode';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/apiClient';

export default function AgentLogin() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to login.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/agent/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      // Store in auth context
      login(data.user, data.token, data.refreshToken);

      // Navigate to agent dashboard
      navigate('/dashboard/agent');
    } catch {
      setError('Connection to the server failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-6 pb-16 px-4 transition-colors duration-200 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="w-full max-w-md mx-auto">
        {/* Back Link */}
        <Link
          to="/login"
          className={`mb-4 inline-flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${
            darkMode ? 'text-white/70 hover:text-red-600' : 'text-black/70 hover:text-red-600'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to standard login
        </Link>

        {/* Card */}
        <div
          className={`p-6 sm:p-8 border transition-all duration-200 ${
            darkMode ? 'bg-black border-white/20 shadow-2xl' : 'bg-white border-black shadow-lg'
          }`}
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white rounded-sm mb-2.5">
              Agent Portal
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>
              Agent Portal<span className="text-red-600">.</span>
            </h1>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1.5 ${darkMode ? 'text-white/70' : 'text-black/60'}`}>
              Log in to access your regional agent dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-start gap-3 p-3 border border-red-600/30 bg-red-600/10 text-red-600 dark:text-red-400 mb-6"
              style={{ borderRadius: '2px' }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Field */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  type="text"
                  placeholder="ENTER EMAIL OR USERNAME..."
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="ENTER PASSWORD..."
                  className={`w-full pl-10 pr-12 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-2.5 transition-colors ${
                    darkMode ? 'text-white/60 hover:text-red-600' : 'text-black/60 hover:text-red-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-start gap-2 pt-0.5">
              <input
                type="checkbox"
                id="agentLoginTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-xs border-black/30 dark:border-white/30 text-red-600 focus:ring-red-600 accent-red-600 cursor-pointer"
              />
              <label
                htmlFor="agentLoginTerms"
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
                >
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-red-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-all border ${
                loading
                  ? 'bg-black/50 border-zinc-700 text-white/50 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 border-red-600 shadow-md active:scale-[0.99]'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in as Agent'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center border-t pt-4 border-black/20 dark:border-white/20">
            <Link
              to="/agent/register"
              className="text-xs font-black uppercase tracking-wider transition-colors text-red-600 hover:text-red-700 hover:underline"
            >
              Apply to become HafiConnect Agent →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
