/**
 * Authentication Manager
 *
 * High-level authentication interface for Artorizer.
 * Provides session management, caching, and error handling.
 */

import { auth } from './authClient.js';

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  constructor(message, originalError = null, code = null) {
    super(message);
    this.name = 'AuthError';
    this.originalError = originalError;
    this.code = code;
  }
}

/**
 * Main authentication manager class
 */
export class AuthManager {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:7000';
    this.redirectUrl = config.redirectUrl || '/dashboard/dashboard-v2.html';
    this.loginUrl = config.loginUrl || '/auth/login.html';

    // Session cache to reduce API calls
    this.sessionCache = null;
    this.cacheExpiry = null;
    this.cacheDuration = config.cacheDuration || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle() {
    auth.signInWithGoogle();
  }

  /**
   * Sign in with GitHub OAuth
   */
  signInWithGitHub() {
    auth.signInWithGitHub();
  }

  /**
   * Login with email/username and password
   * @returns {Promise<{user, session}>}
   */
  async login(emailOrUsername, password) {
    try {
      const result = await auth.login(emailOrUsername, password);
      this.clearCache();
      return result;
    } catch (error) {
      throw new AuthError(error.message || 'Login failed', error, 'LOGIN_FAILED');
    }
  }

  /**
   * Register new user
   * @returns {Promise<{user, session}>}
   */
  async register(email, username, password, name = null) {
    try {
      const result = await auth.register(email, username, password, name);
      this.clearCache();
      return result;
    } catch (error) {
      throw new AuthError(error.message || 'Registration failed', error, 'REGISTER_FAILED');
    }
  }

  /**
   * Check if email/username is available
   * @returns {Promise<{emailAvailable: boolean, usernameAvailable: boolean}>}
   */
  async checkAvailability(email = null, username = null) {
    try {
      return await auth.checkAvailability(email, username);
    } catch (error) {
      throw new AuthError('Failed to check availability', error, 'CHECK_AVAILABILITY_FAILED');
    }
  }

  /**
   * Get current session
   * Uses cache if available and valid
   * @returns {Promise<Session | null>}
   */
  async getSession() {
    // Use cache if valid
    if (this.sessionCache && Date.now() < this.cacheExpiry) {
      return this.sessionCache;
    }

    try {
      const session = await auth.getSession();

      // Cache the session
      if (session) {
        this.sessionCache = session;
        this.cacheExpiry = Date.now() + this.cacheDuration;
      } else {
        this.sessionCache = null;
        this.cacheExpiry = null;
      }

      return session;
    } catch (error) {
      this.clearCache();
      throw new AuthError('Failed to get session', error, 'GET_SESSION_FAILED');
    }
  }

  /**
   * Sign out current user
   * Clears cache and redirects to login
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await auth.signOut();
      this.clearCache();
    } catch (error) {
      // Clear cache anyway
      this.clearCache();
      throw new AuthError('Sign out failed', error, 'SIGNOUT_FAILED');
    }
  }

  /**
   * Require authentication
   * Redirects to login if not authenticated
   * @returns {Promise<Session>}
   * @throws {AuthError} Throws if not authenticated (after redirect)
   */
  async requireAuth() {
    const session = await this.getSession();

    if (!session) {
      const returnUrl = window.location.pathname + window.location.search;
      window.location.href = `${this.loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
      throw new AuthError('Authentication required', null, 'AUTH_REQUIRED');
    }

    return session;
  }

  /**
   * Check if user is authenticated
   * Does not redirect, just returns boolean
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const session = await this.getSession();
      return session !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current user
   * @returns {Promise<User | null>}
   */
  async getUser() {
    const session = await this.getSession();
    return session?.user || null;
  }

  /**
   * Clear session cache
   * Call this after manual session modifications
   */
  clearCache() {
    this.sessionCache = null;
    this.cacheExpiry = null;
  }

  /**
   * Refresh session
   * Forces a new session check, bypassing cache
   * @returns {Promise<Session | null>}
   */
  async refreshSession() {
    this.clearCache();
    return this.getSession();
  }
}

// Export default instance for convenience
export const authManager = new AuthManager();
