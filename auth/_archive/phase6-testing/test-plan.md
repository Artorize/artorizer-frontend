# Phase 6: Comprehensive Test Plan

## Test Matrix

| Test ID | Category | Test Case | Priority | Status |
|---------|----------|-----------|----------|--------|
| E2E-1 | OAuth | Google login flow | High | |
| E2E-2 | OAuth | GitHub login flow | High | |
| E2E-3 | Session | Session persistence | High | |
| E2E-4 | Session | Logout flow | High | |
| E2E-5 | Upload | Upload with auth | High | |
| E2E-6 | Upload | Upload without auth | High | |
| INT-1 | API | Protected endpoint | High | |
| INT-2 | API | Unauthorized access | High | |
| INT-3 | Database | User creation | Medium | |
| INT-4 | Database | Artwork association | Medium | |
| UNIT-1 | Auth | signInWithGoogle() | Medium | |
| UNIT-2 | Auth | signOut() | Medium | |
| UNIT-3 | Auth | getSession() | Medium | |
| UNIT-4 | Guard | requireAuth() | Medium | |
| SEC-1 | Security | httpOnly cookies | High | |
| SEC-2 | Security | CSRF protection | High | |
| SEC-3 | Security | Rate limiting | Medium | |
| SEC-4 | Security | HTTPS enforcement | High | |
| UX-1 | UI | Loading states | Low | |
| UX-2 | UI | Error messages | Medium | |
| UX-3 | UI | Mobile responsive | Medium | |
| UX-4 | UI | Accessibility | Medium | |

---

## E2E Test Scenarios

### Scenario 1: New User Registration

1. Navigate to `/login.html`
2. Click "Continue with Google"
3. Complete OAuth (new user)
4. Verify redirect to dashboard
5. Verify user profile displays
6. Verify welcome message shown
7. Upload first artwork
8. Verify artwork appears in gallery

**Expected**: Complete flow successful

---

### Scenario 2: Returning User Login

1. Navigate to `/login.html` (logged out)
2. Click "Continue with GitHub"
3. Complete OAuth (existing user)
4. Verify redirect to dashboard
5. Verify user profile displays
6. Verify previous artworks shown

**Expected**: Previous data intact

---

### Scenario 3: Session Persistence

1. Log in
2. Navigate through app
3. Refresh page
4. Close and reopen browser
5. Navigate to dashboard

**Expected**: Still logged in throughout

---

### Scenario 4: Protected Routes

1. Log out
2. Try to access `/dashboard/dashboard-v2.html` directly
3. Verify redirect to login
4. Log in
5. Verify redirect back to dashboard

**Expected**: Cannot access without auth

---

### Scenario 5: Upload Flow

1. Log in
2. Navigate to upload
3. Select file
4. Configure options
5. Upload
6. Wait for processing
7. Verify artwork appears in gallery
8. Verify artwork linked to user

**Expected**: Complete upload successful

---

## Error Scenarios

### Error 1: OAuth Denied

1. Click "Continue with Google"
2. Deny permission on Google page
3. Observe behavior

**Expected**: User-friendly error, can retry

---

### Error 2: Network Failure

1. Disconnect network
2. Try to log in
3. Observe error

**Expected**: "Network error" message, retry option

---

### Error 3: Session Expired

1. Manually expire session in database
2. Try to upload
3. Observe behavior

**Expected**: Redirect to login

---

### Error 4: Upload Without Auth

1. Log out
2. Try to upload (if UI allows)
3. Observe behavior

**Expected**: Redirect to login or error message

---

## Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

For each browser, test:
- Login flow
- Session persistence
- Upload
- Logout

---

## Performance Testing

### Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Login page load | < 1s | |
| OAuth redirect | < 2s | |
| Session check | < 100ms | |
| Dashboard load | < 2s | |
| Upload start | < 500ms | |

### Tools
- Lighthouse (performance score > 90)
- Chrome DevTools (Network, Performance)
- WebPageTest

---

## Accessibility Testing

### Checklist

- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader support (NVDA/JAWS)
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels on buttons
- [ ] Color contrast (WCAG AA)
- [ ] Form labels associated

### Tools
- axe DevTools
- Lighthouse accessibility audit
- Manual screen reader testing

---

## Security Testing

### Automated Scans

- [ ] **OWASP ZAP** - Vulnerability scan
- [ ] **npm audit** - Dependency check
- [ ] **Snyk** - Security analysis

### Manual Tests

- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF bypass attempts
- [ ] Session hijacking attempts
- [ ] Brute force login (rate limit)

---

## Load Testing

### Test Upload Endpoint

```bash
# Use Apache Bench
ab -n 1000 -c 10 -H "Cookie: better-auth.session_token=..." \
  https://router.artorizer.com/api/artworks/me
```

**Expected**: Handle 10 concurrent users

---

## Regression Testing

After each phase, re-run:
- All E2E tests
- Critical integration tests
- Security tests

Ensure new features don't break existing functionality.

---

## Test Automation

### Setup

```bash
npm install --save-dev playwright @playwright/test
```

### Example E2E Test

```javascript
import { test, expect } from '@playwright/test';

test('Google OAuth login flow', async ({ page }) => {
  await page.goto('/login.html');

  // Click Google button
  await page.click('#google-login');

  // Wait for OAuth redirect
  await page.waitForURL(/accounts\.google\.com/);

  // Complete OAuth (use test account)
  await page.fill('[type="email"]', 'test@example.com');
  await page.click('#next');
  // ... fill password, submit

  // Should redirect to dashboard
  await page.waitForURL('/dashboard/dashboard-v2.html');

  // Verify user profile visible
  const profile = page.locator('.user-profile');
  await expect(profile).toBeVisible();

  // Verify email displayed
  await expect(profile).toContainText('test@example.com');
});
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Auth Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npx playwright test
```

---

## Success Criteria

- [ ] All E2E tests passing
- [ ] All integration tests passing
- [ ] All unit tests passing
- [ ] Security scan clean
- [ ] Performance metrics met
- [ ] Cross-browser compatible
- [ ] Accessibility compliant
- [ ] No regressions
