# Artorize Storage Backend API Reference

A Node.js/Express service for secure artwork storage and retrieval using MongoDB GridFS.

**Base URL**: `http://localhost:3000` (configurable)

## Quick Start

```bash
# Health check
curl http://localhost:3000/health

# Search artworks
curl "http://localhost:3000/artworks?artist=Picasso&limit=5"

# Get artwork metadata
curl http://localhost:3000/artworks/{id}/metadata

# Stream artwork file
curl http://localhost:3000/artworks/{id}?variant=original
```

## Rate Limits

- **General**: 300 requests/15min per IP
- **Uploads**: 30 uploads/hour per IP
- **Health**: No limits

## Authentication

The backend supports **two authentication methods**:

### 1. Token-Based Authentication (Processor Integration)

Used for secure processor uploads in the Artorize architecture.

**How It Works**:

1. **Router generates a token** via `POST /tokens` endpoint
2. **Router passes token to both processor and backend**
3. **Processor includes token** in `Authorization: Bearer <token>` header when uploading
4. **Token is consumed** (single-use) on first successful upload
5. **Expired/used tokens are rejected** with 401 status

**Security Benefits**:
- **One-time tokens**: Each token can only be used once, preventing replay attacks
- **Time-limited**: Tokens expire after 1 hour (configurable, max 24 hours)
- **Per-artwork isolation**: Compromised token affects only one artwork
- **No static credentials**: Eliminates risk of leaked API keys

### 2. Session-Based Authentication (User Authentication via Router)

Used for user-specific operations when accessed via the Artorize router with Better Auth integration.

**How It Works**:

1. **User authenticates via router** using Better Auth (Google/GitHub OAuth)
2. **Router sets session cookie** (`better-auth.session_token`)
3. **Router validates session** against Better Auth/PostgreSQL
4. **Router forwards user info** via custom headers when proxying to backend:
    - `X-User-Id`: User's unique identifier
    - `X-User-Email`: User's email address
    - `X-User-Name`: User's display name
5. **Backend validates headers** and associates artworks with user

**IMPORTANT**: The backend does NOT validate the `better-auth.session_token` cookie directly. It relies on the router to:
- Validate the session against Better Auth
- Forward user information via headers
- Only send headers for valid, authenticated sessions

**User-Specific Features**:
- Artworks are automatically associated with the authenticated user (`userId` field)
- Users can retrieve only their own artworks via `/artworks/me`
- Search can be filtered by user ID
- Upload tracking and ownership management

### Protected Endpoints

- `POST /artworks` - **Requires authentication** (token or session)
    - With token: Artwork uploaded without user association (`userId: null`)
    - With session: Artwork associated with authenticated user
- `GET /artworks/me` - **Requires user authentication** (session only)
    - Must have valid `X-User-Id` header from router

### Public Endpoints

All read endpoints remain public:
- `GET /artworks` - Search (can optionally filter by userId)
- `GET /artworks/{id}/*` - Metadata, file streaming, downloads
- `GET /health` - Health checks
- `GET /artworks/check-exists` - Duplication checking

## Router Integration

This backend is designed to work seamlessly with the Artorize router (Fastify + Better Auth).

**Architecture:**
```
User → Router (Fastify) → Backend (Express) → MongoDB
       [Better Auth]      [GridFS Storage]
```

**Key Integration Points:**

1. **User Authentication Flow**:
    - Router handles all user authentication via Better Auth
    - Router validates sessions and forwards user context via headers
    - Backend trusts headers from router (assumes router is the only client)

2. **Processor Upload Flow**:
    - Router generates tokens via `POST /tokens`
    - Router passes tokens to processor
    - Processor uploads directly to backend with token

3. **Security Model**:
    - Backend binds to `127.0.0.1` (localhost only)
    - Router acts as reverse proxy for external access
    - Only router can reach backend (firewall protected)

**For detailed integration requirements, see `ROUTER_INTEGRATION.md`.**

### Router Requirements

The router MUST:
1. Forward `X-User-Id` header when user is authenticated
2. Forward `X-User-Email` header when user is authenticated
3. Forward `X-User-Name` header when user is authenticated
4. Only forward headers for valid, authenticated sessions
5. Call `POST /tokens` to generate tokens for processor uploads
6. Act as reverse proxy since backend binds to localhost only

---

## Processor Integration

This backend is designed to support **direct processor uploads** in the Artorize architecture with secure token-based authentication:

