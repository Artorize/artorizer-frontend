# Artorize Dashboard Configuration Guide

This guide explains how to configure the Artorize Dashboard for your deployment environment.

## Table of Contents

1. [Configuration File](#configuration-file)
2. [Configuration Options](#configuration-options)
3. [Deployment Scenarios](#deployment-scenarios)
4. [Runtime Configuration](#runtime-configuration)
5. [Security Considerations](#security-considerations)

---

## Configuration File

The dashboard configuration is stored in `dashboard/config.js`. This file contains all settings for connecting to your Router API and CDN.

**Default location:**
```
artorizer-frontend/
└── dashboard/
    └── config.js
```

---

## Configuration Options

### Core Settings

#### ROUTER_URL

**Description**: Base URL of your Artorizer Router API (no trailing slash)

**Default**: `'http://localhost:7000'`

**Examples**:
```javascript
// Local development
ROUTER_URL: 'http://localhost:7000'

// Production
ROUTER_URL: 'https://api.artorize.com'

// Staging
ROUTER_URL: 'https://staging-api.artorize.com'
```

**Important**: Must match the Router service URL configured in your backend deployment.

---

#### CDN_URL

**Description**: Base URL of your CDN for protected images and SAC masks (no trailing slash)

**Default**: `'http://localhost:3000'`

**Examples**:
```javascript
// Local development
CDN_URL: 'http://localhost:3000'

// Production CDN
CDN_URL: 'https://cdn.artorize.com'

// CloudFront
CDN_URL: 'https://d1a2b3c4d5e6f7.cloudfront.net'

// Custom domain
CDN_URL: 'https://images.yourdomain.com'
```

**Important**: The CDN should serve files at URLs like:
- Protected image: `{CDN_URL}/i/{artwork_id}.jpg`
- SAC mask: `{CDN_URL}/i/{artwork_id}.sac`

---

#### AUTH_TOKEN

**Description**: Optional authentication token for Router API requests

**Default**: `null` (no authentication)

**Example**:
```javascript
// With authentication
AUTH_TOKEN: 'your-secret-api-token-here'
```

**Usage**: If your Router requires an API key or bearer token, set it here. The token will be sent as:
```
Authorization: Bearer {AUTH_TOKEN}
```

---

### Polling Configuration

Controls job status polling behavior.

```javascript
POLLING: {
  // Initial delay before first status check (ms)
  INITIAL_DELAY: 2000,

  // Polling interval (ms)
  INTERVAL: 3000,

  // Maximum polling attempts before timeout
  MAX_ATTEMPTS: 100,

  // Exponential backoff multiplier
  BACKOFF_MULTIPLIER: 1.2
}
```

**Recommendations**:
- **Fast jobs** (< 1 minute): Lower `INITIAL_DELAY` to 1000ms, `INTERVAL` to 2000ms
- **Slow jobs** (> 5 minutes): Increase `MAX_ATTEMPTS` to 200+, use higher backoff
- **Production**: Keep defaults for balanced performance

---

### Default Protection Options

Default values for protection layer checkboxes.

```javascript
DEFAULTS: {
  include_hash_analysis: true,
  include_protection: true,
  enable_fawkes: true,
  enable_photoguard: true,
  enable_mist: true,
  enable_nightshade: true,
  enable_c2pa_manifest: true,
  watermark_strategy: 'invisible-watermark'
}
```

**Customization**: Adjust these to match your organization's default protection policy.

---

### Upload Constraints

File upload limits.

```javascript
UPLOAD: {
  // Maximum file size in bytes (256MB default)
  MAX_FILE_SIZE: 268435456,

  // Accepted MIME types
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
}
```

**Important**: `MAX_FILE_SIZE` should match or be lower than your Router's `MAX_FILE_SIZE` setting.

---

## Deployment Scenarios

### Scenario 1: Local Development

**Setup**:
```javascript
const ArtorizeConfig = {
  ROUTER_URL: 'http://localhost:7000',
  CDN_URL: 'http://localhost:3000',
  AUTH_TOKEN: null
};
```

**Services**:
- Router running on `localhost:7000`
- CDN (or local file server) on `localhost:3000`
- Frontend served on `localhost:8080` (http-server)

**Testing**:
```bash
# Terminal 1: Start Router
cd artorizer-router
npm start

# Terminal 2: Start CDN (or mock file server)
cd artorizer-cdn
npm start

# Terminal 3: Start Frontend
cd artorizer-frontend
npm start
```

---

### Scenario 2: Production Deployment

**Setup**:
```javascript
const ArtorizeConfig = {
  ROUTER_URL: 'https://api.artorize.com',
  CDN_URL: 'https://cdn.artorize.com',
  AUTH_TOKEN: null // Use environment-specific override
};
```

**Architecture**:
```
User Browser
    ↓
HTTPS → Frontend (artorize.com)
    ↓
HTTPS → Router API (api.artorize.com)
    ↓
Internal → Processor (Docker)
    ↓
HTTPS → Backend Storage (backend.artorize.com)
    ↓
HTTPS → CDN (cdn.artorize.com)
```

**CORS Configuration**: Ensure Router and CDN allow requests from your frontend domain:
```javascript
// Router: server/index.js
app.use(cors({
  origin: ['https://artorize.com', 'https://www.artorize.com'],
  credentials: true
}));
```

---

### Scenario 3: Multi-Environment

Use different config files for each environment.

**File structure**:
```
dashboard/
├── config.js              (default/local)
├── config.staging.js      (staging)
└── config.production.js   (production)
```

**Build script** (in `package.json`):
```json
{
  "scripts": {
    "build:staging": "cp dashboard/config.staging.js dashboard/config.js && npm run build",
    "build:production": "cp dashboard/config.production.js dashboard/config.js && npm run build"
  }
}
```

---

## Runtime Configuration

You can override configuration values at runtime without modifying `config.js`.

### Method 1: Inline Script Override

Add a script block **after** loading `config.js` in `dashboard/index.html`:

```html
<script src="config.js"></script>
<script>
  // Override for this deployment
  window.ArtorizeConfig.ROUTER_URL = 'https://api.example.com';
  window.ArtorizeConfig.CDN_URL = 'https://cdn.example.com';
  window.ArtorizeConfig.AUTH_TOKEN = 'production-token';
</script>
<script src="sacParser.js"></script>
<script src="artworkUploader.js"></script>
<script src="dashboard.js"></script>
```

**Use case**: Quick testing with different endpoints without editing config.js

---

### Method 2: Environment Variables (Build-Time)

Use a build tool to inject environment variables.

**Example with Webpack**:
```javascript
// webpack.config.js
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ROUTER_URL': JSON.stringify(process.env.ROUTER_URL),
      'process.env.CDN_URL': JSON.stringify(process.env.CDN_URL)
    })
  ]
};
```

**In config.js**:
```javascript
const ArtorizeConfig = {
  ROUTER_URL: process.env.ROUTER_URL || 'http://localhost:7000',
  CDN_URL: process.env.CDN_URL || 'http://localhost:3000'
};
```

---

### Method 3: URL Parameters (Testing Only)

For quick testing, parse URL parameters:

```html
<script>
  const params = new URLSearchParams(window.location.search);
  if (params.has('router_url')) {
    window.ArtorizeConfig.ROUTER_URL = params.get('router_url');
  }
  if (params.has('cdn_url')) {
    window.ArtorizeConfig.CDN_URL = params.get('cdn_url');
  }
</script>
```

**Usage**:
```
https://artorize.com/dashboard/?router_url=https://test-api.com&cdn_url=https://test-cdn.com
```

**Warning**: Never use for production with sensitive tokens!

---

## Security Considerations

### 1. API Token Security

**DO NOT** commit real API tokens to version control.

**Bad**:
```javascript
AUTH_TOKEN: 'sk_live_abc123def456'  // NEVER DO THIS
```

**Good**:
```javascript
AUTH_TOKEN: null  // Default in config.js
```

Use runtime override or environment variables for production tokens.

---

### 2. CORS Configuration

Ensure your Router API has proper CORS headers:

```javascript
// Router server
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://artorize.com',
      'https://www.artorize.com',
      'http://localhost:8080'  // development only
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

### 3. Content Security Policy

Add CSP headers to your frontend deployment:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.artorize.com https://cdn.artorize.com;
  img-src 'self' https://cdn.artorize.com blob: data:;
  style-src 'self' 'unsafe-inline';
">
```

---

### 4. HTTPS in Production

**Always** use HTTPS for production deployments:

```javascript
// Production config
ROUTER_URL: 'https://api.artorize.com',  // ✓
CDN_URL: 'https://cdn.artorize.com',     // ✓

// Never in production
ROUTER_URL: 'http://api.artorize.com',   // ✗ INSECURE
```

---

## Troubleshooting

### Issue: "Failed to fetch" errors

**Cause**: CORS misconfiguration or wrong URL

**Solution**:
1. Check browser console for exact error
2. Verify `ROUTER_URL` is correct
3. Check Router CORS settings
4. Test with `curl`:
   ```bash
   curl -H "Origin: https://artorize.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS https://api.artorize.com/protect
   ```

---

### Issue: "Job polling timeout"

**Cause**: `MAX_ATTEMPTS` too low for slow jobs

**Solution**: Increase polling attempts:
```javascript
POLLING: {
  MAX_ATTEMPTS: 200  // increased from 100
}
```

---

### Issue: "File size exceeds maximum"

**Cause**: Mismatch between frontend and Router limits

**Solution**: Ensure values match:
```javascript
// Frontend config.js
UPLOAD: {
  MAX_FILE_SIZE: 268435456  // 256MB
}

// Router .env
MAX_FILE_SIZE=268435456
```

---

## Quick Reference

| Setting | Local Dev | Production |
|---------|-----------|------------|
| `ROUTER_URL` | `http://localhost:7000` | `https://api.artorize.com` |
| `CDN_URL` | `http://localhost:3000` | `https://cdn.artorize.com` |
| `AUTH_TOKEN` | `null` | Environment variable |
| `MAX_FILE_SIZE` | `268435456` (256MB) | Match Router config |

---

## Related Documentation

- **[DASHBOARD_USAGE.md](./DASHBOARD_USAGE.md)** - User guide for the dashboard
- **[ROUTER-API.md](./ROUTER-API.md)** - Router API reference
- **[sac_v_1_cdn_mask_transfer_protocol.md](./sac_v_1_cdn_mask_transfer_protocol.md)** - SAC protocol spec

---

## Support

For configuration issues:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test Router API with `curl` or Postman
4. Review Router logs for backend errors

---

**Last Updated**: 2025-11-09
