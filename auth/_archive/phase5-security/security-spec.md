# Phase 5: Security Specification

## Security Checklist

### Authentication Security

- [ ] **Passwords NOT stored** - OAuth only, no password storage
- [ ] **Secure session tokens** - httpOnly cookies, not localStorage
- [ ] **HTTPS in production** - All auth requests over HTTPS
- [ ] **Secure cookie flags** - Secure, HttpOnly, SameSite=Lax
- [ ] **Session expiration** - Sessions expire after 7 days
- [ ] **Session refresh** - Auto-refresh before expiry

### CSRF Protection

- [ ] **CSRF tokens** - Better Auth includes automatically
- [ ] **Double-submit cookies** - Validated on state changes
- [ ] **Origin validation** - trustedOrigins configured
- [ ] **Referer checking** - Better Auth validates referer

### XSS Protection

- [ ] **No inline scripts** - All scripts external
- [ ] **Content Security Policy** - CSP headers configured
- [ ] **httpOnly cookies** - Tokens not accessible to JS
- [ ] **Sanitized output** - User input escaped in HTML

### Rate Limiting

- [ ] **Auth endpoints** - 100 req/min per IP
- [ ] **Upload endpoints** - Rate limit configured
- [ ] **Failed logins** - Tracked and limited

### OAuth Security

- [ ] **State parameter** - CSRF protection for OAuth
- [ ] **Nonce validation** - Replay attack prevention
- [ ] **Redirect URI validation** - Exact match required
- [ ] **Token encryption** - Access/refresh tokens encrypted

### Database Security

- [ ] **Parameterized queries** - No SQL injection
- [ ] **Password hashing** - N/A (OAuth only)
- [ ] **Connection encryption** - SSL/TLS for database
- [ ] **Principle of least privilege** - DB user has minimal permissions

### Network Security

- [ ] **HTTPS only** - Redirect HTTP to HTTPS in production
- [ ] **HSTS headers** - Strict-Transport-Security enabled
- [ ] **Secure headers** - X-Frame-Options, X-Content-Type-Options
- [ ] **CORS configuration** - trustedOrigins whitelisted

---

## Common Vulnerabilities

### 1. XSS (Cross-Site Scripting)

**Risk**: Attacker injects malicious JavaScript

**Mitigation**:
- httpOnly cookies (tokens not accessible)
- Content Security Policy headers
- Escape user input in HTML
- No `eval()` or `innerHTML` with user data

### 2. CSRF (Cross-Site Request Forgery)

**Risk**: Attacker tricks user into unwanted action

**Mitigation**:
- CSRF tokens (Better Auth automatic)
- SameSite cookie attribute
- Origin/Referer validation

### 3. Session Hijacking

**Risk**: Attacker steals session token

**Mitigation**:
- httpOnly cookies (not accessible to JS)
- Secure flag (HTTPS only)
- IP/User-Agent binding
- Session expiration

### 4. OAuth Redirect Attacks

**Risk**: Attacker redirects OAuth callback to malicious site

**Mitigation**:
- Exact redirect URI matching
- State parameter validation
- Whitelist allowed origins

### 5. SQL Injection

**Risk**: Attacker injects SQL into queries

**Mitigation**:
- Parameterized queries (Better Auth uses)
- ORM/query builder
- Input validation

---

## Security Headers

### Content Security Policy

```javascript
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' https://esm.sh https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://router.artorizer.com"
  );
  next();
});
```

### Other Security Headers

```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // HTTPS only (production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security",
      "max-age=31536000; includeSubDomains");
  }

  next();
});
```

---

## Secrets Management

### Environment Variables

✅ **DO**:
- Store in `.env` file (gitignored)
- Use strong, random secrets
- Rotate secrets periodically
- Different secrets for dev/prod

❌ **DON'T**:
- Commit to git
- Hardcode in source
- Use default/example values
- Share across environments

### Secret Generation

```bash
# Generate strong secret
openssl rand -base64 32

# Generate UUID
uuidgen
```

---

## Incident Response

### If Session Token Leaked

1. Revoke all sessions:
   ```sql
   DELETE FROM session WHERE userId = '<user-id>';
   ```

2. Force re-login

3. Rotate BETTER_AUTH_SECRET

4. Investigate how leaked

### If OAuth Credentials Leaked

1. Immediately revoke in OAuth provider console
2. Generate new credentials
3. Update environment variables
4. Restart backend
5. Audit access logs

---

## Compliance

### GDPR

- [ ] **Right to access** - User can download their data
- [ ] **Right to deletion** - User can delete account
- [ ] **Data minimization** - Only collect necessary data
- [ ] **Consent** - Terms of Service acceptance

### Data Retention

- **User data**: Keep until account deletion
- **Sessions**: Auto-delete on expiry
- **Logs**: Retain 90 days, then delete

---

## Security Testing

### Manual Tests

1. **Test httpOnly cookie**:
   ```javascript
   document.cookie  // Should NOT see session token
   ```

2. **Test HTTPS redirect** (production):
   ```bash
   curl -I http://router.artorizer.com
   # Should redirect to https://
   ```

3. **Test rate limiting**:
   ```bash
   for i in {1..200}; do
     curl http://localhost:7000/api/auth/session
   done
   # Should get 429 after 100 requests
   ```

### Automated Tests

Use tools like:
- **OWASP ZAP** - Security scanner
- **Burp Suite** - Penetration testing
- **npm audit** - Dependency vulnerabilities

---

## Success Criteria

All security checklist items ✅
No high/critical vulnerabilities found
All security tests passing
