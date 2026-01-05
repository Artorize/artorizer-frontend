/**
 * Mock Authentication Backend
 *
 * Simulates a Better Auth backend for frontend development and testing.
 * Allows full frontend development without a real backend.
 */

/**
 * Mock user data
 */
export const MOCK_USERS = {
  google: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test.google@example.com',
    name: 'Test User (Google)',
    image: 'https://via.placeholder.com/150/667eea/ffffff?text=G',
    emailVerified: true,
    createdAt: '2025-01-15T10:30:00Z'
  },
  github: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test.github@example.com',
    name: 'Test User (GitHub)',
    image: 'https://via.placeholder.com/150/24292e/ffffff?text=GH',
    emailVerified: true,
    createdAt: '2025-01-15T10:30:00Z'
  }
};

/**
 * Mock Authentication Backend Class
 */
export class MockAuthBackend {
  constructor() {
    this.currentUser = null;
    this.sessionToken = null;
    this.isInitialized = false;

    // Restore session from storage on init
    this.restoreSession();
  }

  /**
   * Restore session from sessionStorage
   */
  restoreSession() {
    try {
      const storedSession = sessionStorage.getItem('mock-auth-session');
      if (storedSession) {
        const session = JSON.parse(storedSession);

        // Check if session is expired
        if (new Date(session.expiresAt) > new Date()) {
          this.currentUser = session.user;
          this.sessionToken = session.token;
          this.isInitialized = true;
          console.log('[Mock Auth] Session restored:', this.currentUser.email);
        } else {
          console.log('[Mock Auth] Session expired');
          sessionStorage.removeItem('mock-auth-session');
        }
      }
    } catch (error) {
      console.error('[Mock Auth] Failed to restore session:', error);
    }
  }

  /**
   * Simulate OAuth sign-in
   * @param {string} provider - 'google' or 'github'
   */
  signIn = {
    social: async ({ provider, callbackURL }) => {
      console.log(`[Mock Auth] Sign-in initiated for ${provider}`);

      // Simulate OAuth redirect delay
      await this.delay(500);

      // Set mock user based on provider
      const user = MOCK_USERS[provider];
      if (!user) {
        throw new Error(`Unknown provider: ${provider}`);
      }

      this.currentUser = user;
      this.sessionToken = `mock-token-${provider}-${Date.now()}`;

      // Store session
      const session = {
        user: this.currentUser,
        token: this.sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      sessionStorage.setItem('mock-auth-session', JSON.stringify(session));

      console.log(`[Mock Auth] Signed in as: ${this.currentUser.name}`);

      // Simulate OAuth callback redirect
      // In real auth, this would be handled by the OAuth provider
      const redirectUrl = callbackURL || '/dashboard/dashboard-modular.html';
      await this.delay(300);

      // Simulate callback with code parameter
      window.location.href = `/login.html?code=mock-code-${Date.now()}&state=mock-state`;
    }
  };

  /**
   * Get current session
   * @returns {Promise<Object|null>}
   */
  async getSession() {
    await this.delay(100); // Simulate network delay

    const storedSession = sessionStorage.getItem('mock-auth-session');
    if (!storedSession) {
      console.log('[Mock Auth] No session found');
      return null;
    }

    try {
      const session = JSON.parse(storedSession);

      // Check if expired
      if (new Date(session.expiresAt) < new Date()) {
        console.log('[Mock Auth] Session expired');
        sessionStorage.removeItem('mock-auth-session');
        this.currentUser = null;
        this.sessionToken = null;
        return null;
      }

      console.log('[Mock Auth] Session retrieved:', session.user.email);

      return {
        user: session.user,
        session: {
          token: session.token,
          expiresAt: session.expiresAt
        }
      };
    } catch (error) {
      console.error('[Mock Auth] Failed to parse session:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>}
   */
  async signOut(options = {}) {
    await this.delay(100);

    console.log('[Mock Auth] Signing out');

    this.currentUser = null;
    this.sessionToken = null;
    sessionStorage.removeItem('mock-auth-session');

    if (options.fetchOptions?.onSuccess) {
      options.fetchOptions.onSuccess();
    }

    return { success: true };
  }

  /**
   * Simulate network delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const mockAuth = new MockAuthBackend();

/**
 * Enable mock authentication mode
 */
export function enableMockAuth() {
  window.__MOCK_AUTH_ENABLED__ = true;
  console.log('[Mock Auth] Mock authentication enabled');
}

/**
 * Disable mock authentication mode
 */
export function disableMockAuth() {
  window.__MOCK_AUTH_ENABLED__ = false;
  console.log('[Mock Auth] Mock authentication disabled');
}

/**
 * Check if mock auth is enabled
 * @returns {boolean}
 */
export function isMockAuthEnabled() {
  return window.__MOCK_AUTH_ENABLED__ === true;
}

/**
 * Auto-enable mock auth in development
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('[Mock Auth] Development environment detected');
  console.log('[Mock Auth] To enable mock auth, call: enableMockAuth()');
  console.log('[Mock Auth] Available mock users:', Object.keys(MOCK_USERS));
}
