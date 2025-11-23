# Phase 4: Implementation Specification

See `api-spec.md` for API endpoint details.

## Backend Implementation

### File 1: `src/auth/middleware.js`

```javascript
import { auth } from './index.js';

export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.user = session.user;
  next();
}

export async function optionalAuth(req, res, next) {
  const session = await auth.api.getSession({ headers: req.headers });
  req.user = session?.user || null;
  next();
}
```

### File 2: Update `routes/upload.js`

```javascript
import { requireAuth } from '../auth/middleware.js';

// Protect upload route
router.post('/upload', requireAuth, async (req, res) => {
  const userId = req.user.id;

  // Process upload with userId
  const job = await processUpload(req.file, {
    userId,
    ...req.body
  });

  // Save to database
  await db.query(
    'INSERT INTO artwork_jobs (user_id, job_id, ...) VALUES ($1, $2, ...)',
    [userId, job.id, ...]
  );

  res.json({ job_id: job.id, status: 'pending', user_id: userId });
});
```

### File 3: Create `routes/artworks.js`

```javascript
import { requireAuth } from '../auth/middleware.js';

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const artworks = await db.query(
    'SELECT * FROM artwork_jobs WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  res.json({ artworks: artworks.rows, total: artworks.rows.length });
});
```

---

## Frontend Implementation

### Update `dashboard/config.js`

```javascript
const ArtorizeConfig = {
  ROUTER_URL: 'https://router.artorizer.com',
  CDN_URL: 'https://cdn.artorizer.com',
  AUTH: {
    BASE_URL: 'https://router.artorizer.com',
    LOGIN_URL: '/login.html',
    CALLBACK_URL: '/dashboard/dashboard-v2.html'
  },
  // ... rest
};
```

### Update `dashboard/artworkUploader.js`

```javascript
import { AuthManager } from '../src/auth/authManager.js';

async function uploadArtwork(file, options) {
  const auth = new AuthManager();
  const session = await auth.getSession();

  if (!session) {
    window.location.href = '/login.html';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch(`${ROUTER_URL}/api/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  if (response.status === 401) {
    window.location.href = '/login.html';
    return;
  }

  return response.json();
}
```

---

## Success Criteria

- [ ] Backend middleware implemented
- [ ] Upload route protected
- [ ] User ID associated with uploads
- [ ] User gallery endpoint created
- [ ] Frontend sends credentials
- [ ] Unauthorized requests redirect to login
- [ ] User can view only their artworks
