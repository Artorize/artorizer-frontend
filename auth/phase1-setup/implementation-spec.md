# Phase 1: Implementation Specification

## Overview

This document provides detailed implementation specifications for all functions, configurations, and modules required in Phase 1.

## File 1: `src/auth/config.js`

### Purpose
Centralized configuration for Better Auth instance.

### Exports

#### `authConfig` (Object)

Configuration object for Better Auth.

**Type Definition**:
```javascript
{
  database: DatabaseConfig,
  socialProviders: SocialProvidersConfig,
  trustedOrigins: string[],
  session: SessionConfig,
  rateLimit: RateLimitConfig,
  advanced: AdvancedConfig
}
```

**Full Implementation Specification**:

```javascript
/**
 * Better Auth Configuration
 *
 * @module auth/config
 * @requires dotenv - For environment variable loading
 */

// Configuration object structure
const authConfig = {
  /**
   * Database Configuration
   * Connects Better Auth to PostgreSQL/MySQL database
   */
  database: {
    // Database type - "pg" or "mysql"
    type: string,              // Required: "pg" | "mysql"

    // Connection parameters
    host: string,              // Required: process.env.DB_HOST
    port: number,              // Required: process.env.DB_PORT
    user: string,              // Required: process.env.DB_USER
    password: string,          // Required: process.env.DB_PASSWORD
    database: string,          // Required: process.env.DB_NAME

    // Optional: SSL configuration for production
    ssl: {
      rejectUnauthorized: boolean  // true in production
    }
  },

  /**
   * Social OAuth Provider Configuration
   */
  socialProviders: {
    /**
     * Google OAuth 2.0 Configuration
     */
    google: {
      // Client ID from Google Cloud Console
      clientId: string,        // Required: process.env.GOOGLE_CLIENT_ID

      // Client Secret from Google Cloud Console
      clientSecret: string,    // Required: process.env.GOOGLE_CLIENT_SECRET

      // Optional: Scopes to request
      scope: string[],         // Default: ["openid", "email", "profile"]

      // Optional: Redirect URI (auto-generated if not specified)
      redirectURI: string      // Default: "${baseURL}/api/auth/callback/google"
    },

    /**
     * GitHub OAuth Configuration
     */
    github: {
      // Client ID from GitHub Developer Settings
      clientId: string,        // Required: process.env.GITHUB_CLIENT_ID

      // Client Secret from GitHub Developer Settings
      clientSecret: string,    // Required: process.env.GITHUB_CLIENT_SECRET

      // Optional: Scopes to request
      scope: string[],         // Default: ["user:email"]

      // Optional: Redirect URI (auto-generated if not specified)
      redirectURI: string      // Default: "${baseURL}/api/auth/callback/github"
    }
  },

  /**
   * Base URL for Better Auth
   * Used to construct callback URLs
   */
  baseURL: string,             // Required: process.env.BETTER_AUTH_URL

  /**
   * Secret key for signing sessions and tokens
   * MUST be a secure random string (min 32 characters)
   */
  secret: string,              // Required: process.env.BETTER_AUTH_SECRET

  /**
   * Trusted Origins for CORS
   * Array of allowed frontend origins
   */
  trustedOrigins: string[],    // Required: parsed from process.env.BETTER_AUTH_TRUSTED_ORIGINS

  /**
   * Session Configuration
   */
  session: {
    // How long sessions last before expiring
    expiresIn: number,         // Optional: Default 604800 (7 days in seconds)

    // How often to update session expiry
    updateAge: number,         // Optional: Default 86400 (1 day in seconds)

    // Cookie name for session token
    cookieName: string,        // Optional: Default "better-auth.session_token"

    // Cookie options
    cookieOptions: {
      httpOnly: boolean,       // Required: true (security)
      secure: boolean,         // Required: true in production, false in dev
      sameSite: string,        // Required: "lax" | "strict" | "none"
      path: string,            // Optional: Default "/"
      domain: string           // Optional: Set for subdomain sharing
    }
  },

  /**
   * Rate Limiting Configuration
   * Prevents brute force attacks
   */
  rateLimit: {
    // Enable rate limiting
    enabled: boolean,          // Optional: Default true

    // Window size in seconds
    window: number,            // Optional: Default 60

    // Max requests per window
    max: number                // Optional: Default 100
  },

  /**
   * Advanced Security Settings
   */
  advanced: {
    // Enable CSRF protection
    csrfProtection: {
      enabled: boolean,        // Optional: Default true
      tokenLength: number      // Optional: Default 32
    },

    // Enable secure headers
    secureHeaders: boolean,    // Optional: Default true

    // Generate user IDs as UUID
    generateId: function       // Optional: Custom ID generation
  }
};
```

