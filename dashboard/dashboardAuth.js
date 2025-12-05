/**
 * Dashboard Authentication Module
 *
 * Handles authentication state for the dashboard, including:
 * - Session checking on page load
 * - Redirecting to login if not authenticated
 * - Providing user data to the dashboard UI
 * - Sign-out functionality
 */

(function() {
  'use strict';

  const AUTH_CONFIG = {
    // Use the same base URL as the router
    baseURL: window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com',
    loginUrl: '/auth/login.html',
    sessionCacheDuration: 5 * 60 * 1000 // 5 minutes
  };

  // Session cache
  let cachedSession = null;
  let cacheExpiry = null;

  /**
   * Get current session from Better Auth
   * @returns {Promise<{user: Object, session: Object} | null>}
   */
  async function getSession() {
    // Use cache if valid
    if (cachedSession && cacheExpiry && Date.now() < cacheExpiry) {
      return cachedSession;
    }

    try {
      const response = await fetch(`${AUTH_CONFIG.baseURL}/auth/me`, {
        credentials: 'include'
      });

      if (!response.ok) {
        cachedSession = null;
        cacheExpiry = null;
        return null;
      }

      const data = await response.json();

      // Better Auth returns null or empty object when not authenticated
      if (!data || !data.user) {
        cachedSession = null;
        cacheExpiry = null;
        return null;
      }

      // Cache the session
      cachedSession = data;
      cacheExpiry = Date.now() + AUTH_CONFIG.sessionCacheDuration;

      return data;
    } catch (error) {
      console.error('[DashboardAuth] Failed to get session:', error);
      cachedSession = null;
      cacheExpiry = null;
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async function isAuthenticated() {
    const session = await getSession();
    return session !== null;
  }

  /**
   * Require authentication - redirects to login if not authenticated
   * @returns {Promise<{user: Object, session: Object}>}
   */
  async function requireAuth() {
    const session = await getSession();

    if (!session) {
      // Store current URL for return after login
      const returnUrl = window.location.pathname + window.location.search;
      const loginUrl = `${AUTH_CONFIG.loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
      window.location.href = loginUrl;
      // Throw to prevent further execution
      throw new Error('Authentication required');
    }

    return session;
  }

  /**
   * Sign out and redirect to login
   */
  async function signOut() {
    try {
      await fetch(`${AUTH_CONFIG.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('[DashboardAuth] Sign out request failed:', error);
    }

    // Clear cache
    cachedSession = null;
    cacheExpiry = null;

    // Redirect to login
    window.location.href = AUTH_CONFIG.loginUrl;
  }

  /**
   * Clear session cache (useful after sign-out or session refresh)
   */
  function clearCache() {
    cachedSession = null;
    cacheExpiry = null;
  }

  /**
   * Start periodic session validation
   * Checks session every 5 minutes and redirects to login if expired
   */
  function startSessionValidation() {
    // Check session every 5 minutes
    setInterval(async () => {
      console.log('[DashboardAuth] Validating session...');

      // Force cache refresh by clearing it first
      clearCache();

      const session = await getSession();

      if (!session) {
        console.warn('[DashboardAuth] Session expired, redirecting to login...');
        // Store current URL for return after login
        const returnUrl = window.location.pathname + window.location.search;
        const loginUrl = `${AUTH_CONFIG.loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
        window.location.href = loginUrl;
      } else {
        console.log('[DashboardAuth] Session valid');
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get current user from session
   * @returns {Promise<Object | null>}
   */
  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  /**
   * Update user profile in the dashboard UI
   * @param {Object} user - User object from session
   */
  function updateUserProfileUI(user) {
    if (!user) return;

    // Update user name display
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(el => {
      el.textContent = user.name || user.email?.split('@')[0] || 'User';
    });

    // Update user email display
    const userEmailElements = document.querySelectorAll('[data-user-email]');
    userEmailElements.forEach(el => {
      el.textContent = user.email || '';
    });

    // Update user avatar
    const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
    userAvatarElements.forEach(el => {
      if (user.image) {
        el.src = user.image;
        el.alt = user.name || 'User avatar';
      } else {
        // Generate initials avatar
        const initials = (user.name || user.email || 'U').charAt(0).toUpperCase();
        el.alt = initials;
        // Keep existing placeholder or set a default
      }
    });

    // Update sidebar user info (specific to dashboard-v2 layout)
    updateSidebarUserInfo(user);
  }

  /**
   * Update sidebar user information
   * @param {Object} user - User object from session
   */
  function updateSidebarUserInfo(user) {
    const userName = user.name || user.email?.split('@')[0] || 'User';
    const userEmail = user.email || '';

    // Update sidebar user name element
    const sidebarNameElement = document.querySelector('[data-sidebar-user-name]');
    if (sidebarNameElement) {
      // Get the child div (workspace section) to preserve it
      const childDiv = sidebarNameElement.querySelector('div');
      const childDivClone = childDiv ? childDiv.cloneNode(true) : null;
      // Clear and rebuild content
      sidebarNameElement.innerHTML = '';
      sidebarNameElement.appendChild(document.createTextNode(userName));
      if (childDivClone) {
        sidebarNameElement.appendChild(childDivClone);
      }
    }

    // Update sidebar avatar
    const sidebarAvatar = document.querySelector('[data-sidebar-user-avatar]');
    if (sidebarAvatar) {
      if (user.image) {
        sidebarAvatar.src = user.image;
        sidebarAvatar.alt = userName;
      } else {
        // Generate initials avatar SVG
        const initials = userName.charAt(0).toUpperCase();
        sidebarAvatar.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236366f1'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.35em' fill='white' font-size='40' font-family='system-ui'%3E${initials}%3C/text%3E%3C/svg%3E`;
        sidebarAvatar.alt = userName;
      }
    }

    // Update dropdown user info if it exists
    const dropdownNameElement = document.querySelector('[data-dropdown-user-name]');
    if (dropdownNameElement) {
      dropdownNameElement.textContent = userName;
    }

    const dropdownEmailElement = document.querySelector('[data-dropdown-user-email]');
    if (dropdownEmailElement) {
      dropdownEmailElement.textContent = userEmail;
    }

    // Update the header user avatar (Talk to El section)
    const headerAvatars = document.querySelectorAll('.hstack img[alt*="huang"], .hstack img[data-nimg]');
    headerAvatars.forEach(img => {
      if (user.image && img.alt !== 'Ask El') {
        img.src = user.image;
        img.alt = userName;
      }
    });
  }

  /**
   * Initialize sign-out buttons
   */
  function initSignOutButtons() {
    // Add click handler to any sign-out buttons
    document.querySelectorAll('[data-action="sign-out"]').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut();
      });
    });
  }

  /**
   * Show authentication loading state
   */
  function showAuthLoading() {
    const appRoot = document.getElementById('app-root');
    if (appRoot) {
      appRoot.style.opacity = '0.5';
      appRoot.style.pointerEvents = 'none';
    }
  }

  /**
   * Hide authentication loading state
   */
  function hideAuthLoading() {
    const appRoot = document.getElementById('app-root');
    if (appRoot) {
      appRoot.style.opacity = '1';
      appRoot.style.pointerEvents = 'auto';
    }
  }

  /**
   * Initialize dashboard authentication
   * Should be called early in the page load
   */
  async function initDashboardAuth() {
    console.log('[DashboardAuth] Initializing...');

    // LOCAL DEBUG MODE: Skip auth on localhost for UI testing
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      console.log('[DashboardAuth] Local debug mode - skipping auth');
      // Provide mock user for local testing
      const mockUser = { name: 'Local Dev', email: 'dev@localhost', image: null };
      updateUserProfileUI(mockUser);
      return { user: mockUser, session: { token: 'local-debug' } };
    }

    showAuthLoading();

    try {
      // Require authentication - will redirect if not authenticated
      const session = await requireAuth();

      console.log('[DashboardAuth] User authenticated:', session.user.email);

      // Update UI with user info
      updateUserProfileUI(session.user);

      // Initialize sign-out buttons
      initSignOutButtons();

      // Start periodic session validation
      startSessionValidation();

      hideAuthLoading();

      return session;
    } catch (error) {
      // If requireAuth throws, we're being redirected
      console.log('[DashboardAuth] Redirecting to login...');
      return null;
    }
  }

  // Export to window for use in dashboard
  window.DashboardAuth = {
    init: initDashboardAuth,
    getSession,
    getUser,
    isAuthenticated,
    requireAuth,
    signOut,
    clearCache,
    updateUserProfileUI,
    startSessionValidation
  };

})();
