// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional list of allowed roles
  fallbackPath?: string; // Optional custom fallback path
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, fallbackPath = '/login' }) => {
  const { isLoggedIn, user } = useAuth();

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to={fallbackPath} />;
  }

  // If allowedRoles is specified, check if user has at least one of the required roles
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
