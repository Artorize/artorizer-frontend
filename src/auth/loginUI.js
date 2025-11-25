/**
 * Login Page UI Handler
 *
 * Manages the login page interactions, OAuth flows, and error handling.
 */

import { AuthManager } from './authManager.js';
import { authConfig } from './authConfig.js';

/**
 * Login UI Controller
 */
export class LoginUI {
  constructor() {
    this.authManager = new AuthManager();
    this.isLoading = false;
  }

  /**
   * Initialize the login page
   * Call this when DOM is ready
   */
  init() {
    this.attachEventListeners();
    this.handleOAuthCallback();
    this.checkExistingSession();
  }

  /**
   * Attach event listeners to login buttons
   */
  attachEventListeners() {
    const googleBtn = document.getElementById('google-signin');
    const githubBtn = document.getElementById('github-signin');
    const emailForm = document.getElementById('login-form');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleGoogleLogin());
    }

    if (githubBtn) {
      githubBtn.addEventListener('click', () => this.handleGitHubLogin());
    }

    if (emailForm) {
      emailForm.addEventListener('submit', (e) => this.handleEmailLogin(e));
    }
  }

  /**
   * Handle Google OAuth login
   */
  async handleGoogleLogin() {
    if (this.isLoading) return;

    this.showLoading('Redirecting to Google...');

    try {
      await this.authManager.signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
      this.showError('Failed to sign in with Google. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Handle GitHub OAuth login
   */
  async handleGitHubLogin() {
    if (this.isLoading) return;

    this.showLoading('Redirecting to GitHub...');

    try {
      await this.authManager.signInWithGitHub();
    } catch (error) {
      console.error('GitHub login failed:', error);
      this.showError('Failed to sign in with GitHub. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Handle email/password login
   * Note: This is a placeholder for future email auth implementation
   */
  async handleEmailLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value;

    if (!email) {
      this.showError('Please enter your email address');
      return;
    }

    // TODO: Implement email authentication with Better Auth
    console.log('Email sign-in requested:', email);
    this.showError('Email authentication is not yet implemented. Please use Google or GitHub.');
  }

  /**
   * Handle OAuth callback
   * Processes the OAuth redirect after user authorizes
   */
  async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');

    // Handle OAuth errors
    if (error) {
      this.showError(`Authentication failed: ${error}`);
      // Clean URL
      window.history.replaceState({}, document.title, '/login.html');
      return;
    }

    // Handle successful OAuth callback
    if (code) {
      this.showLoading('Completing sign in...');

      // Better Auth handles the callback automatically
      // We just need to wait a moment and check the session
      setTimeout(async () => {
        try {
          const session = await this.authManager.getSession();
          if (session) {
            this.redirectAfterLogin();
          } else {
            this.showError('Sign in failed. Please try again.');
            this.hideLoading();
            window.history.replaceState({}, document.title, '/login.html');
          }
        } catch (error) {
          console.error('Session check failed:', error);
          this.showError('Sign in failed. Please try again.');
          this.hideLoading();
          window.history.replaceState({}, document.title, '/login.html');
        }
      }, 1000);
    }
  }

  /**
   * Check if user is already logged in
   * If so, redirect to dashboard
   */
  async checkExistingSession() {
    // Don't check if we're processing an OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return;

    try {
      const session = await this.authManager.getSession();
      if (session) {
        // Already logged in, redirect
        this.redirectAfterLogin();
      }
    } catch {
      // Not logged in, that's fine
    }
  }

  /**
   * Redirect after successful login
   * Uses returnUrl if provided, otherwise goes to dashboard
   */
  redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') || authConfig.redirectUrl;
    window.location.href = returnUrl;
  }

  /**
   * Show loading state
   * @param {string} message - Loading message to display
   */
  showLoading(message = 'Loading...') {
    this.isLoading = true;

    // Disable all login buttons
    const buttons = document.querySelectorAll('.oauth-btn, .sign-in-btn');
    buttons.forEach(btn => btn.disabled = true);

    // Show loading indicator
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.textContent = message;
      loadingDiv.style.display = 'block';
    } else {
      // Create loading indicator if it doesn't exist
      const loading = document.createElement('div');
      loading.id = 'loading-indicator';
      loading.className = 'loading-indicator';
      loading.textContent = message;
      loading.style.cssText = 'text-align: center; margin: 20px 0; color: #667eea; font-weight: 500;';

      const formSection = document.querySelector('.login-form-wrapper');
      if (formSection) {
        formSection.appendChild(loading);
      }
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.isLoading = false;

    // Re-enable all login buttons
    const buttons = document.querySelectorAll('.oauth-btn, .sign-in-btn');
    buttons.forEach(btn => btn.disabled = false);

    // Hide loading indicator
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    let errorDiv = document.getElementById('error-message');

    if (!errorDiv) {
      // Create error div if it doesn't exist
      errorDiv = document.createElement('div');
      errorDiv.id = 'error-message';
      errorDiv.className = 'error-message';
      errorDiv.style.cssText = 'background: #fee; color: #c33; padding: 12px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcc;';

      const formSection = document.querySelector('.login-form-wrapper');
      if (formSection) {
        formSection.appendChild(errorDiv);
      }
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const loginUI = new LoginUI();
    loginUI.init();
  });
} else {
  const loginUI = new LoginUI();
  loginUI.init();
}