**Workflow**:
1. Router receives artwork submission request
2. **Router generates authentication token** via `POST /tokens`
3. **Router passes token to both processor and backend**
4. Processor receives image and token from router
5. Processor generates all variants (original, protected, masks, analysis, summary)
6. **Processor uploads directly to `POST /artworks`** with `Authorization: Bearer <token>` header
7. Backend validates and consumes token (single-use)
8. Backend returns `id` in response (MongoDB ObjectId)
9. Processor sends `id` to router in callback
10. Router uses `id` to retrieve files when needed

**Key Points**:
- Secure token-based authentication (one-time use)
- Per-artwork token isolation limits breach impact
- All required files and metadata are supported
- Returns `id` field that processor needs for callbacks
- Handles large files (256MB max) efficiently
- Rate limiting configured (30 uploads/hour per IP)
- No temporary storage needed in router
- Tokens expire after 1 hour (configurable)
- Automatic cleanup of expired/used tokens

**Security Architecture**:
- Each artwork gets a unique 16-character token
- Tokens are cryptographically random and single-use
- Compromised token only affects one artwork
- No static credentials to leak or crack

---

## Endpoints

### Authentication Endpoints

### `POST /tokens`
Generate a new authentication token (called by router).

**Request Body** (optional):
```json
{
  "artworkId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "expiresIn": 3600000,
  "metadata": { "source": "router" }
}
```

- `artworkId` (optional) - Associate token with specific artwork
- `expiresIn` (optional) - Expiration time in milliseconds (default: 1 hour, max: 24 hours)
- `metadata` (optional) - Additional metadata to store with token

**Response**: `201 Created`
```json
{
  "token": "a1b2c3d4e5f6g7h8",
  "tokenId": "60f7b3b3b3b3b3b3b3b3b3b5",
  "artworkId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "expiresAt": "2023-07-21T10:15:00.000Z",
  "createdAt": "2023-07-21T09:15:00.000Z"
}
```

---

### `DELETE /tokens/:token`
Revoke a token (mark as used).

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

**Errors**:
- `404` - Token not found or already revoked

---

### `GET /tokens/stats`
Get token statistics (monitoring).

**Response**: `200 OK`
```json
{
  "stats": {
    "total": 150,
    "active": 5,
    "used": 120,
    "expired": 25
  },
  "timestamp": "2023-07-21T09:15:00.000Z"
}
```

---

### `GET /health`
Comprehensive service health status with component-level diagnostics.

**Response**: `200 OK` (healthy/degraded) or `503 Service Unavailable` (unhealthy)

**Healthy Response Example**:
```json
{
  "status": "healthy",
  "message": "All systems operational",
  "timestamp": "2025-10-20T10:30:45.123Z",
  "uptime": 86400.5,
  "responseTime": 45,
  "summary": {
    "mongodb": "healthy",
    "gridfs": "healthy",
    "hashStorage": "healthy"
  },
  "components": {
    "mongodb": {
      "status": "healthy",
      "connected": true,
      "database": "artorize",
      "version": "7.0.0",
      "uptime": 86400,
      "message": "MongoDB connection active"
    },
    "gridfs": {
      "status": "healthy",
      "bucketsFound": 6,
      "bucketsExpected": 6,
      "bucketsReady": true,
      "buckets": {
        "originals": true,
        "protected": true,
        "masks": true
      },
      "message": "All GridFS buckets initialized"
    },
    "hashStorage": {
      "status": "healthy",
      "artworksCount": 1234,
      "indexesConfigured": true,
      "message": "1234 artwork(s) stored"
    }
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "memory": {
      "heapUsed": 85,
      "heapTotal": 120,
      "rss": 150
    }
  }
}
```

**Fresh Installation Response Example** (no data yet):
```json
{
  "status": "healthy",
  "message": "All systems operational",
  "timestamp": "2025-10-20T10:30:45.123Z",
  "uptime": 120.5,
  "responseTime": 42,
  "summary": {
    "mongodb": "healthy",
    "gridfs": "healthy",
    "hashStorage": "healthy"
  },
  "components": {
    "mongodb": {
      "status": "healthy",
      "connected": true,
      "database": "artorize",
      "version": "7.0.0",
      "uptime": 86400,
      "message": "MongoDB connection active"
    },
    "gridfs": {
      "status": "healthy",
      "bucketsFound": 0,
      "bucketsExpected": 6,
      "bucketsReady": false,
      "buckets": {
        "originals": false,
        "protected": false,
        "masks": false
      },
      "message": "GridFS buckets will be created on first upload"
    },
    "hashStorage": {
      "status": "healthy",
      "artworksCount": 0,
      "indexesConfigured": false,
      "message": "Ready to store artworks"
    }
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "memory": {
      "heapUsed": 45,
      "heapTotal": 80,
      "rss": 95
    }
  }
}
```

