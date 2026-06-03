import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTimeUntilExpiration, isTokenExpired } from '../utils/tokenUtils';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// Define user info
interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

// Auth context type
interface AuthContextType {
  isLoggedIn: boolean;
  isInitializing: boolean;
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  login: (userData: UserInfo, token: string, refreshToken: string) => void;
  logout: (reason?: 'manual' | 'token_expired' | 'session_expired') => void;
  updateUser: (updatedUser: Partial<UserInfo>) => void;
  updateToken: (newToken: string) => void;
  fetchWithAutoLogout: (url: string, options?: RequestInit) => Promise<Response>;
  fetchUserRoles: () => Promise<string[]>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // Add initialization state to prevent premature API calls
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Initialize state WITHOUT clearing expired tokens (we'll try to refresh first)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const storedToken = localStorage.getItem('token');
    return !!storedToken; // Just check if token exists
  });
  const [user, setUser] = useState<UserInfo | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refreshToken'));

  // Request cache to prevent duplicate API calls
  const requestCache = useRef<Map<string, { promise: Promise<any>, timestamp: number }>>(new Map());
  const CACHE_DURATION = 5000; // 5 seconds cache

  // --- Token Decoding Helper ---
  const decodeTokenPayload = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Decode base64url properly
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));
      return payload;
    } catch (error) {
      console.error('❌ [AUTH] Failed to decode token payload:', error);
      return null;
    }
  };

  // --- Sync State from Token ---
  const syncUserFromToken = (token: string, existingUser: UserInfo | null) => {
    const payload = decodeTokenPayload(token);
    if (!payload) return;

    // Extract ID
    if (payload.id) {
      localStorage.setItem('providerId', payload.id.toString());
    }

    // Update roles if they are in the payload
    if (payload.roles && existingUser) {
      const normalizedRoles = Array.isArray(payload.roles)
        ? payload.roles
        : typeof payload.roles === 'string'
          ? (payload.roles as string).split(/[+,]/).map(r => r.trim()).filter(Boolean)
          : [];

      const updatedUser = { ...existingUser, roles: normalizedRoles };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // --- Login ---
  const login = (userData: UserInfo, token: string, refreshToken: string) => {
    // Guard: if token is missing (e.g. Google flow returned no token yet), bail early
    if (!token || typeof token !== 'string') {
      console.error('❌ [AUTH] login() called with invalid token:', token);
      return;
    }

    // 1. Decode payload to get roles and ID
    const payload = decodeTokenPayload(token);
    const rolesFromToken = payload?.roles
      ? (Array.isArray(payload.roles)
        ? payload.roles
        : typeof payload.roles === 'string'
          ? (payload.roles as string).split(/[+,]/).map(r => r.trim()).filter(Boolean)
          : [])
      : null;

    // 2. Normalize user data (prefer roles from token if available)
    const normalizedUser = {
      ...userData,
      roles: rolesFromToken || (Array.isArray(userData.roles)
        ? userData.roles
        : typeof userData.roles === 'string'
          ? (userData.roles as string).split(/[+,]/).map(r => r.trim()).filter(Boolean)
          : [])
    };

    // 3. Set state
    setIsLoggedIn(true);
    setUser(normalizedUser);
    setToken(token);
    setRefreshToken(refreshToken);

    // 4. Update localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken ?? token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));

    if (payload?.id) {
      localStorage.setItem('providerId', payload.id.toString());
      console.log('✅ [AUTH] ProviderId extracted from token:', payload.id);
    }

    // Clear request cache on login
    requestCache.current.clear();
  };

  // --- Logout ---
  const logout = async (reason?: 'manual' | 'token_expired' | 'session_expired') => {
    const currentRefreshToken = refreshToken || localStorage.getItem('refreshToken');

    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('providerId'); // Also remove providerId

    // Clear request cache on logout
    requestCache.current.clear();

    if (currentRefreshToken) {
      try {
        await fetch(`${API_BASE}/api/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });
      } catch (err) {
        console.error('Logout API error:', err);
      }
    }

    // Navigate with appropriate message based on logout reason
    if (reason === 'token_expired') {
      navigate('/login?message=token_expired&reason=Your session has expired. Please log in again.', { replace: true });
    } else if (reason === 'session_expired') {
      navigate('/login?message=session_expired&reason=Your session has expired. Please log in again.', { replace: true });
    } else {
      navigate('/login?message=logged_out', { replace: true });
    }
  };

  // --- Update user ---
  const updateUser = (updatedUser: Partial<UserInfo>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...updatedUser } : null;
      if (updated) localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // --- Update token manually (e.g., after role change) ---
  const updateToken = (newToken: string) => {
    if (!newToken || typeof newToken !== 'string') return;
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // Sync user roles and ID from the new token
    syncUserFromToken(newToken, user);
  };

  // --- Cached request wrapper ---
  const getCachedRequest = async <T,>(cacheKey: string, requestFn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const cached = requestCache.current.get(cacheKey);

    // Return cached promise if it exists and is still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.promise;
    }

    // Create new request
    const promise = requestFn();
    requestCache.current.set(cacheKey, { promise, timestamp: now });

    // Clean up old cache entries
    setTimeout(() => {
      requestCache.current.delete(cacheKey);
    }, CACHE_DURATION);

    return promise;
  };

  // --- Fetch user roles (centralized and cached) ---
  const fetchUserRoles = async (): Promise<string[]> => {
    if (!token || !isLoggedIn) {
      return [];
    }

    return getCachedRequest('user-roles', async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error('Failed to fetch user roles:', res.status);
          return user?.roles || [];
        }

        const data = await res.json();
        const roles = data.user?.roles || [];

        // Update user state with fetched roles
        if (user && JSON.stringify(user.roles) !== JSON.stringify(roles)) {
          updateUser({ roles });
        }

        return roles;
      } catch (err) {
        console.error('Error fetching user roles:', err);
        return user?.roles || [];
      }
    });
  };

  // --- Fetch wrapper with auto logout ---
  const fetchWithAutoLogout = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      logout('session_expired');
      throw new Error("No token, logging out...");
    }

    let res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      if (!refreshToken) {
        logout('session_expired');
        throw new Error("Session expired, logging out...");
      }

      try {
        const refreshRes = await fetch(`${API_BASE}/api/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshRes.json();

        if (!refreshRes.ok || !refreshData.token) {
          logout('session_expired');
          throw new Error("Session expired, logging out...");
        }

        setToken(refreshData.token);
        localStorage.setItem('token', refreshData.token);

        // Retry original request
        res = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${refreshData.token}`,
          },
        });
      } catch (err) {
        logout('session_expired');
        throw new Error("Session expired, logging out...");
      }
    }

    return res;
  };

  // --- Initialize and attempt token refresh on mount ---
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      // If no token at all, clear everything and finish initialization
      if (!storedToken) {
        setIsLoggedIn(false);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        setIsInitializing(false);
        return;
      }

      // If token is expired but we have a refresh token, try to refresh
      if (isTokenExpired(storedToken)) {
        if (storedRefreshToken) {
          try {
            console.log('Token expired on mount, attempting refresh...');
            const refreshRes = await fetch(`${API_BASE}/api/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });

            const refreshData = await refreshRes.json();

            if (refreshRes.ok && refreshData.token) {
              // Successfully refreshed - update state
              console.log('Token refreshed successfully on mount');
              setToken(refreshData.token);
              localStorage.setItem('token', refreshData.token);
              setIsLoggedIn(true);
              setUser(storedUser ? JSON.parse(storedUser) : null);
              setRefreshToken(storedRefreshToken);
              setIsInitializing(false);
              return;
            }
          } catch (err) {
            console.error('Failed to refresh token on mount:', err);
          }
        }

        // Refresh failed or no refresh token - clear everything
        console.log('Token expired and refresh failed, clearing auth state');
        setIsLoggedIn(false);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsInitializing(false);
        return;
      }

      // Token is still valid - sync state
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setIsLoggedIn(true);
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  // --- Token expiration monitoring and refresh scheduling ---
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = async () => {
      const currentToken = token || localStorage.getItem('token');
      const currentRefreshToken = refreshToken || localStorage.getItem('refreshToken');

      if (!currentToken || !currentRefreshToken || !isLoggedIn) {
        return;
      }

      const timeRemaining = getTimeUntilExpiration(currentToken);

      if (timeRemaining <= 0) {
        console.log('Token expired, attempting refresh...');
        try {
          const refreshRes = await fetch(`${API_BASE}/api/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          const refreshData = await refreshRes.json();

          if (refreshRes.ok && refreshData.token) {
            setToken(refreshData.token);
            localStorage.setItem('token', refreshData.token);
            console.log('Token refreshed successfully after expiration');
            return;
          }
        } catch (err) {
          console.error('Automatic refresh failed:', err);
        }

        logout('session_expired');
        return;
      }

      const refreshTimeout = Math.max(timeRemaining - 30000, 0);
      timeoutId = setTimeout(async () => {
        console.log('Refreshing token before expiry...');
        try {
          const refreshRes = await fetch(`${API_BASE}/api/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          const refreshData = await refreshRes.json();

          if (refreshRes.ok && refreshData.token) {
            setToken(refreshData.token);
            localStorage.setItem('token', refreshData.token);
            console.log('Token refreshed successfully before expiry');
          } else {
            console.warn('Token refresh failed before expiry, logging out');
            logout('session_expired');
          }
        } catch (err) {
          console.error('Automatic refresh failed before expiry:', err);
          logout('session_expired');
        }
      }, refreshTimeout);
    };

    if (isLoggedIn && token) {
      scheduleRefresh();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoggedIn, token, refreshToken, logout]); // Dependencies: re-run when login state or token changes

  // --- Provide context ---
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isInitializing,
        user,
        token,
        refreshToken,
        login,
        logout,
        updateUser,
        updateToken,
        fetchWithAutoLogout,
        fetchUserRoles
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
