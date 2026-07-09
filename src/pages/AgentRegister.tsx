import { useDarkMode } from '@/context/DarkMode';
import { AlertCircle, ArrowLeft, Lock, Mail, MapPin, User, CheckCircle, Phone } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function AgentRegister() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    name: '',
    phoneNumber: '',
    password: '',
    passwordConfirm: '',
    location: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const locationsList = [
    'Kigali-Kimironko',
    'Kigali-Kicukiro',
    'Kigali-Remera',
    'Kigali-Kacyiru',
    'Kigali-Nyarugenge',
    'Kigali-Gisozi',
    'Kigali-Nyamirambo',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/agent/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          name: form.name,
          phoneNumber: form.phoneNumber,
          password: form.password,
          passwordConfirm: form.passwordConfirm,
          location: form.location,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Registration successful! Redirecting to login portal...');
        setTimeout(() => {
          navigate('/agent/login');
        }, 2500);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Connection to the server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-4 pb-12 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-55 text-gray-900'}`}>
      <div className="w-full max-w-lg mx-auto px-4">
        {/* Back link */}
        <Link
          to="/register"
          className={`mb-4 inline-flex items-center text-sm font-medium transition-colors ${
            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-650 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to standard register
        </Link>

        {/* Card container */}
        <div
          className={`p-8 border transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 shadow-sm' : 'bg-white border-gray-250 shadow-sm'
          }`}
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-2xl font-bold uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Agent Registration
            </h1>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-emerald-455' : 'text-emerald-600'}`}>
              Register as a HafiConnect Agent in your region
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div
              className={`flex items-start gap-3 p-3 border mb-6 ${
                darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{success}</span>
            </div>
          )}

          {/* Error message */}
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
            {/* Full Name */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                Phone Number
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="phoneNumber"
                  placeholder="e.g. 078XXXXXXX"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                Agent Username
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="username"
                  placeholder="Choose an agent username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="email"
                  type="email"
                  placeholder="agent@haficonnect.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-555'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="password"
                  type="password"
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-555'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="passwordConfirm"
                  type="password"
                  placeholder="Re-type password"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-555'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Location Select */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                Location (Kigali Region)
              </label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white focus:ring-1 focus:ring-emerald-500'
                      : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <option value="">-- Choose Kigali Sector / Region --</option>
                  {locationsList.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
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
              {loading ? 'Creating Agent...' : 'Register as Agent'}
            </button>
          </form>

          {/* Login redirection */}
          <div className="mt-6 text-center border-t pt-4 border-gray-200 dark:border-gray-700">
            <Link
              to="/agent/login"
              className={`text-sm font-semibold transition-colors ${
                darkMode ? 'text-emerald-450 hover:text-emerald-350' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              Already an agent? Login to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