**Component Status Values**:
- `healthy`: Component fully operational
- `degraded`: Component partially operational (some features may not work)
- `unhealthy`: Component not operational
- `unknown`: Unable to determine component status

**Notes**:
- Health endpoint is **exempt from rate limiting** for monitoring purposes
- Returns HTTP 503 when overall status is `unhealthy`, HTTP 200 otherwise
- **Quick status check**: Use the `summary` field for at-a-glance component status
- **Detailed diagnostics**: Check the `components` field for full component details
- Each component includes a human-readable `message` field explaining its status
- GridFS buckets are created on-demand when first file is uploaded
- Fresh installations show `bucketsReady: false` but are still `healthy`
- Memory values are in MB, `responseTime` is in milliseconds

---

### `POST /artworks`
Upload artwork with multiple file variants.

**Authentication**: Required
**Header**: `Authorization: Bearer <token>`

**Content-Type**: `multipart/form-data`

**Required Files**:
- `original` - Original image (JPEG/PNG/WebP/AVIF/GIF, max 256MB)
- `protected` - Protected variant (same formats)
- `mask` - Grayscale mask file (SAC v1 binary format, .sac extension)
- `analysis` - Analysis JSON document
- `summary` - Summary JSON document

**Optional Fields**:
- `title` (200 chars max)
- `artist` (120 chars max)
- `description` (2000 chars max)
- `tags` (25 tags max, 50 chars each)
- `createdAt` (ISO date string)
- `extra` (5000 chars max JSON)

**Success**: `201 Created`
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "userId": "user-uuid-from-session",
  "formats": {
    "original": {
      "contentType": "image/jpeg",
      "bytes": 1048576,
      "checksum": "sha256:abc123...",
      "fileId": "60f7b3b3b3b3b3b3b3b3b3b4"
    },
    "protected": { /* ... */ },
    "mask": { /* ... */ }
  }
}
```

**Note**: The `userId` field is only included if the upload was authenticated with a user session. For token-based uploads (processor), this field will be `null`.

**Important**: The `id` field in the response is a MongoDB ObjectId that **must be used by the processor in callbacks** to the router. This allows the router to retrieve artwork files using other endpoints.

**Errors**:
- `400` - Missing files, invalid types, malformed JSON
- `401` - Missing/invalid/expired authentication token
- `429` - Rate limit exceeded

---

### `GET /artworks/{id}`
Stream artwork file.

**Parameters**:
- `variant` (query) - `original|protected|mask` (default: `original`)

**Response**: `200 OK`
- Binary file stream with proper MIME type
- For images: returns JPEG/PNG/WebP/etc. as appropriate
- For masks: returns SAC v1 binary format (application/octet-stream)
- Cache headers: `public, max-age=31536000, immutable`
- ETag: `{id}-{variant}`

**Note**: For mask files, you can also use the dedicated `/artworks/{id}/mask` endpoint.

**Errors**:
- `400` - Invalid ID format
- `404` - Artwork/variant not found

---

### `GET /artworks/{id}/metadata`
Complete artwork metadata.

**Response**: `200 OK`
```json
{
  "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "title": "Artwork Title",
  "artist": "Artist Name",
  "description": "Description...",
  "tags": ["tag1", "tag2"],
  "createdAt": "2023-07-20T15:30:00Z",
  "uploadedAt": "2023-07-21T09:15:00Z",
  "userId": "user-uuid",
  "formats": {
    "original": {
      "contentType": "image/jpeg",
      "bytes": 1048576,
      "checksum": "sha256:abc123...",
      "fileId": "60f7b3b3b3b3b3b3b3b3b3b4",
      "bucket": "originals"
    }
  },
  "analysis": { /* JSON payload */ },
  "summary": { /* JSON payload */ },
  "extra": { /* Additional metadata */ }
}
```

**Note**: The `userId` field will be `null` for artworks uploaded via token-based authentication (processor).

---

### `GET /artworks/{id}/variants`
Available variant information.

**Response**: `200 OK`
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "title": "Artwork Title",
  "variants": {
    "original": {
      "available": true,
      "contentType": "image/jpeg",
      "size": 1048576,
      "checksum": "sha256:abc123...",
      "url": "/artworks/{id}?variant=original"
    }
  }
}
```

---

### `GET /artworks/{id}/mask`
Stream artwork grayscale mask file in SAC v1 binary format.

