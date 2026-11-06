import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';
import { 
  AlertCircle, 
  CheckCircle, 
  Mail, 
  Key, 
  Edit2, 
  Save, 
  RefreshCw
} from 'lucide-react';
import { getNavigationPath } from '../utils/navigationUtils';
import { API_BASE } from '@/api/apiClient';

const VERIFY_EMAIL_KEY = 'verify_email';
const VERIFY_CODE_KEY = 'verify_code';

const VerifyEmailForm = ({ email: propEmail }: { email: string }) => {
  const { darkMode } = useDarkMode();
  const [email, setEmail] = useState(() => localStorage.getItem(VERIFY_EMAIL_KEY) || propEmail);
  const [oldEmail, setOldEmail] = useState(() => localStorage.getItem(VERIFY_EMAIL_KEY) || propEmail);
  const [code, setCode] = useState(() => localStorage.getItem(VERIFY_CODE_KEY) || '');
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  // Persist email and code to localStorage
  useEffect(() => {
    if (email) localStorage.setItem(VERIFY_EMAIL_KEY, email);
    if (code) localStorage.setItem(VERIFY_CODE_KEY, code);
  }, [email, code]);

  // Remove keys on successful verification
  const clearLocal = () => {
    localStorage.removeItem(VERIFY_EMAIL_KEY);
    localStorage.removeItem(VERIFY_CODE_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNotification('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Email verified successfully! Redirecting to dashboard...');
        clearLocal();

        // Store token and user data from verification response
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        setTimeout(() => {
          // Redirect to dashboard based on user role
          const roles = data.user?.roles || [];
          const path = getNavigationPath(roles);
          navigate(path);
        }, 2000);
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch {
      setError('Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  // When Save is clicked after editing email
  const handleSaveEmail = async () => {
    setEditMode(false);
    setCode('');
    setSuccess('');
    setError('');
    setNotification('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/update-email-and-resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldEmail, newEmail: email }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Verification code sent to your new email: ${email}`);
        setOldEmail(email); // update oldEmail to reflect the saved value
      } else {
        setError(data.error || 'Could not update email.');
      }
    } catch {
      setError('Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setNotification('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Verification code sent to your email: ${email}`);
      } else {
        setError(data.error || 'Could not resend verification code.');
      }
    } catch {
      setError('Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBg = darkMode
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
    : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400';

  return (
    <div className={`w-full max-w-md mx-auto px-0 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
      <div
        className={`p-6 sm:p-8 rounded-2xl border transition-all duration-200 ${
          darkMode ? 'bg-gray-900 border-gray-800 shadow-xs' : 'bg-white border-[#E5E5E5] shadow-xs'
        }`}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-2.5 shadow-xs">
            Verification
          </div>
          <h1 className={`text-2xl font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
            Verify Email<span className="text-[#E5252A]">.</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-[#E5252A]">
            Confirm ownership of your email address
          </p>
        </div>

        {/* Notifications and messages */}
        {notification && (
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border mb-4 text-xs font-semibold ${
            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515]'
          }`}>
            <CheckCircle className="w-4 h-4 text-[#E5252A] flex-shrink-0 mt-0.5" />
            <span>{notification}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-[#E5252A] mb-4 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-[#E5252A] flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 mb-4 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Registered Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Mail className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  disabled={!editMode}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${inputBg} ${
                    !editMode && (darkMode ? 'bg-gray-950 opacity-70' : 'bg-gray-100 opacity-70')
                  } focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
                />
              </div>
              {editMode ? (
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={submitting}
                  className="bg-[#E5252A] hover:bg-[#c91d22] text-white px-4 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className={`px-4 text-xs font-bold uppercase border rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors ${
                    darkMode ? 'border-gray-700 hover:border-[#E5252A] text-white bg-gray-800' : 'border-[#E5E5E5] hover:border-[#E5252A] text-[#151515] bg-white'
                  }`}
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Verification Code field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Verification Code
            </label>
            <div className="relative">
              <Key className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                placeholder="ENTER 6-DIGIT CODE..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]`}
              />
            </div>
          </div>

          {/* Resend Actions */}
          <div className="flex justify-between items-center pt-2">
            <span className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Didn't receive the code?
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting || !email}
              className="text-xs font-bold uppercase tracking-wider text-[#E5252A] hover:text-[#c91d22] transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend Code
            </button>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 mt-2 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl shadow-xs active:scale-[0.99] ${
              submitting
                ? 'bg-gray-400 dark:bg-gray-800 text-gray-200 dark:text-gray-500 cursor-not-allowed'
                : 'bg-[#E5252A] hover:bg-[#c91d22]'
            }`}
          >
            {submitting ? 'Verifying...' : 'Verify Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailForm;
