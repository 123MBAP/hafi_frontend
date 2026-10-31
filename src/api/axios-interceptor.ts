/**
 * Fetch API Interceptor for Authentication Error Handling
 * 
 * This interceptor wraps the native fetch API to automatically handle 
 * authentication errors from the backend and redirects to login when 
 * tokens are expired, invalid, or missing.
 * 
 * Usage:
 * 1. Import this file in your main.tsx or App.tsx
 * 2. The interceptor will automatically wrap all fetch calls
 */

// Store the original fetch
const originalFetch = window.fetch;

/**
 * Handle logout and redirect to login page
 * @param message - Message to display to user (optional)
 */
function handleLogout(message?: string) {
    // Clear all authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Clear all authentication data from sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');

    // Display message to user (optional - you can use toast notifications here)
    if (message) {
        // TODO: Replace with toast notification
        // toast.error(message);
    }

    // Redirect to login page
    window.location.href = '/login';
}

/**
 * Wrapped fetch function with authentication error handling
 */
window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const [resource, config] = args;

    // Get the URL as a string
    const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : resource.href);

    // Skip auth handling for login, register, and public endpoints
    const isAuthEndpoint = url.includes('/api/login') ||
        url.includes('/api/register') ||
        url.includes('/api/auth/google') ||
        url.includes('/api/verify-email') ||
        url.includes('/api/me') ||
        url.includes('/api/refresh');

    // Add Authorization header if token exists and not already present (but not for login/register)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const requestConfig = config || {};

    // Only add auth header if we have a token and it's not a login/register request
    const shouldAddAuthHeader = token && !url.includes('/api/login') && !url.includes('/api/register');

    if (shouldAddAuthHeader && !requestConfig.headers) {
        requestConfig.headers = {
            'Authorization': `Bearer ${token}`
        };
    } else if (shouldAddAuthHeader && requestConfig.headers) {
        const headers = new Headers(requestConfig.headers);
        if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        requestConfig.headers = headers;
    }

    try {
        // Make the actual fetch request
        const response = await originalFetch(resource, requestConfig);

        // Skip auth error handling for auth endpoints and if already on login page
        if (isAuthEndpoint || window.location.pathname === '/login') {
            return response;
        }

        // Check for authentication errors (401)
        if (response.status === 401) {
            // Clone the response to read it (can only read once)
            const clonedResponse = response.clone();

            try {
                const data = await clonedResponse.json();

                // Check if backend wants us to redirect to login
                if (data?.redirectToLogin) {
                    const errorCode = data.code;

                    // Handle specific error codes
                    const messages: Record<string, string> = {
                        TOKEN_EXPIRED: 'Your session has expired. Please login again.',
                        INVALID_TOKEN: 'Invalid authentication. Please login again.',
                        NO_TOKEN: 'Please login to continue.',
                        TOKEN_REVOKED: 'Your session has been revoked. Please login again.',
                        INVALID_TOKEN_TYPE: 'Invalid authentication type. Please login again.',
                        AUTH_FAILED: 'Authentication failed. Please login again.'
                    };

                    const message = messages[errorCode] || data.error || 'Please login to continue.';
                    handleLogout(message);
                }
            } catch (_parseError) {
                // If we can't parse the response, still logout on 401
                handleLogout('Authentication failed. Please login again.');
            }
        }

        // Check for forbidden errors (403) - optional
        if (response.status === 403) {
            const clonedResponse = response.clone();
            try {
                const data = await clonedResponse.json();

                // If forbidden also wants redirect to login
                if (data?.redirectToLogin) {
                    handleLogout('Access forbidden. Please login again.');
                }
            } catch (_parseError) {
                // Silently handle parse errors
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
};

export default window.fetch;
