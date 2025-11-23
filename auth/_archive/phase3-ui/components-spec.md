# Phase 3: Component Specifications

## File 1: `login.html`

### Purpose
Login page with OAuth provider buttons

### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In - Artorize</title>
  <link rel="stylesheet" href="dashboard/dashboard-v2.css">
  <style>
    /* Login-specific styles */
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-card">
      <h1>Welcome to Artorize</h1>
      <p class="subtitle">Protecting the Finite Gesture</p>

      <div class="oauth-buttons">
        <button id="google-login" class="oauth-btn google-btn">
          <!-- Google SVG icon -->
          <span>Continue with Google</span>
        </button>

        <button id="github-login" class="oauth-btn github-btn">
          <!-- GitHub SVG icon -->
          <span>Continue with GitHub</span>
        </button>
      </div>

      <p class="terms">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  </div>

  <script type="module" src="src/auth/loginUI.js"></script>
</body>
</html>
```

---

## File 2: `src/auth/authClient.js`

### Purpose
Better Auth client wrapper with configuration

### Exports

#### `authClient` (BetterAuthClient)

```javascript
/**
 * Better Auth Client Wrapper
 * @module auth/authClient
 */

import { createAuthClient } from "https://esm.sh/@better-auth/client@1.0.0";

/**
 * Configured Better Auth Client
 * @type {BetterAuthClient}
 */
export const authClient = createAuthClient({
  baseURL: "https://router.artorizer.com",  // From config
  credentials: "include"  // Send cookies
});
```

---

## File 3: `src/auth/authManager.js`

### Purpose
High-level authentication operations

### Class: `AuthManager`

```javascript
/**
 * Authentication Manager
 * High-level API for authentication operations
 *
 * @class AuthManager
 */
export class AuthManager {
  constructor() {
    this.client = authClient;
    this.session = null;
    this.user = null;
  }

  /**
   * Sign in with Google
   * @async
   * @param {string} callbackURL - URL to redirect after auth
   * @returns {Promise<void>}
   */
  async signInWithGoogle(callbackURL = "/dashboard/dashboard-v2.html") {
    await this.client.signIn.social({
      provider: "google",
      callbackURL
    });
  }

  /**
   * Sign in with GitHub
   * @async
   * @param {string} callbackURL - URL to redirect after auth
   * @returns {Promise<void>}
   */
  async signInWithGitHub(callbackURL = "/dashboard/dashboard-v2.html") {
    await this.client.signIn.social({
      provider: "github",
      callbackURL
    });
  }

  /**
   * Get current session
   * @async
   * @returns {Promise<{user: User, session: Session} | null>}
   */
  async getSession() {
    try {
      const data = await this.client.getSession();
      this.session = data?.session || null;
      this.user = data?.user || null;
      return data;
    } catch (error) {
      console.error("Failed to get session:", error);
      return null;
    }
  }

  /**
   * Sign out current user
   * @async
   * @returns {Promise<void>}
   */
  async signOut() {
    await this.client.signOut();
    this.session = null;
    this.user = null;
    window.location.href = "/login.html";
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.user;
  }
}
```

---

## File 4: `src/auth/loginUI.js`

### Purpose
Login page event handlers

```javascript
/**
 * Login Page UI Handlers
 * @module auth/loginUI
 */

import { AuthManager } from './authManager.js';

const auth = new AuthManager();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Google login button
  const googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleLogin);
  }

  // GitHub login button
  const githubBtn = document.getElementById('github-login');
  if (githubBtn) {
    githubBtn.addEventListener('click', handleGitHubLogin);
  }

  // Check if already authenticated
  checkExistingSession();
});

/**
 * Handle Google login button click
 * @async
 */
async function handleGoogleLogin() {
  try {
    setLoading(true, 'google-login');
    await auth.signInWithGoogle();
  } catch (error) {
    console.error('Google login failed:', error);
    showError('Failed to sign in with Google');
    setLoading(false, 'google-login');
  }
}

/**
 * Handle GitHub login button click
 * @async
 */
async function handleGitHubLogin() {
  try {
    setLoading(true, 'github-login');
    await auth.signInWithGitHub();
  } catch (error) {
    console.error('GitHub login failed:', error);
    showError('Failed to sign in with GitHub');
    setLoading(false, 'github-login');
  }
}

/**
 * Check for existing session and redirect if authenticated
 * @async
 */
async function checkExistingSession() {
  const session = await auth.getSession();
  if (session) {
    // Already logged in, redirect to dashboard
    window.location.href = '/dashboard/dashboard-v2.html';
  }
}

/**
 * Set button loading state
 * @param {boolean} loading - Loading state
 * @param {string} buttonId - Button element ID
 */
function setLoading(loading, buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.disabled = loading;
    button.classList.toggle('loading', loading);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  // Implement error display (toast, alert, etc.)
  alert(message);  // Simple implementation
}
```

---

## File 5: `src/auth/userProfile.js`

### Purpose
User profile component for dashboard

### Functions

#### `displayUserProfile(user, containerId)`

Renders user profile in dashboard

```javascript
/**
 * User Profile Component
 * @module auth/userProfile
 */

/**
 * Display user profile in container
 * @param {User} user - User object from session
 * @param {string} containerId - Container element ID
 */
