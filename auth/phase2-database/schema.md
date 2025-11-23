# Database Schema Documentation

## Overview

Complete database schema for Artorizer authentication system using Better Auth.

---

## Better Auth Tables

These tables are automatically created by Better Auth migration.

### Table: `user`

Stores user account information.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `emailVerified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `name` | VARCHAR(255) | NULL | User display name |
| `image` | TEXT | NULL | User avatar URL from OAuth provider |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `createdAt` for sorting

**PostgreSQL DDL**:
```sql
CREATE TABLE "user" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  "name" VARCHAR(255),
  "image" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "user"("email");
CREATE INDEX idx_user_created ON "user"("createdAt");
```

**MySQL DDL**:
```sql
CREATE TABLE `user` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `emailVerified` BOOLEAN DEFAULT FALSE,
  `name` VARCHAR(255),
  `image` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_user_email ON `user`(`email`);
CREATE INDEX idx_user_created ON `user`(`createdAt`);
```

---

### Table: `account`

Links users to OAuth providers (Google, GitHub).

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique account identifier |
| `userId` | UUID | FOREIGN KEY → user.id, NOT NULL | User this account belongs to |
| `provider` | VARCHAR(50) | NOT NULL | OAuth provider (google, github) |
| `providerAccountId` | VARCHAR(255) | NOT NULL | User ID from OAuth provider |
| `accessToken` | TEXT | NULL | OAuth access token (encrypted) |
| `refreshToken` | TEXT | NULL | OAuth refresh token (encrypted) |
| `expiresAt` | TIMESTAMP | NULL | Token expiration time |
| `scope` | VARCHAR(255) | NULL | Granted OAuth scopes |
| `tokenType` | VARCHAR(50) | NULL | Token type (usually "Bearer") |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`provider`, `providerAccountId`)
- INDEX on `userId` for joins
- INDEX on (`provider`, `userId`) for provider lookups

**Constraints**:
- FOREIGN KEY `userId` REFERENCES `user(id)` ON DELETE CASCADE

**PostgreSQL DDL**:
```sql
CREATE TABLE "account" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP,
  "scope" VARCHAR(255),
  "tokenType" VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
  UNIQUE ("provider", "providerAccountId")
);

CREATE INDEX idx_account_userId ON "account"("userId");
CREATE INDEX idx_account_provider_userId ON "account"("provider", "userId");
```

---

### Table: `session`

Manages active user sessions.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique session identifier |
| `userId` | UUID | FOREIGN KEY → user.id, NOT NULL | User this session belongs to |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Session token (hashed) |
| `expiresAt` | TIMESTAMP | NOT NULL | Session expiration time |
| `ipAddress` | VARCHAR(45) | NULL | IP address of session |
| `userAgent` | TEXT | NULL | Browser/client user agent |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Session creation time |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last activity time |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `token`
- INDEX on `userId` for user session lookups
- INDEX on `expiresAt` for cleanup jobs

**Constraints**:
- FOREIGN KEY `userId` REFERENCES `user(id)` ON DELETE CASCADE

**PostgreSQL DDL**:
```sql
CREATE TABLE "session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "token" VARCHAR(255) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_session_token ON "session"("token");
CREATE INDEX idx_session_userId ON "session"("userId");
CREATE INDEX idx_session_expires ON "session"("expiresAt");
```

---

### Table: `verification`

Stores email verification tokens.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique verification identifier |
| `identifier` | VARCHAR(255) | NOT NULL | Email or identifier to verify |
| `value` | VARCHAR(255) | NOT NULL | Verification token |
| `expiresAt` | TIMESTAMP | NOT NULL | Token expiration time |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Token creation time |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on (`identifier`, `value`) for verification lookup
- INDEX on `expiresAt` for cleanup

**PostgreSQL DDL**:
```sql
CREATE TABLE "verification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "identifier" VARCHAR(255) NOT NULL,
  "value" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_lookup ON "verification"("identifier", "value");
CREATE INDEX idx_verification_expires ON "verification"("expiresAt");
```

---

## Artorizer Tables

### Table: `artwork_jobs` (Updated)

Existing table updated with user association.

**New Column**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | FOREIGN KEY → user.id, NULL | User who uploaded artwork |

**Full Schema** (with new column):

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique job identifier |
| `user_id` | UUID | FOREIGN KEY → user.id, NULL | **NEW**: User who uploaded |
| `job_id` | VARCHAR(255) | UNIQUE, NOT NULL | Processing job ID |
| `original_filename` | VARCHAR(255) | NOT NULL | Original file name |
| `original_url` | TEXT | NOT NULL | Original artwork URL |
| `protected_url` | TEXT | NULL | Protected artwork URL |
| `sac_mask_url` | TEXT | NULL | SAC mask URL |
| `status` | VARCHAR(50) | NOT NULL | Job status (pending/processing/completed/failed) |
| `options` | JSON/JSONB | NULL | Protection options used |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Job creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |
| `completed_at` | TIMESTAMP | NULL | Job completion time |

**Migration** (add user_id):
```sql
-- PostgreSQL
ALTER TABLE "artwork_jobs"
ADD COLUMN "user_id" UUID,
ADD CONSTRAINT fk_artwork_user
  FOREIGN KEY ("user_id")
  REFERENCES "user"("id")
  ON DELETE SET NULL;