**Response**: `200 OK`
- Binary SAC v1 file stream (application/octet-stream)
- Cache headers: `public, max-age=31536000, immutable`
- ETag: `{id}-mask`
- Content-Disposition: `inline; filename="{title}-mask.sac"`

**Example**:
```bash
# Get grayscale mask
curl http://localhost:3000/artworks/{id}/mask

# Save to file
curl http://localhost:3000/artworks/{id}/mask -o mask.sac
```

**Note**: The mask is stored in grayscale format using SAC v1 protocol. According to the poison mask grayscale protocol, this provides 3x smaller file sizes and 8.6x faster generation compared to RGB masks, with only minor quality loss (32.98 dB PSNR).

**Errors**:
- `400` - Invalid ID format
- `404` - Artwork not found or mask not available

---

### `GET /artworks`
Search artworks.

**Query Parameters**:
- `artist` (120 chars max) - Filter by artist
- `q` (200 chars max) - Full-text search (title/description)
- `tags` - Comma-separated tags
- `userId` (100 chars max) - Filter by user ID
- `limit` (1-10000, default: 20) - Results per page
- `skip` (0-5000, default: 0) - Pagination offset

**Response**: `200 OK`
```json
[
  {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Artwork Title",
    "artist": "Artist Name",
    "description": "Description...",
    "tags": ["tag1", "tag2"],
    "createdAt": "2023-07-20T15:30:00Z",
    "uploadedAt": "2023-07-21T09:15:00Z"
  }
]
```

---

### `GET /artworks/me`
Get artworks uploaded by the authenticated user.

**Authentication**: Required (session-based only)
**Headers**:
- `Cookie: better-auth.session_token=...` (set by router)
- `X-User-Id: <user-id>` (forwarded by router)

**Query Parameters**:
- `limit` (1-100, default: 20) - Results per page
- `skip` (0-5000, default: 0) - Pagination offset

**Response**: `200 OK`
```json
{
  "artworks": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Artwork Title",
      "artist": "Artist Name",
      "description": "Description...",
      "tags": ["tag1", "tag2"],
      "createdAt": "2023-07-20T15:30:00Z",
      "uploadedAt": "2023-07-21T09:15:00Z",
      "userId": "user-uuid"
    }
  ],
  "total": 15,
  "userId": "user-uuid"
}
```

**Errors**:
- `401` - Not authenticated or user ID not found in session

---

### `GET /artworks/check-exists`
Check if artwork already exists.

**Query Parameters** (at least one required):
- `id` - 24-char hex string
- `checksum` - 64-char SHA256 hash
- `title` + `artist` - Combined search
- `tags` - Comma-separated tags

**Response**: `200 OK`
```json
{
  "exists": true,
  "matchCount": 1,
  "matches": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Artwork Title",
      "artist": "Artist Name",
      "checksum": "sha256:abc123...",
      "tags": ["tag1", "tag2"],
      "uploadedAt": "2023-07-21T09:15:00Z",
      "createdAt": "2023-07-20T15:30:00Z"
    }
  ]
}
```

---

### `POST /artworks/batch`
Retrieve multiple artworks by IDs.

**Request Body**:
```json
{
  "ids": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"],
  "fields": "title,artist,tags"
}
```

- `ids` - Array of 1-100 artwork IDs
- `fields` (optional) - Comma-separated field list

