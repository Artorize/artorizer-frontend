# Phase 3: Test Specification

## Manual Tests

### Test 1: Login Page Loads
**Steps**:
1. Navigate to `/login.html`
2. Observe page

**Expected**:
- ✅ Page loads without errors
- ✅ Google button visible
- ✅ GitHub button visible
- ✅ Artorizer branding present

---

### Test 2: Google OAuth Flow
**Steps**:
1. Click "Continue with Google"
2. Complete Google OAuth (use test account)
3. Observe redirect

**Expected**:
- ✅ Redirects to Google OAuth page
- ✅ After granting, redirects back to dashboard
- ✅ User profile displays in dashboard
- ✅ Session persists on page refresh

---

### Test 3: GitHub OAuth Flow
**Steps**:
1. From login page, click "Continue with GitHub"
2. Complete GitHub OAuth
3. Observe redirect

**Expected**:
- ✅ Redirects to GitHub OAuth page
- ✅ After granting, redirects back to dashboard
- ✅ User profile displays
- ✅ Session persists

---

### Test 4: Route Protection
**Steps**:
1. Clear cookies / use incognito
2. Navigate directly to `/dashboard/dashboard-v2.html`
3. Observe behavior

**Expected**:
- ✅ Redirects to `/login.html`
- ✅ After login, redirects back to dashboard

---

### Test 5: Session Persistence
**Steps**:
1. Log in successfully
2. Refresh page
3. Observe user profile

**Expected**:
- ✅ Still logged in after refresh
- ✅ User profile still displays
- ✅ No redirect to login

---

### Test 6: Logout
**Steps**:
1. While logged in, click "Sign Out"
2. Observe behavior

**Expected**:
- ✅ Redirects to `/login.html`
- ✅ Session cleared
- ✅ Cannot access dashboard without re-login

---

### Test 7: Multiple Tabs
**Steps**:
1. Log in on Tab 1
2. Open Tab 2 to dashboard
3. Observe Tab 2

**Expected**:
- ✅ Tab 2 shows user as logged in
- ✅ Logout on Tab 1 affects Tab 2 (after refresh)

---

## Browser Console Tests

### Test 8: Auth Client Available
```javascript
import { authClient } from '/src/auth/authClient.js';
console.log(authClient);
```
**Expected**: Object with `signIn`, `signOut`, `getSession` methods

---

### Test 9: Get Session
```javascript
import { AuthManager } from '/src/auth/authManager.js';
const auth = new AuthManager();
const session = await auth.getSession();
console.log(session);
```
**Expected**: User object if logged in, null otherwise

---

### Test 10: Check Auth
```javascript
import { checkAuth } from '/src/utils/authGuard.js';
const isAuth = await checkAuth();
console.log(isAuth);
```
**Expected**: `true` if logged in, `false` otherwise

---

## Automated Tests (Optional)

### E2E Test: Full OAuth Flow
```javascript
// Using Playwright or Cypress
test('Google OAuth login flow', async ({ page }) => {
  await page.goto('/login.html');
  await page.click('#google-login');

  // Wait for Google OAuth page
  await page.waitForURL(/accounts\.google\.com/);

  // Complete OAuth (test account)
  await page.fill('[type="email"]', 'test@example.com');
  await page.click('#next');

  // After OAuth, should redirect to dashboard
  await page.waitForURL('/dashboard/dashboard-v2.html');

  // Check user profile visible
  const profile = await page.locator('.user-profile');
  expect(profile).toBeVisible();
});
```

---

## Success Criteria

All manual tests (1-7) must pass.
Console tests (8-10) should work as expected.

**Total**: 10/10 tests passing
