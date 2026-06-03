import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNavigationPath } from '../utils/navigationUtils';

const VERIFY_EMAIL_KEY = 'verify_email';
const VERIFY_CODE_KEY = 'verify_code';

const VerifyEmailForm = ({ email: propEmail }: { email: string }) => {
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

  return (
    <form onSubmit={handleSubmit}>
      <label className="block mb-2">Email to verify:</label>
      <div className="flex mb-2">
        {editMode ? (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="border p-2 rounded w-full mr-2"
            />
            <button
              type="button"
              onClick={handleSaveEmail}
              disabled={submitting}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Save
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              value={email}
              disabled
              className="border p-2 rounded w-full mr-2 bg-gray-100"
            />
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
          </>
        )}
      </div>
      <label className="block mb-2">Enter verification code from email:</label>
      <input
        type="text"
        value={code}
        onChange={e => setCode(e.target.value)}
        required
        className="border p-2 rounded w-full mb-2"
      />
      <button
        type="button"
        onClick={handleResend}
        disabled={submitting || !email}
        className="bg-gray-500 text-white px-3 py-1 rounded mb-3"
      >
        Resend Code
      </button>
      {notification && <div className="text-green-600 mb-2">{notification}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-purple-600 text-white px-4 py-2 rounded w-full"
      >
        {submitting ? 'Verifying...' : 'Verify'}
      </button>
    </form>
  );
};

export default VerifyEmailForm;