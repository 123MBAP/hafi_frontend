/**
 * React Context-based Authentication Error Handler
 * 
 * This component provides a React-friendly way to handle authentication errors
 * and automatically redirect to login when needed.
 * 
 * Usage:
 * 1. Wrap your App with <AuthErrorHandler>
 * 2. Use the useAuthErrorHandler hook in your API calls
 */

import axios, { AxiosError } from 'axios';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthError {
    error: string;
    code: string;
    redirectToLogin?: boolean;
}

interface AuthErrorContextType {
    handleAuthError: (error: AxiosError<AuthError>) => void;
    logout: (message?: string) => void;
}

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(undefined);

export function AuthErrorHandler({ children }: { children: ReactNode }) {
    const navigate = useNavigate();

    const logout = (message?: string) => {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');

        // Show message if provided (you can replace with toast notification)
        if (message) {
            console.log('Logout message:', message);
            // toast.error(message);
        }

        // Navigate to login
        navigate('/login', {
            replace: true,
            state: { message }
        });
    };

    const handleAuthError = (error: AxiosError<AuthError>) => {
        if (!error.response) {
            console.error('Network error:', error.message);
            return;
        }

        const { status, data } = error.response;

        // Handle 401 authentication errors
        if (status === 401 && data?.redirectToLogin) {
            const messages: Record<string, string> = {
                TOKEN_EXPIRED: 'Your session has expired. Please login again.',
                INVALID_TOKEN: 'Invalid authentication. Please login again.',
                NO_TOKEN: 'Please login to continue.',
                TOKEN_REVOKED: 'Your session has been revoked. Please login again.',
                INVALID_TOKEN_TYPE: 'Invalid authentication type. Please login again.',
                AUTH_FAILED: 'Authentication failed. Please login again.',
            };

            const message = messages[data.code] || data.error || 'Please login to continue.';
            logout(message);
        }
    };

    // Setup axios interceptor
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error: AxiosError<AuthError>) => {
                handleAuthError(error);
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    return (
        <AuthErrorContext.Provider value={{ handleAuthError, logout }}>
            {children}
        </AuthErrorContext.Provider>
    );
}

/**
 * Hook to access auth error handling
 */
export function useAuthErrorHandler() {
    const context = useContext(AuthErrorContext);
    if (!context) {
        throw new Error('useAuthErrorHandler must be used within AuthErrorHandler');
    }
    return context;
}

/**
 * Example usage in a component:
 * 
 * function MyComponent() {
 *   const { logout } = useAuthErrorHandler();
 *   
 *   const handleManualLogout = () => {
 *     logout('You have been logged out successfully');
 *   };
 *   
 *   return <button onClick={handleManualLogout}>Logout</button>;
 * }
 */
