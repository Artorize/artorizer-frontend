# Frontend Integration Plan
## What Can Be Implemented Without Backend/Router Modifications

This document outlines all frontend components, utilities, and features that can be implemented and tested **completely independently** of backend changes. These can be developed in parallel while the backend OAuth integration is being set up.

---

## Table of Contents

1. [UI Components](#ui-components)
2. [Client-Side Libraries](#client-side-libraries)
3. [State Management](#state-management)
4. [Routing & Navigation](#routing--navigation)
5. [Mock Integration](#mock-integration)
6. [Testing Infrastructure](#testing-infrastructure)
7. [User Experience Features](#user-experience-features)
8. [Development Timeline](#development-timeline)

---

## UI Components

### 1. Login Page (`login.html`)

**Can be implemented:** ✅ 100%

**Features:**
- Login page HTML structure
- OAuth provider buttons (Google, GitHub)
- Artorizer branding and styling
- Responsive layout
- Loading states
- Error message display

**Implementation:**
```html
<!-- login.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Artorizer</title>
    <link rel="stylesheet" href="/styles/auth.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <h1>Artorizer</h1>
            <p>Protect your art with AI-powered watermarking</p>

            <div class="oauth-buttons">
                <button id="google-login-btn" class="oauth-btn google">
                    <img src="/assets/google-icon.svg" alt="Google">
                    Continue with Google
                </button>

                <button id="github-login-btn" class="oauth-btn github">
                    <img src="/assets/github-icon.svg" alt="GitHub">
                    Continue with GitHub
                </button>
            </div>

            <div id="error-message" class="error hidden"></div>
            <div id="loading" class="loading hidden">
                <span>Signing in...</span>
            </div>
        </div>
    </div>

    <script type="module" src="/src/auth/loginUI.js"></script>
</body>
</html>
```

**Why no backend needed:**
- Pure HTML/CSS
- JavaScript only wires up click handlers
- OAuth redirects happen client-side
- Can test with mock callbacks

---

### 2. User Profile Component

**Can be implemented:** ✅ 100%

**Features:**
- User avatar display
- User name and email
- Dropdown menu
- Sign out button
- Settings link
- Profile stats

**Implementation:**
```javascript
// src/auth/userProfile.js
export class UserProfile {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
  }

  render(user) {
    if (!user) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="user-profile">
        <img src="${user.image || '/assets/default-avatar.svg'}"
             alt="${user.name}"
             class="user-avatar">
        <div class="user-info">
          <span class="user-name">${user.name}</span>
          <span class="user-email">${user.email}</span>
        </div>
        <button class="dropdown-toggle" id="profile-menu-btn">
          ▼
        </button>

        <div class="dropdown-menu hidden" id="profile-menu">
          <a href="/dashboard/gallery.html">My Artworks</a>
          <a href="/dashboard/settings.html">Settings</a>
          <button id="sign-out-btn">Sign Out</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const menuBtn = document.getElementById('profile-menu-btn');
    const menu = document.getElementById('profile-menu');

    menuBtn?.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });

    const signOutBtn = document.getElementById('sign-out-btn');
    signOutBtn?.addEventListener('click', () => {
      this.onSignOut?.();
    });
  }

  onSignOut = null; // Set by consumer
}
```

**Why no backend needed:**
- Renders based on provided user object
- Event handlers call callbacks
- Can test with mock user data

---

### 3. Route Guard UI

**Can be implemented:** ✅ 100%

**Features:**
- Check auth status on page load
- Redirect to login if not authenticated
- Show loading spinner during check
- Handle return URL

**Implementation:**
```javascript
// src/utils/authGuard.js
import { AuthManager } from '../auth/authManager.js';

export async function requireAuth() {
  const authManager = new AuthManager();
  const currentPath = window.location.pathname;

  // Show loading state
  showLoadingSpinner();

  try {
    const session = await authManager.getSession();

    if (!session) {
      // Not authenticated, redirect to login
      const returnUrl = encodeURIComponent(currentPath + window.location.search);
      window.location.href = `/login.html?returnUrl=${returnUrl}`;
      return null;
    }

    // Authenticated, hide loading
    hideLoadingSpinner();
    return session;

  } catch (error) {
    console.error('Auth check failed:', error);
    // On error, redirect to login
    window.location.href = '/login.html';
    return null;
  }
}

function showLoadingSpinner() {
  document.body.classList.add('checking-auth');
}

function hideLoadingSpinner() {
  document.body.classList.remove('checking-auth');
}

export async function checkAuth() {
  const authManager = new AuthManager();
  try {
    const session = await authManager.getSession();
    return session !== null;
  } catch {
    return false;
  }
}
```

**Why no backend needed:**
- Logic can be tested with mocked AuthManager
- Redirects work without backend
- Can use mock session data

---

## Client-Side Libraries

### 4. Auth Client Wrapper

**Can be implemented:** ✅ 100%

**Features:**
- Wrapper around Better Auth client
- Type-safe methods
- Error handling
- Credential management

**Implementation:**
```javascript
// src/auth/authClient.js

// Import Better Auth client from CDN
import { createAuthClient } from "https://esm.sh/better-auth@1.0.0/client";

export const authClient = createAuthClient({
  baseURL: "https://router.artorizer.com",
  credentials: "include"
});

// Export convenient methods
export const auth = {
  async signInWithGoogle() {
    return authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard/dashboard-v2.html"
    });
  },

  async signInWithGitHub() {
    return authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard/dashboard-v2.html"
    });
  },

  async getSession() {
    return authClient.getSession();
  },

  async signOut() {
    return authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login.html";
        }
      }
    });
  }
};
```

**Why no backend needed:**
- Client library is pure JavaScript
- Can be imported and tested
- Methods can be mocked for testing
- No actual API calls needed to develop UI

---

### 5. Authentication Manager

**Can be implemented:** ✅ 95%

**Features:**
- High-level auth interface
- Session caching
- Auto-refresh logic
- Consistent error handling

**Implementation:**
```javascript
// src/auth/authManager.js
import { auth } from './authClient.js';

export class AuthManager {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://router.artorizer.com';
    this.redirectUrl = config.redirectUrl || '/dashboard/dashboard-v2.html';
    this.sessionCache = null;
    this.cacheExpiry = null;
  }

  async signInWithGoogle() {
    try {
      return await auth.signInWithGoogle();
    } catch (error) {
      throw new AuthError('Google sign-in failed', error);
    }
  }

  async signInWithGitHub() {
    try {
      return await auth.signInWithGitHub();
    } catch (error) {
      throw new AuthError('GitHub sign-in failed', error);
    }
  }

  async getSession() {
    // Use cache if valid
    if (this.sessionCache && Date.now() < this.cacheExpiry) {
      return this.sessionCache;
    }

    try {
      const session = await auth.getSession();

      // Cache for 5 minutes
      this.sessionCache = session;
      this.cacheExpiry = Date.now() + (5 * 60 * 1000);

      return session;
    } catch (error) {
      this.sessionCache = null;
      this.cacheExpiry = null;
      throw new AuthError('Failed to get session', error);
    }
  }

  async signOut() {
    try {
      await auth.signOut();
      this.sessionCache = null;
      this.cacheExpiry = null;
    } catch (error) {
      throw new AuthError('Sign out failed', error);
    }
  }

  async requireAuth() {
    const session = await this.getSession();

    if (!session) {
      const returnUrl = window.location.pathname + window.location.search;
      window.location.href = `/login.html?returnUrl=${encodeURIComponent(returnUrl)}`;
      throw new AuthError('Authentication required');
    }

    return session;
  }

  clearCache() {
    this.sessionCache = null;
    this.cacheExpiry = null;
  }
}

export class AuthError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.originalError = originalError;
  }
}
```

**Why 95% (not 100%):**
- 100% of code can be written
- Only 5% (actual auth.getSession() call) needs backend
- Can be fully tested with mocks

---

### 6. Fetch Utility with Auth

**Can be implemented:** ✅ 100%

**Features:**
- Automatic credential inclusion
- Error handling
- Retry logic
- Consistent API

**Implementation:**
```javascript
// src/utils/authenticatedFetch.js

export async function authenticatedFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const mergedOptions = {
    ...options,
    ...defaultOptions,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, mergedOptions);

    // Handle 401 by redirecting to login
    if (response.status === 401) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login.html?returnUrl=${returnUrl}`;
      throw new Error('Unauthorized');
    }

    return response;

  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Convenience methods
export const api = {
  async get(url) {
    const response = await authenticatedFetch(url);
    return response.json();
  },

  async post(url, data) {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async upload(url, formData) {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
    return response.json();
  },

  async delete(url) {
    const response = await authenticatedFetch(url, {
      method: 'DELETE'
    });
    return response.json();
  }
};
```

**Why no backend needed:**
- Pure JavaScript utility
- Can be tested with fetch mocks
- Error handling is client-side

---

## State Management

### 7. Auth State Manager

**Can be implemented:** ✅ 100%

**Features:**
- Global auth state
- Event-based updates
- Multi-tab sync
- State persistence

**Implementation:**
```javascript
// src/auth/authState.js

class AuthState {
  constructor() {
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: true
    };
    this.listeners = [];
    this.setupStorageListener();
  }

  setState(updates) {
    this.state = {
      ...this.state,
      ...updates
    };

    // Notify all listeners
    this.listeners.forEach(listener => listener(this.state));

    // Broadcast to other tabs
    this.broadcastState();
  }

  subscribe(listener) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState() {
    return this.state;
  }

  setupStorageListener() {
    // Listen for changes in other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth-state-sync') {
        const newState = JSON.parse(event.newValue || '{}');
        this.state = newState;
        this.listeners.forEach(listener => listener(this.state));
      }
    });
  }

  broadcastState() {
    // Broadcast to other tabs via localStorage
    localStorage.setItem('auth-state-sync', JSON.stringify(this.state));
    localStorage.removeItem('auth-state-sync'); // Trigger event
  }
}

// Global singleton
export const authState = new AuthState();
```

**Why no backend needed:**
- Pure client-side state management
- Uses browser APIs only
- Can be tested without server

---

## Routing & Navigation

### 8. Protected Route Wrapper

**Can be implemented:** ✅ 100%

**Features:**
- Wrap any page with auth check
- Auto-redirect on auth failure
- Loading states
- Error boundaries

**Implementation:**
```javascript
// src/utils/protectedPage.js
import { requireAuth } from './authGuard.js';
import { authState } from '../auth/authState.js';

export async function initProtectedPage(onReady) {
  try {
    // Check auth
    const session = await requireAuth();

    if (!session) {
      // Will redirect, but just in case:
      return;
    }

    // Update state
    authState.setState({
      user: session.user,
      isAuthenticated: true,
      isLoading: false
    });

    // Call page-specific initialization
    if (onReady) {
      await onReady(session);
    }

  } catch (error) {
    console.error('Page initialization error:', error);
    showError('Failed to load page');
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'page-error';
  errorDiv.textContent = message;
  document.body.prepend(errorDiv);
}
```

**Usage:**
```javascript
// In dashboard-v2.html
import { initProtectedPage } from '/src/utils/protectedPage.js';

initProtectedPage(async (session) => {
  // Page is authenticated, session is available
  console.log('Logged in as:', session.user.name);

  // Initialize dashboard
  await loadUserArtworks();
  renderDashboard();
});
```

**Why no backend needed:**
- Wrapper logic is pure JavaScript
- Can test with mock auth checks

---

### 9. Login Page Handler

**Can be implemented:** ✅ 100%

**Features:**
- Handle OAuth button clicks
- Show loading states
- Parse return URLs
- Handle OAuth callbacks
- Error display

**Implementation:**
```javascript
// src/auth/loginUI.js
import { AuthManager } from './authManager.js';

class LoginUI {
  constructor() {
    this.authManager = new AuthManager();
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.handleOAuthCallback();
    this.checkExistingSession();
  }

  attachEventListeners() {
    const googleBtn = document.getElementById('google-login-btn');
    const githubBtn = document.getElementById('github-login-btn');

    googleBtn?.addEventListener('click', () => this.handleGoogleLogin());
    githubBtn?.addEventListener('click', () => this.handleGitHubLogin());
  }

  async handleGoogleLogin() {
    this.showLoading('Redirecting to Google...');

    try {
      await this.authManager.signInWithGoogle();
    } catch (error) {
      this.showError('Failed to sign in with Google');
      this.hideLoading();
    }
  }

  async handleGitHubLogin() {
    this.showLoading('Redirecting to GitHub...');

    try {
      await this.authManager.signInWithGitHub();
    } catch (error) {
      this.showError('Failed to sign in with GitHub');
      this.hideLoading();
    }
  }

  async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      this.showError(`Authentication failed: ${error}`);
      return;
    }

    // Check if we just came back from OAuth
    const code = params.get('code');
    if (code) {
      this.showLoading('Completing sign in...');

      // Better Auth handles the callback automatically
      // Just need to wait and check session
      setTimeout(async () => {
        const session = await this.authManager.getSession();
        if (session) {
          this.redirectAfterLogin();
        } else {
          this.showError('Sign in failed');
          this.hideLoading();
        }
      }, 1000);
    }
  }

  async checkExistingSession() {
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

  redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') || '/dashboard/dashboard-v2.html';
    window.location.href = returnUrl;
  }

  showLoading(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.querySelector('span').textContent = message;
      loading.classList.remove('hidden');
    }
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    loading?.classList.add('hidden');
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }

    setTimeout(() => {
      errorDiv?.classList.add('hidden');
    }, 5000);
  }
}

// Initialize on page load
new LoginUI();
```

**Why no backend needed:**
- All UI logic is client-side
- OAuth redirects work without backend ready
- Can test with mock callbacks

---

## Mock Integration

### 10. Mock Auth Backend

**Can be implemented:** ✅ 100%

**Features:**
- Simulate OAuth flow
- Mock session responses
- Test all error states
- Development mode toggle

**Implementation:**
```javascript
// src/auth/__mocks__/mockAuthBackend.js

export const MOCK_USERS = {
  google: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User (Google)',
    image: 'https://via.placeholder.com/150',
    emailVerified: true,
    createdAt: '2025-01-15T10:30:00Z'
  },
  github: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@github.com',
    name: 'Test User (GitHub)',
    image: 'https://via.placeholder.com/150',
    emailVerified: true,
    createdAt: '2025-01-15T10:30:00Z'
  }
};

