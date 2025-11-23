# Authentication Tests

This directory contains comprehensive test suites for the Artorizer authentication system.

## Directory Structure

```
tests/
├── README.md                          # This file
├── unit/                              # Unit tests for individual modules
│   ├── authClient.test.js            # Auth client wrapper tests
│   ├── authManager.test.js           # Auth manager tests
│   ├── authGuard.test.js             # Route protection tests
│   └── sessionManager.test.js        # Session management tests
├── integration/                       # Integration tests
│   ├── oauth-flow.test.js            # OAuth login flow tests
│   ├── session-persistence.test.js   # Session handling tests
│   ├── protected-routes.test.js      # Route protection integration
│   └── api-integration.test.js       # API endpoint integration
├── e2e/                              # End-to-end tests
│   ├── google-oauth.spec.js          # Google OAuth E2E
│   ├── github-oauth.spec.js          # GitHub OAuth E2E
│   ├── upload-flow.spec.js           # Complete upload flow
│   └── user-journey.spec.js          # Complete user journey
├── api-contracts/                     # API contract specifications
│   ├── auth-endpoints.json           # Auth endpoint contracts
│   ├── user-endpoints.json           # User endpoint contracts
│   └── artwork-endpoints.json        # Artwork endpoint contracts
└── test-data/                        # Test fixtures and mocks
    ├── mock-users.json               # Mock user data
    ├── mock-sessions.json            # Mock session data
    └── mock-responses.json           # Mock API responses
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

## Test Requirements

- Node.js 18+
- Modern browser (for E2E tests)
- Test credentials configured in `.env.test`

## Coverage Goals

- Unit tests: > 90%
- Integration tests: > 80%
- E2E tests: Critical paths covered
