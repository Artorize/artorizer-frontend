# Authentication API Design & Test Cases

This document defines what users should call and what they should receive when interacting with the authentication system.

## Table of Contents

1. [Client-Side API](#client-side-api)
2. [Server-Side Endpoints](#server-side-endpoints)
3. [Session Management](#session-management)
4. [Error Handling](#error-handling)
5. [Test Cases](#test-cases)

---

## Client-Side API

### AuthManager Class

The main authentication manager that users interact with on the frontend.

#### `new AuthManager(config)`

**Purpose**: Initialize authentication manager

**Parameters**:
```javascript
{
  baseUrl: "https://router.artorizer.com",  // API base URL
  redirectUrl: "/dashboard/dashboard-v2.html" // Post-login redirect
}
```

**Returns**: AuthManager instance

**Example**:
```javascript
import { AuthManager } from '/src/auth/authManager.js';

const auth = new AuthManager({
  baseUrl: "https://router.artorizer.com",
  redirectUrl: "/dashboard/dashboard-v2.html"
});
```

---

#### `authManager.signInWithGoogle()`

**Purpose**: Initiate Google OAuth login flow

**Parameters**: None

**Returns**: Promise<void>

**Side Effects**: Redirects to Google OAuth page

**Example**:
```javascript
await auth.signInWithGoogle();
// User is redirected to Google OAuth
```

**Test Cases**:
1. Should redirect to Google OAuth URL
2. Should include correct client_id
3. Should include correct redirect_uri
4. Should include proper scopes (email, profile)

---

#### `authManager.signInWithGitHub()`

**Purpose**: Initiate GitHub OAuth login flow

**Parameters**: None

**Returns**: Promise<void>

**Side Effects**: Redirects to GitHub OAuth page

**Example**:
```javascript
await auth.signInWithGitHub();
// User is redirected to GitHub OAuth
```

**Test Cases**:
1. Should redirect to GitHub OAuth URL
2. Should include correct client_id
3. Should include correct redirect_uri
4. Should include proper scopes (read:user, user:email)

---

#### `authManager.getSession()`

**Purpose**: Retrieve current user session

**Parameters**: None

**Returns**: Promise<Session | null>

**Session Object**:
```javascript
{
  user: {
    id: "uuid-v4",
    email: "user@example.com",
    name: "John Doe",
    image: "https://avatars.githubusercontent.com/...",
    emailVerified: true,
    createdAt: "2025-01-15T10:30:00Z"
  },
  session: {
    token: "session-token",
    expiresAt: "2025-01-22T10:30:00Z"
  }
}
```

**Example**:
```javascript
const session = await auth.getSession();
if (session) {
  console.log(`Logged in as: ${session.user.name}`);
} else {
  console.log('Not logged in');
}
```

**Test Cases**:
1. Returns session object when logged in
2. Returns null when not logged in
3. Session object has correct structure
4. User object has all required fields
5. Token is included in session

---

#### `authManager.signOut()`

**Purpose**: Log out current user

**Parameters**: None

**Returns**: Promise<void>

**Side Effects**: Clears session, redirects to login

**Example**:
```javascript
await auth.signOut();
// User is logged out and redirected to /login.html
```

**Test Cases**:
1. Clears session from backend
2. Clears cookies
3. Redirects to login page
4. Session is null after logout

---

#### `authManager.requireAuth()`

**Purpose**: Ensure user is authenticated, redirect if not

**Parameters**: None

**Returns**: Promise<Session>

**Throws**: Redirects to login if not authenticated

**Example**:
```javascript
// In protected pages
const session = await auth.requireAuth();
// If not logged in, user is redirected to login
// If logged in, session is returned
console.log(`Welcome back, ${session.user.name}!`);
```

**Test Cases**:
1. Returns session when logged in
2. Redirects to login when not logged in
3. Stores return URL for post-login redirect
4. Throws no errors when authenticated

---

### AuthClient (Lower-Level API)

Direct wrapper around Better Auth client.

#### `authClient.signIn.social({ provider })`

**Purpose**: Low-level OAuth sign-in

**Parameters**:
```javascript
{
  provider: "google" | "github",
  callbackURL: "/dashboard/dashboard-v2.html" // optional
}
```

**Returns**: Promise<void>

**Example**:
```javascript
import { authClient } from '/src/auth/authClient.js';

await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard/dashboard-v2.html"
});
```

---

## Server-Side Endpoints

All endpoints are relative to `https://router.artorizer.com`

### Authentication Endpoints

#### `GET /api/auth/callback/google`

**Purpose**: OAuth callback endpoint for Google

**Authentication**: Public

**Query Parameters**:
- `code`: OAuth authorization code
- `state`: CSRF state token

**Response**: Redirects to dashboard with session cookie

**Cookies Set**:
```
better-auth.session_token=<token>; HttpOnly; Secure; SameSite=Lax
```

**Test Cases**:
1. Valid code returns 302 redirect
2. Invalid code returns 400 error
3. Missing state returns 400 error
4. Sets httpOnly session cookie
5. Redirects to correct callback URL

---

#### `GET /api/auth/callback/github`

**Purpose**: OAuth callback endpoint for GitHub

**Authentication**: Public

**Query Parameters**:
- `code`: OAuth authorization code
- `state`: CSRF state token

**Response**: Redirects to dashboard with session cookie

**Test Cases**:
1. Valid code returns 302 redirect
2. Invalid code returns 400 error
3. Sets session cookie correctly
4. Creates user if not exists
5. Links to existing user if email matches

---

#### `GET /api/auth/session`

**Purpose**: Get current session

**Authentication**: Required (via cookie)

**Headers**:
```
Cookie: better-auth.session_token=<token>
```

**Success Response (200)**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/...",
    "emailVerified": true,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "session": {
    "token": "abc123...",
    "expiresAt": "2025-01-22T10:30:00Z"
  }
}
```

**Error Response (401)**:
```json
{
  "error": "Unauthorized",
  "message": "No active session"
}
```

**Test Cases**:
1. Returns session when valid token provided
2. Returns 401 when no token provided
3. Returns 401 when token expired
4. Returns 401 when token invalid
5. Refreshes session if close to expiry

---

#### `POST /api/auth/sign-out`

**Purpose**: End current session

**Authentication**: Required

**Headers**:
```
Cookie: better-auth.session_token=<token>
```

**Success Response (200)**:
```json
{
  "success": true
}
```

**Side Effects**: Clears session cookie

**Test Cases**:
1. Returns 200 on success
2. Clears session cookie
3. Invalidates session in database
4. Returns 401 if not logged in
5. Can't use same token after logout

---

### Protected API Endpoints

#### `POST /api/upload`

**Purpose**: Upload artwork for protection

**Authentication**: Required

**Headers**:
```
Cookie: better-auth.session_token=<token>
Content-Type: multipart/form-data
```

**Request Body (FormData)**:
```javascript
{
  file: File,                        // Image file
  include_hash_analysis: boolean,    // Optional
  include_protection: boolean        // Optional
}
```

**Success Response (200)**:
```json
{
  "job_id": "job_abc123",
  "status": "pending",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Error Response (401)**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Error Response (400)**:
```json
{
  "error": "Bad Request",
  "message": "No file uploaded"
}
```

**Test Cases**:
1. Authenticated user can upload
2. Unauthenticated user gets 401
3. Returns job_id on success
4. Associates upload with user_id
5. Validates file type
6. Validates file size
7. Returns 400 for invalid files

---

#### `GET /api/artworks/me`

**Purpose**: Get current user's artworks

**Authentication**: Required

**Headers**:
```
Cookie: better-auth.session_token=<token>
```

**Query Parameters**:
- `limit`: Number (default 50, max 100)
- `offset`: Number (default 0)
- `status`: "pending" | "processing" | "completed" | "failed"

**Success Response (200)**:
```json
{
  "artworks": [
    {
      "id": "artwork_123",
      "job_id": "job_abc123",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "original_filename": "my-art.jpg",
      "original_url": "https://storage.artorizer.com/originals/my-art.jpg",
      "protected_url": "https://storage.artorizer.com/protected/my-art-protected.jpg",
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z",
      "completed_at": "2025-01-15T10:35:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Error Response (401)**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Test Cases**:
1. Returns only current user's artworks
2. Does not return other users' artworks
3. Pagination works correctly
4. Filtering by status works
5. Returns 401 when not authenticated
6. Returns empty array when user has no artworks

---

#### `GET /api/artworks/:id`

**Purpose**: Get specific artwork details

**Authentication**: Required (must own artwork)

**Success Response (200)**:
```json
{
  "id": "artwork_123",
  "job_id": "job_abc123",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "original_filename": "my-art.jpg",
  "original_url": "https://storage.artorizer.com/originals/my-art.jpg",
  "protected_url": "https://storage.artorizer.com/protected/my-art-protected.jpg",
  "hash_analysis": {
    "original_hash": "abc123...",
    "protected_hash": "def456..."
  },
  "status": "completed",
  "created_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:35:00Z"
}
```

**Error Response (403)**:
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this artwork"
}
```

**Error Response (404)**:
```json
{
  "error": "Not Found",
  "message": "Artwork not found"
}
```

**Test Cases**:
1. Returns artwork when user owns it
2. Returns 403 when user doesn't own it
3. Returns 404 when artwork doesn't exist
4. Returns 401 when not authenticated

---

#### `DELETE /api/artworks/:id`

**Purpose**: Delete artwork

**Authentication**: Required (must own artwork)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Artwork deleted"
}
```

**Error Response (403)**:
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this artwork"
}
```

**Test Cases**:
1. Deletes artwork when user owns it
2. Returns 403 when user doesn't own it
3. Returns 404 when artwork doesn't exist
4. Actually removes from database
5. Removes associated files from storage

---

#### `GET /api/user/profile`

**Purpose**: Get current user profile

**Authentication**: Required

**Success Response (200)**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/...",
    "emailVerified": true,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "stats": {
    "total_artworks": 42,
    "total_uploads": 50,
    "account_age_days": 30
  }
}
```

**Test Cases**:
1. Returns user profile when authenticated
2. Returns 401 when not authenticated
3. Stats are accurate
4. Email is correct
5. Image URL is valid

---

## Session Management

### Cookie Handling

**Cookie Name**: `better-auth.session_token`

**Cookie Attributes**:
```
HttpOnly: true      // Prevents JavaScript access (XSS protection)
Secure: true        // HTTPS only (production)
SameSite: Lax      // CSRF protection
Path: /            // Available site-wide
Max-Age: 604800    // 7 days
```

### Session Lifecycle

1. **Login**: OAuth redirect → callback → set cookie → redirect to dashboard
2. **Request**: Browser sends cookie → server validates → returns data
3. **Refresh**: Session < 1 day remaining → auto-refresh → new cookie
4. **Logout**: POST /api/auth/sign-out → clear cookie → invalidate in DB

### Session Persistence

**Frontend**:
```javascript
// Check session on page load
const session = await auth.getSession();
if (session) {
  // User is logged in
  displayUserProfile(session.user);
} else {
  // User is logged out
  redirectToLogin();
}
```

**Storage**: No localStorage or sessionStorage - only httpOnly cookies

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}  // Optional additional info
}
```

### Error Types

#### Authentication Errors

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**401 Session Expired**:
```json
{
  "error": "Unauthorized",
  "message": "Session expired",
  "code": "SESSION_EXPIRED"
}
```

**403 Forbidden**:
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this resource",
  "code": "FORBIDDEN"
}
```

#### OAuth Errors

**400 OAuth Failed**:
```json
{
  "error": "Bad Request",
  "message": "OAuth authentication failed",
  "code": "OAUTH_FAILED",
  "details": {
    "provider": "google",
    "reason": "access_denied"
  }
}
```

#### Validation Errors

**400 Invalid File**:
```json
{
  "error": "Bad Request",
  "message": "Invalid file type",
  "code": "INVALID_FILE_TYPE",
  "details": {
    "allowed_types": ["image/jpeg", "image/png"],
    "received_type": "application/pdf"
  }
}
```

**400 File Too Large**:
```json
{
  "error": "Bad Request",
  "message": "File size exceeds limit",
  "code": "FILE_TOO_LARGE",
  "details": {
    "max_size_mb": 10,
    "file_size_mb": 15
  }
}
```

#### Rate Limiting

**429 Too Many Requests**:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 60,
    "limit": 100,
    "window": "1h"
  }
}
```

### Frontend Error Handling

```javascript
try {
  const session = await auth.getSession();
  // Use session
} catch (error) {
  if (error.code === 'AUTH_REQUIRED') {
    // Redirect to login
    window.location.href = '/login.html';
  } else if (error.code === 'SESSION_EXPIRED') {
    // Show re-login prompt
    showReloginDialog();
  } else {
    // Generic error
    showError(error.message);
  }
}
```

---

## Test Cases

### Unit Test Cases

#### authManager.getSession()

```javascript
describe('AuthManager.getSession()', () => {
  test('returns session when logged in', async () => {
    const session = await auth.getSession();
    expect(session).not.toBeNull();
    expect(session.user).toHaveProperty('id');
    expect(session.user).toHaveProperty('email');
  });

  test('returns null when not logged in', async () => {
    // Clear cookies first
    const session = await auth.getSession();
    expect(session).toBeNull();
  });

  test('session has correct structure', async () => {
    const session = await auth.getSession();
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
});
```

#### authManager.requireAuth()

```javascript
describe('AuthManager.requireAuth()', () => {
  test('returns session when authenticated', async () => {
    const session = await auth.requireAuth();
    expect(session).not.toBeNull();
  });

  test('redirects when not authenticated', async () => {
    const redirectSpy = jest.spyOn(window.location, 'href', 'set');
    await auth.requireAuth();
    expect(redirectSpy).toHaveBeenCalledWith(
      expect.stringContaining('/login.html')
    );
  });
});
```

### Integration Test Cases

#### OAuth Flow

```javascript
describe('OAuth Login Flow', () => {
  test('Google OAuth completes successfully', async () => {
    // 1. Click Google login
    await auth.signInWithGoogle();

    // 2. Should redirect to Google
    expect(window.location.href).toContain('accounts.google.com');

    // 3. Simulate OAuth callback
    await simulateOAuthCallback('google', 'valid-code');

    // 4. Should redirect to dashboard
    expect(window.location.href).toContain('/dashboard');

    // 5. Session should exist
    const session = await auth.getSession();
    expect(session).not.toBeNull();
  });

  test('GitHub OAuth completes successfully', async () => {
    await auth.signInWithGitHub();
    expect(window.location.href).toContain('github.com/login/oauth');

    await simulateOAuthCallback('github', 'valid-code');
    expect(window.location.href).toContain('/dashboard');

    const session = await auth.getSession();
    expect(session).not.toBeNull();
  });
});
```

#### Protected Routes

```javascript
describe('Protected Routes', () => {
  test('allows access when authenticated', async () => {
    await auth.signIn();
    const response = await fetch('/api/artworks/me', {
      credentials: 'include'
    });
    expect(response.status).toBe(200);
  });

  test('blocks access when not authenticated', async () => {
    await auth.signOut();
    const response = await fetch('/api/artworks/me', {
      credentials: 'include'
    });
    expect(response.status).toBe(401);
  });
});
```

### E2E Test Cases

#### Complete User Journey

```javascript
describe('Complete User Journey', () => {
  test('new user can sign up, upload, and view artworks', async () => {
    // 1. Visit login page
    await page.goto('/login.html');

    // 2. Click Google login
    await page.click('#google-login-btn');

    // 3. Complete OAuth (test account)
    await completeGoogleOAuth(page, TEST_EMAIL, TEST_PASSWORD);

    // 4. Should be on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // 5. Upload artwork
    await page.setInputFiles('#file-input', 'test-art.jpg');
    await page.click('#upload-btn');

    // 6. Wait for upload
    await page.waitForSelector('.upload-success');

    // 7. Artwork should appear in gallery
    const artworks = await page.locator('.artwork-item').count();
    expect(artworks).toBeGreaterThan(0);

    // 8. Sign out
    await page.click('#sign-out-btn');

    // 9. Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
```

---

## Mock Data

### Mock User

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "name": "Test User",
  "image": "https://via.placeholder.com/150",
  "emailVerified": true,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Mock Session

```javascript
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "name": "Test User",
    "image": "https://via.placeholder.com/150",
    "emailVerified": true,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "session": {
    "token": "mock-session-token-abc123",
    "expiresAt": "2025-01-22T10:30:00Z"
  }
}
```

### Mock Artwork

```javascript
{
  "id": "artwork_123",
  "job_id": "job_abc123",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "original_filename": "test-art.jpg",
  "original_url": "https://storage.artorizer.com/originals/test-art.jpg",
  "protected_url": "https://storage.artorizer.com/protected/test-art-protected.jpg",
  "status": "completed",
  "created_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:35:00Z"
}
```

---

## Summary

This API design provides:

1. **Clear client-side API** - Users know exactly what to call
2. **Well-defined responses** - Users know what to expect
3. **Comprehensive error handling** - Users can handle all error cases
4. **Complete test coverage** - All scenarios are testable
5. **Mock data** - Easy to write tests before backend is ready

All endpoints follow REST conventions and return consistent JSON responses.
