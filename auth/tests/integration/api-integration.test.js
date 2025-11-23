/**
 * Integration Tests for API Endpoints
 *
 * Tests the integration between frontend auth and backend API
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

const BASE_URL = 'https://router.artorizer.com';

describe('API Integration Tests', () => {
  let sessionToken = null;

  describe('Authentication Endpoints', () => {
    describe('GET /api/auth/session', () => {
      test('should return 401 when not authenticated', async () => {
        const response = await fetch(`${BASE_URL}/api/auth/session`);

        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data).toEqual({
          error: 'Unauthorized',
          message: expect.any(String)
        });
      });

      test('should return session when authenticated', async () => {
        // Assume we have a session token from login
        const response = await fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        if (sessionToken) {
          expect(response.status).toBe(200);

          const data = await response.json();
          expect(data).toMatchObject({
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
        }
      });

      test('should return 401 when session is expired', async () => {
        const expiredToken = 'expired-token';
        const response = await fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            'Cookie': `better-auth.session_token=${expiredToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      test('should return 401 when session token is invalid', async () => {
        const invalidToken = 'invalid-token-format';
        const response = await fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            'Cookie': `better-auth.session_token=${invalidToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/auth/sign-out', () => {
      test('should return 200 on successful sign out', async () => {
        if (!sessionToken) {
          // Skip if not authenticated
          return;
        }

        const response = await fetch(`${BASE_URL}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual({ success: true });
      });

      test('should clear session cookie on sign out', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        const cookies = response.headers.get('set-cookie');
        expect(cookies).toContain('better-auth.session_token=;');
        expect(cookies).toContain('Max-Age=0');
      });

      test('should invalidate session after sign out', async () => {
        if (!sessionToken) {
          return;
        }

        // Sign out
        await fetch(`${BASE_URL}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        // Try to use old token
        const response = await fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Protected Endpoints', () => {
    describe('POST /api/upload', () => {
      test('should return 401 when not authenticated', async () => {
        const formData = new FormData();
        formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data).toMatchObject({
          error: 'Unauthorized',
          message: expect.any(String)
        });
      });

      test('should accept upload when authenticated', async () => {
        if (!sessionToken) {
          return;
        }

        const formData = new FormData();
        formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include',
          body: formData
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toMatchObject({
          job_id: expect.any(String),
          status: 'pending',
          user_id: expect.any(String),
          created_at: expect.any(String)
        });
      });

      test('should return 400 when file is missing', async () => {
        if (!sessionToken) {
          return;
        }

        const formData = new FormData();

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include',
          body: formData
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Bad Request');
        expect(data.message).toContain('file');
      });

      test('should validate file type', async () => {
        if (!sessionToken) {
          return;
        }

        const formData = new FormData();
        formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf');

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include',
          body: formData
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.code).toBe('INVALID_FILE_TYPE');
      });
    });

    describe('GET /api/artworks/me', () => {
      test('should return 401 when not authenticated', async () => {
        const response = await fetch(`${BASE_URL}/api/artworks/me`);

        expect(response.status).toBe(401);
      });

      test('should return user artworks when authenticated', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/artworks/me`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toMatchObject({
          artworks: expect.any(Array),
          total: expect.any(Number),
          limit: expect.any(Number),
          offset: expect.any(Number)
        });
      });

      test('should support pagination', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/artworks/me?limit=10&offset=0`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.limit).toBe(10);
        expect(data.offset).toBe(0);
        expect(data.artworks.length).toBeLessThanOrEqual(10);
      });

      test('should filter by status', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/artworks/me?status=completed`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        data.artworks.forEach(artwork => {
          expect(artwork.status).toBe('completed');
        });
      });

      test('should only return current user artworks', async () => {
        if (!sessionToken) {
          return;
        }

        // Get session to know current user ID
        const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        const session = await sessionResponse.json();
        const userId = session.user.id;

        // Get artworks
        const artworksResponse = await fetch(`${BASE_URL}/api/artworks/me`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        const artworks = await artworksResponse.json();

        artworks.artworks.forEach(artwork => {
          expect(artwork.user_id).toBe(userId);
        });
      });
    });

    describe('GET /api/artworks/:id', () => {
      test('should return 401 when not authenticated', async () => {
        const response = await fetch(`${BASE_URL}/api/artworks/artwork_123`);

        expect(response.status).toBe(401);
      });

      test('should return artwork when user owns it', async () => {
        if (!sessionToken) {
          return;
        }

        // First, get user's artworks to get a valid ID
        const listResponse = await fetch(`${BASE_URL}/api/artworks/me`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        const list = await listResponse.json();
        if (list.artworks.length === 0) {
          return; // No artworks to test with
        }

        const artworkId = list.artworks[0].id;

        // Get specific artwork
        const response = await fetch(`${BASE_URL}/api/artworks/${artworkId}`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toMatchObject({
          id: artworkId,
          job_id: expect.any(String),
          user_id: expect.any(String),
          original_filename: expect.any(String),
          status: expect.any(String),
          created_at: expect.any(String)
        });
      });

      test('should return 403 when user does not own artwork', async () => {
        if (!sessionToken) {
          return;
        }

        // Try to access artwork that doesn't belong to user
        const response = await fetch(`${BASE_URL}/api/artworks/other-user-artwork-id`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect([403, 404]).toContain(response.status);
      });

      test('should return 404 when artwork does not exist', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/artworks/nonexistent-id`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/artworks/:id', () => {
      test('should return 401 when not authenticated', async () => {
        const response = await fetch(`${BASE_URL}/api/artworks/artwork_123`, {
          method: 'DELETE'
        });

        expect(response.status).toBe(401);
      });

      test('should delete artwork when user owns it', async () => {
        if (!sessionToken) {
          return;
        }

        // This test would need a test artwork to delete
        // Skipping actual deletion to avoid side effects
      });

      test('should return 403 when user does not own artwork', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/artworks/other-user-artwork-id`, {
          method: 'DELETE',
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect([403, 404]).toContain(response.status);
      });
    });

    describe('GET /api/user/profile', () => {
      test('should return 401 when not authenticated', async () => {
        const response = await fetch(`${BASE_URL}/api/user/profile`);

        expect(response.status).toBe(401);
      });

      test('should return user profile when authenticated', async () => {
        if (!sessionToken) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/user/profile`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionToken}`
          },
          credentials: 'include'
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toMatchObject({
          user: {
            id: expect.any(String),
            email: expect.stringMatching(/@/),
            name: expect.any(String),
            emailVerified: expect.any(Boolean),
            createdAt: expect.any(String)
          },
          stats: {
            total_artworks: expect.any(Number),
            total_uploads: expect.any(Number),
            account_age_days: expect.any(Number)
          }
        });
      });
    });
  });

  describe('CORS and Credentials', () => {
    test('should include credentials in requests', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`, {
        credentials: 'include'
      });

      // Should not throw CORS error
      expect(response).toBeDefined();
    });

    test('should handle preflight OPTIONS requests', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'OPTIONS'
      });

      expect(response.headers.get('access-control-allow-credentials')).toBe('true');
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('Error Responses', () => {
    test('should return consistent error format', async () => {
      const response = await fetch(`${BASE_URL}/api/artworks/me`);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toMatchObject({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test('should include error codes for client handling', async () => {
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        body: new FormData()
      });

      if (response.status === 400) {
        const data = await response.json();
        expect(data).toHaveProperty('code');
      }
    });
  });
});
