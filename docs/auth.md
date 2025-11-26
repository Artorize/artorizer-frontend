# Authentication Guide for Artorize Frontend

## Quick Reference

| Action | Method | Endpoint | Auth Required |
|--------|--------|----------|---------------|
| Register | POST | `/auth/register` | No |
| Login | POST | `/auth/login` | No |
| Logout | POST | `/auth/logout` | Yes (cookie) |
| Get Session | GET | `/auth/me` | Yes (cookie) |
| Check Availability | GET | `/auth/check-availability` | No |
| Google OAuth | POST | `/auth/sign-in/social` | No |
| GitHub OAuth | POST | `/auth/sign-in/social` | No |
| OAuth Callback | GET | `/auth/callback/:provider` | Automatic |

---

## Architecture Overview

```
┌─────────────┐              ┌─────────────────────┐              ┌──────────────────────┐
│   Frontend  │─────────────>│ Artorizer-core-router│─────────────>│ artorize-storage-backend│
│             │    :7000     │     (API Gateway)    │    :5001     │   (Better Auth)       │
└─────────────┘              └─────────────────────┘              └──────────────────────┘
```

**IMPORTANT: All frontend requests MUST go to the Router**

| Environment | Router URL |
|-------------|------------|
| Development | `http://localhost:7000` |
| Production | `https://router.artorizer.com` |

---

## Authentication Technology

- **Framework**: Better Auth
- **Session Storage**: MongoDB
- **Session Method**: HTTP-only cookies (`better-auth.session_token`)
- **Session Duration**: 7 days with automatic refresh
- **OAuth Providers**: Google, GitHub
- **Security**: AES-256-GCM encryption, Argon2id password hashing

---

## API Endpoints

### 1. User Registration

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "name": "John Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| username | string | Yes | Unique username |
| password | string | Yes | Minimum 8 characters |
| name | string | No | Display name |

