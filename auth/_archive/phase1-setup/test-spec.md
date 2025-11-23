# Phase 1: Test Specification

## Overview

This document outlines all tests that must pass before Phase 1 is considered complete.

## Test Categories

1. **Unit Tests** - Test individual functions and modules
2. **Integration Tests** - Test Better Auth initialization and configuration
3. **Manual Tests** - Verify OAuth provider setup and environment
4. **Security Tests** - Validate security configuration

---

## Unit Tests

### Test Suite: Configuration Validation

#### Test 1.1: `validateConfig()` - Valid Configuration
```javascript
describe('validateConfig', () => {
  it('should return valid=true for complete configuration', () => {
    const config = {
      database: {
        host: 'localhost',
        user: 'test',
        password: 'test',
        database: 'test'
      },
      secret: 'a'.repeat(32),
      baseURL: 'http://localhost:7000',
      trustedOrigins: ['http://localhost:8080'],
      socialProviders: {
        google: {
          clientId: 'test-google-id',
          clientSecret: 'test-google-secret'
        },
        github: {
          clientId: 'test-github-id',
          clientSecret: 'test-github-secret'
        }
      }
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

**Expected Result**: ✅ Test passes, config is valid

---

#### Test 1.2: `validateConfig()` - Missing Database Config
```javascript
it('should fail when database config is missing', () => {
  const config = {
    database: {},
    secret: 'a'.repeat(32),
    baseURL: 'http://localhost:7000',
    trustedOrigins: ['http://localhost:8080'],
    socialProviders: {
      google: { clientId: 'test', clientSecret: 'test' },
      github: { clientId: 'test', clientSecret: 'test' }
    }
  };

  const result = validateConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('DB_HOST is required');
  expect(result.errors).toContain('DB_USER is required');
  expect(result.errors).toContain('DB_PASSWORD is required');
  expect(result.errors).toContain('DB_NAME is required');
});
```

**Expected Result**: ✅ Test passes, validation catches missing database config

---

#### Test 1.3: `validateConfig()` - Short Secret
```javascript
it('should fail when secret is too short', () => {
  const config = {
    database: { host: 'localhost', user: 'test', password: 'test', database: 'test' },
    secret: 'short',  // Too short!
    baseURL: 'http://localhost:7000',
    trustedOrigins: ['http://localhost:8080'],
    socialProviders: {
      google: { clientId: 'test', clientSecret: 'test' },
      github: { clientId: 'test', clientSecret: 'test' }
    }
  };

  const result = validateConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('BETTER_AUTH_SECRET must be at least 32 characters');
});
```

**Expected Result**: ✅ Test passes, validation catches short secret

---

#### Test 1.4: `validateConfig()` - Missing OAuth Credentials
```javascript
it('should fail when Google OAuth credentials are missing', () => {
  const config = {
    database: { host: 'localhost', user: 'test', password: 'test', database: 'test' },
    secret: 'a'.repeat(32),
    baseURL: 'http://localhost:7000',
    trustedOrigins: ['http://localhost:8080'],
    socialProviders: {
      google: {},  // Missing credentials
      github: { clientId: 'test', clientSecret: 'test' }
    }
  };

  const result = validateConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('GOOGLE_CLIENT_ID is required');
  expect(result.errors).toContain('GOOGLE_CLIENT_SECRET is required');
});
```

**Expected Result**: ✅ Test passes, validation catches missing OAuth credentials

---

### Test Suite: Environment Variables

#### Test 2.1: Load Environment Variables
```javascript
describe('Environment Variables', () => {
  beforeAll(() => {
    // Load .env.test file
    require('dotenv').config({ path: '.env.test' });
  });

  it('should load all required environment variables', () => {
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_USER).toBeDefined();
    expect(process.env.DB_PASSWORD).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.BETTER_AUTH_SECRET).toBeDefined();
    expect(process.env.BETTER_AUTH_URL).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
    expect(process.env.GITHUB_CLIENT_ID).toBeDefined();
    expect(process.env.GITHUB_CLIENT_SECRET).toBeDefined();
  });
});
```

**Test File**: Create `.env.test` with test values

**Expected Result**: ✅ All environment variables load successfully

---

#### Test 2.2: Secret Length Validation
```javascript
it('should have BETTER_AUTH_SECRET with minimum length', () => {
  expect(process.env.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
});
```

**Expected Result**: ✅ Secret meets minimum length requirement

---

### Test Suite: Configuration Loading

#### Test 3.1: Config Object Structure
```javascript
describe('Auth Configuration', () => {
  it('should export valid config object', () => {
    const { authConfig } = require('./src/auth/config.js');

    expect(authConfig).toBeDefined();
    expect(authConfig.database).toBeDefined();
    expect(authConfig.socialProviders).toBeDefined();
    expect(authConfig.socialProviders.google).toBeDefined();
    expect(authConfig.socialProviders.github).toBeDefined();
    expect(authConfig.baseURL).toBeDefined();
    expect(authConfig.secret).toBeDefined();
    expect(authConfig.trustedOrigins).toBeInstanceOf(Array);
  });
});
```

**Expected Result**: ✅ Config object has correct structure

---

#### Test 3.2: Database Configuration
```javascript
it('should have valid database configuration', () => {
  const { authConfig } = require('./src/auth/config.js');

  expect(authConfig.database.type).toBe('pg'); // or 'mysql'
  expect(authConfig.database.host).toBeTruthy();
  expect(authConfig.database.user).toBeTruthy();
  expect(authConfig.database.password).toBeTruthy();
  expect(authConfig.database.database).toBeTruthy();
});
```

**Expected Result**: ✅ Database config is valid

---

#### Test 3.3: OAuth Provider Configuration
```javascript
it('should have valid OAuth provider configuration', () => {
  const { authConfig } = require('./src/auth/config.js');

  // Google
  expect(authConfig.socialProviders.google.clientId).toBeTruthy();
  expect(authConfig.socialProviders.google.clientSecret).toBeTruthy();

  // GitHub
  expect(authConfig.socialProviders.github.clientId).toBeTruthy();
  expect(authConfig.socialProviders.github.clientSecret).toBeTruthy();
});
```

**Expected Result**: ✅ OAuth providers configured correctly

---

## Integration Tests

### Test Suite: Better Auth Initialization

#### Test 4.1: Auth Instance Creation
```javascript
describe('Better Auth Instance', () => {
  it('should initialize without errors', () => {
    expect(() => {
      const { auth } = require('./src/auth/index.js');
    }).not.toThrow();
  });
});
```

**Expected Result**: ✅ Auth instance initializes successfully

---

#### Test 4.2: Auth Instance Properties
```javascript
it('should have required properties', () => {
  const { auth } = require('./src/auth/index.js');

  expect(auth.handler).toBeDefined();
  expect(typeof auth.handler).toBe('function');
  expect(auth.api).toBeDefined();
});
```

**Expected Result**: ✅ Auth instance has handler and api

---

### Test Suite: Route Mounting

#### Test 5.1: Routes Mount Successfully
```javascript
describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    const express = require('express');
    app = express();
  });

  it('should mount auth routes without errors', () => {
    expect(() => {
      const { setupAuthRoutes } = require('./src/routes/auth.js');
      setupAuthRoutes(app);
    }).not.toThrow();
  });
});
```

**Expected Result**: ✅ Routes mount successfully

---

#### Test 5.2: Routes Respond to Requests
```javascript
it('should respond to auth route requests', async () => {
  const { setupAuthRoutes } = require('./src/routes/auth.js');
  setupAuthRoutes(app);

  const request = require('supertest');
  const response = await request(app).get('/api/auth/session');

  // Should not be 404
  expect(response.status).not.toBe(404);
});
```

**Expected Result**: ✅ Auth routes respond (not 404)

---

## Manual Tests

### Test Suite: OAuth Provider Setup

#### Test 6.1: Google OAuth Configuration
**Steps**:
1. Open browser
2. Navigate to `http://localhost:7000/api/auth/callback/google`
3. Observe response (should not be "Not Found")

