/**
 * Authentication Guard
 *
 * Protects routes by requiring authentication before accessing them.
 */

import { AuthManager } from '../auth/authManager.js';

/**
 * Require authentication for the current page
 * Redirects to login if not authenticated
 * @param {Object} options - Configuration options
 * @returns {Promise<Session>} The user session
 */
export async function requireAuth(options = {}) {
  const authManager = new AuthManager(options);
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  // Show loading state
  if (options.showLoading !== false) {
    showLoadingSpinner();
  }

  try {
    const session = await authManager.getSession();

    if (!session) {
      // Not authenticated, redirect to login with return URL
      const returnUrl = encodeURIComponent(currentPath + currentSearch);
      const loginUrl = options.loginUrl || '/auth/login.html';
      window.location.href = `${loginUrl}?returnUrl=${returnUrl}`;
      return null;
    }

    // Authenticated, hide loading
    if (options.showLoading !== false) {
      hideLoadingSpinner();
    }

    return session;

  } catch (error) {
    console.error('Auth check failed:', error);

    // On error, redirect to login
    const loginUrl = options.loginUrl || '/auth/login.html';
    window.location.href = loginUrl;
    return null;
  }
}

/**
 * Check if user is authenticated without redirecting
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>}
 */
export async function checkAuth(options = {}) {
  const authManager = new AuthManager(options);
  try {
    const session = await authManager.getSession();
    return session !== null;
  } catch {
    return false;
  }
}

/**
 * Get current session without redirecting
 * @param {Object} options - Configuration options
 * @returns {Promise<Session | null>}
 */
export async function getSession(options = {}) {
  const authManager = new AuthManager(options);
  try {
    return await authManager.getSession();
  } catch {
    return null;
  }
}

/**
 * Show loading spinner
 */
function showLoadingSpinner() {
  // Check if already exists
  if (document.getElementById('auth-loading-spinner')) return;

  const spinner = document.createElement('div');
  spinner.id = 'auth-loading-spinner';
  spinner.className = 'auth-loading-overlay';
  spinner.innerHTML = `
    <div class="auth-loading-content">
      <div class="auth-spinner"></div>
      <p>Checking authentication...</p>
    </div>
  `;

  // Inject styles
  const styles = `
    <style id="auth-loading-styles">
      .auth-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .auth-loading-content {
        text-align: center;
      }

      .auth-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: auth-spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes auth-spin {
        to { transform: rotate(360deg); }
      }

      .auth-loading-content p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }
    </style>
  `;

  if (!document.getElementById('auth-loading-styles')) {
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  document.body.appendChild(spinner);
  document.body.classList.add('checking-auth');
}

/**
 * Hide loading spinner
 */
function hideLoadingSpinner() {
  const spinner = document.getElementById('auth-loading-spinner');
  if (spinner) {
    spinner.remove();
  }
  document.body.classList.remove('checking-auth');
}
