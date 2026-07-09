import { useDarkMode } from '@/context/DarkMode';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function AgentLogin() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    <div className={`min-h-screen pt-12 pb-16 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="w-full max-w-md mx-auto px-4">
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
          className={`p-8 border transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 shadow-sm' : 'bg-white border-gray-250 shadow-sm'
          }`}
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-2xl font-bold uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Agent Portal
            </h1>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-emerald-450' : 'text-emerald-600'}`}>
              Log in to access your Agent Dashboard
            </p>
          </div>

          {/* Error Message */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Field */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Enter email or username"
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-12 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-555'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider transition-colors border ${
                loading
                  ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {loading ? 'Logging in...' : 'Sign in as Agent'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center border-t pt-4 border-gray-200 dark:border-gray-700">
            <Link
              to="/agent/register"
              className={`text-sm font-semibold transition-colors ${
                darkMode ? 'text-emerald-450 hover:text-emerald-350' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              Apply to become HafiConnect Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
