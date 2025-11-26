# Authentication Guide for Artorize

## Architecture Overview

The authentication system consists of two services:

1. **Artorizer-core-router** (Port: 7000) - API Gateway
   - Your frontend should ONLY connect to this service
   - Handles request proxying and session validation

2. **artorize-storage-backend** (Port: 7001) - Storage Service
   - Backend service (internal only)
   - Contains Better Auth configuration and user data

**IMPORTANT: All frontend requests must go to the Router at `http://localhost:7000`**

---

## Authentication Technology

- **Framework**: Better Auth (modern authentication library)
- **Session Storage**: MongoDB
- **Session Method**: HTTP-only cookies (`better-auth.session_token`)
- **OAuth Providers**: Google, GitHub
- **Security**: AES-256-GCM encryption for PII, Argon2id password hashing

---

## API Endpoints (Frontend → Router)

All endpoints below should be called from your frontend to the **Router** (port 7000).

### Base URL
```
http://localhost:7000
```

### Available Endpoints

#### 1. User Registration
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securePassword123",
  "name": "User Name" // optional
}
```

**Response:** (201 Created)
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }
}
```

**Cookies Set:**
```
Set-Cookie: better-auth.session_token=...; HttpOnly; Secure; SameSite=Lax
```

---

#### 2. User Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com", // or "username"
  "password": "securePassword123"
}
```

**Response:** (200 OK)
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }
}
```

**Cookies Set:**
```
Set-Cookie: better-auth.session_token=...; HttpOnly; Secure; SameSite=Lax
```

---

#### 3. User Logout
```
POST /auth/logout
```

**Request Headers:**
```
Cookie: better-auth.session_token=...
```

**Response:** (204 No Content)

**Cookies Cleared:**
```
Set-Cookie: better-auth.session_token=; Max-Age=0
```

---

#### 4. Get Current User
```
GET /auth/me
```

**Request Headers:**
```
Cookie: better-auth.session_token=...
```

**Response:** (200 OK)
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }
}
```

**Response if Unauthenticated:** (401 Unauthorized)
```json
{
  "error": "Unauthorized"
}
```

---

#### 5. Check Username/Email Availability
```
GET /auth/check-availability?email=user@example.com&username=username
```

**Query Parameters:**
- `email` (optional): Email to check
- `username` (optional): Username to check

**Response:** (200 OK)
```json
{
  "emailAvailable": true,
  "usernameAvailable": false
}
```

**Note:** This endpoint does NOT require authentication.

---

#### 6. OAuth - Start Flow
```
POST /auth/sign-in/social
```

**Request Body:**
```json
{
  "provider": "google"
}
```

**Parameters:**
- `provider` - Either `google` or `github`

**Example:**
```
POST /auth/sign-in/social
Content-Type: application/json

{"provider":"google"}
```

**Response:** (200 OK)
```json
{
  "url": "https://accounts.google.com/o/oauth2/auth?...",
  "redirect": true
}
```

The response contains a `url` that you should navigate the user to. This URL redirects to the OAuth provider's authorization page where the user authenticates with Google/GitHub.

---

#### 7. OAuth - Callback Handler
```
GET /auth/callback/:provider
```

**Parameters:**
- `:provider` - Either `google` or `github`
- Query parameters added by OAuth provider (code, state, etc.)

**Example Callback URLs:**
```
GET /auth/callback/google?code=...&state=...
GET /auth/callback/github?code=...&state=...
```

**Response:** (302 Redirect)
- Creates or links user account
- Sets session cookie
- Redirects to frontend application

**Note:** This endpoint is called automatically by OAuth providers. Your frontend should initiate OAuth by calling the `/auth/sign-in/social` endpoint, which returns a URL to navigate to. After the user authenticates with the OAuth provider, they are redirected back to this callback endpoint.

---

## Authentication Flows

### Flow 1: Email/Password Registration

```
┌─────────┐                    ┌────────┐                    ┌─────────┐
│ Frontend│                    │ Router │                    │ Backend │
└────┬────┘                    └───┬────┘                    └────┬────┘
     │                             │                              │
     │ POST /auth/register         │                              │
     │ {email, username, password} │                              │
     │────────────────────────────>│                              │
     │                             │                              │
     │                             │ Proxy POST /auth/register    │
     │                             │─────────────────────────────>│
     │                             │                              │
     │                             │        Better Auth:          │
     │                             │        - Validate input      │
     │                             │        - Encrypt PII         │
     │                             │        - Hash password       │
     │                             │        - Create user         │
     │                             │        - Create session      │
     │                             │                              │
     │                             │ 201 {user, session}          │
     │                             │ Set-Cookie: session_token    │
     │                             │<─────────────────────────────│
     │                             │                              │
     │ 201 {user, session}         │                              │
     │ Set-Cookie: session_token   │                              │
     │<────────────────────────────│                              │
     │                             │                              │
     │ Store session cookie        │                              │
     │ (automatic by browser)      │                              │
     │                             │                              │
