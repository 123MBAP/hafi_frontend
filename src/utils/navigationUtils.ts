/**
 * Utility functions for role-based navigation
 */

/**
 * Determines the appropriate dashboard path based on user roles
 * Priority:
 * 1. Admin → /admin/dashboard
 * 2. Seller only → /seller/dashboard
 * 3. Service Provider (with any other roles) → /dashboard
 * 4. Seller + Customer → /seller/dashboard
 * 5. Default → /services
 * 
 * Note: Users with multiple roles (e.g., service_provider + seller) 
 * will go to /dashboard but can navigate to /seller/dashboard via the UI menu
 */
export function getNavigationPath(roles: string[] | string): string {
    const roleArr = Array.isArray(roles)
        ? roles
        : roles.split(/[+,]/).map((r) => r.trim()).filter(Boolean);

    // Admin gets priority routing
    if (roleArr.includes('admin')) return '/admin/dashboard';

    // If user only has seller role, go to seller dashboard
    if (roleArr.includes('seller') && !roleArr.includes('service_provider') && !roleArr.includes('customer')) {
        return '/seller/dashboard';
    }

    // If user has service_provider role (with or without other roles), go to provider dashboard
    // They can navigate to seller dashboard via the UI menu if they also have seller role
    if (roleArr.includes('service_provider')) return '/dashboard';

    // If user only has seller role with customer
    if (roleArr.includes('seller') && roleArr.includes('customer')) return '/seller/dashboard';

    // Pure seller role
    if (roleArr.includes('seller')) return '/seller/dashboard';

    // Default to services page
    return '/services';
}

/**
 * Checks if a user has at least one of the specified roles
 */
export function hasAnyRole(userRoles: string[] | string, requiredRoles: string[]): boolean {
    const roleArr = Array.isArray(userRoles)
        ? userRoles
        : userRoles.split(/[+,]/).map((r) => r.trim()).filter(Boolean);

    return requiredRoles.some(role => roleArr.includes(role));
}

/**
 * Checks if a user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[] | string, requiredRoles: string[]): boolean {
    const roleArr = Array.isArray(userRoles)
        ? userRoles
        : userRoles.split(/[+,]/).map((r) => r.trim()).filter(Boolean);

    return requiredRoles.every(role => roleArr.includes(role));
}
