/**
 * Better Auth Client Wrapper
 *
 * Provides a clean interface to Better Auth client library.
 * This can be imported via CDN (no build step required).
 */

// For production, import Better Auth client from CDN
// For now, we'll create a compatible interface that can work with mocks
let authClientInstance = null;

/**
 * Initialize Better Auth client
 * Call this once when the app starts, or let it initialize lazily
 */
export async function initAuthClient(config = {}) {
  const baseURL = config.baseURL || 'https://router.artorizer.com';

  // Check if we're in mock mode
  if (window.__MOCK_AUTH_ENABLED__) {
    const { mockAuth } = await import('./__mocks__/mockAuthBackend.js');
    authClientInstance = mockAuth;
    return authClientInstance;
  }

  // In production, this would import Better Auth
  // import { createAuthClient } from "https://esm.sh/better-auth@1.0.0/client";
  // For now, we create a compatible interface
  try {
    // Dynamically import Better Auth if available
    const { createAuthClient } = await import('https://esm.sh/better-auth@1.0.0/client');
    authClientInstance = createAuthClient({
      baseURL,
      credentials: 'include'
    });
  } catch (error) {
    console.warn('Better Auth client not available, using fallback');
    // Create fallback implementation
    authClientInstance = createFallbackClient(baseURL);
  }

  return authClientInstance;
}

/**
 * Fallback client for development when Better Auth isn't available
 */
function createFallbackClient(baseURL) {
  return {
    signIn: {
      async social({ provider, callbackURL }) {
        // Simulate OAuth redirect
        const redirectUrl = `${baseURL}/api/auth/signin/${provider}?callbackURL=${encodeURIComponent(callbackURL || '/dashboard/dashboard-v2.html')}`;
        window.location.href = redirectUrl;
      }
    },

    async getSession() {
      try {
        const response = await fetch(`${baseURL}/api/auth/session`, {
          credentials: 'include'
        });

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error('Failed to get session:', error);
        return null;
      }
    },

    async signOut(options = {}) {
      try {
        await fetch(`${baseURL}/api/auth/sign-out`, {
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
   * Sign in with Google
   */
  async signInWithGoogle() {
    const client = await getAuthClient();
    return client.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard/dashboard-v2.html'
    });
  },

  /**
   * Sign in with GitHub
   */
  async signInWithGitHub() {
    const client = await getAuthClient();
    return client.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard/dashboard-v2.html'
    });
  },

  /**
   * Get current session
   * @returns {Promise<Session | null>}
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
          window.location.href = '/login.html';
        }
      }
    });
  }
};
