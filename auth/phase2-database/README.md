# Phase 2: Database Schema & Migration

## Overview

This phase focuses on creating the database schema for authentication, running Better Auth migrations, and linking user accounts to existing Artorizer artwork data.

## Duration

**Estimated Time**: 1-2 hours

## Prerequisites

- [x] Phase 1 completed successfully
- [x] Better Auth installed and configured
- [x] Database running (PostgreSQL or MySQL)
- [x] Database credentials configured in `.env`

## Goals

By the end of this phase, you will have:

1. ✅ Better Auth database tables created (`user`, `session`, `account`, `verification`)
2. ✅ Migration scripts run successfully
3. ✅ Existing artwork tables updated with `user_id` foreign key
4. ✅ Database indexes created for performance
5. ✅ Sample data inserted for testing (optional)

## Database Schema Overview

Better Auth automatically creates these tables:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    user     │         │   account   │         │   session   │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │◄───────┤ userId (FK) │         │ id (PK)     │
│ email       │         │ provider    │         │ userId (FK) │
│ name        │         │ providerId  │         │ expiresAt   │
│ image       │         │ accessToken │         │ token       │
│ emailVerif..│         │ refreshTok..│         │ ipAddress   │
│ createdAt   │         │ createdAt   │         │ userAgent   │
│ updatedAt   │         └─────────────┘         │ createdAt   │
└─────────────┘                                 │ updatedAt   │
       │                                        └─────────────┘
       │
       │         ┌─────────────────┐
       │         │ verification    │
       └────────►├─────────────────┤
                 │ id (PK)         │
                 │ identifier      │
                 │ value           │
                 │ expiresAt       │
                 │ createdAt       │
                 └─────────────────┘
```

## Artorizer Schema Updates

Existing tables will be updated to link with users:

```
┌─────────────┐
│    user     │
├─────────────┤
│ id (PK)     │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│  artwork_jobs   │  (Your existing table)
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │  ← NEW COLUMN
│ job_id          │
│ original_url    │
│ protected_url   │
│ status          │
│ created_at      │
└─────────────────┘
```

## Detailed Steps

### Step 1: Run Better Auth Migration

Better Auth provides automatic migration tools.

**Command**:
```bash
npx better-auth migrate
```

**What This Does**:
- Creates `user` table
- Creates `account` table (links users to OAuth providers)
- Creates `session` table (manages active sessions)
- Creates `verification` table (email verification tokens)
- Creates indexes for performance

**Expected Output**:
```
✅ Migrating Better Auth database...
✅ Created table: user
✅ Created table: account
✅ Created table: session
✅ Created table: verification
✅ Created indexes
✅ Migration completed successfully
```

### Step 2: Update Artorizer Tables

Add `user_id` column to link artworks with users.

**See**: `schema.md` for full table definitions
**See**: `implementation-spec.md` for migration scripts

**Tables to Update**:
- `artwork_jobs` (or equivalent) - Add `user_id` foreign key
- `upload_history` (if exists) - Add `user_id` foreign key
- Any other user-specific data

### Step 3: Create Indexes

Add database indexes for query performance.

**Indexes to Create**:
- `user.email` - Fast user lookup by email
- `account.provider_userId` - Fast OAuth account lookup
- `session.token` - Fast session validation
- `artwork_jobs.user_id` - Fast artwork queries by user

### Step 4: Add Constraints

Add foreign key constraints for data integrity.

**Constraints**:
- `artwork_jobs.user_id` → `user.id` (CASCADE on delete)
- `account.userId` → `user.id` (CASCADE on delete)
- `session.userId` → `user.id` (CASCADE on delete)

## Files to Create

### Migration Scripts

```
router-backend/
├── migrations/
│   ├── 001_better_auth.sql         # Better Auth tables (auto-generated)
│   ├── 002_artorizer_user_link.sql # Link artworks to users
│   └── 003_indexes.sql             # Performance indexes
└── scripts/
    └── run-migrations.js           # Migration runner script
```

## Testing This Phase

**Verification Queries**:

1. **Check Tables Exist**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user', 'account', 'session', 'verification');
```

2. **Check User Table Structure**:
```sql
DESCRIBE user;  -- MySQL
\d user         -- PostgreSQL
```

3. **Check Foreign Keys**:
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

See `test-spec.md` for comprehensive database tests.

## Success Criteria

- [ ] Better Auth tables created (`user`, `account`, `session`, `verification`)
- [ ] All tables have correct columns and types
- [ ] `artwork_jobs` table has `user_id` column
- [ ] Foreign key constraints created
- [ ] Indexes created for performance
- [ ] Migration scripts run without errors
- [ ] Database passes all verification queries
- [ ] Can insert test user record
- [ ] Can link test artwork to user

## Common Issues

### Issue: Migration fails with "relation already exists"
**Solution**: Tables may already exist. Drop them or use `IF NOT EXISTS`

### Issue: "permission denied for schema"
**Solution**: Ensure database user has CREATE TABLE permissions

### Issue: "syntax error at or near"
**Solution**: Check SQL syntax for your database type (PostgreSQL vs MySQL)

### Issue: Foreign key constraint fails
**Solution**: Ensure referenced table (`user`) exists before creating constraint

## Rollback Plan

If migration fails, rollback with:

```sql
-- PostgreSQL
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS user CASCADE;

-- Remove added column
ALTER TABLE artwork_jobs DROP COLUMN IF EXISTS user_id;
```

## Next Phase

After completing this phase, proceed to **Phase 3: Authentication UI Components** to build the login interface.

## Documentation Files

- `schema.md` - Complete database schema definitions
- `implementation-spec.md` - Migration scripts and SQL
- `test-spec.md` - Database validation tests
