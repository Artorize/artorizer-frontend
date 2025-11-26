/**
 * Authentication Configuration
 *
 * Centralizes auth-related configuration including API base URLs.
 * Uses Better Auth with HTTP-only cookies for session management.
 *
 * Backend: Better Auth framework
 * Session: HTTP-only cookies (better-auth.session_token)
 * Session Duration: 7 days with automatic refresh
 */

/**
 * Determine the API base URL
 * Always uses production router for consistency (allows local testing with real auth)
 */
function getBaseURL() {
  // Check for explicit environment variable (set via build process or window config)
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  // Always use production router
  return 'https://router.artorizer.com';
}

/**
 * Auth configuration object
 */
export const authConfig = {
  /** API base URL for auth endpoints - environment aware */
  baseURL: getBaseURL(),

  /** Default redirect after login */
  redirectUrl: '/dashboard/dashboard-v2.html',

  /** Login page URL */
  loginUrl: '/auth/login.html',

  /** Session cache duration in milliseconds (5 minutes) */
  cacheDuration: 5 * 60 * 1000,

  /** Whether auth is enabled */
  authEnabled: true
};

/**
 * Map API availability response to boolean flags
 *
 * Backend returns: { emailAvailable: boolean, usernameAvailable: boolean }
 * This function handles both formats for compatibility.
 *
 * @param {Object} apiResponse - Raw API response from /auth/check-availability
 * @returns {Object} Normalized availability object
 */
export function normalizeAvailability(apiResponse) {
  // Backend already returns boolean format
  if (typeof apiResponse.emailAvailable === 'boolean') {
    return {
      emailAvailable: apiResponse.emailAvailable,
      usernameAvailable: apiResponse.usernameAvailable ?? true
    };
  }

  // Fallback: handle string format (email: 'available'|'taken'|'invalid')
  return {
    emailAvailable: apiResponse.email === 'available',
    usernameAvailable: apiResponse.username === 'available'
  };
}

export default authConfig;
