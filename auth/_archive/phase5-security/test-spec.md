# Phase 5: Test Specification

## Security Tests

### Test 1: httpOnly Cookie
```javascript
// In browser console after login
console.log(document.cookie);
```
**Expected**: Should NOT see `better-auth.session_token`

---

### Test 2: HTTPS Redirect (Production)
```bash
curl -I http://router.artorizer.com/api/auth/session
```
**Expected**: `301` redirect to `https://`

---

### Test 3: Security Headers
```bash
curl -I https://router.artorizer.com/
```
**Expected Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: ...`
- `Strict-Transport-Security: ...` (production)

---

### Test 4: CSRF Protection
```bash
# Try request without CSRF token
curl -X POST https://router.artorizer.com/api/upload \
  -H "Cookie: better-auth.session_token=..." \
  -F "file=@test.jpg"
```
**Expected**: Better Auth validates automatically

---

### Test 5: Rate Limiting
```bash
# Send 200 requests rapidly
for i in {1..200}; do
  curl https://router.artorizer.com/api/auth/session
done
```
**Expected**: `429 Too Many Requests` after limit exceeded

---

### Test 6: Session Persistence
1. Log in
2. Close browser
3. Reopen browser
4. Navigate to dashboard

**Expected**: Still logged in (session cookie persists)

---

### Test 7: Session Expiration
1. Log in
2. Wait 7+ days (or manually expire session in DB)
3. Refresh page

**Expected**: Redirected to login (session expired)

---

### Test 8: Logout Clears Session
1. Log in
2. Click logout
3. Try to access dashboard

**Expected**: Redirected to login, cannot access without re-login

---

## Success Criteria

All 8 tests passing.
