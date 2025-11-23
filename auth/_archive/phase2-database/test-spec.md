# Phase 2: Test Specification

## Database Verification Tests

### Test 1: Better Auth Tables Exist
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user', 'account', 'session', 'verification');
```
**Expected**: `table_count = 4`

---

### Test 2: User Table Structure
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user'
ORDER BY ordinal_position;
```
**Expected Columns**:
- id (uuid, NO)
- email (varchar, NO)
- emailVerified (boolean, YES)
- name (varchar, YES)
- image (text, YES)
- createdAt (timestamp, YES)
- updatedAt (timestamp, YES)

---

### Test 3: Artwork Jobs Has user_id
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'artwork_jobs'
AND column_name = 'user_id';
```
**Expected**: 1 row with `data_type = uuid, is_nullable = YES`

---

### Test 4: Foreign Key Exists
```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'artwork_jobs'
AND constraint_type = 'FOREIGN KEY'
AND constraint_name = 'fk_artwork_user';
```
**Expected**: 1 row

---

### Test 5: Indexes Created
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'artwork_jobs'
AND indexname IN (
  'idx_artwork_user',
  'idx_artwork_user_status',
  'idx_artwork_created',
  'idx_artwork_user_created'
);
```
**Expected**: 4 rows

---

### Test 6: Insert Test User
```sql
INSERT INTO "user" (email, name)
VALUES ('test@example.com', 'Test User')
RETURNING id, email, name;
```
**Expected**: Success, returns new user

---

### Test 7: Link Artwork to User
```sql
-- Assumes test user and artwork exist
UPDATE "artwork_jobs"
SET user_id = (SELECT id FROM "user" WHERE email = 'test@example.com' LIMIT 1)
WHERE job_id = 'some_test_job';
```
**Expected**: Success

---

### Test 8: Query User's Artworks
```sql
SELECT u.email, COUNT(a.id) as artwork_count
FROM "user" u
LEFT JOIN "artwork_jobs" a ON u.id = a.user_id
WHERE u.email = 'test@example.com'
GROUP BY u.id, u.email;
```
**Expected**: Returns count > 0 if artwork linked

---

## Success Criteria

All 8 tests must pass.
