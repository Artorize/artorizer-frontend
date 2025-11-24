/**
 * Auth Client for Artorizer
 *
 * Provides authentication methods matching the Better Auth backend API.
 * Endpoints documented in auth/auth.md
 */

// Base URL for the API router
const API_BASE_URL = 'http://localhost:7000';

let authClientInstance = null;

/**
 * Initialize auth client
 */
export async function initAuthClient(config = {}) {
  const baseURL = config.baseURL || API_BASE_URL;

  // Check if we're in mock mode
  if (window.__MOCK_AUTH_ENABLED__) {
    const { mockAuth } = await import('./__mocks__/mockAuthBackend.js');
    authClientInstance = mockAuth;
    return authClientInstance;
  }

  authClientInstance = createAuthClient(baseURL);
  return authClientInstance;
}

/**
 * Create auth client with API methods
 */
function createAuthClient(baseURL) {
  return {
    baseURL,

    /**
     * OAuth sign in - redirects to OAuth provider
     */
    signIn: {
      social({ provider }) {
        // Redirect to OAuth start endpoint
        window.location.href = `${baseURL}/auth/oauth/${provider}/start`;
      }
    },

    /**
     * Email/password login
     */
    async login(emailOrUsername, password) {
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailOrUsername, password })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error.error || error.message || 'Login failed');
      }

      return response.json();
    },

    /**
     * Register new user
     */
    async register(email, username, password, name = null) {
      const body = { email, username, password };
      if (name) body.name = name;

      const response = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(error.error || error.message || 'Registration failed');
      }

      return response.json();
    },

    /**
     * Check email/username availability
     */
    async checkAvailability(email = null, username = null) {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (username) params.append('username', username);

      const response = await fetch(`${baseURL}/auth/check-availability?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      return response.json();
    },

    /**
     * Get current session
     */
    async getSession() {
      try {
        const response = await fetch(`${baseURL}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) {
          return null;
        }

        return response.json();
      } catch (error) {
        console.error('Failed to get session:', error);
        return null;
      }
    },

    /**
     * Sign out
     */
    async signOut(options = {}) {
      try {
        await fetch(`${baseURL}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });

        if (options.fetchOptions?.onSuccess) {
          options.fetchOptions.onSuccess();
        }
      } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
      }
    }
  };
}

/**
 * Get or initialize auth client
 */
async function getAuthClient() {
  if (!authClientInstance) {
    await initAuthClient();
  }
  return authClientInstance;
}

/**
 * Convenient auth methods
 */
export const auth = {
  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle() {
    const client = authClientInstance || createAuthClient(API_BASE_URL);
    client.signIn.social({ provider: 'google' });
  },

  /**
   * Sign in with GitHub OAuth
   */
  signInWithGitHub() {
    const client = authClientInstance || createAuthClient(API_BASE_URL);
    client.signIn.social({ provider: 'github' });
  },

  /**
   * Login with email/username and password
   */
  async login(emailOrUsername, password) {
    const client = await getAuthClient();
    return client.login(emailOrUsername, password);
  },

  /**
   * Register new user
   */
  async register(email, username, password, name = null) {
    const client = await getAuthClient();
    return client.register(email, username, password, name);
  },

  /**
   * Check email/username availability
   * @returns {Promise<{emailAvailable: boolean, usernameAvailable: boolean}>}
   */
  async checkAvailability(email = null, username = null) {
    const client = await getAuthClient();
    return client.checkAvailability(email, username);
  },

  /**
   * Get current session
   * @returns {Promise<{user, session} | null>}
   */
  async getSession() {
    const client = await getAuthClient();
    return client.getSession();
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const client = await getAuthClient();
    return client.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/auth/login.html';
        }
      }
    });
  }
};
