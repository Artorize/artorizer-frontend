# Phase 4: API Specification

## Auth Middleware

### `requireAuth(req, res, next)`

**Purpose**: Protect routes, require authentication

**Implementation**:
```javascript
export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = session.user;
  next();
}
```

---

## Protected Endpoints

### `POST /api/upload`

**Authentication**: Required

**Headers**:
- `Cookie: better-auth.session_token=...` (automatic)

**Request Body**:
```javascript
FormData {
  file: File,
  include_hash_analysis: boolean,
  include_protection: boolean,
  ...options
}
```

**Response**:
```json
{
  "job_id": "abc123",
  "status": "pending",
  "user_id": "uuid"
}
```

**Error**:
```json
{
  "error": "Unauthorized"
}
```

---

### `GET /api/artworks/me`

**Authentication**: Required

**Response**:
```json
{
  "artworks": [
    {
      "id": "uuid",
      "job_id": "abc123",
      "original_filename": "art.jpg",
      "original_url": "https://...",
      "protected_url": "https://...",
      "status": "completed",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

---

### `GET /api/user/profile`

**Authentication**: Required

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "image": "https://...",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## Frontend Request Helper

### `authenticatedFetch(url, options)`

**Purpose**: Fetch with credentials

```javascript
export async function authenticatedFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include',  // Send cookies
    headers: {
      ...options.headers,
      // Add any custom headers
    }
  });
}
```

**Usage**:
```javascript
import { authenticatedFetch } from './utils/fetch.js';

const data = await authenticatedFetch('/api/artworks/me')
  .then(r => r.json());
```
