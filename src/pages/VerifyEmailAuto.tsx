import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '@/api/apiClient';
import { useDarkMode } from '@/context/DarkMode';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyEmailAuto() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const email = searchParams.get('email');
    const code = searchParams.get('code');
    if (!email || !code) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    fetch(`${API_BASE}/api/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Server error.');
      });
  }, [searchParams, navigate]);

  return (
    <div className={`min-h-[70vh] flex items-center justify-center px-4 ${darkMode ? 'bg-gray-950 text-white' : 'bg-[#F5F5F5] text-[#151515]'}`}>
      <div className={`max-w-md w-full p-8 rounded-2xl border shadow-xs text-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'}`}>
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-10 h-10 text-[#E5252A] animate-spin mb-4" />
            <h3 className="text-base font-bold uppercase tracking-wider mb-1">Verifying Email</h3>
            <p className="text-xs text-gray-500">Please wait while we confirm your email address...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-base font-bold uppercase tracking-wider mb-1">Verification Complete</h3>
            <p className="text-xs text-gray-500">{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-4">
            <AlertCircle className="w-10 h-10 text-[#E5252A] mb-4" />
            <h3 className="text-base font-bold uppercase tracking-wider mb-1">Verification Failed</h3>
            <p className="text-xs text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}