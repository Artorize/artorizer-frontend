# Phase 3: Authentication UI Components

## Overview

Build the frontend authentication UI: login page, auth client wrapper, user profile components, and route guards.

## Duration

**Estimated Time**: 6-8 hours

## Prerequisites

- [x] Phase 1 completed (Backend configured)
- [x] Phase 2 completed (Database ready)
- [x] OAuth providers configured

## Goals

1. ✅ Create login page with Google and GitHub buttons
2. ✅ Implement Better Auth client wrapper
3. ✅ Build user profile component for dashboard
4. ✅ Create route guard for protected pages
5. ✅ Add session restoration on page load

## Files to Create

```
artorizer-frontend/
├── login.html                          # Login page
├── src/
│   └── auth/
│       ├── authClient.js              # Better Auth client wrapper
│       ├── authManager.js             # High-level auth operations
│       ├── loginUI.js                 # Login page handlers
│       ├── userProfile.js             # User profile component
│       └── sessionManager.js          # Session state management
└── src/utils/
    └── authGuard.js                   # Route protection
```

## Key Components

### 1. Login Page (`login.html`)
- OAuth buttons (Google, GitHub)
- Artorizer branding
- Redirect handling

### 2. Auth Client (`authClient.js`)
- Wrapper around Better Auth client
- Centralized configuration
- Error handling

### 3. Auth Manager (`authManager.js`)
- High-level operations:
  - `signInWithGoogle()`
  - `signInWithGitHub()`
  - `signOut()`
  - `getSession()`

### 4. User Profile (`userProfile.js`)
- Display user info in dashboard
- Avatar, name, email
- Logout button

### 5. Route Guard (`authGuard.js`)
- Redirect to login if unauthenticated
- Restore session on load

## Success Criteria

- [ ] Login page displays correctly
- [ ] Google OAuth button initiates flow
- [ ] GitHub OAuth button initiates flow
- [ ] User profile shows after login
- [ ] Protected routes redirect when not authenticated
- [ ] Session persists across page refresh
- [ ] Logout clears session

See `implementation-spec.md` for detailed function signatures and `test-spec.md` for test procedures.
