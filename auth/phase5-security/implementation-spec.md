# Phase 5: Implementation Specification

## Session Management

### Auto Session Refresh

Better Auth handles automatically, but you can implement custom logic:

```javascript
/**
 * Session Refresh Manager
 * Refreshes session before expiry
 */
class SessionRefreshManager {
  constructor(authManager) {
    this.auth = authManager;
    this.refreshTimer = null;
  }

  /**
   * Start auto-refresh
   * Refreshes session 1 hour before expiry
   */
  async start() {
    const session = await this.auth.getSession();
    if (!session) return;

    // Calculate time until refresh (1 hour before expiry)
    const expiresAt = new Date(session.session.expiresAt);
    const refreshAt = new Date(expiresAt.getTime() - 3600000); // 1 hour before
    const msUntilRefresh = refreshAt.getTime() - Date.now();

    if (msUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => this.refresh(), msUntilRefresh);
    }
  }

  /**
   * Refresh session
   */
  async refresh() {
    await this.auth.getSession();  // Better Auth auto-refreshes
    this.start();  // Schedule next refresh
  }

  /**
   * Stop auto-refresh
   */
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Usage in dashboard
const refreshManager = new SessionRefreshManager(auth);
refreshManager.start();
```

---

## Logout Implementation

### Complete Logout

```javascript
/**
 * Logout with cleanup
 */
async function logout() {
  try {
    // 1. Call Better Auth signOut
    await authClient.signOut();

    // 2. Clear local state
    sessionManager.clear();

    // 3. Clear any cached data
    localStorage.removeItem('artorizer_cache');
    sessionStorage.clear();

    // 4. Redirect to login
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    // Force redirect anyway
    window.location.href = '/login.html';
  }
}
```

---

## Security Headers (Backend)

### File: `src/middleware/security.js`

```javascript
/**
 * Security Headers Middleware
 */
export function securityHeaders(req, res, next) {
  // Content Security Policy
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' https://esm.sh https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://router.artorizer.com"
  );

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // HTTPS only in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload");
  }

  // Permissions Policy
  res.setHeader("Permissions-Policy",
    "geolocation=(), microphone=(), camera=()");

  next();
}

// Apply to all routes
app.use(securityHeaders);
```

---

## HTTPS Enforcement (Production)

### Force HTTPS Middleware

```javascript
/**
 * Redirect HTTP to HTTPS in production
 */
export function forceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

app.use(forceHTTPS);
```

---

## Cookie Configuration

Better Auth configures automatically, but verify:

```javascript
session: {
  cookieOptions: {
    httpOnly: true,              // ✅ Not accessible to JavaScript
    secure: NODE_ENV === 'production',  // ✅ HTTPS only in prod
    sameSite: 'lax',            // ✅ CSRF protection
    path: '/',
    maxAge: 604800000           // 7 days in ms
  }
}
```

---

## Input Validation

### Sanitize User Input

```javascript
/**
 * Sanitize filename for upload
 */
function sanitizeFilename(filename) {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '');

  // Allow only alphanumeric, dash, underscore, dot
  filename = filename.replace(/[^a-zA-Z0-9-_.]/g, '_');

  // Limit length
  if (filename.length > 255) {
    filename = filename.substring(0, 255);
  }

  return filename;
}
```

---

## Rate Limiting (Additional)

Beyond Better Auth's built-in rate limiting:

```javascript
import rateLimit from 'express-rate-limit';

// Upload endpoint rate limit
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: 'Too many uploads, please try again later'
});

app.post('/api/upload', requireAuth, uploadLimiter, uploadHandler);
```

---

## Audit Logging

### Log Security Events

```javascript
/**
 * Log authentication events
 */
function logAuthEvent(event, userId, details) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    userId,
    ip: details.ip,
    userAgent: details.userAgent
  }));
}

// Usage
logAuthEvent('login_success', user.id, { ip: req.ip, userAgent: req.headers['user-agent'] });
logAuthEvent('login_failed', null, { ip: req.ip, email: req.body.email });
logAuthEvent('logout', user.id, { ip: req.ip });
```

---

## Success Criteria

- [ ] httpOnly cookies configured
- [ ] Secure flag enabled in production
- [ ] HTTPS enforced in production
- [ ] Security headers applied
- [ ] CSRF protection active
- [ ] Rate limiting configured
- [ ] Audit logging implemented
- [ ] Input validation on uploads
- [ ] Session auto-refresh working
- [ ] Logout clears all data
