# Artorizer Authentication System

## Overview

This directory contains the complete implementation plan and documentation for integrating Better Auth OAuth authentication into Artorizer. This implementation enables users to sign in with Google and GitHub accounts, associating their protected artworks with their identity.

## Why Better Auth?

- **100% Open Source** - MIT licensed, no vendor lock-in
- **Self-Hosted** - All authentication data stays in your database
- **No Pricing Tiers** - Completely free, no monthly active user limits
- **Framework-Agnostic** - Works with vanilla JavaScript/ES6 modules
- **TypeScript-First** - But works great with plain JavaScript
- **Rapid Setup** - Minutes, not hours
- **Endorsed by Industry** - Recommended by Theo (t3.gg) and rapidly adopted in 2025

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Frontend       │         │  Better Auth     │         │  Database       │
│  (Vanilla JS)   │◄───────►│  Backend API     │◄───────►│  (PostgreSQL)   │
│                 │         │                  │         │                 │
│  - Login UI     │         │  - OAuth Routes  │         │  - Users        │
│  - Auth Client  │         │  - Session Mgmt  │         │  - Sessions     │
│  - Route Guards │         │  - Token Auth    │         │  - Accounts     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│  OAuth Providers│         │  Artorizer API   │
│                 │         │                  │
│  - Google       │         │  - Upload        │
│  - GitHub       │         │  - Job Status    │
└─────────────────┘         └──────────────────┘
```

## Implementation Phases

### Phase 1: Setup & Configuration
**Location**: `phase1-setup/`
**Duration**: 3-4 hours
**Description**: Install Better Auth, configure OAuth providers (Google, GitHub), and set up backend authentication instance.

### Phase 2: Database Schema & Migration
**Location**: `phase2-database/`
**Duration**: 1-2 hours
**Description**: Create database tables for users, sessions, and accounts. Link existing artwork tables to user IDs.

### Phase 3: Authentication UI Components
**Location**: `phase3-ui/`
**Duration**: 6-8 hours
**Description**: Build login page, auth client wrapper, user profile components, and route guards.

### Phase 4: Backend API Integration
**Location**: `phase4-backend-integration/`
**Duration**: 4-6 hours
**Description**: Integrate authentication with existing Artorizer API endpoints, protect routes, and associate uploads with users.

### Phase 5: Security & Session Management
**Location**: `phase5-security/`
**Duration**: 2-3 hours
**Description**: Implement secure token storage, session persistence, logout flows, and CSRF protection.

### Phase 6: Testing & User Experience
**Location**: `phase6-testing/`
**Duration**: 4-6 hours
**Description**: Write comprehensive tests, implement error handling, add loading states, and polish UX.

## Total Estimated Time

**20-29 hours** of development work

## Project Structure

```
artorizer-frontend/
├── auth/                                    # This directory
│   ├── README.md                           # This file
│   ├── IMPLEMENTATION-GUIDE.md             # Step-by-step implementation guide
│   ├── phase1-setup/
│   │   ├── README.md                       # Phase 1 documentation
│   │   ├── implementation-spec.md          # Detailed implementation specs
│   │   └── test-spec.md                    # Test specifications
│   ├── phase2-database/
│   │   ├── README.md
│   │   ├── schema.md                       # Database schema details
│   │   ├── implementation-spec.md
│   │   └── test-spec.md
│   ├── phase3-ui/
│   │   ├── README.md
│   │   ├── components-spec.md              # UI component specifications
│   │   ├── implementation-spec.md
│   │   └── test-spec.md
│   ├── phase4-backend-integration/
│   │   ├── README.md
│   │   ├── api-spec.md                     # API endpoint specifications
│   │   ├── implementation-spec.md
│   │   └── test-spec.md
│   ├── phase5-security/
│   │   ├── README.md
│   │   ├── security-spec.md                # Security requirements
│   │   ├── implementation-spec.md
│   │   └── test-spec.md
│   └── phase6-testing/
│       ├── README.md
│       ├── test-plan.md                    # Comprehensive test plan
│       └── test-spec.md
├── src/
│   └── auth/                               # To be created in Phase 3
│       ├── authManager.js                  # Core authentication manager
│       ├── authClient.js                   # Better Auth client wrapper
│       ├── loginUI.js                      # Login page handlers
│       └── userProfile.js                  # User profile component
├── login.html                              # To be created in Phase 3
└── dashboard/
    ├── config.js                           # To be updated in Phase 4
    └── artworkUploader.js                  # To be updated in Phase 4