**Required Environment Variables**:
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `BETTER_AUTH_SECRET` - Secret for signing tokens
- `BETTER_AUTH_URL` - Base URL of backend
- `BETTER_AUTH_TRUSTED_ORIGINS` - Comma-separated frontend origins
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `NODE_ENV` - Environment (development/production)

**Example Implementation**:
```javascript
import 'dotenv/config';

export const authConfig = {
  database: {
    type: "pg",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: true
    } : undefined
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  },

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') || [],

  session: {
    expiresIn: parseInt(process.env.SESSION_EXPIRES_IN || "604800"),
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE || "86400"),
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    }
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100
  },

  advanced: {
    csrfProtection: {
      enabled: true
    },
    secureHeaders: true
  }
};
```

**Validation Requirements**:
- All required environment variables must be present
- `BETTER_AUTH_SECRET` must be at least 32 characters
- `trustedOrigins` must include frontend URL
- Database credentials must be valid
- OAuth client IDs and secrets must be valid format

---

## File 2: `src/auth/index.js`

### Purpose
Initialize and export Better Auth instance.

### Exports

#### `auth` (BetterAuthInstance)

Initialized Better Auth instance ready for use.

**Function**: `initializeAuth()`

Initializes the Better Auth instance with configuration.

**Parameters**: None (uses config from `config.js`)

**Returns**: `BetterAuthInstance`

**Throws**:
- `Error` - If configuration is invalid
- `DatabaseConnectionError` - If database connection fails

**Implementation Specification**:

```javascript
/**
 * Better Auth Instance
 *
 * @module auth
 * @requires better-auth
 * @requires ./config
 */

import { betterAuth } from "better-auth";
import { authConfig } from "./config.js";

/**
 * Initialize Better Auth
 *
 * Creates and configures the Better Auth instance with
 * Google and GitHub OAuth providers, session management,
 * and security features.
 *
 * @function initializeAuth
 * @returns {BetterAuthInstance} Configured auth instance
 * @throws {Error} If configuration is invalid or database connection fails
 *
 * @example
 * import { auth } from './auth/index.js';
 *
 * // Auth instance ready to use
 * app.use('/api/auth/*', auth.handler);
 */
function initializeAuth() {
  // Validate required configuration
  // (Implementation should validate all required fields)

  // Initialize Better Auth with config
  const authInstance = betterAuth(authConfig);

  // Log successful initialization (development only)
  if (process.env.NODE_ENV === "development") {
    console.log("✅ Better Auth initialized successfully");
    console.log("   - Google OAuth configured");
    console.log("   - GitHub OAuth configured");
    console.log(`   - Base URL: ${authConfig.baseURL}`);
  }

  return authInstance;
}

// Export initialized instance
export const auth = initializeAuth();
```

**Instance Properties** (from Better Auth):
- `auth.handler` - Request handler for all auth routes
- `auth.api` - API methods for manual auth operations
- `auth.middleware` - Middleware functions for route protection

