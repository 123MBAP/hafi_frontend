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
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { getNavigationPath } from '../utils/navigationUtils';

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
      const res = await fetch('http://localhost:5000/api/verify-email', {
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
      const res = await fetch('http://localhost:5000/api/update-email-and-resend', {
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
      const res = await fetch('http://localhost:5000/api/resend-verification', {
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
    ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-550'
    : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400';

  return (
    <div className={`w-full max-w-md mx-auto px-0 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      <div
        className={`p-0 sm:p-8 border-0 sm:border transition-all duration-300 ${
          darkMode ? 'bg-gray-955 bg-gray-950 sm:bg-gray-900 sm:border-gray-700 shadow-sm' : 'bg-white border-gray-250 shadow-sm'
        }`}
        style={{ borderRadius: '2px' }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Verify Email
          </h1>
          <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-emerald-450' : 'text-emerald-600'}`}>
            Confirm ownership of your email address
          </p>
        </div>

        {/* Notifications and messages */}
        {notification && (
          <div
            className={`flex items-start gap-3 p-3 border mb-4 text-xs font-semibold ${
              darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{notification}</span>
          </div>
        )}

        {error && (
          <div
            className={`flex items-start gap-3 p-3 border mb-4 text-xs font-semibold ${
              darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-655'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className={`flex items-start gap-3 p-3 border mb-4 text-xs font-semibold ${
              darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
              Registered Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  disabled={!editMode}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${inputBg} ${
                    !editMode && (darkMode ? 'bg-gray-950 opacity-70' : 'bg-gray-50 opacity-70')
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>
              {editMode ? (
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 shrink-0"
                  style={{ borderRadius: '2px' }}
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className={`px-4 text-xs font-bold uppercase border shadow-sm flex items-center gap-1 shrink-0 ${
                    darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-250 hover:bg-gray-50 text-gray-700'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Verification Code field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
              Verification Code
            </label>
            <div className="relative">
              <Key className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                placeholder="Enter verification code"
                className={`w-full pl-10 pr-4 py-2.5 border text-sm transition-colors ${inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`}
                style={{ borderRadius: '2px' }}
              />
            </div>
          </div>

          {/* Resend Actions */}
          <div className="flex justify-between items-center pt-2">
            <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Didn't receive the code?
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting || !email}
              className="text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend Code
            </button>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2.5 px-4 mt-2 text-white text-xs font-bold uppercase tracking-wider transition-colors border ${
              submitting
                ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-sm'
            }`}
            style={{ borderRadius: '2px' }}
          >
            {submitting ? 'Verifying...' : 'Verify Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailForm;