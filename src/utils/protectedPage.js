/**
 * Protected Page Wrapper
 *
 * Provides an easy way to initialize protected pages with authentication.
 */

import { requireAuth } from './authGuard.js';
import { authState } from '../auth/authState.js';

/**
 * Initialize a protected page
 * Ensures user is authenticated before running page initialization
 *
 * @param {Function} onReady - Callback to run when page is authenticated and ready
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
export async function initProtectedPage(onReady, options = {}) {
  try {
    // Check authentication
    const session = await requireAuth(options);

    if (!session) {
      // requireAuth will redirect, but just in case:
      return;
    }

    // Update global auth state
    authState.setState({
      user: session.user,
      isAuthenticated: true,
      isLoading: false
    });

    // Call page-specific initialization
    if (onReady && typeof onReady === 'function') {
      await onReady(session);
    }

  } catch (error) {
    console.error('Page initialization error:', error);
    showError('Failed to load page. Please refresh and try again.');

    // Update auth state to show error
    authState.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error.message
    });
  }
}

/**
 * Show error message on page
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Check if error element already exists
  let errorDiv = document.getElementById('page-error-message');

  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'page-error-message';
    errorDiv.className = 'page-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #fee;
      color: #c33;
      padding: 16px 24px;
      border-radius: 12px;
      border: 1px solid #fcc;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 9998;
      max-width: 90%;
      text-align: center;
    `;
    document.body.appendChild(errorDiv);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }, 10000);
}

/**
 * Wrapper for pages that need authentication
 * Usage:
 *
 * ```javascript
 * import { withAuth } from '/src/utils/protectedPage.js';
 *
 * withAuth(async (session) => {
 *   console.log('User:', session.user.name);
 *   // Initialize your page here
 * });
 * ```
 */
export function withAuth(initFn, options = {}) {
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initProtectedPage(initFn, options);
    });
  } else {
    initProtectedPage(initFn, options);
  }
}
