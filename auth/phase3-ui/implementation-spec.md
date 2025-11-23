# Phase 3: Implementation Specification

See `components-spec.md` for detailed component specifications.

## Implementation Order

1. **Create `authClient.js`** - Foundation for all auth operations
2. **Create `authManager.js`** - High-level API
3. **Create `login.html`** - Login page
4. **Create `loginUI.js`** - Login page handlers
5. **Create `userProfile.js`** - Profile component
6. **Create `sessionManager.js`** - Session state management
7. **Create `authGuard.js`** - Route protection
8. **Update `dashboard-v2.html`** - Add user profile container
9. **Update `dashboard-v2.js`** - Add auth guard
10. **Add CSS** - Styling for login and profile

## Key Implementation Details

### Better Auth Client CDN
```javascript
import { createAuthClient } from "https://esm.sh/@better-auth/client@1.0.0";
```

### Configuration
All auth operations use:
- `baseURL: "https://router.artorizer.com"`
- `credentials: "include"` (send cookies)

### OAuth Flow
1. User clicks "Continue with Google"
2. `authManager.signInWithGoogle()` called
3. Redirects to Google OAuth page
4. User grants permission
5. Redirects back to `/api/auth/callback/google`
6. Better Auth creates session
7. Redirects to `callbackURL` (dashboard)
8. Dashboard checks session, displays user info

### Session Persistence
- Sessions stored in httpOnly cookies
- Automatically sent with requests
- `getSession()` restores user on page load

### Error Handling
All async functions should:
- Try/catch errors
- Display user-friendly messages
- Log errors to console
- Gracefully degrade

## Success Criteria

- [ ] Login page renders correctly
- [ ] OAuth buttons initiate flows
- [ ] Successful login redirects to dashboard
- [ ] User profile displays in dashboard
- [ ] Logout clears session and redirects
- [ ] Route guard protects dashboard
- [ ] Session persists across page refresh