```

**Frontend Code Example:**
```javascript
async function register(email, username, password, name) {
  const response = await fetch('http://localhost:7000/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify({
      email,
      username,
      password,
      name, // optional
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  const data = await response.json();
  return data; // { user, session }
}
```

---

### Flow 2: Email/Password Login

```
┌─────────┐                    ┌────────┐                    ┌─────────┐
│ Frontend│                    │ Router │                    │ Backend │
└────┬────┘                    └───┬────┘                    └────┬────┘
     │                             │                              │
     │ POST /auth/login            │                              │
     │ {emailOrUsername, password} │                              │
     │────────────────────────────>│                              │
     │                             │                              │
     │                             │ Proxy POST /auth/login       │
     │                             │─────────────────────────────>│
     │                             │                              │
     │                             │        Better Auth:          │
     │                             │        - Lookup user         │
     │                             │        - Verify password     │
     │                             │        - Create session      │
     │                             │                              │
     │                             │ 200 {user, session}          │
     │                             │ Set-Cookie: session_token    │
     │                             │<─────────────────────────────│
     │                             │                              │
     │ 200 {user, session}         │                              │
     │ Set-Cookie: session_token   │                              │
     │<────────────────────────────│                              │
     │                             │                              │
```

**Frontend Code Example:**
```javascript
async function login(emailOrUsername, password) {
  const response = await fetch('http://localhost:7000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify({
      emailOrUsername,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return data; // { user, session }
}
```

---

### Flow 3: Get Current User (Session Validation)

```
┌─────────┐                    ┌────────┐                    ┌─────────┐
│ Frontend│                    │ Router │                    │ Backend │
└────┬────┘                    └───┬────┘                    └────┬────┘
     │                             │                              │
     │ GET /auth/me                │                              │
     │ Cookie: session_token       │                              │
     │────────────────────────────>│                              │
     │                             │                              │
     │                             │ Proxy GET /auth/me           │
     │                             │ Cookie: session_token        │
     │                             │─────────────────────────────>│
     │                             │                              │
     │                             │        Better Auth:          │
     │                             │        - Validate session    │
     │                             │        - Fetch user data     │
     │                             │                              │
     │                             │ 200 {user, session}          │
     │                             │<─────────────────────────────│
     │                             │                              │
     │ 200 {user, session}         │                              │
     │<────────────────────────────│                              │
     │                             │                              │
```

**Frontend Code Example:**
```javascript
async function getCurrentUser() {
  const response = await fetch('http://localhost:7000/auth/me', {
    method: 'GET',
    credentials: 'include', // Important: Include cookies
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null; // User not authenticated
    }
    throw new Error('Failed to fetch user');
  }

  const data = await response.json();
  return data; // { user, session }
}
```

---

### Flow 4: Logout

```
┌─────────┐                    ┌────────┐                    ┌─────────┐
│ Frontend│                    │ Router │                    │ Backend │
└────┬────┘                    └───┬────┘                    └────┬────┘
     │                             │                              │
     │ POST /auth/logout           │                              │
     │ Cookie: session_token       │                              │
     │────────────────────────────>│                              │
     │                             │                              │
     │                             │ Proxy POST /auth/logout      │
     │                             │ Cookie: session_token        │
     │                             │─────────────────────────────>│
     │                             │                              │
     │                             │        Better Auth:          │
     │                             │        - Invalidate session  │
     │                             │                              │
     │                             │ 204 No Content               │
     │                             │ Set-Cookie: Max-Age=0        │
     │                             │<─────────────────────────────│
     │                             │                              │
     │ 204 No Content              │                              │
     │ Set-Cookie: Max-Age=0       │                              │
     │<────────────────────────────│                              │
     │                             │                              │
     │ Cookie cleared by browser   │                              │
     │                             │                              │
```

**Frontend Code Example:**
```javascript
async function logout() {
  const response = await fetch('http://localhost:7000/auth/logout', {
    method: 'POST',
    credentials: 'include', // Important: Include cookies
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  // Cookie is automatically cleared by browser
  return true;
}
```

---

### Flow 5: OAuth Authentication (Google/GitHub)

```
┌─────────┐        ┌────────┐        ┌─────────┐        ┌──────────┐
│ Frontend│        │ Router │        │ Backend │        │  OAuth   │
│         │        │        │        │         │        │ Provider │
└────┬────┘        └───┬────┘        └────┬────┘        └────┬─────┘
     │                 │                  │                  │
     │ User clicks     │                  │                  │
     │ "Login with     │                  │                  │
     │  Google"        │                  │                  │
     │                 │                  │                  │
     │ POST /auth/     │                  │                  │
     │  sign-in/social │                  │                  │
     │  {provider:     │                  │                  │
     │   "google"}     │                  │                  │
     │────────────────>│                  │                  │
     │                 │                  │                  │
     │                 │ Proxy POST /auth/│                  │
     │                 │  sign-in/social  │                  │
     │                 │─────────────────>│                  │
     │                 │                  │                  │
     │                 │                  │ Generate OAuth   │
     │                 │                  │ authorization URL│
     │                 │                  │                  │
     │                 │ 200 OK           │                  │
     │                 │ {url: "https://..│                  │
     │                 │   ...google..."}  │                  │
     │                 │<─────────────────│                  │
     │                 │                  │                  │
     │ {url: "https://│                  │                  │
     │  ...google..."}│                  │                  │
     │<────────────────│                  │                  │
     │                 │                  │                  │
     │ Navigate to URL │                  │                  │
     │─────────────────────────────────────────────────────>│
     │                 │                  │                  │
     │                 │                  │    User logs in  │
     │                 │                  │    and authorizes│
     │                 │                  │                  │
     │          302 Redirect to callback URL                │
     │          /auth/callback/google?code=...&state=...    │
     │<─────────────────────────────────────────────────────│
     │                 │                  │                  │
     │ Navigate to     │                  │                  │
     │ /auth/callback/ │                  │                  │
     │  google?code... │                  │                  │
     │────────────────>│                  │                  │
     │                 │                  │                  │
     │                 │ Proxy GET /auth/ │                  │
     │                 │  callback/google?│                  │
     │                 │  code...         │                  │
     │                 │─────────────────>│                  │
     │                 │                  │                  │
     │                 │                  │ Exchange code    │
     │                 │                  │ for tokens       │
     │                 │                  │─────────────────>│
     │                 │                  │                  │
     │                 │                  │ Access token +   │
     │                 │                  │ user profile     │
     │                 │                  │<─────────────────│
     │                 │                  │                  │
     │                 │      Better Auth:│                  │
     │                 │      - Create/   │                  │
     │                 │        link user │                  │
     │                 │      - Encrypt   │                  │
     │                 │        tokens    │                  │
     │                 │      - Create    │                  │
     │                 │        session   │                  │
     │                 │                  │                  │
     │                 │ 302 Redirect to  │                  │
     │                 │ frontend app     │                  │
     │                 │ Set-Cookie:      │                  │
     │                 │  session_token   │                  │
     │                 │<─────────────────│                  │
     │                 │                  │                  │
     │ 302 Redirect to │                  │                  │
     │ frontend app    │                  │                  │
     │ Set-Cookie:     │                  │                  │
     │  session_token  │                  │                  │
     │<────────────────│                  │                  │
     │                 │                  │                  │
     │ User is now     │                  │                  │
     │ authenticated!  │                  │                  │
     │                 │                  │                  │
```

**Frontend Code Example:**
```javascript
// Initiate OAuth flow
async function loginWithGoogle() {
  try {
    const response = await fetch('http://localhost:7000/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider: 'google' }),
    });

    if (!response.ok) throw new Error('Failed to start OAuth');

    const data = await response.json();
    // Navigate to the OAuth provider
    window.location.href = data.url;
  } catch (error) {
    console.error('OAuth error:', error);
  }
}

async function loginWithGithub() {
  try {
    const response = await fetch('http://localhost:7000/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider: 'github' }),
    });

    if (!response.ok) throw new Error('Failed to start OAuth');

    const data = await response.json();
    // Navigate to the OAuth provider
    window.location.href = data.url;
  } catch (error) {
    console.error('OAuth error:', error);
  }
}

// Option 2: Open in popup window
async function loginWithGooglePopup() {
  const width = 500;
  const height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  try {
    const response = await fetch('http://localhost:7000/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider: 'google' }),
    });

    if (!response.ok) throw new Error('Failed to start OAuth');

    const data = await response.json();
    const popup = window.open(
      data.url,
      'oauth-login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for popup close or message
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkInterval);
        // Check if user is now authenticated
        getCurrentUser().then(user => {
          if (user) {
            console.log('Login successful:', user);
          }
        });
      }
    }, 500);
  } catch (error) {
    console.error('OAuth error:', error);
  }
}
```

---

## Making Authenticated Requests

Once a user is authenticated, their session cookie is automatically included in all requests to the same domain.

### Important: Always Include Credentials

When making requests from your frontend, ALWAYS include `credentials: 'include'`:

```javascript
fetch('http://localhost:7000/api/protected-endpoint', {
  method: 'GET',
  credentials: 'include', // This includes the session cookie
})
```

### How Protected Routes Work

When you call any protected endpoint:

1. **Frontend** sends request with `credentials: 'include'`
2. **Router** intercepts the request
3. **Router middleware** validates session by calling `/auth/me`
4. If valid, router attaches user context and forwards to backend:
   ```
   X-User-Id: user-uuid
   X-User-Email: user@example.com
   X-User-Name: User Name
   ```
5. **Backend** receives headers and uses them for access control

### Example: Fetching User's Artworks

```javascript
async function getMyArtworks() {
  const response = await fetch('http://localhost:7000/api/artworks', {
    method: 'GET',
    credentials: 'include', // Session cookie included automatically
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch artworks');
  }

  const artworks = await response.json();
  return artworks;
}
```

---

## Session Management

### Cookie Details

- **Cookie Name**: `better-auth.session_token`
- **Properties**:
  - `HttpOnly` - Cannot be accessed by JavaScript (prevents XSS)
  - `Secure` - Only sent over HTTPS in production
  - `SameSite=Lax` - CSRF protection
- **Storage**: MongoDB (sessions collection)
- **Expiration**: Configured by Better Auth (check backend config)

### Checking Authentication State

To check if a user is authenticated on app load:

```javascript
async function initializeAuth() {
  try {
    const data = await getCurrentUser();
    if (data && data.user) {
      console.log('User is authenticated:', data.user);
      return data.user;
    }
  } catch (error) {
    console.log('User is not authenticated');
  }
  return null;
}

// Call on app initialization
initializeAuth().then(user => {
  if (user) {
    // Render authenticated UI
  } else {
    // Render login UI
  }
});
```

### Handling Session Expiration

When a session expires:

1. Requests to protected endpoints will return `401 Unauthorized`
2. Your frontend should detect this and redirect to login
3. Better Auth automatically cleans up expired sessions via TTL indexes

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Session expired or user not authenticated
    console.log('Session expired, redirecting to login');
    window.location.href = '/login';
    return null;
  }

  return response;
}
```

---

## Error Handling

### Common Error Responses

#### Registration Errors
```json
{
  "error": "Email already exists"
}
```
```json
{
  "error": "Username already taken"
}
```

#### Login Errors
```json
{
  "error": "Invalid credentials"
}
```

#### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "No valid session found"
}
```

### Frontend Error Handling Example

```javascript
async function handleAuthRequest(requestFn) {
  try {
    return await requestFn();
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('already exists')) {
      // Show user-friendly message
      alert('An account with this email already exists');
    } else {
      // Generic error handling
      console.error('Request failed:', error);
      alert('Something went wrong. Please try again.');
    }
  }
}
```

---

## Complete Frontend Auth Context Example

Here's a complete React context example for managing authentication:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('http://localhost:7000/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function register(email, username, password, name) {
    const response = await fetch('http://localhost:7000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    return data;
  }

  async function login(emailOrUsername, password) {
    const response = await fetch('http://localhost:7000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emailOrUsername, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    return data;
  }

  async function logout() {
    const response = await fetch('http://localhost:7000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      setUser(null);
    }
  }

  async function loginWithGoogle() {
    try {
      const response = await fetch('http://localhost:7000/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'google' }),
      });

      if (!response.ok) throw new Error('Failed to start OAuth');

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('OAuth error:', error);
    }
  }

  async function loginWithGithub() {
    try {
      const response = await fetch('http://localhost:7000/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'github' }),
      });

      if (!response.ok) throw new Error('Failed to start OAuth');

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('OAuth error:', error);
    }
  }

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    loginWithGoogle,
    loginWithGithub,
    checkAuth, // Useful for revalidating after OAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Usage:**
```javascript
function LoginPage() {
  const { login, loginWithGoogle, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    }
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email or username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>

      {error && <div className="error">{error}</div>}

      <button type="button" onClick={loginWithGoogle}>
        Login with Google
      </button>
    </form>
  );
}
```

---

## File References

### Router (Frontend connects here)

| File | Line | Description |
|------|------|-------------|
| `Artorizer-core-router/src/routes/auth.ts` | 1-200 | All auth route handlers |
| `Artorizer-core-router/src/middleware/auth.middleware.ts` | 1-100 | Session validation middleware |

### Backend (Internal only)

| File | Line | Description |
|------|------|-------------|
| `artorize-storage-backend/src/auth/betterAuth.js` | 1-300 | Better Auth configuration |
| `artorize-storage-backend/src/routes/auth.routes.js` | 1-50 | Auth routes (check-availability) |
| `artorize-storage-backend/src/middlewares/auth.js` | 1-150 | Authentication middleware |

---

## Security Considerations

1. **Always use `credentials: 'include'`** in fetch requests
2. **Never store tokens in localStorage** - cookies are more secure (HttpOnly)
3. **HTTPS in production** - Session cookies should only be sent over HTTPS
4. **CORS configuration** - Ensure your frontend domain is allowed
5. **Password requirements** - Enforce strong passwords on frontend and backend
6. **Rate limiting** - Consider implementing rate limiting for auth endpoints

---

## Troubleshooting

### Issue: "Unauthorized" errors even after login

**Solution:** Make sure you're including `credentials: 'include'` in ALL fetch requests.

### Issue: OAuth redirects not working

**Solution:** Check that `APP_BASE_URL` in backend `.env` matches your router URL:
```
APP_BASE_URL=http://localhost:7000
```

### Issue: Session not persisting

**Solution:**
- Check that cookies are enabled in browser
- Verify CORS allows credentials
- Ensure frontend and backend are on same domain or configured for cross-origin cookies

### Issue: Can't login with username

**Solution:** Ensure you're using `emailOrUsername` field in login request, not separate fields.

---

## Environment Variables Required

### Backend (.env in artorize-storage-backend)

```env
# Better Auth
BETTER_AUTH_SECRET=your-32-character-secret-here
APP_ENCRYPTION_KEY=base64-encoded-32-byte-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Base URL for OAuth callbacks
APP_BASE_URL=http://localhost:7000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/artorize
```

---

## Summary

✅ **Frontend connects to**: Router at `http://localhost:7000`
✅ **All auth endpoints**: `/auth/*`
✅ **Session method**: HTTP-only cookies (automatic)
✅ **OAuth providers**: Google, GitHub
✅ **Protected routes**: Include `credentials: 'include'`
✅ **User context**: Automatically forwarded via headers to backend

For additional questions or issues, refer to the file references above or check Better Auth documentation.