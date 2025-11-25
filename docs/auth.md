# Authentication API Reference

This document details all authentication endpoints and provides guidance on implementing authentication in client applications.

## Overview

The Artorizer Core Router proxies all authentication requests to the backend service. Authentication is handled via session cookies (`better-auth.session_token`) with support for:

- Email/password authentication
- OAuth 2.0 (Google and GitHub)
- Session-based authentication with automatic refresh

## Session Management

| Property | Value |
|----------|-------|
| Cookie Name | `better-auth.session_token` |
| Duration | 7 days |
| Auto-refresh | Within 1 day of expiration |
| Cookie Flags | `httpOnly`, `secure`, `sameSite=Lax` |

---

## Email/Password Authentication

### Register a New User

Creates a new user account with email and password.

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "username": "username",
  "name": "Full Name"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | User password |
| username | string | Yes | Unique username |
| name | string | No | Display name |

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "name": "Full Name"
  },
  "session": {
    "id": "session-id",
    "token": "session-token",
    "expiresAt": "2025-02-01T12:00:00.000Z"
  }
}
```

**Cookies Set:** `better-auth.session_token` (httpOnly)

---

### Login

Authenticates a user with email/username and password.

```
POST /auth/login
```

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "password"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| emailOrUsername | string | Yes | Email address or username |
| password | string | Yes | User password |

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "name": "Full Name"
  },
  "session": {
    "id": "session-id",
    "token": "session-token",
    "expiresAt": "2025-02-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing required fields

---

### Logout

Ends the current user session.

```
POST /auth/logout
```

**Request Headers:**
```
Cookie: better-auth.session_token=<token>
Origin: https://artorizer.com
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Cookies Cleared:** `better-auth.session_token`

---

### Get Current User

Returns the authenticated user's information.

```
GET /auth/me
```

**Request Headers:**
```
Cookie: better-auth.session_token=<token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "name": "Full Name",
    "emailVerified": true
  },
  "session": {
    "id": "session-id",
    "expiresAt": "2025-02-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated or session expired

---

### Check Availability

Checks if an email or username is available for registration.

```
GET /auth/check-availability?email=<email>&username=<username>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | No | Email to check |
| username | string | No | Username to check |

*At least one parameter must be provided.*

**Response (200 OK):**
```json
{
  "available": true,
  "email": "available",
  "username": "taken"
}
```

| Status Value | Description |
|--------------|-------------|
| `available` | Not registered |
| `taken` | Already in use |
| `invalid` | Invalid format |

---

## OAuth 2.0 Authentication

The router supports OAuth authentication via Google and GitHub. The flow uses PKCE (Proof Key for Code Exchange) for enhanced security.

### Getting OAuth Redirect Links

To initiate OAuth login, redirect the user to the appropriate start endpoint:

| Provider | Redirect URL |
|----------|--------------|
| Google | `/auth/oauth/google/start` |
| GitHub | `/auth/oauth/github/start` |

**Production URLs:**
```
https://router.artorizer.com/auth/oauth/google/start
https://router.artorizer.com/auth/oauth/github/start
```

**Local Development:**
```
http://localhost:7000/auth/oauth/google/start
http://localhost:7000/auth/oauth/github/start
```

### Start OAuth Flow

Initiates the OAuth authentication flow with the specified provider.

```
GET /auth/oauth/:provider/start
```

**Path Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| provider | `google`, `github` | OAuth provider |

**Behavior:**
1. Backend generates PKCE state and nonce
2. State is stored in secure cookies
3. User is redirected to provider's consent screen

**Response:** HTTP 302 redirect to OAuth provider

### OAuth Callback

Handles the OAuth provider callback after user authorization.

```
GET /auth/oauth/:provider/callback
```

**Query Parameters (set by provider):**

| Parameter | Description |
|-----------|-------------|
| code | Authorization code from provider |
| state | PKCE state for verification |

**Behavior:**
1. Backend verifies PKCE state against cookie
2. Exchanges authorization code for access token
3. Creates or links user account
4. Sets session cookie
5. Redirects to frontend application

**Response:** HTTP 302 redirect to frontend with session established

---

## OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1. User clicks "Login with Google"
                                    │    window.location = '/auth/oauth/google/start'
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTER (port 7000)                              │
│                                                                      │
│   GET /auth/oauth/google/start                                       │
│   → Proxies to backend                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 2. Backend initiates PKCE flow
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (port 5001)                             │
│                                                                      │
│   • Generates state & nonce                                          │
│   • Sets PKCE cookies                                                │
│   • Returns 302 redirect to Google                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 3. HTTP 302 Redirect
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH CONSENT                              │
│                                                                      │
│   https://accounts.google.com/o/oauth2/v2/auth                       │
│   ?client_id=...                                                     │
│   &redirect_uri=.../auth/oauth/google/callback                       │
│   &state=...                                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 4. User grants permission
                                    │    Provider redirects to callback
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTER (port 7000)                              │
│                                                                      │
│   GET /auth/oauth/google/callback?code=...&state=...                 │
│   → Proxies to backend                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 5. Backend processes callback
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (port 5001)                             │
│                                                                      │
│   • Verifies PKCE state                                              │
│   • Exchanges code for access token                                  │
│   • Fetches user profile from Google                                 │
│   • Creates/links user account                                       │
│   • Creates session                                                  │
│   • Sets better-auth.session_token cookie                            │
│   • Returns 302 redirect to frontend                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 6. User redirected to app (authenticated)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                            │
│                                                                      │
│   Session cookie is set, user is authenticated                       │
│   Call GET /auth/me to get user info                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Client Implementation Examples

### JavaScript/TypeScript - Initiating OAuth

```typescript
// Redirect to OAuth provider
function loginWithGoogle() {
  window.location.href = '/auth/oauth/google/start';
}

function loginWithGitHub() {
  window.location.href = '/auth/oauth/github/start';
}
```

### JavaScript/TypeScript - Email/Password Login

```typescript
async function login(emailOrUsername: string, password: string) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}
```

### JavaScript/TypeScript - Get Current User

```typescript
async function getCurrentUser() {
  const response = await fetch('/auth/me', {
    credentials: 'include', // Important: include cookies
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null; // Not authenticated
    }
    throw new Error('Failed to get user');
  }

  return response.json();
}
```

### JavaScript/TypeScript - Logout

```typescript
async function logout() {
  const response = await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  // Redirect to login page or update UI
  window.location.href = '/login';
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const loginWithGoogle = () => {
    window.location.href = '/auth/oauth/google/start';
  };

  const loginWithGitHub = () => {
    window.location.href = '/auth/oauth/github/start';
  };

  const logout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  return { user, loading, loginWithGoogle, loginWithGitHub, logout };
}
```

---

## OAuth Provider Setup

### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the consent screen if prompted
6. Select **Web application**
7. Add authorized redirect URIs:
   ```
   https://router.artorizer.com/auth/oauth/google/callback
   http://localhost:7000/auth/oauth/google/callback  (for development)
   ```
8. Save the Client ID and Client Secret

### GitHub OAuth Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - **Homepage URL:** `https://artorizer.com`
   - **Authorization callback URL:** `https://router.artorizer.com/auth/oauth/github/callback`
4. Register the application
5. Generate a client secret
6. Save the Client ID and Client Secret

---

## Environment Configuration

```env
# Enable authentication
AUTH_ENABLED=true

# Backend URL (handles auth logic)
BACKEND_URL=https://backend.artorizer.com

# Allowed origins for CORS
ALLOWED_ORIGINS=https://artorizer.com,https://app.artorizer.com
```

Backend environment variables (configured in backend service):
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Error Handling

### Common Error Responses

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Missing required fields, invalid format |
| 401 | Unauthorized | Invalid credentials, expired session |
| 403 | Forbidden | Account disabled, insufficient permissions |
| 409 | Conflict | Email/username already exists |
| 500 | Server Error | Backend unavailable |

### Error Response Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

---

## Security Considerations

1. **HTTPS Required:** All authentication endpoints must be accessed over HTTPS in production
2. **Cookie Security:** Session cookies are `httpOnly` (no JavaScript access), `secure` (HTTPS only), and `sameSite=Lax`
3. **PKCE:** OAuth flows use Proof Key for Code Exchange to prevent authorization code interception
4. **CORS:** Only allowed origins can make authenticated requests
5. **Credentials:** Always use `credentials: 'include'` when making fetch requests to include cookies

---

## Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Create new account |
| `/auth/login` | POST | No | Email/password login |
| `/auth/logout` | POST | Yes | End session |
| `/auth/me` | GET | Yes | Get current user |
| `/auth/check-availability` | GET | No | Check email/username |
| `/auth/oauth/google/start` | GET | No | Start Google OAuth |
| `/auth/oauth/github/start` | GET | No | Start GitHub OAuth |
| `/auth/oauth/:provider/callback` | GET | OAuth | OAuth callback |
