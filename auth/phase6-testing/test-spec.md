# Phase 6: Test Specification

See `test-plan.md` for comprehensive test matrix and scenarios.

## Quick Test Checklist

### Critical Tests (Must Pass)

- [ ] **E2E-1**: Google OAuth login works end-to-end
- [ ] **E2E-2**: GitHub OAuth login works end-to-end
- [ ] **E2E-3**: Session persists after page refresh
- [ ] **E2E-4**: Logout clears session correctly
- [ ] **E2E-5**: Authenticated users can upload
- [ ] **E2E-6**: Unauthenticated users redirected to login
- [ ] **INT-1**: Protected endpoints require auth
- [ ] **INT-2**: Unauthorized requests return 401
- [ ] **SEC-1**: Session tokens in httpOnly cookies
- [ ] **SEC-2**: HTTPS enforced in production

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Performance

- [ ] Login page < 1s load time
- [ ] Session check < 100ms
- [ ] Dashboard < 2s load time

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] WCAG AA color contrast

---

## Test Execution

### Run All Tests

```bash
# Unit + Integration
npm test

# E2E
npx playwright test

# Security scan
npm audit
npx snyk test

# Performance
npm run lighthouse
```

---

## Success Criteria

✅ All critical tests passing
✅ Cross-browser compatible
✅ Performance targets met
✅ Accessibility compliant
✅ Security scan clean
