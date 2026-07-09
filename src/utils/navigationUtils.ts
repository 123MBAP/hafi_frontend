/**
 * Utility functions for role-based navigation
 */

/**
 * Determines the appropriate dashboard path based on user roles
 * Priority:
 * 1. Admin → /admin/dashboard
 * 2. Service Provider (with any other roles) → /dashboard/provider
 * 3. Seller (with any other roles) → /dashboard/seller
 * 4. Default → /services
 * 
 * Note: Users with multiple roles can navigate to alternate dashboards via the UI menu.
 */
export function getNavigationPath(roles: string[] | string): string {
    const roleArr = Array.isArray(roles)
        ? roles
        : roles.split(/[+,]/).map((r) => r.trim()).filter(Boolean);

    // Admin gets priority routing
    if (roleArr.includes('admin')) return '/admin/dashboard';

    // Agent routing
    if (roleArr.includes('agent')) return '/dashboard/agent';

    // If user has service_provider role (with or without other roles), go to provider dashboard
    if (roleArr.includes('service_provider')) return '/dashboard/provider';

    // If user has seller role (with or without other roles), go to seller dashboard
    if (roleArr.includes('seller')) return '/dashboard/seller';

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