**Response**: `200 OK`
```json
{
  "artworks": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Artwork Title",
      "artist": "Artist Name",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

---

### `GET /artworks/{id}/download`
Download artwork with attachment headers.

**Parameters**:
- `variant` (query) - File variant (default: `original`)

**Response**: `200 OK`
- Binary file stream
- `Content-Disposition: attachment; filename="title-variant.ext"`
- `Content-Type` and `Content-Length` headers

---

### `GET /artworks/{id}/download-url`
Generate temporary download URLs.

**Parameters**:
- `variant` (query) - File variant (default: `original`)
- `expires` (query) - Expiration seconds (60-86400, default: 3600)

**Response**: `200 OK`
```json
{
  "downloadUrl": "http://localhost:3000/artworks/{id}/download?variant=original",
  "directUrl": "http://localhost:3000/artworks/{id}?variant=original",
  "variant": "original",
  "contentType": "image/jpeg",
  "size": 1048576,
  "checksum": "sha256:abc123...",
  "expiresAt": "2023-07-21T10:15:00.000Z"
}
```

---

## Error Responses

All errors return JSON:
```json
{ "error": "Human-readable error message" }
```

**Status Codes**:
- `400` - Bad Request (validation errors, malformed data)
- `401` - Unauthorized (missing, invalid, or expired authentication token)
- `404` - Not Found (artwork/variant doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Storage Architecture

**GridFS Buckets**:
- `artwork_originals` - Original images
- `artwork_protected` - Protected variants
- `artwork_masks` - High/low resolution masks (SAC v1 binary format)

**Features**:
- 1MB chunk size
- SHA256 checksums for integrity
- Automatic compression (WiredTiger + zstd)
- Masks stored in SAC v1 format for efficient CDN delivery

**Database Indexes**:
- `{ artist: 1, createdAt: -1 }` - Artist queries
- `{ tags: 1 }` - Tag filtering
- `{ title: "text", description: "text" }` - Full-text search

---

## File Format Support

**Images**: JPEG, PNG, WebP, AVIF, GIF
**Masks**: SAC v1 binary format (.sac files, application/octet-stream)
**Metadata**: JSON only
**Max Size**: 256MB per file

### SAC v1 Format
Masks use the Simple Array Container (SAC) v1 protocol - a compact binary format for shipping two signed 16-bit arrays. This format is optimized for CDN delivery with:
- Minimal overhead (24-byte header + raw int16 data)
- Fixed little-endian layout for browser compatibility
- Immutable caching support
- Efficient parsing in JavaScript
- See `sac_v_1_cdn_mask_transfer_protocol.md` for complete specification

---

## Security Features

- Rate limiting per IP
- Input validation (Zod schemas)
- Security headers (Helmet.js)
- Structured logging with header redaction
- File type validation
- Size limits enforcement

---

## Examples

### Complete Workflow Example

```bash
# Step 1: Router generates a token
TOKEN_RESPONSE=$(curl -X POST http://localhost:3000/tokens \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"source": "router"}}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
echo "Generated token: $TOKEN"

# Step 2: Router passes token to processor (and to backend for reference)

# Step 3: Processor uploads artwork with the token
curl -X POST http://localhost:3000/artworks \
  -H "Authorization: Bearer $TOKEN" \
  -F "original=@image.jpg" \
  -F "protected=@protected.jpg" \
  -F "mask=@mask.sac" \
  -F "analysis=@analysis.json" \
  -F "summary=@summary.json" \
  -F "title=My Artwork" \
  -F "artist=Artist Name" \
  -F "tags=abstract,modern"

# Response contains the artwork ID
# {
#   "id": "671924a5c3d8e8f9a1b2c3d4",
#   "formats": { ... }
# }
```

**Note**: Mask files must be in SAC v1 binary format. You can generate them using the Python code provided in `sac_v_1_cdn_mask_transfer_protocol.md`.

### Processor Upload Example
```bash
# Step 1: Get token from router (router already generated it)
TOKEN="a1b2c3d4e5f6g7h8"

# Step 2: Processor uploads after processing artwork
curl -X POST http://localhost:3000/artworks \
  -H "Authorization: Bearer $TOKEN" \
  -F "original=@mona_lisa.jpg;type=image/jpeg" \
  -F "protected=@mona_lisa_protected.jpg;type=image/jpeg" \
  -F "mask=@mask.sac;type=application/octet-stream" \
  -F "analysis=@analysis.json;type=application/json" \
  -F "summary=@summary.json;type=application/json" \
  -F "title=Mona Lisa" \
  -F "artist=Leonardo da Vinci" \
  -F "description=Famous Renaissance portrait" \
  -F "tags=renaissance,portrait,famous" \
  -F "createdAt=1503-01-01T00:00:00Z" \
  -F "extra={\"processing_time_ms\":64000}"

# Response contains the artwork ID
# {
#   "id": "671924a5c3d8e8f9a1b2c3d4",
#   "formats": { ... }
# }

# Step 3: Processor sends this ID to router in callback for retrieval
```

### Search Example
```bash
# Search by artist
curl "http://localhost:3000/artworks?artist=Picasso"

# Full-text search
curl "http://localhost:3000/artworks?q=landscape"

# Search by tags
curl "http://localhost:3000/artworks?tags=abstract,modern"

# Combined with pagination
curl "http://localhost:3000/artworks?artist=Picasso&limit=10&skip=20"
```

### Mask Retrieval Example
```bash
# Get grayscale mask
curl "http://localhost:3000/artworks/{id}/mask" -o mask.sac

# Alternative: using variant parameter
curl "http://localhost:3000/artworks/{id}?variant=mask" -o mask.sac
```

### Check Existence Example
```bash
# Check by checksum
curl "http://localhost:3000/artworks/check-exists?checksum=abc123..."

# Check by title and artist
curl "http://localhost:3000/artworks/check-exists?title=Mona Lisa&artist=Leonardo"
```