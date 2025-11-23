# Phase 1: Setup & Configuration

## Overview

This phase focuses on installing Better Auth on the backend, configuring OAuth providers (Google and GitHub), and setting up the authentication instance. This is a **backend-only** phase.

## Duration

**Estimated Time**: 3-4 hours

## Prerequisites

- [ ] Node.js 18+ installed on router backend
- [ ] PostgreSQL or MySQL database running
- [ ] Access to router backend codebase
- [ ] Google Cloud Console account
- [ ] GitHub account with developer access

## Goals

By the end of this phase, you will have:

1. ✅ Better Auth installed on the backend
2. ✅ Google OAuth 2.0 credentials created and configured
3. ✅ GitHub OAuth App created and configured
4. ✅ Better Auth instance initialized with both providers
5. ✅ Auth routes mounted on the backend (`/api/auth/*`)
6. ✅ Environment variables configured securely

## Components to Create

### Backend Files

```
router-backend/                          # Your existing backend
├── src/
│   ├── auth/
│   │   ├── config.js                   # Better Auth configuration
│   │   ├── index.js                    # Auth instance export
│   │   └── middleware.js               # Auth middleware (for Phase 4)
│   └── routes/
│       └── auth.js                     # Auth route handler
├── .env.example                        # Example environment variables
└── package.json                        # Updated dependencies
```

## Detailed Steps

### Step 1: Install Better Auth

**Location**: Backend `package.json`

**Commands**:
```bash
cd /path/to/router-backend
npm install better-auth
npm install pg  # Or mysql2 if using MySQL
```

**Expected Dependencies**:
```json
{
  "dependencies": {
    "better-auth": "^1.0.0",
    "pg": "^8.11.0"
  }
}
```

### Step 2: Create Google OAuth Credentials

**Actions**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Artorizer Auth"
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   - Development: `http://localhost:7000/api/auth/callback/google`
   - Production: `https://router.artorizer.com/api/auth/callback/google`
7. Save Client ID and Client Secret

**Credentials Needed**:
- `GOOGLE_CLIENT_ID` - Will look like: `123456789-abcdefg.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` - Will look like: `GOCSPX-abcdefghijklmnop`

### Step 3: Create GitHub OAuth App

**Actions**:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: "Artorizer"
   - **Homepage URL**: `https://artorizer.com`
   - **Authorization callback URL**:
     - Development: `http://localhost:7000/api/auth/callback/github`
     - Production: `https://router.artorizer.com/api/auth/callback/github`
4. Register application
5. Generate client secret
6. Save Client ID and Client Secret

**Credentials Needed**:
- `GITHUB_CLIENT_ID` - Will look like: `Iv1.a1b2c3d4e5f6g7h8`
- `GITHUB_CLIENT_SECRET` - Will look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

### Step 4: Configure Environment Variables

**Location**: Backend `.env` file

**File**: `.env`
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=artorizer
DB_PASSWORD=<your-secure-database-password>
DB_NAME=artorizer_production

# Better Auth Configuration
BETTER_AUTH_SECRET=<generate-this-see-below>
BETTER_AUTH_URL=https://router.artorizer.com
BETTER_AUTH_TRUSTED_ORIGINS=https://artorizer.com,http://localhost:8080

# Google OAuth
GOOGLE_CLIENT_ID=<from-step-2>
GOOGLE_CLIENT_SECRET=<from-step-2>

# GitHub OAuth
GITHUB_CLIENT_ID=<from-step-3>
GITHUB_CLIENT_SECRET=<from-step-3>

# Session Configuration
SESSION_EXPIRES_IN=604800  # 7 days in seconds
SESSION_UPDATE_AGE=86400   # 1 day in seconds

# Environment
NODE_ENV=production
```

**Generate BETTER_AUTH_SECRET**:
```bash
openssl rand -base64 32
```

**Security Notes**:
- Never commit `.env` file to git
- Create `.env.example` with dummy values for documentation
- Use different secrets for development and production
- Rotate secrets periodically (every 90 days recommended)

### Step 5: Create Better Auth Configuration

**See**: `implementation-spec.md` for detailed function signatures

**File**: `src/auth/config.js`

This file will contain the Better Auth configuration object with:
- Database connection settings
- OAuth provider configurations
- Session settings
- CORS/trusted origins
- Security settings

**Key Configuration Options**:
- `database` - Database connection parameters
- `socialProviders` - Google and GitHub provider configs
- `trustedOrigins` - Allowed frontend origins
- `session` - Session duration and update settings
- `rateLimit` - Rate limiting configuration
- `advanced` - CSRF and security settings

### Step 6: Create Auth Instance

**File**: `src/auth/index.js`

This file will:
- Import Better Auth
- Import configuration from `config.js`
- Initialize Better Auth instance
- Export auth instance for use in routes

### Step 7: Mount Auth Routes

**File**: `src/routes/auth.js` or in main `app.js`

This will:
- Import auth instance
- Mount Better Auth handler at `/api/auth/*`
- Handle all OAuth callbacks automatically

**Routes Created** (automatic):
- `POST /api/auth/sign-in/social` - Initiate OAuth flow
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/callback/github` - GitHub OAuth callback
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- Additional routes for token refresh, etc.

## Testing This Phase

**Manual Tests**:

1. **Server Starts Successfully**:
   ```bash
   npm start
   # Should start without errors
   ```

2. **Auth Routes Respond**:
   ```bash
   curl http://localhost:7000/api/auth/session
   # Should return 401 or session data (not 404)
   ```

3. **Environment Variables Loaded**:
   ```bash
   node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
   # Should print your client ID
   ```

See `test-spec.md` for comprehensive testing procedures.

## Success Criteria

- [ ] Better Auth installed successfully
- [ ] Google OAuth credentials created and stored securely
- [ ] GitHub OAuth credentials created and stored securely
- [ ] `.env` file configured with all required variables
- [ ] `.env.example` created for documentation
- [ ] Auth configuration file created
- [ ] Auth instance initialized without errors
- [ ] Auth routes mounted at `/api/auth/*`
- [ ] Server starts without errors
- [ ] Auth routes respond (not 404)

## Common Issues

### Issue: "Cannot find module 'better-auth'"
**Solution**: Run `npm install better-auth` in backend directory

### Issue: "Database connection failed"
**Solution**: Verify database is running and credentials in `.env` are correct

### Issue: "Invalid redirect URI"
**Solution**: Ensure redirect URIs in Google/GitHub match exactly with Better Auth callback URLs

### Issue: "CORS error on auth requests"
**Solution**: Add frontend origin to `trustedOrigins` in Better Auth config

## Next Phase

After completing this phase, proceed to **Phase 2: Database Schema & Migration** to create the necessary database tables for users, sessions, and accounts.

## Documentation Files

- `implementation-spec.md` - Detailed function signatures and implementation requirements
- `test-spec.md` - Comprehensive testing procedures
