# Phase 4: Test Specification

## API Tests

### Test 1: Upload Without Auth
```bash
curl -X POST https://router.artorizer.com/api/upload \
  -F "file=@test.jpg"
```
**Expected**: `401 Unauthorized`

### Test 2: Upload With Auth
```bash
curl -X POST https://router.artorizer.com/api/upload \
  -H "Cookie: better-auth.session_token=..." \
  -F "file=@test.jpg"
```
**Expected**: `200 OK` with job_id

### Test 3: Get User Artworks
```bash
curl https://router.artorizer.com/api/artworks/me \
  -H "Cookie: better-auth.session_token=..."
```
**Expected**: `200 OK` with artwork list

### Test 4: Cross-User Access
- User A uploads artwork
- User B tries to access User A's artwork
**Expected**: User B cannot see User A's artwork

---

## Frontend Tests

### Test 5: Upload While Logged In
1. Log in
2. Upload artwork
3. Check artwork appears in gallery

**Expected**: ✅ Upload succeeds, artwork visible

### Test 6: Upload While Logged Out
1. Log out
2. Try to upload artwork

**Expected**: ✅ Redirects to login page

### Test 7: View My Gallery
1. Log in
2. Navigate to gallery
3. Verify only user's artworks shown

**Expected**: ✅ Only user's artworks visible

---

## Success Criteria

All 7 tests passing.