**Instance Methods** (commonly used):
- `auth.handler(req, res)` - Handle auth requests
- `auth.api.getSession({ headers })` - Get session from request
- `auth.api.signOut({ sessionToken })` - Sign out a session

---

## File 3: `src/routes/auth.js`

### Purpose
Mount Better Auth routes on Express app.

### Exports

None (modifies Express app directly)

### Functions

#### `setupAuthRoutes(app)`

Mounts all Better Auth routes on the Express application.

**Parameters**:
- `app` (Express.Application) - Express app instance

**Returns**: `void`

**Side Effects**:
- Mounts auth handler at `/api/auth/*`
- Adds CORS middleware for auth routes
- Logs route registration in development

**Implementation Specification**:

```javascript
/**
 * Auth Routes Setup
 *
 * @module routes/auth
 * @requires express
 * @requires ../auth
 */

import express from "express";
import { auth } from "../auth/index.js";

/**
 * Setup Authentication Routes
 *
 * Mounts Better Auth handler to handle all authentication routes:
 * - POST /api/auth/sign-in/social - Initiate OAuth flow
 * - GET /api/auth/callback/google - Google OAuth callback
 * - GET /api/auth/callback/github - GitHub OAuth callback
 * - POST /api/auth/sign-out - Sign out user
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/session/refresh - Refresh session
 *
 * @function setupAuthRoutes
 * @param {Express.Application} app - Express application instance
 * @returns {void}
 *
 * @example
 * import express from 'express';
 * import { setupAuthRoutes } from './routes/auth.js';
 *
 * const app = express();
 * setupAuthRoutes(app);
 */
export function setupAuthRoutes(app) {
  // Mount Better Auth handler for all /api/auth/* routes
  app.all("/api/auth/*", (req, res) => {
    return auth.handler(req, res);
  });

  // Log route registration
  if (process.env.NODE_ENV === "development") {
    console.log("✅ Auth routes mounted at /api/auth/*");
  }
}

/**
 * Alternative: Router-based setup
 * Use this if you prefer Express Router pattern
 */
export function createAuthRouter() {
  const router = express.Router();

  // Mount auth handler on router
  router.all("*", (req, res) => {
    return auth.handler(req, res);
  });

  return router;
}
```

**Usage in Main App**:

```javascript
// app.js or server.js
import express from "express";
import { setupAuthRoutes } from "./routes/auth.js";

const app = express();

// ... other middleware

// Setup auth routes
setupAuthRoutes(app);

// ... other routes

app.listen(7000, () => {
  console.log("Server running on port 7000");
});
```

**Alternative Usage with Router**:

```javascript
// app.js or server.js
import express from "express";
import { createAuthRouter } from "./routes/auth.js";

const app = express();

// Mount auth router
app.use("/api/auth", createAuthRouter());
```

---

## File 4: `.env.example`

### Purpose
Template for environment variables (safe to commit to git).

**Content**:

```bash
# ===========================================
# ARTORIZER AUTHENTICATION CONFIGURATION
# ===========================================

# Database Configuration
# -----------------------
DB_HOST=localhost
DB_PORT=5432
DB_USER=artorizer
DB_PASSWORD=<your-database-password>
DB_NAME=artorizer_production

# Better Auth Configuration
# --------------------------
# Generate secret with: openssl rand -base64 32
BETTER_AUTH_SECRET=<your-32-character-secret-key>

# Base URL of your backend (no trailing slash)
BETTER_AUTH_URL=https://router.artorizer.com

# Comma-separated list of allowed frontend origins
BETTER_AUTH_TRUSTED_ORIGINS=https://artorizer.com,http://localhost:8080

# Google OAuth Credentials
# -------------------------
# Get from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# GitHub OAuth Credentials
# -------------------------
# Get from: https://github.com/settings/developers
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# Session Configuration
# ---------------------
# Session expiration in seconds (604800 = 7 days)
SESSION_EXPIRES_IN=604800

# Session update interval in seconds (86400 = 1 day)
SESSION_UPDATE_AGE=86400

# Environment
# -----------
NODE_ENV=production
```