CREATE INDEX idx_artwork_user ON "artwork_jobs"("user_id");
CREATE INDEX idx_artwork_user_status ON "artwork_jobs"("user_id", "status");
```

**Why NULL?**: Existing artworks uploaded before authentication can remain without user association.

---

## Relationships

### Entity Relationship Diagram

```
user (1) ──────── (N) account
  │                     "One user can have multiple OAuth accounts"
  │
  ├─── (N) session
  │         "One user can have multiple active sessions"
  │
  └─── (N) artwork_jobs
            "One user can upload multiple artworks"
```

### Detailed Relationships

1. **user → account** (1:N)
   - One user can link multiple OAuth providers
   - Example: User can sign in with Google OR GitHub
   - CASCADE DELETE: Deleting user removes all linked accounts

2. **user → session** (1:N)
   - One user can have multiple active sessions
   - Example: Logged in on desktop and mobile
   - CASCADE DELETE: Deleting user removes all sessions

3. **user → artwork_jobs** (1:N)
   - One user can upload multiple artworks
   - SET NULL: Deleting user keeps artworks (for data retention)
   - Alternative: CASCADE DELETE if you want to remove user data completely

---

## Sample Data

### Sample User
```sql
INSERT INTO "user" (id, email, emailVerified, name, image)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'artist@example.com',
  TRUE,
  'Jane Artist',
  'https://avatars.githubusercontent.com/u/12345'
);
```

### Sample Google Account
```sql
INSERT INTO "account" (id, userId, provider, providerAccountId)
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',  -- References user above
  'google',
  '1234567890'
);
```

### Sample Session
```sql
INSERT INTO "session" (id, userId, token, expiresAt)
VALUES (
  '770e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',  -- References user above
  'hashed_session_token_here',
  NOW() + INTERVAL '7 days'
);
```

### Sample Artwork Job
```sql
INSERT INTO "artwork_jobs" (
  id,
  user_id,
  job_id,
  original_filename,
  original_url,
  status
)
VALUES (
  '880e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',  -- References user above
  'job_abc123',
  'my_artwork.jpg',
  'https://cdn.artorizer.com/original/abc123.jpg',
  'completed'
);
```

---

## Data Types

### UUID Generation

**PostgreSQL**:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Use gen_random_uuid()
DEFAULT gen_random_uuid()
```

**MySQL**:
```sql
-- Use UUID()
DEFAULT (UUID())

-- Store as CHAR(36) for compatibility
```

### JSON Types

**PostgreSQL**: Use `JSONB` for better performance
```sql
"options" JSONB
```

**MySQL**: Use `JSON`
```sql
`options` JSON
```

---

## Indexes Strategy

### Performance Indexes

1. **User Lookups**: `email` (UNIQUE already indexed)
2. **Session Validation**: `token` (UNIQUE already indexed)
3. **User's Artworks**: `artwork_jobs.user_id`
4. **User's Sessions**: `session.userId`
5. **Provider Lookup**: `account.provider + providerAccountId`
6. **Composite**: `artwork_jobs(user_id, status)` for filtered queries

### Cleanup Indexes

1. **Expired Sessions**: `session.expiresAt`
2. **Expired Verifications**: `verification.expiresAt`

---

## Constraints Summary

All foreign key constraints use appropriate delete behavior:

| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| `account` | `userId` | `user.id` | CASCADE |
| `session` | `userId` | `user.id` | CASCADE |
| `artwork_jobs` | `user_id` | `user.id` | SET NULL |

**Rationale**:
- CASCADE for auth data (accounts, sessions) - no orphans
- SET NULL for artwork data - preserve historical data

---

## Backup Recommendations

### Critical Tables (backup frequently)
- `user` - User accounts
- `account` - OAuth links
- `artwork_jobs` - User data

### Ephemeral Tables (can be recreated)
- `session` - Active sessions (expire anyway)
- `verification` - Temporary tokens

### Backup Schedule
- Daily: `user`, `account`, `artwork_jobs`
- Weekly: Full database backup
- Before migrations: Full backup

---

## Migration Order

1. ✅ Create Better Auth tables (user, account, session, verification)
2. ✅ Create indexes on Better Auth tables
3. ✅ Add `user_id` column to `artwork_jobs`
4. ✅ Create foreign key constraint
5. ✅ Create indexes on `artwork_jobs.user_id`
6. ✅ (Optional) Migrate existing data

---

## Cleanup Jobs

Recommended automated cleanup for ephemeral data:

```sql
-- Clean expired sessions (run daily)
DELETE FROM "session"
WHERE "expiresAt" < NOW();

-- Clean expired verifications (run daily)
DELETE FROM "verification"
WHERE "expiresAt" < NOW();
```

Schedule as cron job or database task.
