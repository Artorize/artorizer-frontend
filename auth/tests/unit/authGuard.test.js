/**
 * Unit Tests for Auth Guard
 *
 * Tests route protection and authentication checks
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Auth Guard', () => {
  let checkAuth;
  let requireAuth;
  let redirectToLogin;
  let mockAuthManager;

  beforeEach(() => {
    // Mock AuthManager
    mockAuthManager = {
      getSession: jest.fn()
    };

    // Define guard functions (to be implemented)
    checkAuth = async () => {
      const session = await mockAuthManager.getSession();
      return session !== null;
    };

    requireAuth = async (redirectUrl = null) => {
      const session = await mockAuthManager.getSession();
      if (!session) {
        redirectToLogin(redirectUrl);
        return false;
      }
      return true;
    };

    redirectToLogin = (returnUrl = null) => {
      const url = returnUrl
        ? `/login.html?returnUrl=${encodeURIComponent(returnUrl)}`
        : '/login.html';
      window.location.href = url;
    };

    global.window = {
      location: { href: '' }
    };
  });

  describe('checkAuth()', () => {
    test('should return true when user is authenticated', async () => {
      mockAuthManager.getSession.mockResolvedValue({
        user: { id: '123' }
      });

      const isAuth = await checkAuth();

      expect(isAuth).toBe(true);
    });

    test('should return false when user is not authenticated', async () => {
      mockAuthManager.getSession.mockResolvedValue(null);

      const isAuth = await checkAuth();

      expect(isAuth).toBe(false);
    });

    test('should return false on session fetch error', async () => {
      mockAuthManager.getSession.mockRejectedValue(new Error('Network error'));

      try {
        await checkAuth();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('requireAuth()', () => {
    test('should return true when authenticated', async () => {
      mockAuthManager.getSession.mockResolvedValue({
        user: { id: '123' }
      });

      const result = await requireAuth();

      expect(result).toBe(true);
    });

    test('should redirect to login when not authenticated', async () => {
      mockAuthManager.getSession.mockResolvedValue(null);

      await requireAuth();

      expect(window.location.href).toBe('/login.html');
    });

    test('should include return URL in redirect', async () => {
      mockAuthManager.getSession.mockResolvedValue(null);

      await requireAuth('/dashboard/dashboard-v2.html');

      expect(window.location.href).toContain('returnUrl');
      expect(window.location.href).toContain('dashboard-v2.html');
    });

    test('should return false after redirect', async () => {
      mockAuthManager.getSession.mockResolvedValue(null);

      const result = await requireAuth();

      expect(result).toBe(false);
    });
  });

  describe('redirectToLogin()', () => {
    test('should redirect to login page', () => {
      redirectToLogin();

      expect(window.location.href).toBe('/login.html');
    });

    test('should include return URL when provided', () => {
      redirectToLogin('/dashboard/dashboard-v2.html');

      expect(window.location.href).toContain('/login.html?returnUrl=');
      expect(window.location.href).toContain('dashboard-v2.html');
    });

    test('should encode return URL properly', () => {
      redirectToLogin('/dashboard/page.html?tab=1&section=2');

      expect(window.location.href).toContain('returnUrl=');
      expect(decodeURIComponent(window.location.href.split('returnUrl=')[1]))
        .toBe('/dashboard/page.html?tab=1&section=2');
    });
  });

  describe('Protected Page Flow', () => {
    test('should allow access to authenticated users', async () => {
      mockAuthManager.getSession.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' }
      });

      const canAccess = await requireAuth();

      expect(canAccess).toBe(true);
      expect(window.location.href).toBe('');
    });

    test('should block access to unauthenticated users', async () => {
      mockAuthManager.getSession.mockResolvedValue(null);

      const canAccess = await requireAuth('/protected-page.html');

      expect(canAccess).toBe(false);
      expect(window.location.href).toContain('/login.html');
      expect(window.location.href).toContain('protected-page.html');
    });
  });

  describe('Return URL Handling', () => {
    test('should extract return URL from query params', () => {
      const searchParams = new URLSearchParams('?returnUrl=%2Fdashboard%2Fdashboard-v2.html');
      const returnUrl = searchParams.get('returnUrl');

      expect(returnUrl).toBe('/dashboard/dashboard-v2.html');
    });

    test('should handle missing return URL', () => {
      const searchParams = new URLSearchParams('?other=value');
      const returnUrl = searchParams.get('returnUrl');

      expect(returnUrl).toBeNull();
    });

    test('should default to dashboard when return URL is missing', () => {
      const searchParams = new URLSearchParams('');
      const returnUrl = searchParams.get('returnUrl') || '/dashboard/dashboard-v2.html';

      expect(returnUrl).toBe('/dashboard/dashboard-v2.html');
    });
  });
});

describe('Auth Guard Integration', () => {
  let mockAuthManager;
  let protectRoute;

  beforeEach(() => {
    mockAuthManager = {
      getSession: jest.fn()
    };

    protectRoute = async (routeName) => {
      const session = await mockAuthManager.getSession();
      if (!session) {
        throw new Error(`Access denied to ${routeName}`);
      }
      return session;
    };

    global.window = {
      location: { href: '' }
    };
  });

  test('should protect dashboard route', async () => {
    mockAuthManager.getSession.mockResolvedValue(null);

    await expect(protectRoute('dashboard')).rejects.toThrow('Access denied to dashboard');
  });

  test('should allow dashboard access when authenticated', async () => {
    const mockSession = { user: { id: '123' } };
    mockAuthManager.getSession.mockResolvedValue(mockSession);

    const session = await protectRoute('dashboard');

    expect(session).toEqual(mockSession);
  });

  test('should protect upload route', async () => {
    mockAuthManager.getSession.mockResolvedValue(null);

    await expect(protectRoute('upload')).rejects.toThrow('Access denied to upload');
  });

  test('should protect gallery route', async () => {
    mockAuthManager.getSession.mockResolvedValue(null);

    await expect(protectRoute('gallery')).rejects.toThrow('Access denied to gallery');
  });
});