---

## File 5: `.gitignore` (Update)

### Purpose
Ensure secrets are never committed.

**Add These Lines**:

```
# Environment variables
.env
.env.local
.env.production

# Better Auth generated files
better-auth.db
```

---

## Validation Functions

### `validateConfig(config)`

Validates auth configuration before initialization.

**Parameters**:
- `config` (Object) - Auth configuration object

**Returns**: `{ valid: boolean, errors: string[] }`

**Implementation**:

```javascript
/**
 * Validate Auth Configuration
 *
 * Ensures all required configuration values are present
 * and properly formatted before initializing Better Auth.
 *
 * @function validateConfig
 * @param {Object} config - Auth configuration object
 * @returns {{ valid: boolean, errors: string[] }}
 *
 * @example
 * const result = validateConfig(authConfig);
 * if (!result.valid) {
 *   console.error('Config errors:', result.errors);
 * }
 */
export function validateConfig(config) {
  const errors = [];

  // Database validation
  if (!config.database?.host) {
    errors.push("DB_HOST is required");
  }
  if (!config.database?.user) {
    errors.push("DB_USER is required");
  }
  if (!config.database?.password) {
    errors.push("DB_PASSWORD is required");
  }
  if (!config.database?.database) {
    errors.push("DB_NAME is required");
  }

  // Better Auth validation
  if (!config.secret) {
    errors.push("BETTER_AUTH_SECRET is required");
  } else if (config.secret.length < 32) {
    errors.push("BETTER_AUTH_SECRET must be at least 32 characters");
  }

  if (!config.baseURL) {
    errors.push("BETTER_AUTH_URL is required");
  }

  if (!config.trustedOrigins || config.trustedOrigins.length === 0) {
    errors.push("BETTER_AUTH_TRUSTED_ORIGINS is required");
  }

  // Google OAuth validation
  if (!config.socialProviders?.google?.clientId) {
    errors.push("GOOGLE_CLIENT_ID is required");
  }
  if (!config.socialProviders?.google?.clientSecret) {
    errors.push("GOOGLE_CLIENT_SECRET is required");
  }

  // GitHub OAuth validation
  if (!config.socialProviders?.github?.clientId) {
    errors.push("GITHUB_CLIENT_ID is required");
  }
  if (!config.socialProviders?.github?.clientSecret) {
    errors.push("GITHUB_CLIENT_SECRET is required");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Error Handling

All functions should handle these error cases:

### Configuration Errors
```javascript
class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}
```

### Database Connection Errors
```javascript
class DatabaseConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}
```

### OAuth Provider Errors
```javascript
class OAuthProviderError extends Error {
  constructor(provider, message) {
    super(`${provider}: ${message}`);
    this.name = "OAuthProviderError";
    this.provider = provider;
  }
}
```

---

## Implementation Checklist

- [ ] Create `src/auth/config.js` with full configuration
- [ ] Create `src/auth/index.js` with auth initialization
- [ ] Create `src/routes/auth.js` with route mounting
- [ ] Create `.env.example` template
- [ ] Update `.gitignore` to exclude `.env`
- [ ] Implement `validateConfig()` function
- [ ] Add error handling classes
- [ ] Test configuration loading
- [ ] Test auth instance initialization
- [ ] Test route mounting
- [ ] Verify all environment variables load correctly

---

## Success Criteria

1. ✅ All files created with proper structure
2. ✅ Configuration validates successfully
3. ✅ Better Auth instance initializes without errors
4. ✅ Routes mounted at `/api/auth/*`
5. ✅ Environment variables load correctly
6. ✅ No secrets committed to git
7. ✅ Development logs show successful initialization
8. ✅ Server starts without errors

---

## Next Steps

After implementing all specifications, proceed to Phase 1 testing (see `test-spec.md`).