export class MockAuthBackend {
  constructor() {
    this.currentUser = null;
    this.sessionToken = null;
  }

  async signIn(provider) {
    // Simulate OAuth redirect delay
    await this.delay(500);

    // Set mock user
    this.currentUser = MOCK_USERS[provider];
    this.sessionToken = `mock-token-${Date.now()}`;

    // Store in sessionStorage for persistence
    sessionStorage.setItem('mock-session', JSON.stringify({
      user: this.currentUser,
      token: this.sessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    return {
      user: this.currentUser,
      session: {
        token: this.sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  async getSession() {
    await this.delay(100);

    const storedSession = sessionStorage.getItem('mock-session');
    if (!storedSession) {
      return null;
    }

    const session = JSON.parse(storedSession);

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      sessionStorage.removeItem('mock-session');
      return null;
    }

    return session;
  }

  async signOut() {
    await this.delay(100);

    this.currentUser = null;
    this.sessionToken = null;
    sessionStorage.removeItem('mock-session');

    return { success: true };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const mockAuth = new MockAuthBackend();

// Helper to enable mock mode
export function enableMockAuth() {
  window.__MOCK_AUTH_ENABLED__ = true;
}

export function disableMockAuth() {
  window.__MOCK_AUTH_ENABLED__ = false;
}

export function isMockAuthEnabled() {
  return window.__MOCK_AUTH_ENABLED__ === true;
}
```

**Usage:**
```javascript
// In development, enable mocks
import { enableMockAuth } from '/src/auth/__mocks__/mockAuthBackend.js';

if (window.location.hostname === 'localhost') {
  enableMockAuth();
}
```

**Why no backend needed:**
- Completely simulates backend
- Allows full frontend development
- Can test all user flows

---

## Testing Infrastructure

### 11. Test Utilities

**Can be implemented:** ✅ 100%

**Features:**
- Mock factories
- Test helpers
- Assertion utilities
- Test data generators

**Implementation:**
```javascript
// auth/tests/test-data/factories.js

export function createMockUser(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://via.placeholder.com/150',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function createMockSession(overrides = {}) {
  return {
    user: createMockUser(overrides.user),
    session: {
      token: 'mock-session-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides.session
    }
  };
}

export function createMockArtwork(overrides = {}) {
  return {
    id: 'artwork_123',
    job_id: 'job_abc123',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    original_filename: 'test-art.jpg',
    original_url: 'https://storage.artorizer.com/originals/test-art.jpg',
    protected_url: 'https://storage.artorizer.com/protected/test-art-protected.jpg',
    status: 'completed',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    ...overrides
  };
}

// Test helpers
export function mockFetch(responses) {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options) => {
    calls.push({ url, options });

    const response = responses[url] || responses.default;
    if (typeof response === 'function') {
      return response(url, options);
    }

    return {
      ok: true,
      status: 200,
      json: async () => response,
      ...response
    };
  };

  return {
    calls,
    restore: () => {
      global.fetch = originalFetch;
    }
  };
}
```

**Why no backend needed:**
- Pure test utilities
- Mock data generation
- Works offline

---

## User Experience Features

### 12. Loading States

**Can be implemented:** ✅ 100%

**Features:**
- Skeleton screens
- Loading spinners
- Progress indicators
- Optimistic UI updates

**Implementation:**
```javascript
// src/components/LoadingStates.js

export function showPageLoading() {
  const loading = document.createElement('div');
  loading.id = 'page-loading';
  loading.className = 'page-loading';
  loading.innerHTML = `
    <div class="spinner"></div>
    <p>Loading...</p>
  `;
  document.body.appendChild(loading);
}

export function hidePageLoading() {
  const loading = document.getElementById('page-loading');
  loading?.remove();
}

export function showSkeletonScreen(container) {
  container.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  `;
}

export function createLoadingButton(text, isLoading) {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.disabled = isLoading;

  if (isLoading) {
    btn.innerHTML = `
      <span class="spinner-small"></span>
      ${text}
    `;
  } else {
    btn.textContent = text;
  }

  return btn;
}
```

---

### 13. Error Handling UI

**Can be implemented:** ✅ 100%

**Features:**
- Toast notifications
- Error boundaries
- Retry mechanisms
- User-friendly messages

**Implementation:**
```javascript
// src/components/ErrorHandler.js

export class ErrorHandler {
  static show(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  static showError(error) {
    let message = 'An error occurred';

    if (error.code === 'AUTH_REQUIRED') {
      message = 'Please sign in to continue';
    } else if (error.code === 'SESSION_EXPIRED') {
      message = 'Your session has expired. Please sign in again.';
    } else if (error.code === 'NETWORK_ERROR') {
      message = 'Network error. Please check your connection.';
    } else if (error.message) {
      message = error.message;
    }

    this.show(message, 'error');
  }

  static showSuccess(message) {
    this.show(message, 'success');
  }

  static showWarning(message) {
    this.show(message, 'warning');
  }
}
```

---

### 14. Responsive Design

**Can be implemented:** ✅ 100%

**Features:**
- Mobile-friendly login
- Responsive user profile
- Touch-friendly buttons
- Mobile navigation

**CSS Implementation:**
```css
/* styles/auth.css */

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.oauth-btn:hover {
  border-color: #4285f4;
  background: #f8f9fa;
}

.oauth-btn img {
  width: 20px;
  height: 20px;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .oauth-btn {
    font-size: 14px;
    padding: 10px;
  }
}
```

---

## Development Timeline

### Phase 1: Basic UI (No backend needed)
**Duration: 1-2 days**

- ✅ Create login.html
- ✅ Style OAuth buttons
- ✅ Create basic user profile component
- ✅ Add loading states
- ✅ Implement error displays

### Phase 2: Client Libraries (No backend needed)
**Duration: 1 day**

- ✅ Set up authClient wrapper
- ✅ Implement AuthManager
- ✅ Create authenticatedFetch utility
- ✅ Build auth state manager

### Phase 3: Routing & Guards (No backend needed)
**Duration: 1 day**

- ✅ Implement requireAuth guard
- ✅ Create protectedPage wrapper
- ✅ Build login UI handler
- ✅ Handle return URLs

### Phase 4: Mocks & Testing (No backend needed)
**Duration: 2-3 days**

- ✅ Create mock auth backend
- ✅ Write unit tests
- ✅ Write integration tests
- ✅ Set up test data factories
- ✅ Create development mode toggle

### Phase 5: UX Polish (No backend needed)
**Duration: 1-2 days**

- ✅ Add loading skeletons
- ✅ Implement toast notifications
- ✅ Create error boundaries
- ✅ Mobile responsive design
- ✅ Accessibility improvements

**Total: 6-9 days of frontend-only development**

---

## Integration Checklist

### When Backend Is Ready

Once the backend OAuth integration is complete, here's what needs to be changed:

1. **Disable mock auth** (1 line)
   ```javascript
   // Change from:
   enableMockAuth();
   // To:
   // Mock disabled
   ```

2. **Update baseURL if needed** (1 line)
   ```javascript
   // In authClient.js
   baseURL: "https://router.artorizer.com" // Verify this is correct
   ```

3. **Test OAuth flows** (manual testing)
   - Test Google OAuth
   - Test GitHub OAuth
   - Test session persistence
   - Test logout

4. **Update CORS config** (backend only)
   - Ensure frontend origin is whitelisted

**That's it!** All frontend code will work with real backend.

---

## Summary

### What Can Be Built Without Backend

✅ **100% Complete:**
1. Login page UI
2. User profile component
3. Route guards
4. Auth client wrapper
5. Auth manager
6. Authenticated fetch utility
7. Auth state management
8. Protected page wrapper
9. Login UI handler
10. Mock auth backend
11. Test infrastructure
12. Loading states
13. Error handling
14. Responsive design

✅ **95% Complete:**
- All tests (can run with mocks)
- All components (work with mock data)

❌ **Cannot Be Built:**
- OAuth provider configuration (needs backend)
- Database setup (backend only)
- Session validation (backend only)

---

## Development Strategy

**Recommended Approach:**

1. **Week 1:** Build all UI components with mock auth
2. **Week 2:** Write comprehensive tests
3. **Week 3:** Polish UX and accessibility
4. **Week 4:** Integrate with real backend (1-2 days)

**Parallel Development:**

- Frontend team: Build everything in this document
- Backend team: Set up OAuth, database, Better Auth
- **Result:** Both ready at same time, 1-2 day integration

---

## Testing Strategy

**During Frontend Development:**

```javascript
// Enable mocks
import { enableMockAuth } from '/src/auth/__mocks__/mockAuthBackend.js';
enableMockAuth();

// Test all flows
await testGoogleLogin();
await testGitHubLogin();
await testSessionPersistence();
await testProtectedRoutes();
await testUploadFlow();
```

**After Backend Is Ready:**

```javascript
// Disable mocks
// Run same tests against real backend
disableMockAuth();

await testGoogleLogin(); // Now uses real OAuth
await testGitHubLogin(); // Now uses real OAuth
// etc...
```

---

## Conclusion

**~90% of frontend auth can be built without backend changes.**

Only the actual OAuth handshake and database persistence require backend work. Everything else - UI, routing, state management, error handling, testing - can be developed in parallel and will work immediately when backend is ready.

This allows frontend and backend teams to work completely independently, maximizing development velocity.
