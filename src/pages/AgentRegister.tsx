import { useDarkMode } from '@/context/DarkMode';
import { AlertCircle, ArrowLeft, Lock, Mail, User, CheckCircle, Phone, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RwandaLocationSelector from '@/components/RwandaLocationSelector';
import { API_BASE } from '../api/apiClient';

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

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
      const combinedLocation = selectedSector ? `${selectedSector}, ${selectedDistrict}, ${selectedProvince}` : '';
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
          location: combinedLocation,
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
    <div className={`min-h-screen pt-6 pb-16 px-4 transition-colors duration-200 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="w-full max-w-lg mx-auto">
        {/* Back link */}
        <Link
          to="/register"
          className={`mb-4 inline-flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${
            darkMode ? 'text-white/70 hover:text-red-600' : 'text-black/70 hover:text-red-600'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to standard register
        </Link>

        {/* Card container */}
        <div
          className={`p-6 sm:p-8 border transition-all duration-200 ${
            darkMode ? 'bg-black border-white/20 shadow-2xl' : 'bg-white border-black shadow-lg'
          }`}
          style={{ borderRadius: '2px' }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white rounded-sm mb-2.5">
              Agent Program
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>
              Agent Registration<span className="text-red-600">.</span>
            </h1>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1.5 ${darkMode ? 'text-white/70' : 'text-black/60'}`}>
              Register as a certified HafiConnect Agent in your region
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div
              className={`flex items-start gap-3 p-3 border mb-6 ${
                darkMode ? 'bg-zinc-900 border-white/30 text-white' : 'bg-zinc-50 border-black text-black'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{success}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              className="flex items-start gap-3 p-3 border border-red-600/30 bg-red-600/10 text-red-600 dark:text-red-400 mb-6"
              style={{ borderRadius: '2px' }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  name="name"
                  placeholder="E.G. JOHN DOE"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Phone Number
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  name="phoneNumber"
                  placeholder="E.G. 078XXXXXXX"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Agent Username
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  name="username"
                  placeholder="CHOOSE AN AGENT USERNAME..."
                  value={form.username}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  name="email"
                  type="email"
                  placeholder="AGENT@HAFICONNECT.COM"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="CREATE PASSWORD..."
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-10 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 transition-colors ${
                    darkMode ? 'text-white/60 hover:text-red-600' : 'text-black/60 hover:text-red-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
                <input
                  name="passwordConfirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="RE-TYPE PASSWORD..."
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-10 py-2.5 border text-sm transition-colors ${
                    darkMode
                      ? 'bg-black border-white/30 text-white placeholder-white/40'
                      : 'bg-white border-black text-black placeholder-black/40'
                  } focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600`}
                  style={{ borderRadius: '2px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-3 transition-colors ${
                    darkMode ? 'text-white/60 hover:text-red-600' : 'text-black/60 hover:text-red-600'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Location Select (Province, District, Sector) */}
            <div className="space-y-3.5">
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-white/80' : 'text-black/70'}`}>
                Location Details
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Province */}
                <div>
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Province</label>
                  <RwandaLocationSelector
                    level="province"
                    value={selectedProvince}
                    onChange={(val) => {
                      setSelectedProvince(val);
                      setSelectedDistrict("");
                      setSelectedSector("");
                    }}
                    darkMode={darkMode}
                  />
                </div>

                {/* District */}
                <div>
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>District</label>
                  <RwandaLocationSelector
                    level="district"
                    value={selectedDistrict}
                    parentValues={{ province: selectedProvince }}
                    onChange={(val) => {
                      setSelectedDistrict(val);
                      setSelectedSector("");
                    }}
                    darkMode={darkMode}
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Sector</label>
                  <RwandaLocationSelector
                    level="sector"
                    value={selectedSector}
                    parentValues={{ district: selectedDistrict }}
                    onChange={(val) => {
                      setSelectedSector(val);
                    }}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
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
                  <span>Creating Agent...</span>
                </div>
              ) : (
                'Register as Agent'
              )}
            </button>
          </form>

          {/* Login redirection */}
          <div className="mt-6 text-center border-t pt-4 border-black/20 dark:border-white/20">
            <Link
              to="/agent/login"
              className="text-xs font-black uppercase tracking-wider transition-colors text-red-600 hover:text-red-700 hover:underline"
            >
              Already an agent? Login to Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
