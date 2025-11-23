Authentication

Optional Feature - Disabled by default (AUTH_ENABLED=false)

When enabled, the router supports user authentication via Better Auth with OAuth providers (Google, GitHub). User information is automatically forwarded to the backend for access control and ownership tracking.
Authentication Flow

    Client initiates OAuth: GET /api/auth/signin/google (or /github)
    OAuth provider redirects to callback: GET /api/auth/callback/google
    Better Auth creates session and sets httpOnly cookie (better-auth.session_token)
    Client includes cookie in subsequent requests
    Router extracts user info and forwards to backend via HTTP headers

Available Endpoints

When AUTH_ENABLED=true, the following endpoints are automatically mounted:
GET /api/auth/signin/google

Initiates Google OAuth flow. Redirects to Google for authentication.

Response: HTTP 302 redirect to Google OAuth consent screen
GET /api/auth/signin/github

Initiates GitHub OAuth flow. Redirects to GitHub for authentication.

Response: HTTP 302 redirect to GitHub OAuth consent screen
GET /api/auth/callback/google

OAuth callback endpoint for Google. Handles the OAuth code exchange and session creation.

Response: HTTP 302 redirect to frontend with session cookie set
GET /api/auth/callback/github

OAuth callback endpoint for GitHub. Handles the OAuth code exchange and session creation.

Response: HTTP 302 redirect to frontend with session cookie set
GET /api/auth/session

Get current authenticated user session.

Example:

curl -X GET https://router.artorizer.com/api/auth/session \
--cookie "better-auth.session_token=xxx"

Response (authenticated):

{
"user": {
"id": "550e8400-e29b-41d4-a716-446655440000",
"email": "user@example.com",
"name": "John Doe",
"image": "https://avatars.githubusercontent.com/u/12345",
"emailVerified": true,
"createdAt": "2025-01-15T10:30:00.000Z"
},
"session": {
"token": "session-token-here",
"expiresAt": "2025-01-22T10:30:00.000Z"
}
}

Response (not authenticated):

null

POST /api/auth/sign-out

Sign out and clear session cookie.

Example:

curl -X POST https://router.artorizer.com/api/auth/sign-out \
--cookie "better-auth.session_token=xxx"

Response:

{
"success": true
}

User Header Forwarding

When a user is authenticated, the router automatically forwards user context to the backend via HTTP headers on all user-facing endpoints:

Headers sent to backend:

    X-User-Id: User's UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)
    X-User-Email: User's email address (e.g., user@example.com)
    X-User-Name: User's display name (e.g., John Doe, optional)

Endpoints that forward user headers:

    POST /protect - Associates artwork with authenticated user
    GET /jobs/:id - Enables backend access control
    GET /jobs/:id/result - Enables backend access control
    GET /jobs/:id/download/:variant - Enables backend access control

The backend can use these headers to:

    Associate artworks with specific users
    Implement user-based access control (users can only see their own artworks)
    Track user activity and ownership
    Enable multi-tenant artwork management

Session Management

    Storage: PostgreSQL via Better Auth
    Duration: 7 days
    Refresh: Sessions can be refreshed within 1 day of expiration
    Cookie: better-auth.session_token (httpOnly, secure in production)
    CORS: Credentials must be included in cross-origin requests
