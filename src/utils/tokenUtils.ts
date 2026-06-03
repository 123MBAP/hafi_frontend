// JWT Token utility functions for client-side token validation

interface TokenPayload {
  id: string;
  email: string;
  roles: string[];
  name: string;
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
}

/**
 * Decode JWT token payload without verification (client-side)
 * Note: This doesn't verify the signature, only extracts the payload
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    if (!token) return null;

    // JWT has 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);

    // Decode base64url to string
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decoded) as TokenPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @param bufferSeconds - Buffer time in seconds before expiration (default: 30)
 * @returns true if expired, false if still valid
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // Convert exp from seconds to milliseconds and compare with current time
  // Add buffer to prevent race conditions (token expiring during request)
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return currentTime >= (expirationTime - bufferTime);
}

/**
 * Get the expiration time of a JWT token
 * @param token - JWT token string
 * @returns Date object of expiration time or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
}

/**
 * Get user roles from JWT token
 * @param token - JWT token string
 * @returns Array of user roles or empty array if invalid
 */
export function getTokenRoles(token: string): string[] {
  const payload = decodeToken(token);
  if (!payload || !payload.roles) return [];

  return Array.isArray(payload.roles) ? payload.roles : [payload.roles];
}

/**
 * Check if user has specific roles that require auto-logout on expiration
 * @param token - JWT token string
 * @returns true if user has service_provider or seller role
 */
export function shouldAutoLogoutOnExpiration(token: string): boolean {
  const roles = getTokenRoles(token);
  return roles.includes('service_provider') || roles.includes('seller');
}

/**
 * Check if user is only a customer (has customer role but not seller or service_provider)
 * @param token - JWT token string
 * @returns true if user is only a customer
 */
export function isOnlyCustomer(token: string): boolean {
  const roles = getTokenRoles(token);
  return roles.includes('customer') &&
    !roles.includes('service_provider') &&
    !roles.includes('seller');
}

/**
 * Get time remaining until token expires
 * @param token - JWT token string
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export function getTimeUntilExpiration(token: string): number {
  const expirationDate = getTokenExpiration(token);
  if (!expirationDate) return 0;

  const timeRemaining = expirationDate.getTime() - Date.now();
  return Math.max(0, timeRemaining);
}