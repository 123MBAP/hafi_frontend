import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyEmailAuto() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    fetch('http://localhost:5000/api/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Email verified! Redirecting to login...');
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
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-12 text-center">
      {status === 'verifying' && <div>Verifying your email...</div>}
      {status !== 'verifying' && <div>{message}</div>}
    </div>
  );
}