# Backend & Router Requirements for Authentication

This document specifies **exactly** what the backend/router needs to implement to integrate with the frontend authentication system.

All frontend code is **already implemented** and ready to use. This document is the single source of truth for backend implementation.

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Required npm Packages](#required-npm-packages)
3. [Environment Variables](#environment-variables)
4. [Better Auth Configuration](#better-auth-configuration)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [CORS Configuration](#cors-configuration)
8. [OAuth Provider Setup](#oauth-provider-setup)
9. [Testing the Integration](#testing-the-integration)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Quick Overview

**What we're using**: [Better Auth](https://www.better-auth.com/) - MIT licensed, self-hosted, framework-agnostic authentication

**Why Better Auth**:
- 100% open source, no vendor lock-in
- No monthly fees or user limits
- Works with vanilla JavaScript (no build step needed)
- Built-in OAuth providers (Google, GitHub)
- Session management via httpOnly cookies (secure by default)

**Frontend Status**: ✅ **100% Complete**
- All UI components implemented
- Authentication state management ready
- Route guards configured
- Mock backend for development
- Ready to connect to real backend

**Backend Status**: ❌ **Needs Implementation** (this document)

---

## Required npm Packages

Install these on the router backend:

```bash
npm install better-auth@latest
npm install pg@^8.11.0  # PostgreSQL client (or mysql2 if using MySQL)
```

That's it! No other auth-related packages needed.

---

## Environment Variables

Add these to your router backend `.env` file:

```bash
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=artorizer
DB_PASSWORD=<your-secure-password>
DB_NAME=artorizer_db

# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=https://router.artorizer.com

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# GitHub OAuth (from GitHub Developer Settings)
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# CORS - Frontend origins that can make requests
ALLOWED_ORIGINS=https://artorizer.com,http://localhost:8080

# Optional: Rate limiting
RATE_LIMIT_MAX=100  # requests per window
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
```

**Important Security Notes**:
- Never commit `.env` to git
- Use different secrets for development/production
- BETTER_AUTH_SECRET must be at least 32 characters
- Store secrets in environment variables, not in code

---

## Better Auth Configuration

Create `auth.js` in your router backend:

```javascript
// router/auth.js
import { betterAuth } from 'better-auth';
import { Pool } from 'pg'; // or import mysql from 'mysql2/promise' for MySQL

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Better Auth instance
export const auth = betterAuth({
  // Database adapter
  database: {
    type: 'postgres', // or 'mysql'
    pool,
  },

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Base URL of your application
  baseURL: process.env.BETTER_AUTH_URL,

  // Trusted origins (for CORS)
  trustedOrigins: process.env.ALLOWED_ORIGINS.split(','),

  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Redirect URI will be: https://router.artorizer.com/api/auth/callback/google
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Redirect URI will be: https://router.artorizer.com/api/auth/callback/github
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Refresh if < 1 day remaining
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Advanced security options
  advanced: {
    cookiePrefix: 'better-auth',
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false, // Enable if you need cross-subdomain auth
    },
    generateSessionToken: () => {
      // Use default secure token generation
      return undefined;
    },
  },
});
```

---

## Database Schema

Better Auth will automatically create these tables when you run migrations:

### Run Database Migration

```bash
# In your router backend directory
npx better-auth migrate
```

This creates the following tables:

### 1. `users` Table

Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  name VARCHAR(255),
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### 2. `accounts` Table

Links users to OAuth providers.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider);
```

### 3. `sessions` Table

Stores active user sessions.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### 4. Link Existing Tables to Users

You need to add `user_id` to your existing artwork/job tables:

```sql
-- Add user_id to artworks table
ALTER TABLE artworks
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_artworks_user_id ON artworks(user_id);

-- Add user_id to jobs table (if you have one)
ALTER TABLE jobs
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
```

---

## API Endpoints

Better Auth provides these endpoints automatically. You just need to mount the handler.

### Mount Better Auth in Express

```javascript
// router/server.js (or wherever your Express app is)
import express from 'express';
import { auth } from './auth.js';

const app = express();

// Mount Better Auth at /api/auth/*
app.all('/api/auth/*', async (req, res) => {
  return auth.handler(req, res);
});

// Your existing routes...
app.post('/api/upload', requireAuth, uploadHandler);
app.get('/api/artworks/me', requireAuth, getMyArtworks);
```

### Automatically Available Endpoints

Once mounted, these endpoints work automatically:

#### 1. **GET /api/auth/signin/google**
Initiates Google OAuth flow. Redirects to Google login.

#### 2. **GET /api/auth/signin/github**
Initiates GitHub OAuth flow. Redirects to GitHub login.

#### 3. **GET /api/auth/callback/google**
OAuth callback for Google. Handles authorization code exchange.

#### 4. **GET /api/auth/callback/github**
OAuth callback for GitHub. Handles authorization code exchange.

#### 5. **GET /api/auth/session**
Returns current session and user data.

**Response**:
```json
{
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "emailVerified": true,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "session": {
    "token": "session-token",
    "expiresAt": "2025-01-22T10:30:00Z"
  }
}
```

Returns `null` if not authenticated.

#### 6. **POST /api/auth/sign-out**
Ends current session. Clears session cookie.

**Response**:
```json
{
  "success": true
}
```

---

## Protecting Your Existing Routes

Create an auth middleware:

```javascript
// router/middleware/requireAuth.js
import { auth } from '../auth.js';

export async function requireAuth(req, res, next) {
  try {
    // Better Auth will validate session from cookie
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Attach user to request
    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid session',
      code: 'INVALID_SESSION'
    });
  }
}
```

Use it on protected routes:

```javascript
// Protect upload endpoint
app.post('/api/upload', requireAuth, async (req, res) => {
  const userId = req.user.id; // Available from middleware

  // Your existing upload logic...
  // But now you can associate uploads with userId

  const artwork = await db.query(
    'INSERT INTO artworks (user_id, filename, ...) VALUES ($1, $2, ...)',
    [userId, filename, ...]
  );

  res.json({ success: true, artwork });
});

// Protect user's artworks endpoint
app.get('/api/artworks/me', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const artworks = await db.query(
    'SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  res.json({ artworks: artworks.rows });
});
```

---

## CORS Configuration

Configure CORS to allow frontend requests:

```javascript
// router/server.js
import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // IMPORTANT: Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Critical**: `credentials: true` must be set, otherwise session cookies won't work.

---

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Configure consent screen if not done
6. Application type: **Web application**
7. Add **Authorized redirect URIs**:
   ```
   https://router.artorizer.com/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google  (for dev)
   ```
8. Copy **Client ID** and **Client Secret** to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Artorizer
   - **Homepage URL**: https://artorizer.com
   - **Authorization callback URL**:
     ```
     https://router.artorizer.com/api/auth/callback/github
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret**
7. Copy **Client Secret** to `.env`

**For Development**:
Create a separate OAuth app for localhost with callback:
```
http://localhost:3000/api/auth/callback/github
```

---

## What Frontend Sends to Backend

### Session Requests

Frontend automatically sends session cookie with every request:

```javascript
// Frontend code (already implemented)
fetch('https://router.artorizer.com/api/artworks/me', {
  credentials: 'include' // Sends httpOnly cookies
})
```

### Upload Requests

```javascript
// Frontend code (already implemented)
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('include_hash_analysis', true);
formData.append('include_protection', true);

fetch('https://router.artorizer.com/api/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include' // Session cookie included
})
```

### Expected Responses

#### Upload Success (200):
```json
{
  "job_id": "job_abc123",
  "status": "pending",
  "user_id": "uuid",
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### Get Artworks Success (200):
```json
{
  "artworks": [
    {
      "id": "artwork_123",
      "job_id": "job_abc123",
      "user_id": "uuid",
      "original_filename": "art.jpg",
      "original_url": "https://storage.artorizer.com/originals/art.jpg",
      "protected_url": "https://storage.artorizer.com/protected/art-protected.jpg",
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z",
      "completed_at": "2025-01-15T10:35:00Z"
    }
  ],
  "total": 42
}
```

#### Auth Required (401):
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

#### Forbidden (403):
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this resource",
  "code": "FORBIDDEN"
}
```

---

## Testing the Integration

### 1. Test Better Auth Endpoints

```bash
# Test session endpoint (should return null when not logged in)
curl -X GET https://router.artorizer.com/api/auth/session \
  -H "Cookie: better-auth.session_token=invalid" \
  --cookie-jar cookies.txt

# Expected: null
```

### 2. Test OAuth Flow

1. Open browser
2. Navigate to: `https://router.artorizer.com/api/auth/signin/google`
3. Should redirect to Google OAuth
4. After authorizing, should redirect back with session cookie set
5. Check that `/api/auth/session` now returns user data

### 3. Test Protected Routes

```bash
# Without auth (should fail)
curl -X POST https://router.artorizer.com/api/upload \
  -F "file=@test.jpg"

# Expected: {"error": "Unauthorized", "code": "AUTH_REQUIRED"}

# With auth (after OAuth login)
curl -X POST https://router.artorizer.com/api/upload \
  -F "file=@test.jpg" \
  --cookie cookies.txt

# Expected: {"job_id": "...", "status": "pending"}
```

### 4. Test Frontend Integration

1. Start your development server: `npm start`
2. Open `http://localhost:8080/login.html`
3. Should see login page
4. Click "Continue with Google" or "Continue with GitHub"
5. After OAuth, should redirect to dashboard
6. Try uploading an artwork
7. Check that it's associated with your user

---

## Common Issues & Solutions

### Issue: OAuth Redirect Shows 404

**Cause**: Better Auth handler not mounted correctly

**Solution**:
```javascript
// Ensure this is in your server.js
app.all('/api/auth/*', async (req, res) => {
  return auth.handler(req, res);
});
```

### Issue: Session Not Persisting

**Cause**: Cookies not being sent/received

**Solutions**:
1. Check CORS `credentials: true`
2. Check frontend uses `credentials: 'include'`
3. Verify cookie domain matches
4. Check that HTTPS is used in production (httpOnly cookies require Secure flag)

### Issue: "Redirect URI mismatch" from OAuth Provider

**Cause**: OAuth callback URL doesn't match registered redirect URI

**Solution**:
1. Check Google Cloud Console / GitHub OAuth app settings
2. Ensure redirect URI is exactly: `https://router.artorizer.com/api/auth/callback/google`
3. No trailing slashes, exact match required

### Issue: Database Connection Errors

**Cause**: Database credentials incorrect or DB not ready

**Solution**:
1. Verify `.env` DB credentials
2. Test database connection:
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME
   ```
3. Ensure database exists and user has permissions
4. Run migrations: `npx better-auth migrate`

### Issue: CORS Errors

**Cause**: Origin not allowed or credentials not enabled

**Solution**:
```javascript
// Ensure CORS config has:
{
  origin: ['https://artorizer.com', 'http://localhost:8080'],
  credentials: true
}
```

---

## Complete Implementation Checklist

Use this to verify your backend implementation:

- [ ] Install `better-auth` and database client
- [ ] Add all environment variables to `.env`
- [ ] Generate `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Configure Google OAuth app (get Client ID/Secret)
- [ ] Configure GitHub OAuth app (get Client ID/Secret)
- [ ] Create `auth.js` with Better Auth configuration
- [ ] Run database migrations: `npx better-auth migrate`
- [ ] Mount Better Auth handler at `/api/auth/*`
- [ ] Create `requireAuth` middleware
- [ ] Protect `/api/upload` with `requireAuth`
- [ ] Create `/api/artworks/me` endpoint (protected)
- [ ] Add `user_id` column to artworks table
- [ ] Configure CORS with `credentials: true`
- [ ] Test OAuth flows (Google and GitHub)
- [ ] Test session persistence
- [ ] Test protected routes return 401 without auth
- [ ] Test upload associates with user
- [ ] Verify artworks filtered by user

---

## Quick Reference

### Useful Better Auth Commands

```bash
# Run migrations
npx better-auth migrate

# Rollback last migration
npx better-auth migrate:rollback

# Generate a secure secret
openssl rand -base64 32
```

### Important URLs

**Development**:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`
- Login: `http://localhost:8080/login.html`

**Production**:
- Frontend: `https://artorizer.com`
- Backend: `https://router.artorizer.com`
- Login: `https://artorizer.com/login.html`

### OAuth Callback URLs

**Google**: `https://router.artorizer.com/api/auth/callback/google`
**GitHub**: `https://router.artorizer.com/api/auth/callback/github`

---

## Support & Documentation

- **Better Auth Docs**: https://www.better-auth.com/docs
- **Better Auth GitHub**: https://github.com/better-auth/better-auth
- **OAuth 2.0 Spec**: https://oauth.net/2/

---

**That's it!** This is everything the backend needs to implement. Once these endpoints are live, the frontend will work immediately - no frontend changes required.
