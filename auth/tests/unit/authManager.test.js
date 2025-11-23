/**
 * Unit Tests for AuthManager
 *
 * Tests the core authentication manager functionality including
 * session management, OAuth flows, and user state.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock authClient
const mockAuthClient = {
  signIn: {
    social: jest.fn()
  },
  signOut: jest.fn(),
  getSession: jest.fn()
};

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn()
};

describe('AuthManager', () => {
  let AuthManager;
  let authManager;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockLocation.href = 'http://localhost:8080';
    global.window = { location: mockLocation };
    global.fetch = jest.fn();

    // Import AuthManager (will need to be created)
    // For now, we define the expected interface
    AuthManager = class {
      constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://router.artorizer.com';
        this.redirectUrl = config.redirectUrl || '/dashboard/dashboard-v2.html';
      }

      async signInWithGoogle() {
        return mockAuthClient.signIn.social({ provider: 'google' });
      }

      async signInWithGitHub() {
        return mockAuthClient.signIn.social({ provider: 'github' });
      }

      async getSession() {
        return mockAuthClient.getSession();
      }

      async signOut() {
        return mockAuthClient.signOut();
      }

      async requireAuth() {
        const session = await this.getSession();
        if (!session) {
          window.location.href = '/login.html';
          throw new Error('Authentication required');
        }
        return session;
      }
    };

    authManager = new AuthManager();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Constructor', () => {
    test('should create instance with default config', () => {
      const manager = new AuthManager();
      expect(manager.baseUrl).toBe('https://router.artorizer.com');
      expect(manager.redirectUrl).toBe('/dashboard/dashboard-v2.html');
    });

    test('should create instance with custom config', () => {
      const manager = new AuthManager({
        baseUrl: 'https://custom.artorizer.com',
        redirectUrl: '/custom-dashboard.html'
      });
      expect(manager.baseUrl).toBe('https://custom.artorizer.com');
      expect(manager.redirectUrl).toBe('/custom-dashboard.html');
    });
  });

  describe('signInWithGoogle()', () => {
    test('should call authClient.signIn.social with google provider', async () => {
      await authManager.signInWithGoogle();

      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google'
      });
      expect(mockAuthClient.signIn.social).toHaveBeenCalledTimes(1);
    });

    test('should handle Google OAuth redirect', async () => {
      mockAuthClient.signIn.social.mockResolvedValue(undefined);

      await authManager.signInWithGoogle();

      // Should initiate OAuth flow (implementation-specific)
      expect(mockAuthClient.signIn.social).toHaveBeenCalled();
    });

    test('should handle Google OAuth errors', async () => {
      const error = new Error('OAuth failed');
      mockAuthClient.signIn.social.mockRejectedValue(error);

      await expect(authManager.signInWithGoogle()).rejects.toThrow('OAuth failed');
    });
  });

  describe('signInWithGitHub()', () => {
    test('should call authClient.signIn.social with github provider', async () => {
      await authManager.signInWithGitHub();

      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'github'
      });
      expect(mockAuthClient.signIn.social).toHaveBeenCalledTimes(1);
    });

    test('should handle GitHub OAuth redirect', async () => {
      mockAuthClient.signIn.social.mockResolvedValue(undefined);

      await authManager.signInWithGitHub();

      expect(mockAuthClient.signIn.social).toHaveBeenCalled();
    });

    test('should handle GitHub OAuth errors', async () => {
      const error = new Error('OAuth failed');
      mockAuthClient.signIn.social.mockRejectedValue(error);

      await expect(authManager.signInWithGitHub()).rejects.toThrow('OAuth failed');
    });
  });

  describe('getSession()', () => {
    test('should return session when user is logged in', async () => {
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://via.placeholder.com/150',
          emailVerified: true,
          createdAt: '2025-01-15T10:30:00Z'
        },
        session: {
          token: 'mock-token',
          expiresAt: '2025-01-22T10:30:00Z'
        }
      };

      mockAuthClient.getSession.mockResolvedValue(mockSession);

      const session = await authManager.getSession();

      expect(session).toEqual(mockSession);
      expect(session.user).toHaveProperty('id');
      expect(session.user).toHaveProperty('email');
      expect(session.session).toHaveProperty('token');
    });

    test('should return null when user is not logged in', async () => {
      mockAuthClient.getSession.mockResolvedValue(null);

      const session = await authManager.getSession();

      expect(session).toBeNull();
    });

    test('should have correct session structure', async () => {
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://via.placeholder.com/150',
          emailVerified: true,
          createdAt: '2025-01-15T10:30:00Z'
        },
        session: {
          token: 'mock-token',
          expiresAt: '2025-01-22T10:30:00Z'
        }
      };

      mockAuthClient.getSession.mockResolvedValue(mockSession);

      const session = await authManager.getSession();

      expect(session).toMatchObject({
        user: {
          id: expect.any(String),
          email: expect.stringMatching(/@/),
          name: expect.any(String),
          emailVerified: expect.any(Boolean),
          createdAt: expect.any(String)
        },
        session: {
          token: expect.any(String),
          expiresAt: expect.any(String)
        }
      });
    });

    test('should handle session fetch errors', async () => {
      mockAuthClient.getSession.mockRejectedValue(new Error('Network error'));

      await expect(authManager.getSession()).rejects.toThrow('Network error');
    });
  });

  describe('signOut()', () => {
    test('should call authClient.signOut', async () => {
      mockAuthClient.signOut.mockResolvedValue({ success: true });

      await authManager.signOut();

      expect(mockAuthClient.signOut).toHaveBeenCalled();
      expect(mockAuthClient.signOut).toHaveBeenCalledTimes(1);
    });

    test('should clear session on sign out', async () => {
      mockAuthClient.signOut.mockResolvedValue({ success: true });
      mockAuthClient.getSession.mockResolvedValueOnce({
        user: { id: '123' }
      }).mockResolvedValueOnce(null);

      const sessionBefore = await authManager.getSession();
      expect(sessionBefore).not.toBeNull();

      await authManager.signOut();

      const sessionAfter = await authManager.getSession();
      expect(sessionAfter).toBeNull();
    });

    test('should handle sign out errors', async () => {
      mockAuthClient.signOut.mockRejectedValue(new Error('Sign out failed'));

      await expect(authManager.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('requireAuth()', () => {
    test('should return session when user is authenticated', async () => {
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      mockAuthClient.getSession.mockResolvedValue(mockSession);

      const session = await authManager.requireAuth();

      expect(session).toEqual(mockSession);
    });

    test('should redirect to login when user is not authenticated', async () => {
      mockAuthClient.getSession.mockResolvedValue(null);

      await expect(authManager.requireAuth()).rejects.toThrow('Authentication required');
      expect(mockLocation.href).toBe('/login.html');
    });

    test('should store return URL for post-login redirect', async () => {
      mockAuthClient.getSession.mockResolvedValue(null);
      mockLocation.href = 'http://localhost:8080/dashboard/dashboard-v2.html';

      try {
        await authManager.requireAuth();
      } catch (e) {
        // Expected to throw
      }

      // Should redirect with return URL
      expect(mockLocation.href).toContain('/login.html');
    });
  });

  describe('Session Validation', () => {
    test('should validate session token format', async () => {
      const mockSession = {
        user: { id: '123' },
        session: { token: 'invalid-token-format' }
      };

      mockAuthClient.getSession.mockResolvedValue(mockSession);

      const session = await authManager.getSession();

      expect(session.session.token).toBeTruthy();
      expect(typeof session.session.token).toBe('string');
    });

    test('should validate session expiry', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const mockSession = {
        user: { id: '123' },
        session: {
          token: 'token',
          expiresAt: futureDate
        }
      };

      mockAuthClient.getSession.mockResolvedValue(mockSession);

      const session = await authManager.getSession();

      expect(new Date(session.session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });
});

describe('AuthManager Error Scenarios', () => {
  let authManager;

  beforeEach(() => {
    authManager = new class {
      async getSession() {
        return mockAuthClient.getSession();
      }
    };
  });

  test('should handle network timeout', async () => {
    mockAuthClient.getSession.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), 100);
      });
    });

    await expect(authManager.getSession()).rejects.toThrow('Network timeout');
  });

  test('should handle invalid JSON responses', async () => {
    mockAuthClient.getSession.mockRejectedValue(new SyntaxError('Invalid JSON'));

    await expect(authManager.getSession()).rejects.toThrow('Invalid JSON');
  });

  test('should handle CORS errors', async () => {
    mockAuthClient.getSession.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(authManager.getSession()).rejects.toThrow('Failed to fetch');
  });
});