```

## Quick Start Guide

### Prerequisites

1. **Backend Requirements**:
   - Node.js 18+ running on router backend
   - PostgreSQL or MySQL database
   - Express.js or similar web framework

2. **Frontend Requirements**:
   - Modern browser with ES6 module support
   - Existing Artorizer frontend (already in place)

3. **OAuth Provider Accounts**:
   - Google Cloud Console account
   - GitHub Developer account

### Implementation Order

Follow the phases in numerical order:

1. **Start with Phase 1** - Backend setup and OAuth configuration
2. **Phase 2** - Database migration (requires Phase 1 complete)
3. **Phase 3** - Build frontend UI (can start after Phase 1)
4. **Phase 4** - Integrate with API (requires Phases 1-3)
5. **Phase 5** - Security hardening (requires Phases 1-4)
6. **Phase 6** - Testing and polish (requires all previous phases)

## Key Design Decisions

### 1. Authentication Flow
- **OAuth 2.0 with Authorization Code Flow** - Most secure for web applications
- **Session-based authentication** - Better Auth manages sessions via httpOnly cookies
- **No password authentication** - OAuth-only reduces security surface area

### 2. Token Storage
- **httpOnly Cookies** - Better Auth default, prevents XSS attacks
- **No localStorage for tokens** - Avoids common security vulnerabilities
- **CSRF tokens** - Built into Better Auth

### 3. Database Design
- **User ID as UUID** - Better Auth default, prevents enumeration
- **Separate accounts table** - Multiple OAuth providers per user
- **Foreign key to artworks** - Associate protected images with users

### 4. Frontend Architecture
- **Pure ES6 Modules** - Matches existing Artorizer architecture
- **No build step required** - Better Auth client via CDN
- **Progressive enhancement** - Works without JavaScript for static content

## Environment Variables

The following environment variables will be needed (backend):

```bash
# Database
DB_HOST=localhost
DB_USER=artorizer
DB_PASSWORD=<secure-password>
DB_NAME=artorizer_auth

# Better Auth
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=https://router.artorizer.com

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# GitHub OAuth
GITHUB_CLIENT_ID=<from-github-developer-settings>
GITHUB_CLIENT_SECRET=<from-github-developer-settings>

# CORS
ALLOWED_ORIGINS=https://artorizer.com,http://localhost:8080
```

## Security Considerations

1. **OAuth Redirect URI Validation** - Strict whitelist of allowed redirect URIs
2. **CSRF Protection** - Better Auth includes built-in CSRF tokens
3. **Rate Limiting** - Better Auth includes built-in rate limiting
4. **SQL Injection Prevention** - Better Auth uses parameterized queries
5. **XSS Prevention** - httpOnly cookies, CSP headers recommended
6. **Session Expiration** - Configurable, default 7 days with refresh
7. **Secure Cookies** - Production must use HTTPS with Secure flag

## Dependencies

### Backend
```json
{
  "better-auth": "^1.0.0",
  "pg": "^8.11.0"  // Or mysql2 if using MySQL
}
```

### Frontend
```javascript
// Via CDN (no package.json changes needed)
import { createAuthClient } from "https://esm.sh/@better-auth/client@1.0.0";
```

## Common Pitfalls to Avoid

1. **Redirect URI Mismatch** - Ensure exact match between OAuth provider config and Better Auth callback URLs
2. **CORS Issues** - Configure CORS properly on backend for auth routes
3. **Session not persisting** - Ensure cookies are sent with credentials: 'include'
4. **Database migrations** - Run Better Auth migrations before starting server
5. **Environment variables** - Never commit secrets to git, use .env files
6. **HTTPS in production** - OAuth requires HTTPS, use localhost for development

## Troubleshooting

See each phase's README.md for phase-specific troubleshooting guides.

### General Issues

**Problem**: OAuth redirect shows 404
**Solution**: Ensure Better Auth handler is mounted at `/api/auth/*`

**Problem**: Session not persisting across page refreshes
**Solution**: Check that cookies are being sent with `credentials: 'include'`

**Problem**: CORS errors on auth requests
**Solution**: Add frontend origin to `trustedOrigins` in Better Auth config

## Resources

- [Better Auth Documentation](https://www.better-auth.com/)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Google OAuth Setup Guide](https://www.better-auth.com/docs/authentication/google)
- [GitHub OAuth Setup Guide](https://www.better-auth.com/docs/authentication/github)
- [Better Auth Basic Usage](https://www.better-auth.com/docs/basic-usage)

## Support

For issues specific to this implementation, see the `test-spec.md` in each phase directory.

For Better Auth issues, consult the [official documentation](https://www.better-auth.com/) or [GitHub issues](https://github.com/better-auth/better-auth/issues).

## License

This authentication implementation follows the same license as Artorizer.
Better Auth is MIT licensed.
