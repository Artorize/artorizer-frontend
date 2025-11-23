# Artorizer Authentication - Implementation Guide

## Quick Start

This guide provides a step-by-step walkthrough for implementing Better Auth OAuth authentication in Artorizer.

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL or MySQL database running
- [ ] Access to router backend codebase
- [ ] Google Cloud Console account
- [ ] GitHub developer account
- [ ] Basic understanding of OAuth 2.0
- [ ] Familiarity with Express.js and ES6 modules

---

## Implementation Steps

Follow these phases in order. Each phase builds on the previous one.

### ✅ Phase 1: Setup & Configuration (3-4 hours)

**What**: Install Better Auth on backend, configure OAuth providers

**Location**: `auth/phase1-setup/`

**Key Steps**:
1. Install Better Auth: `npm install better-auth pg`
2. Create Google OAuth credentials in Google Cloud Console
3. Create GitHub OAuth App in GitHub Developer Settings
4. Configure `.env` with secrets
5. Create auth configuration and instance
6. Mount auth routes at `/api/auth/*`

**Verification**:
```bash
# Server starts without errors
npm start

# Auth routes respond
curl http://localhost:7000/api/auth/session
# Should NOT return 404
```

**Documentation**:
- [README](phase1-setup/README.md) - Overview and goals
- [implementation-spec.md](phase1-setup/implementation-spec.md) - Detailed specs
- [test-spec.md](phase1-setup/test-spec.md) - Test procedures

**⚠️ Blockers**: Cannot proceed without Phase 1 complete

---

### ✅ Phase 2: Database Schema (1-2 hours)

**What**: Create database tables for users, sessions, accounts

**Location**: `auth/phase2-database/`

**Key Steps**:
1. Run Better Auth migration: `npx better-auth migrate`
2. Add `user_id` column to `artwork_jobs`
3. Create foreign key constraints
4. Create performance indexes

**Verification**:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('user', 'account', 'session', 'verification');

-- Should return 4 rows
```

**Documentation**:
- [README](phase2-database/README.md) - Overview
- [schema.md](phase2-database/schema.md) - Complete schema
- [implementation-spec.md](phase2-database/implementation-spec.md) - Migration scripts
- [test-spec.md](phase2-database/test-spec.md) - Database tests

**⚠️ Dependencies**: Requires Phase 1 complete

---

### ✅ Phase 3: Authentication UI (6-8 hours)

**What**: Build login page, auth client, user profile components

**Location**: `auth/phase3-ui/`

**Key Steps**:
1. Create login page with OAuth buttons
2. Create auth client wrapper
3. Create auth manager class
4. Create user profile component
5. Create route guard
6. Update dashboard to use auth

**Verification**:
1. Navigate to `/login.html`
2. Click "Continue with Google"
3. Complete OAuth
4. Should redirect to dashboard with user profile visible

**Documentation**:
- [README](phase3-ui/README.md) - Overview
- [components-spec.md](phase3-ui/components-spec.md) - Component specs
- [implementation-spec.md](phase3-ui/implementation-spec.md) - Implementation details
- [test-spec.md](phase3-ui/test-spec.md) - UI tests

**⚠️ Dependencies**: Requires Phases 1-2 complete

---

### ✅ Phase 4: Backend Integration (4-6 hours)

**What**: Protect API routes, associate uploads with users

**Location**: `auth/phase4-backend-integration/`

**Key Steps**:
1. Create auth middleware
2. Protect upload endpoint
3. Update upload handler to include user_id
4. Create user artworks endpoint
5. Update frontend to send credentials

**Verification**:
```bash
# Without auth - should fail
curl -X POST http://localhost:7000/api/upload -F "file=@test.jpg"
# Expected: 401 Unauthorized

# With auth - should work
curl -X POST http://localhost:7000/api/upload \
  -H "Cookie: better-auth.session_token=..." \
  -F "file=@test.jpg"
# Expected: 200 OK
```

**Documentation**:
- [README](phase4-backend-integration/README.md) - Overview
- [api-spec.md](phase4-backend-integration/api-spec.md) - API endpoints
- [implementation-spec.md](phase4-backend-integration/implementation-spec.md) - Middleware
- [test-spec.md](phase4-backend-integration/test-spec.md) - API tests

**⚠️ Dependencies**: Requires Phases 1-3 complete

---

### ✅ Phase 5: Security & Sessions (2-3 hours)

**What**: Harden security, configure sessions, add security headers

**Location**: `auth/phase5-security/`

**Key Steps**:
1. Verify httpOnly cookies configured
2. Add security headers middleware
3. Implement session auto-refresh
4. Add HTTPS enforcement (production)
5. Configure rate limiting
6. Add audit logging

**Verification**:
```javascript
// In browser console - should NOT see token
console.log(document.cookie);
// Expected: No session token visible
```

```bash
# Security headers present
curl -I https://router.artorizer.com/
# Expected: X-Frame-Options, CSP, etc.
```

**Documentation**:
- [README](phase5-security/README.md) - Overview
- [security-spec.md](phase5-security/security-spec.md) - Security checklist
- [implementation-spec.md](phase5-security/implementation-spec.md) - Security implementation
- [test-spec.md](phase5-security/test-spec.md) - Security tests

**⚠️ Dependencies**: Requires Phases 1-4 complete

---

### ✅ Phase 6: Testing & UX (4-6 hours)

**What**: Comprehensive testing, error handling, UX polish

**Location**: `auth/phase6-testing/`

**Key Steps**:
1. Write unit tests for auth functions
2. Write integration tests for API
3. Write E2E tests for OAuth flows
4. Add error handling to all flows
5. Add loading states
6. Test cross-browser
7. Test mobile
8. Accessibility audit

**Verification**:
```bash
# All tests passing
npm test