**Expected Result**:
- ✅ Receives Better Auth response (may be error, but not 404)
- ✅ Route is registered and responding

---

#### Test 6.2: GitHub OAuth Configuration
**Steps**:
1. Open browser
2. Navigate to `http://localhost:7000/api/auth/callback/github`
3. Observe response

**Expected Result**:
- ✅ Receives Better Auth response (may be error, but not 404)
- ✅ Route is registered and responding

---

#### Test 6.3: Google Cloud Console Configuration
**Steps**:
1. Log into [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth client
3. Verify redirect URIs include:
   - `http://localhost:7000/api/auth/callback/google` (development)
   - `https://router.artorizer.com/api/auth/callback/google` (production)

**Expected Result**:
- ✅ Redirect URIs match exactly
- ✅ OAuth client is enabled

---

#### Test 6.4: GitHub OAuth App Configuration
**Steps**:
1. Log into [GitHub Developer Settings](https://github.com/settings/developers)
2. Open your OAuth App
3. Verify callback URL is:
   - `http://localhost:7000/api/auth/callback/github` (development)
   - `https://router.artorizer.com/api/auth/callback/github` (production)

**Expected Result**:
- ✅ Callback URL matches exactly
- ✅ App is active

---

### Test Suite: Server Startup

#### Test 7.1: Server Starts Without Errors
**Steps**:
```bash
cd /path/to/router-backend
npm start
```

**Expected Output**:
```
✅ Better Auth initialized successfully
   - Google OAuth configured
   - GitHub OAuth configured
   - Base URL: http://localhost:7000
✅ Auth routes mounted at /api/auth/*
Server running on port 7000
```

**Expected Result**: ✅ Server starts without errors

---

#### Test 7.2: Auth Routes Listed
**Steps**:
```bash
# In another terminal
curl http://localhost:7000/api/auth/session
```

**Expected Output**:
```json
{
  "session": null
}
```
or
```json
{
  "error": "Unauthorized"
}
```

**Expected Result**:
- ✅ NOT 404 Not Found
- ✅ Returns JSON response

---

### Test Suite: Environment Security

#### Test 8.1: Secrets Not in Git
**Steps**:
```bash
git status
```

**Expected Result**:
- ✅ `.env` file is NOT listed
- ✅ `.env` is in `.gitignore`

---

#### Test 8.2: Example File Exists
**Steps**:
```bash
ls -la | grep .env
```

**Expected Output**:
```
.env
.env.example
```

**Expected Result**:
- ✅ `.env.example` exists
- ✅ `.env.example` has no real secrets

---

## Security Tests

### Test Suite: Configuration Security

#### Test 9.1: Secret Randomness
```javascript
describe('Security', () => {
  it('should have a random secret, not default value', () => {
    const { authConfig } = require('./src/auth/config.js');

    // Should not be placeholder values
    expect(authConfig.secret).not.toBe('changeme');
    expect(authConfig.secret).not.toBe('your-secret-here');
    expect(authConfig.secret).not.toMatch(/example/i);
    expect(authConfig.secret).not.toMatch(/test/i);
  });
});
```

**Expected Result**: ✅ Secret is properly randomized

---

#### Test 9.2: Production Security Settings
```javascript
it('should use secure settings in production', () => {
  process.env.NODE_ENV = 'production';
  const { authConfig } = require('./src/auth/config.js');

  expect(authConfig.session.cookieOptions.secure).toBe(true);
  expect(authConfig.session.cookieOptions.httpOnly).toBe(true);
  expect(authConfig.database.ssl).toBeDefined();
  expect(authConfig.advanced.csrfProtection.enabled).toBe(true);
});
```

**Expected Result**: ✅ Production uses secure settings

---

#### Test 9.3: CORS Configuration
```javascript
it('should have proper CORS configuration', () => {
  const { authConfig } = require('./src/auth/config.js');

  expect(authConfig.trustedOrigins).toBeDefined();
  expect(authConfig.trustedOrigins.length).toBeGreaterThan(0);
  expect(authConfig.trustedOrigins).toContain('https://artorizer.com');
});
```

**Expected Result**: ✅ Trusted origins properly configured

---

## Performance Tests

### Test Suite: Initialization Performance

#### Test 10.1: Fast Initialization
```javascript
describe('Performance', () => {
  it('should initialize in less than 1 second', () => {
    const start = Date.now();
    const { auth } = require('./src/auth/index.js');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
```

**Expected Result**: ✅ Initialization is fast

---

## Test Running Guide

### Setup Test Environment

1. **Create Test Environment File**:
```bash
cp .env.example .env.test
```

2. **Install Test Dependencies**:
```bash
npm install --save-dev jest supertest
```

3. **Add Test Script** to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Run Tests

**All Tests**:
```bash
npm test
```

**Watch Mode**:
```bash
npm run test:watch
```

**With Coverage**:
```bash
npm run test:coverage
```

**Specific Test Suite**:
```bash
npm test -- --testNamePattern="validateConfig"
```

---

## Test Coverage Requirements

Minimum coverage thresholds:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Configure in `jest.config.js`:
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

---

## Success Criteria

All tests must pass:

- [ ] Unit Tests: 10/10 passing
- [ ] Integration Tests: 5/5 passing
- [ ] Manual Tests: 8/8 passing
- [ ] Security Tests: 3/3 passing
- [ ] Performance Tests: 1/1 passing

**Total**: 27/27 tests passing

---

## Troubleshooting Failed Tests

### "Cannot find module 'better-auth'"
**Solution**: Run `npm install better-auth`

### "Database connection failed"
**Solution**:
1. Verify database is running: `pg_isready` or `mysqladmin ping`
2. Check credentials in `.env`
3. Verify database exists: `psql -l` or `mysql -e "SHOW DATABASES"`

### "Invalid redirect URI"
**Solution**:
1. Check exact match in OAuth provider settings
2. Ensure no trailing slashes
3. Verify protocol (http vs https)

### "CORS error"
**Solution**: Add frontend origin to `BETTER_AUTH_TRUSTED_ORIGINS`

### "Secret too short"
**Solution**: Generate new secret: `openssl rand -base64 32`

---

## Next Phase

After all tests pass, proceed to **Phase 2: Database Schema & Migration**.
