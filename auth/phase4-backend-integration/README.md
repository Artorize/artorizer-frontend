# Phase 4: Backend API Integration

## Overview

Integrate authentication with existing Artorizer API endpoints, protect routes, and associate uploads with authenticated users.

## Duration

**Estimated Time**: 4-6 hours

## Prerequisites

- [x] Phase 1-3 completed
- [x] Users can log in via OAuth
- [x] Sessions are working

## Goals

1. ✅ Update `dashboard/config.js` with auth configuration
2. ✅ Modify `artworkUploader.js` to include user context
3. ✅ Add authentication middleware to backend routes
4. ✅ Protect upload endpoint with auth requirement
5. ✅ Associate uploaded artworks with user ID
6. ✅ Create user-specific artwork gallery

## Backend Changes

### 1. Auth Middleware (`backend/src/auth/middleware.js`)

```javascript
/**
 * Require authentication middleware
 * Verifies session and adds user to request
 */
export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: req.headers
  });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = session.user;
  next();
}
```

### 2. Protect Upload Route

```javascript
// Before
app.post('/api/upload', uploadHandler);

// After
app.post('/api/upload', requireAuth, uploadHandler);
```

### 3. Update Upload Handler

```javascript
async function uploadHandler(req, res) {
  const userId = req.user.id;  // From auth middleware

  // Process upload with userId
  const job = await processUpload(file, {
    ...options,
    userId  // Associate with user
  });

  // Save to database with user_id
  await saveArtworkJob({
    user_id: userId,
    job_id: job.id,
    ...
  });
}
```

## Frontend Changes

### 1. Update `config.js`

```javascript
const ArtorizeConfig = {
  // Existing config...

  // NEW: Auth configuration
  AUTH: {
    BASE_URL: 'https://router.artorizer.com',
    LOGIN_URL: '/login.html',
    CALLBACK_URL: '/dashboard/dashboard-v2.html'
  }
};
```

### 2. Update `artworkUploader.js`

```javascript
import { AuthManager } from '../src/auth/authManager.js';

async function uploadArtwork(file, options) {
  // Get session
  const auth = new AuthManager();
  const session = await auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Include session token in request
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', session.user.id);
  // ... other fields

  const response = await fetch(`${ROUTER_URL}/api/upload`, {
    method: 'POST',
    credentials: 'include',  // Send cookies
    body: formData
  });

  return response.json();
}
```

### 3. Create User Gallery

```javascript
/**
 * Fetch user's artworks
 */
async function fetchUserArtworks() {
  const response = await fetch(`${ROUTER_URL}/api/artworks/me`, {
    credentials: 'include'
  });

  return response.json();
}
```

## API Endpoints

### New Endpoints

#### `GET /api/artworks/me`
Get current user's artworks

**Response**:
```json
{
  "artworks": [
    {
      "id": "...",
      "job_id": "...",
      "original_url": "...",
      "protected_url": "...",
      "status": "completed",
      "created_at": "..."
    }
  ]
}
```

#### `GET /api/user/profile`
Get current user profile

**Response**:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "image": "..."
  }
}
```

## Success Criteria

- [ ] Upload endpoint protected with auth
- [ ] Uploads include user_id
- [ ] User gallery shows only user's artworks
- [ ] Unauthorized requests return 401
- [ ] Session token sent with requests
- [ ] Backend validates sessions correctly

See `implementation-spec.md` and `test-spec.md` for details.