# E2E tests passing
npx playwright test

# Security scan clean
npm audit

# Performance good
npm run lighthouse
```

**Documentation**:
- [README](phase6-testing/README.md) - Overview
- [test-plan.md](phase6-testing/test-plan.md) - Comprehensive test plan
- [test-spec.md](phase6-testing/test-spec.md) - Test checklist

**⚠️ Dependencies**: Requires Phases 1-5 complete

---

## Project Timeline

### Week 1: Backend Setup
- **Day 1-2**: Phase 1 (Backend config, OAuth setup)
- **Day 3**: Phase 2 (Database migration)
- **Day 4-5**: Phase 3 start (Login UI)

### Week 2: Frontend & Integration
- **Day 1-2**: Phase 3 complete (Auth components)
- **Day 3-4**: Phase 4 (API integration)
- **Day 5**: Phase 5 (Security hardening)

### Week 3: Testing & Launch
- **Day 1-3**: Phase 6 (Testing, UX polish)
- **Day 4**: Production deployment prep
- **Day 5**: Launch

---

## Troubleshooting

### Common Issues

**"Cannot find module 'better-auth'"**
- Solution: Run `npm install better-auth` in backend

**"Database connection failed"**
- Solution: Check `.env` database credentials
- Verify database is running: `pg_isready`

**"Invalid redirect URI" OAuth error**
- Solution: Check exact match in OAuth provider config
- No trailing slashes
- http vs https must match

**"CORS error on auth requests"**
- Solution: Add frontend URL to `trustedOrigins`

**Session not persisting**
- Solution: Ensure `credentials: 'include'` in fetch
- Check cookies enabled in browser

**Auth routes return 404**
- Solution: Verify auth handler mounted at `/api/auth/*`
- Check server logs for errors

---

## Production Checklist

Before deploying to production:

### Environment
- [ ] `.env` configured with production values
- [ ] Secrets rotated (not using dev secrets)
- [ ] Database backups configured
- [ ] HTTPS certificate valid

### OAuth Providers
- [ ] Production redirect URIs added to Google
- [ ] Production redirect URIs added to GitHub
- [ ] Callback URLs use https://

### Backend
- [ ] `NODE_ENV=production`
- [ ] Database migrations run
- [ ] Security headers enabled
- [ ] HTTPS redirect enabled
- [ ] Rate limiting configured
- [ ] Error logging configured

### Frontend
- [ ] Config points to production backend
- [ ] Source maps disabled
- [ ] Console logs removed
- [ ] Analytics configured

### Testing
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Load testing complete
- [ ] Cross-browser tested
- [ ] Mobile tested

### Monitoring
- [ ] Error tracking (Sentry, etc.)
- [ ] Analytics (Google Analytics, etc.)
- [ ] Uptime monitoring
- [ ] Log aggregation

---

## Support & Resources

### Documentation
- [Better Auth Docs](https://www.better-auth.com/)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [OAuth 2.0 Spec](https://oauth.net/2/)

### OAuth Provider Docs
- [Google OAuth Setup](https://www.better-auth.com/docs/authentication/google)
- [GitHub OAuth Setup](https://www.better-auth.com/docs/authentication/github)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Checklist](https://websecurity.guide/)

---

## Getting Help

If you encounter issues:

1. **Check phase-specific test-spec.md** for common issues
2. **Search Better Auth GitHub issues**
3. **Review this implementation guide**
4. **Check OAuth provider documentation**
5. **Review server logs** for detailed errors

---

## Success Metrics

After implementation, you should have:

✅ **Functional Authentication**
- Users can log in with Google
- Users can log in with GitHub
- Sessions persist across refreshes
- Logout works correctly

✅ **Secure Implementation**
- Sessions in httpOnly cookies
- CSRF protection active
- Rate limiting configured
- HTTPS enforced in production

✅ **User Features**
- Uploads associated with users
- User can view their artworks
- User profile displays correctly
- Session management works

✅ **Quality**
- All tests passing
- Cross-browser compatible
- Mobile responsive
- Accessible
- Performant

---

## Next Steps

After completing all phases:

1. **Deploy to production** following production checklist
2. **Monitor** for errors and issues
3. **Iterate** based on user feedback
4. **Add features** like:
   - Email notifications
   - User settings page
   - Multiple OAuth providers
   - Two-factor authentication
   - API keys for developers

---

## Conclusion

This implementation provides enterprise-grade authentication for Artorizer using industry-standard OAuth 2.0 with Better Auth. The system is:

- 🔒 **Secure** - httpOnly cookies, CSRF protection, rate limiting
- 🚀 **Performant** - Optimized queries, efficient session management
- ♿ **Accessible** - WCAG compliant, keyboard navigable
- 🧪 **Tested** - Comprehensive test coverage
- 📚 **Documented** - Complete documentation for maintainability

Follow the phases in order, use the provided documentation, and you'll have authentication running smoothly in 20-29 hours of development time.

**Good luck!** 🎨