export function displayUserProfile(user, containerId = 'user-profile') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="user-profile">
      <img src="${user.image || '/assets/default-avatar.png'}"
           alt="${user.name}"
           class="user-avatar">
      <div class="user-info">
        <div class="user-name">${user.name || 'User'}</div>
        <div class="user-email">${user.email}</div>
      </div>
      <button id="logout-btn" class="logout-btn">
        Sign Out
      </button>
    </div>
  `;

  // Add logout handler
  document.getElementById('logout-btn')
    ?.addEventListener('click', handleLogout);
}

/**
 * Handle logout button click
 * @async
 */
async function handleLogout() {
  const auth = new AuthManager();
  await auth.signOut();
}

/**
 * Create dropdown menu for user profile
 * @param {User} user - User object
 * @returns {string} HTML for dropdown
 */
export function createProfileDropdown(user) {
  return `
    <div class="profile-dropdown">
      <button class="profile-trigger">
        <img src="${user.image}" alt="${user.name}">
        <span>${user.name}</span>
      </button>
      <div class="dropdown-menu">
        <a href="/profile">Profile</a>
        <a href="/settings">Settings</a>
        <hr>
        <button id="logout-dropdown">Sign Out</button>
      </div>
    </div>
  `;
}
```

---

## File 6: `src/utils/authGuard.js`

### Purpose
Protect routes, redirect if not authenticated

### Functions

#### `requireAuth()`

Ensures user is authenticated before accessing page

```javascript
/**
 * Authentication Route Guard
 * @module utils/authGuard
 */

import { AuthManager } from '../auth/authManager.js';

/**
 * Require authentication for current page
 * Redirects to login if not authenticated
 *
 * @async
 * @returns {Promise<User|null>} User object if authenticated, redirects otherwise
 *
 * @example
 * // In dashboard-v2.js
 * import { requireAuth } from '../src/utils/authGuard.js';
 *
 * const user = await requireAuth();
 * if (user) {
 *   initDashboard(user);
 * }
 */
export async function requireAuth() {
  const auth = new AuthManager();
  const session = await auth.getSession();

  if (!session || !session.user) {
    // Save intended destination
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);

    // Redirect to login
    window.location.href = '/login.html';
    return null;
  }

  return session.user;
}

/**
 * Check auth status without redirecting
 * @async
 * @returns {Promise<boolean>} True if authenticated
 */
export async function checkAuth() {
  const auth = new AuthManager();
  const session = await auth.getSession();
  return !!session?.user;
}

/**
 * Redirect after successful login
 * Uses saved redirect URL or defaults to dashboard
 */
export function redirectAfterLogin() {
  const redirect = sessionStorage.getItem('redirectAfterLogin');
  sessionStorage.removeItem('redirectAfterLogin');

  window.location.href = redirect || '/dashboard/dashboard-v2.html';
}
```

---

## File 7: `src/auth/sessionManager.js`

### Purpose
Manage session state across the application

```javascript
/**
 * Session Manager
 * Manages session state and provides reactive updates
 *
 * @module auth/sessionManager
 */

import { AuthManager } from './authManager.js';

class SessionManager {
  constructor() {
    this.auth = new AuthManager();
    this.session = null;
    this.listeners = [];
  }

  /**
   * Initialize session
   * Restores session from cookies
   * @async
   */
  async initialize() {
    this.session = await this.auth.getSession();
    this.notifyListeners();
    return this.session;
  }

  /**
   * Get current user
   * @returns {User|null}
   */
  getUser() {
    return this.session?.user || null;
  }

  /**
   * Check if authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.session?.user;
  }

  /**
   * Subscribe to session changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of session change
   * @private
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.session);
    });
  }

  /**
   * Refresh session
   * @async
   */
  async refresh() {
    this.session = await this.auth.getSession();
    this.notifyListeners();
  }

  /**
   * Clear session
   */
  clear() {
    this.session = null;
    this.notifyListeners();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
```

---

## Usage Examples

### In `dashboard-v2.js`:

```javascript
import { requireAuth } from '../src/utils/authGuard.js';
import { displayUserProfile } from '../src/auth/userProfile.js';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication
  const user = await requireAuth();

  if (user) {
    // Display user profile
    displayUserProfile(user, 'user-profile-container');

    // Initialize dashboard with user context
    initDashboard(user);
  }
});
```

### In `index.html` (Landing page):

```javascript
import { checkAuth } from './src/utils/authGuard.js';

document.getElementById('explore-button').addEventListener('click', async () => {
  const isAuth = await checkAuth();

  if (isAuth) {
    window.location.href = '/dashboard/dashboard-v2.html';
  } else {
    window.location.href = '/login.html';
  }
});
```

---

## CSS Styling Requirements

### Login Page Styles
- Centered login card
- OAuth buttons with provider colors
- Hover/focus states
- Loading states
- Responsive design

### User Profile Styles
- Avatar (circular, 40x40px)
- Dropdown menu
- Logout button
- Mobile-friendly

See dashboard-v2.css for existing patterns.

---

## Implementation Checklist

- [ ] Create `login.html`
- [ ] Create `src/auth/authClient.js`
- [ ] Create `src/auth/authManager.js`
- [ ] Create `src/auth/loginUI.js`
- [ ] Create `src/auth/userProfile.js`
- [ ] Create `src/auth/sessionManager.js`
- [ ] Create `src/utils/authGuard.js`
- [ ] Update `dashboard-v2.html` with user profile container
- [ ] Update `dashboard-v2.js` with auth guard
- [ ] Add CSS for login and profile components
- [ ] Test OAuth flows
- [ ] Test route protection