**Response (201 Created):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-03T12:00:00.000Z"
  }
}
```

**Errors:**
| Status | Error |
|--------|-------|
| 400 | `Invalid email format` |
| 409 | `Email already exists` |
| 409 | `Username already taken` |

**Frontend Example:**
```javascript
async function register(email, username, password, name) {
  const response = await fetch('http://localhost:7000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, username, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}
```

---

### 2. User Login

```
POST /auth/login
```

**Request:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "securePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| emailOrUsername | string | Yes | Email OR username |
| password | string | Yes | User's password |

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-03T12:00:00.000Z"
  }
}
```

**Errors:**
| Status | Error |
|--------|-------|
| 401 | `Invalid credentials` |

**Frontend Example:**
```javascript
async function login(emailOrUsername, password) {
  const response = await fetch('http://localhost:7000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}
```

---

### 3. User Logout

```
POST /auth/logout
```

**Request:**
- Requires session cookie (automatic with `credentials: 'include'`)

**Response (204 No Content)**

**Frontend Example:**
```javascript
async function logout() {
  const response = await fetch('http://localhost:7000/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Logout failed');
  }

  return true;
}
```

---

### 4. Get Current User / Validate Session

```
GET /auth/me
```

This is the **primary endpoint for session validation**. Call this to:
- Check if user is authenticated
- Get current user data
- Validate session on app load

**Request:**
- Requires session cookie (automatic with `credentials: 'include'`)

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "image": "https://...",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-03T12:00:00.000Z"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Frontend Example:**
```javascript
async function getCurrentUser() {
  const response = await fetch('http://localhost:7000/auth/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null; // Not authenticated
    }
    throw new Error('Failed to fetch user');
  }

  return response.json();
}
```

---

### 5. Check Username/Email Availability

```
GET /auth/check-availability?email=user@example.com&username=johndoe
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | No | Email to check |
| username | string | No | Username to check |

At least one parameter is required.

**Response (200 OK):**
```json
{
  "emailAvailable": true,
  "usernameAvailable": false
}
```

**Frontend Example:**
```javascript
async function checkAvailability(email, username) {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (username) params.append('username', username);

  const response = await fetch(
    `http://localhost:7000/auth/check-availability?${params}`,
    { method: 'GET' }
  );

  return response.json();
}
```

---

## OAuth Authentication (Google / GitHub)

### How OAuth Works

```
┌──────────┐     1. POST /auth/sign-in/social     ┌────────┐
│ Frontend │ ─────────────────────────────────────>│ Router │
│          │                                       │        │
│          │<───────────────────────────────────── │        │
└──────────┘     2. {url: "https://google...",     └────────┘
     │              redirect: true}
     │
     │ 3. Navigate to OAuth URL
     ▼
┌──────────────┐
│ Google/GitHub│
│   Login Page │
│              │
│  User logs in│
└──────────────┘
     │
     │ 4. Redirect to /auth/callback/:provider
     ▼
┌────────┐     5. Process callback      ┌─────────┐
│ Router │ ─────────────────────────────>│ Backend │
│        │<───────────────────────────── │         │
│        │     Set-Cookie: session       └─────────┘
└────────┘
     │
     │ 6. Redirect to frontend with session cookie
     ▼
┌──────────┐
│ Frontend │  User is now authenticated!
│/dashboard│
└──────────┘
```

### 6. Start OAuth Flow

```
POST /auth/sign-in/social
```

**Request:**
```json
{
  "provider": "google"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| provider | string | Yes | `google` or `github` |

**Response (200 OK):**
```json
{
  "url": "https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...&scope=...",
  "redirect": true
}
```

**Frontend Example - Full Page Redirect:**
```javascript
async function loginWithGoogle() {
  const response = await fetch('http://localhost:7000/auth/sign-in/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ provider: 'google' }),
  });

  if (!response.ok) {
    throw new Error('Failed to start OAuth');
  }

  const data = await response.json();

  // Redirect user to OAuth provider
  window.location.href = data.url;
}

async function loginWithGithub() {
  const response = await fetch('http://localhost:7000/auth/sign-in/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ provider: 'github' }),
  });

  if (!response.ok) {
    throw new Error('Failed to start OAuth');
  }

  const data = await response.json();
  window.location.href = data.url;
}
```

**Frontend Example - Popup Window:**
```javascript
async function loginWithGooglePopup() {
  const width = 500;
  const height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  const response = await fetch('http://localhost:7000/auth/sign-in/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ provider: 'google' }),
  });

  if (!response.ok) {
    throw new Error('Failed to start OAuth');
  }

  const data = await response.json();

  const popup = window.open(
    data.url,
    'oauth-login',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  // Poll for popup close
  const checkInterval = setInterval(async () => {
    if (popup.closed) {
      clearInterval(checkInterval);
      // Check authentication status
      const user = await getCurrentUser();
      if (user) {
        console.log('Login successful:', user);
        // Update app state
      }
    }
  }, 500);
}
```

### 7. OAuth Callback (Automatic)

```
GET /auth/callback/:provider
```

This endpoint is called automatically by the OAuth provider after user authentication.

**After Successful OAuth:**
- Session cookie is set automatically
- User is redirected to: `https://artorizer.com/dashboard?auth=success`

**After Failed OAuth:**
- User is redirected to: `https://artorizer.com/auth/error?error=...&error_description=...`

**Handling OAuth Callback in Frontend:**
```javascript
// In your dashboard or callback page component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('auth') === 'success') {
    // OAuth completed, fetch user data
    getCurrentUser().then(data => {
      if (data?.user) {
        setUser(data.user);
      }
    });

    // Clean up URL
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

### 8. OAuth Error Page

```
GET /auth/error?error=STATE_MISMATCH&error_description=...
```

**Error Types:**
| Error Code | Description | User Message |
|------------|-------------|--------------|
| `state_mismatch` | OAuth state validation failed | "Session expired. Please try again." |
| `invalid_grant` | Authorization code expired | "Login expired. Please try again." |
| `access_denied` | User denied OAuth permission | "You denied access. Please try again." |
| `server_error` | Internal server error | "Something went wrong. Please try again." |

**Error Page Example:**
```javascript
function OAuthErrorPage() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const description = params.get('error_description');

  const errorMessages = {
    state_mismatch: 'Your session expired. Please try logging in again.',
    invalid_grant: 'The login link expired. Please try again.',
    access_denied: 'You cancelled the login. Click below to try again.',
    server_error: 'Something went wrong on our end. Please try again.',
  };

  return (
    <div>
      <h1>Login Failed</h1>
      <p>{errorMessages[error] || description || 'An error occurred.'}</p>
      <button onClick={() => window.location.href = '/login'}>
        Try Again
      </button>
    </div>
  );
}
```

---

## Session Management

### Session Cookie Details

| Property | Value |
|----------|-------|
| Name | `better-auth.session_token` |
| HttpOnly | Yes (cannot access via JavaScript) |
| Secure | Yes (HTTPS only in production) |
| SameSite | Lax (CSRF protection) |
| Path | `/` |
| Duration | 7 days |

### Checking Authentication on App Load

```javascript
async function initializeAuth() {
  try {
    const data = await getCurrentUser();
    if (data?.user) {
      return { user: data.user, session: data.session };
    }
  } catch (error) {
    console.log('User not authenticated');
  }
  return { user: null, session: null };
}

// Call on app initialization
initializeAuth().then(({ user }) => {
  if (user) {
    // Show authenticated UI
  } else {
    // Show login UI
  }
});
```

### Handling Session Expiration

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Session expired
    console.log('Session expired, redirecting to login');
    window.location.href = '/login';
    return null;
  }

  return response;
}
```

---

## Making Authenticated Requests

**CRITICAL: Always include `credentials: 'include'`**

```javascript
// Correct
fetch('http://localhost:7000/api/artworks', {
  method: 'GET',
  credentials: 'include',  // REQUIRED for session cookie
});

// Incorrect - will not include session cookie
fetch('http://localhost:7000/api/artworks', {
  method: 'GET',
});
```

### Example: Fetching User's Artworks

```javascript
async function getMyArtworks() {
  const response = await fetch('http://localhost:7000/artworks/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch artworks');
  }

  return response.json();
}
```

### Example: Uploading with Authentication

```javascript
async function uploadArtwork(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:7000/artworks', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please login to upload');
    }
    throw new Error('Upload failed');
  }

  return response.json();
}
```

---

## Complete React Auth Context

```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:7000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSession(data.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, username, password, name) => {
    setError(null);
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username, password, name }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    setSession(data.session);
    return data;
  }, []);

  const login = useCallback(async (emailOrUsername, password) => {
    setError(null);
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emailOrUsername, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setSession(data.session);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // Always clear local state, even if request fails
    setUser(null);
    setSession(null);

    if (!response.ok && response.status !== 204) {
      throw new Error('Logout failed');
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const response = await fetch(`${API_BASE}/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider: 'google' }),
    });

    if (!response.ok) {
      throw new Error('Failed to start Google login');
    }

    const data = await response.json();
    window.location.href = data.url;
  }, []);

  const loginWithGithub = useCallback(async () => {
    const response = await fetch(`${API_BASE}/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider: 'github' }),
    });

    if (!response.ok) {
      throw new Error('Failed to start GitHub login');
    }

    const data = await response.json();
    window.location.href = data.url;
  }, []);

  const checkAvailability = useCallback(async (email, username) => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (username) params.append('username', username);

    const response = await fetch(
      `${API_BASE}/auth/check-availability?${params}`,
      { method: 'GET' }
    );

    return response.json();
  }, []);

  const value = {
    // State
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,

    // Actions
    register,
    login,
    logout,
    loginWithGoogle,
    loginWithGithub,
    checkAuth,
    checkAvailability,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Usage Examples

**App Setup:**
```javascript
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes />
      </Router>
    </AuthProvider>
  );
}
```

**Login Page:**
```javascript
function LoginPage() {
  const { login, loginWithGoogle, loginWithGithub, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
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

      <div className="oauth-buttons">
        <button type="button" onClick={loginWithGoogle}>
          Login with Google
        </button>
        <button type="button" onClick={loginWithGithub}>
          Login with GitHub
        </button>
      </div>
    </form>
  );
}
```

**Protected Route:**
```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : null;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

**Registration with Availability Check:**
```javascript
function RegisterPage() {
  const { register, checkAvailability } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [availability, setAvailability] = useState({});

  // Debounced availability check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (email || username) {
        const result = await checkAvailability(email, username);
        setAvailability(result);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, username, checkAvailability]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register(email, username, password);
      // Redirect to dashboard
    } catch (err) {
      // Handle error
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      {email && !availability.emailAvailable && (
        <span className="error">Email already in use</span>
      )}

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      {username && !availability.usernameAvailable && (
        <span className="error">Username taken</span>
      )}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <button type="submit">Register</button>
    </form>
  );
}
```

---

## Error Handling Reference

### Authentication Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Invalid email format` | Email validation failed |
| 400 | `Password too short` | Password must be 8+ characters |
| 401 | `Invalid credentials` | Wrong email/username or password |
| 401 | `Unauthorized` | No valid session |
| 409 | `Email already exists` | Email is registered |
| 409 | `Username already taken` | Username is taken |
| 500 | `Internal server error` | Server error |

### Centralized Error Handler

```javascript
async function authRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || data.message || 'Request failed');
      error.status = response.status;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error.status === 401) {
      // Handle session expiration
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw error;
  }
}

// Listen for auth expiration globally
window.addEventListener('auth:expired', () => {
  // Clear local state and redirect to login
  window.location.href = '/login?expired=true';
});
```

---

## Security Best Practices

1. **Always use `credentials: 'include'`** - Required for session cookies
2. **Never store tokens in localStorage** - Cookies are more secure (HttpOnly)
3. **Use HTTPS in production** - Session cookies require HTTPS
4. **Handle 401 responses** - Redirect to login on session expiration
5. **Validate on both client and server** - Never trust client-side validation alone
6. **Use CSRF protection** - SameSite cookies provide this automatically

---

## Troubleshooting

### "Unauthorized" errors after login

**Cause:** Missing `credentials: 'include'` in fetch requests.

**Solution:**
```javascript
// Add credentials to ALL authenticated requests
fetch(url, { credentials: 'include' });
```

### OAuth not redirecting back

**Cause:** Incorrect `APP_BASE_URL` in backend configuration.

**Solution:** Ensure backend `.env` has:
```
APP_BASE_URL=http://localhost:7000  # Development
# or
APP_BASE_URL=https://router.artorizer.com  # Production
```

### Session not persisting across page reloads

**Cause:** Cookies not being set due to cross-origin issues.

**Solution:**
1. Ensure frontend and API are on same domain or properly configured for CORS
2. Check browser cookie settings
3. Verify CORS configuration allows credentials

### Can't login with username

**Cause:** Using wrong field name in request.

**Solution:** Use `emailOrUsername` field, not separate `email` and `username`:
```javascript
{ emailOrUsername: 'johndoe', password: '...' }
```

### OAuth state mismatch error

**Cause:** Session cookie expired during OAuth flow or browser blocks third-party cookies.

**Solution:**
1. Ensure cookies are enabled
2. Complete OAuth flow quickly
3. Check browser third-party cookie settings

---

## Environment Configuration

### Frontend Environment Variables

```env
REACT_APP_API_URL=http://localhost:7000
```

### Backend Required Environment Variables

```env
# Better Auth
BETTER_AUTH_SECRET=your-32-character-secret-here
APP_ENCRYPTION_KEY=base64-encoded-32-byte-key
APP_BASE_URL=http://localhost:7000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/artorize
```

---

## Quick Summary

| What | Endpoint | Method | Note |
|------|----------|--------|------|
| Register | `/auth/register` | POST | Returns user + session |
| Login | `/auth/login` | POST | Use `emailOrUsername` field |
| Logout | `/auth/logout` | POST | Clears session cookie |
| Get Session | `/auth/me` | GET | Main session validation endpoint |
| Check Availability | `/auth/check-availability` | GET | No auth required |
| Start Google OAuth | `/auth/sign-in/social` | POST | `{provider: "google"}` |
| Start GitHub OAuth | `/auth/sign-in/social` | POST | `{provider: "github"}` |

**Remember:** All requests must include `credentials: 'include'` for cookie authentication!
