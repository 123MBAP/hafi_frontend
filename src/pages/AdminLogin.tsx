import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminLogin is now deprecated - redirects to unified Login page
 * Admin users now use the same login page as regular users
 * The system automatically routes admins to /admin/dashboard based on their role in the token
 */
export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified login page
    navigate('/login', {
      replace: true,
      state: { message: 'Please use the unified login page. Admins and users share the same login.' }
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg mb-4">Redirecting to login page...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
      </div>
    </div>
  );
}
