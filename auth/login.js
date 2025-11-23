/**
 * Login/Signup Page Handler
 *
 * Manages authentication UI, password strength indicator, and form switching
 */

import { AuthManager } from '../src/auth/authManager.js';

class AuthUI {
  constructor() {
    this.authManager = new AuthManager();
    this.isLoading = false;
    this.currentMode = 'signin'; // 'signin' or 'signup'
  }

  init() {
    this.attachEventListeners();
    this.handleOAuthCallback();
    this.checkExistingSession();
  }

  attachEventListeners() {
    // OAuth buttons (sign in)
    const googleBtn = document.getElementById('google-signin');
    const githubBtn = document.getElementById('github-signin');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleGoogleLogin());
    }

    if (githubBtn) {
      githubBtn.addEventListener('click', () => this.handleGitHubLogin());
    }

    // OAuth buttons (sign up)
    const googleSignupBtn = document.getElementById('google-signup');
    const githubSignupBtn = document.getElementById('github-signup');

    if (googleSignupBtn) {
      googleSignupBtn.addEventListener('click', () => this.handleGoogleLogin());
    }

    if (githubSignupBtn) {
      githubSignupBtn.addEventListener('click', () => this.handleGitHubLogin());
    }

    // Auth forms
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');

    if (signinForm) {
      signinForm.addEventListener('submit', (e) => this.handleSignIn(e));
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignUp(e));
    }

    // Toggle links
    const showSignupLink = document.getElementById('show-signup');
    const showSigninLink = document.getElementById('show-signin');

    if (showSignupLink) {
      showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('signup');
      });
    }

    if (showSigninLink) {
      showSigninLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('signin');
      });
    }

    // Password strength indicator
    const signupPassword = document.getElementById('signup-password');
    if (signupPassword) {
      signupPassword.addEventListener('input', (e) => {
        this.updatePasswordStrength(e.target.value);
      });
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    const signinContainer = document.getElementById('signin-container');
    const signupContainer = document.getElementById('signup-container');

    if (mode === 'signup') {
      signinContainer?.classList.add('hidden');
      signupContainer?.classList.remove('hidden');
    } else {
      signupContainer?.classList.add('hidden');
      signinContainer?.classList.remove('hidden');
    }
  }

  /**
   * Calculate password strength based on various criteria
   * Returns 0-4 representing: none, weak, average, good, perfect
   */
  calculatePasswordStrength(password) {
    if (!password) return 0;

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isLong: password.length >= 12,
    };

    // Basic requirements
    if (checks.length && checks.hasLower && checks.hasUpper) {
      strength = 1; // Weak
    }

    // Add numbers or special chars
    if (strength === 1 && (checks.hasNumber || checks.hasSpecial)) {
      strength = 2; // Average
    }

    // Has variety
    if (checks.hasLower && checks.hasUpper && checks.hasNumber && checks.hasSpecial) {
      strength = 3; // Good
    }

    // Perfect: all criteria + long
    if (strength === 3 && checks.isLong) {
      strength = 4; // Perfect
    }

    return strength;
  }

  /**
   * Update the password strength indicator
   */
  updatePasswordStrength(password) {
    const strengthContainer = document.getElementById('password-strength');
    if (!strengthContainer) return;

    const strength = this.calculatePasswordStrength(password);
    const strengthBar = strengthContainer.querySelector('.password-strength-bar');
    const strengthText = strengthContainer.querySelector('.password-strength-text');

    // Remove all strength classes
    strengthBar.classList.remove('strength-weak', 'strength-average', 'strength-good', 'strength-perfect');

    // Show/hide indicator
    if (!password) {
      strengthContainer.style.display = 'none';
      return;
    }

    strengthContainer.style.display = 'block';

    // Set strength level
    const strengthLabels = ['', 'Weak', 'Average', 'Good', 'Perfect'];
    const strengthClasses = ['', 'strength-weak', 'strength-average', 'strength-good', 'strength-perfect'];

    if (strength > 0) {
      strengthBar.classList.add(strengthClasses[strength]);
      strengthText.textContent = strengthLabels[strength];
    }
  }

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

  async handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById('signin-email')?.value;

    if (!email) {
      this.showError('Please enter your email address');
      return;
    }

    console.log('Sign-in requested:', email);
    this.showError('Email authentication is not yet implemented. Please use Google or GitHub.');
  }

  async handleSignUp(event) {
    event.preventDefault();

    const username = document.getElementById('signup-username')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    const confirmPassword = document.getElementById('signup-password-confirm')?.value;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      this.showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    const strength = this.calculatePasswordStrength(password);
    if (strength < 2) {
      this.showError('Please choose a stronger password');
      return;
    }

    console.log('Sign-up requested:', { username, email });
    this.showError('Email authentication is not yet implemented. Please use Google or GitHub.');
  }

  async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');

    if (error) {
      this.showError(`Authentication failed: ${error}`);
      window.history.replaceState({}, document.title, '/login.html');
      return;
    }

    if (code) {
      this.showLoading('Completing sign in...');

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

  async checkExistingSession() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return;

    try {
      const session = await this.authManager.getSession();
      if (session) {
        this.redirectAfterLogin();
      }
    } catch {
      // Not logged in
    }
  }

  redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') || '/dashboard/dashboard-v2.html';
    window.location.href = returnUrl;
  }

  showLoading(message = 'Loading...') {
    this.isLoading = true;

    const buttons = document.querySelectorAll('.oauth-btn, .sign-in-btn');
    buttons.forEach(btn => btn.disabled = true);

    let loadingDiv = document.getElementById('loading-indicator');
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading-indicator';
      loadingDiv.style.cssText = 'text-align: center; margin: 20px 0; color: #667eea; font-weight: 500;';

      const formSection = document.querySelector('.login-form-wrapper');
      if (formSection) {
        formSection.appendChild(loadingDiv);
      }
    }

    loadingDiv.textContent = message;
    loadingDiv.style.display = 'block';
  }

  hideLoading() {
    this.isLoading = false;

    const buttons = document.querySelectorAll('.oauth-btn, .sign-in-btn');
    buttons.forEach(btn => btn.disabled = false);

    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }

  showError(message) {
    let errorDiv = document.getElementById('error-message');

    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'error-message';
      errorDiv.style.cssText = 'background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca; font-size: 14px;';

      const formSection = document.querySelector('.login-form-wrapper');
      if (formSection) {
        formSection.insertBefore(errorDiv, formSection.firstChild);
      }
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const authUI = new AuthUI();
    authUI.init();
  });
} else {
  const authUI = new AuthUI();
  authUI.init();
}
