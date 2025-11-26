# Artorizer Dashboard Guide

Complete guide for configuring, understanding, and using the Artorizer Dashboard to protect your artwork from AI scraping.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Features Overview](#features-overview)
4. [Uploading Artwork](#uploading-artwork)
5. [Protection Layers](#protection-layers)
6. [Image Comparison Views](#image-comparison-views)
7. [Downloading Protected Files](#downloading-protected-files)
8. [Technical Details](#technical-details)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [Advanced Usage](#advanced-usage)
12. [FAQ](#faq)

---

## Quick Start

### Accessing the Dashboard

**Local Development**:
```bash
cd artorizer-frontend
npm start
# Opens http://localhost:8080/dashboard/
```

**Production**:
Navigate to your deployed dashboard URL (e.g., `https://artorize.com/dashboard/`)

### Dashboard Layout

The dashboard consists of four main sections:

1. **Upload Area**: Select your image file
2. **Metadata Section**: Enter artist name, creation date, description
3. **Protection Options**: Configure protection layers
4. **Results Area**: View protected artwork with mask overlay (appears after processing)

---

## Configuration

### Configuration File

The dashboard configuration is stored in `dashboard/config.js`. This file contains all settings for connecting to your Router API and CDN.

**Default location**:
```
artorizer-frontend/
└── dashboard/
    └── config.js
```

### Configuration Options

#### Core Settings

##### ROUTER_URL

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

##### CDN_URL

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

##### AUTH_TOKEN

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

#### Polling Configuration

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

#### Default Protection Options

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

#### Upload Constraints

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

### Deployment Scenarios

#### Scenario 1: Local Development

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

#### Scenario 2: Production Deployment

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
    |
HTTPS -> Frontend (artorize.com)
    |
HTTPS -> Router API (api.artorize.com)
    |
Internal -> Processor (Docker)
    |
HTTPS -> Backend Storage (backend.artorize.com)
    |
HTTPS -> CDN (cdn.artorize.com)
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

#### Scenario 3: Multi-Environment

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

### Runtime Configuration

You can override configuration values at runtime without modifying `config.js`.

#### Method 1: Inline Script Override

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
```

**Use case**: Quick testing with different endpoints without editing config.js

---

#### Method 2: Environment Variables (Build-Time)

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

#### Method 3: URL Parameters (Testing Only)

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

## Features Overview

The Artorizer Dashboard provides a comprehensive interface for protecting artwork and comparing different image variants.

### Artwork Upload & Protection

#### Uploading Artwork

1. Click the **+** button in the upload area
2. Select an image file (JPEG, PNG, WebP, or TIFF)
3. Maximum file size: **256 MB**
4. Fill in required metadata:
   - **Author Name** (required, max 120 characters)
   - **Creation Date** (optional)
   - **Description** (optional)

#### Protection Options

Configure which protection layers to apply:

- **Fawkes**: Facial protection against facial recognition
- **Photoguard**: Protection against style mimicry
- **Mist**: Adversarial noise injection
- **Nightshade**: Model poisoning protection
- **C2PA Manifest**: Cryptographic provenance tracking
- **Watermark Strategy**:
  - Invisible Watermark
  - Tree Ring

#### Submission Process

1. Click **Generate** button to submit artwork
2. Progress tracking shows:
   - Upload progress (0-100%)
   - Processing status
   - Job completion
3. Upon completion, the comparison section appears automatically

---

## Protection Layers

### Available Protection Technologies

#### 1. Fawkes
- **Purpose**: Protects against facial recognition systems
- **How it works**: Adds imperceptible perturbations to facial features
- **Best for**: Portraits and images containing people

#### 2. Photoguard
- **Purpose**: Prevents AI style mimicry
- **How it works**: Disrupts style transfer and generation models
- **Best for**: Artwork with distinctive artistic styles

#### 3. Mist
- **Purpose**: Adversarial noise protection
- **How it works**: Adds optimized noise patterns
- **Best for**: General-purpose protection

#### 4. Nightshade
- **Purpose**: Model poisoning
- **How it works**: Creates training data that degrades AI models
- **Best for**: High-value artwork requiring strong protection

#### 5. C2PA Manifest
- **Purpose**: Cryptographic provenance
- **How it works**: Embeds tamper-evident metadata
- **Best for**: Establishing authenticity and ownership

#### 6. Watermarking
- **Invisible Watermark**: Robust invisible identification
- **Tree Ring**: Advanced watermarking technique

### Toggle Protection Layers

All protection layers can be toggled on/off before submission:

1. Check/uncheck the desired protection options
2. Changes only apply to new submissions
3. Default: All protections enabled

---

### Recommended Presets

#### Preset 1: Maximum Protection
```
Enable Fawkes: checked
Enable Photoguard: checked
Enable Mist: checked
Enable Nightshade: checked
Enable C2PA Manifest: checked
Watermark: Tree Ring
```
**Use case**: High-value artwork, commercial work
**Processing time**: 3-5 minutes

---

#### Preset 2: Balanced Protection
```
Enable Fawkes: checked (if faces present)
Enable Photoguard: checked
Enable Mist: checked
Enable Nightshade: unchecked
Enable C2PA Manifest: checked
Watermark: Invisible Watermark
```
**Use case**: General artwork sharing
**Processing time**: 1-2 minutes

---

#### Preset 3: Minimal Protection
```
Enable Fawkes: unchecked
Enable Photoguard: unchecked
Enable Mist: checked
Enable Nightshade: unchecked
Enable C2PA Manifest: checked
Watermark: Invisible Watermark
```
**Use case**: Quick protection, low-stakes sharing
**Processing time**: 30-60 seconds

---

## Uploading Artwork

### Step 1: Select Image

Click the **green plus (+) button** to open the file picker.

**Supported formats**:
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- TIFF (`.tiff`)

**File size limit**: 256 MB (configurable)

**Example**: After selecting `my_artwork.jpg`, the label updates to:
```
Selected: my_artwork.jpg (4.2 MB)
```

---

### Step 2: Enter Metadata

Fill in the artwork information:

| Field | Required | Max Length | Description |
|-------|----------|------------|-------------|
| **Artist Name** | Yes | 120 chars | Your name or pseudonym |
| **Creation Date** | Optional | - | When the artwork was created |
| **Description** | Optional | 2000 chars | Artwork description, notes, inspiration |

**Example**:
```
Artist Name: Jane Doe
Creation Date: 2024-11-01
Description: A moody forest scene rendered in Blender,
             exploring themes of solitude and nature.
```

---

### Step 3: Configure Protection

Select which protection layers to apply:

| Option | Description | Use Case |
|--------|-------------|----------|
| **Enable Fawkes** | Facial feature perturbation | Portraits, character art |
| **Enable Photoguard** | Anti-mimicry protection | Style protection |
| **Enable Mist** | Adversarial noise injection | General AI poisoning |
| **Enable Nightshade** | Model-poisoning attack | Strong anti-scraping |
| **Enable C2PA Manifest** | Cryptographic provenance | Copyright tracking |

**Watermark Strategy**:

| Strategy | Description | Visibility |
|----------|-------------|------------|
| **Invisible Watermark** | Frequency-domain watermark | Invisible to eye |
| **Tree Ring** | Ring-pattern watermark | Configurable visibility |

**Default**: All enabled

---

### Step 4: Submit

Click **"Generate"** to start processing.

---

## Image Comparison Views

### Processing Stages

After clicking "Generate", you'll see:

1. **Uploading** (0-100%): File transfer to server
2. **Processing**: Router forwards to Processor
3. **Applying Protection Layers**: Each layer runs sequentially
4. **Uploading to Backend**: Storing protected images
5. **Complete**: Results displayed

**Typical timeline**:
- Small image (< 1 MB): 1-2 minutes
- Medium image (1-10 MB): 2-5 minutes
- Large image (10+ MB): 5-10 minutes

---

### View Modes

The dashboard provides four view modes accessible via toggle buttons:

#### 1. Original View
- Displays the unprotected original artwork
- Useful for reference and comparison
- Full resolution display

#### 2. Protected View
- Shows the protected artwork with all applied protections
- This is what AI scrapers would see
- Contains visual artifacts from protection layers

#### 3. Reconstructed (CDN) View
- Displays the image fetched from CDN
- Shows how legitimate viewers receive the artwork
- Demonstrates the reconstruction capability

#### 4. Compare View (Default)
- Side-by-side comparison of all three variants
- Multiple comparison modes available
- Interactive controls for detailed inspection

---

### Comparison Modes

When in **Compare View**, select from three comparison modes:

#### Side-by-Side
```
+-----------+-----------+-----------+
|Original   |Protected  |Reconstructed|
+-----------+-----------+-----------+
```
- All three images displayed simultaneously
- Equal sizing for easy comparison
- Best for overall visual comparison

#### Slider
```
+---------------------------+
|  Original  |  Protected  |
|           O              |
+---------------------------+
```
- Drag the slider to reveal Original (left) vs Protected (right)
- Precise pixel-by-pixel comparison
- Interactive white handle with circular grip
- Best for identifying subtle differences

**How to use:**
- Click and drag the white slider handle
- Move left to see more of Protected image
- Move right to see more of Original image

#### Overlay
```
+---------------------------+
|     Base Image            |
|     + Overlay (adjustable)|
+---------------------------+
```
- Stack images with adjustable opacity
- Select which image to overlay
- Opacity slider (0-100%)
- Best for transparency comparison

**Controls:**
- **Select Image**: Choose Original, Protected, or Reconstructed
- **Opacity**: Adjust visibility of overlay (0% = invisible, 100% = opaque)

---

## Downloading Protected Files

### Available Downloads

Four download buttons provide access to all image variants:

#### 1. Download Original
- **Format**: JPEG
- **Content**: Unprotected original artwork
- **Filename**: `original_{job_id}.jpg`
- **Use case**: Keeping a backup of the original

#### 2. Download Protected
- **Format**: JPEG
- **Content**: Artwork with all protections applied
- **Filename**: `protected_{job_id}.jpg`
- **Use case**: Sharing the protected version publicly

#### 3. Download Mask (.sac)
- **Format**: SAC v1.1 binary
- **Content**: Reconstruction mask data
- **Filename**: `mask_{job_id}.sac`
- **Use case**: Manual reconstruction or archival

#### 4. Download Reconstructed
- **Format**: JPEG
- **Content**: Image fetched from CDN
- **Filename**: `reconstructed_{job_id}.jpg`
- **Use case**: Verifying CDN delivery

---

### Result Display

The result section shows:

#### Protected Image with Mask Overlay

A **stacked canvas** displaying:
- **Base layer**: Protected (polluted) image
- **Overlay layer**: SAC mask visualization

**Visual effect**: A semi-transparent white overlay indicating the mask strength.

#### Mask Opacity Slider

Adjust the overlay visibility (0-100%) to inspect the mask.

**Usage**:
- **0%**: See only the protected image (what AI scrapers see)
- **50%**: Default, balanced view
- **100%**: See full mask strength

**Note**: This is for visualization only - the actual mask file is separate.

#### Job Information

```
Job ID: f2dc197c-43b9-404d-b3f3-159282802609
Status: completed
Backend Artwork ID: 60f7b3b3b3b3b3b3b3b3b3b3
Completed: 2024-11-09T12:34:56Z
```

**Use these IDs** to:
- Track the job via Router API (`GET /jobs/:id`)
- Reference the artwork in your backend database
- Construct CDN URLs for sharing

---

## Technical Details

### How the Protection Works

```
Original Image
    |
[Router] -> Validate metadata
    |
[Processor] -> Apply protection layers
    |
Protected Image = Original + Perturbations
    |
Mask = Reconstruction Information
    |
[Backend] -> Store protected image + mask
    |
[CDN] -> Serve files
```

---

### SAC Mask Protocol

The `.sac` file uses the **Simple Array Container v1** protocol:

**Structure**:
```
[24-byte header]
[Array A: int16 values]
[Array B: int16 values]
```

**Header fields**:
- Magic: "SAC1"
- Data type: int16 (1)
- Array count: 2
- Dimensions: width x height

**Reconstruction** (client-side):
```javascript
// Browser fetches both files
const protectedImage = await fetch('image.jpg');
const sacMask = await fetch('image.jpg.sac');

// Parse mask
const { arrayA, arrayB, width, height } = parseSAC(sacMask);

// Render reconstruction on canvas overlay
renderMask({ arrayA, arrayB, width, height }, canvas);
```

---

### Why This Approach?

| Aspect | Benefit |
|--------|---------|
| **Polluted image** | Poisons AI training data |
| **Separate mask** | Lightweight, cacheable |
| **Client-side reconstruction** | No server processing |
| **Binary format** | 50-70% smaller than JSON |
| **CDN-friendly** | Immutable, long cache lifetime |

---

### CDN Integration

#### How CDN Protection Works

1. **Original Upload**: Original artwork stored securely
2. **Protection Processing**: Protection layers applied
3. **CDN Storage**: Protected image + SAC mask uploaded to CDN
4. **Public Access**: Only protected image visible to scrapers
5. **Reconstruction**: Legitimate viewers fetch mask and reconstruct

#### CDN Configuration

Default URLs (configurable in `config.js`):

```javascript
ROUTER_URL: 'http://localhost:7000'  // Backend/Router API
CDN_URL: 'http://localhost:3000'     // CDN Server
```

#### CDN Endpoints

Images are served from CDN with the following URL structure:

```
Protected Image: http://localhost:3000/i/{artwork_id}.jpg
SAC Mask:        http://localhost:3000/i/{artwork_id}.sac
```

#### Reconstruction Process

The dashboard automatically:

1. Downloads protected image from Router API
2. Downloads SAC mask from Router API
3. Attempts to fetch from CDN (if backend_artwork_id available)
4. Compares CDN version with Router version
5. Displays reconstructed image in comparison view

**Note**: If CDN is not available, the Router protected image is used as fallback.

---

## Troubleshooting

### Issue: Upload fails with "File size exceeds maximum"

**Cause**: File too large

**Solution**:
1. Check file size (right-click > Properties)
2. Reduce image resolution before upload
3. Or contact admin to increase limit

**Workaround**:
```bash
# Resize with ImageMagick
convert original.jpg -resize 4096x4096\> resized.jpg
```

---

### Issue: "Processing failed: BACKEND_UPLOAD_FAILED"

**Cause**: Backend storage service down

**Solution**:
1. Wait 5 minutes and retry
2. Check backend status: `https://api.artorize.com/health`
3. Contact support if persistent

---

### Issue: "Job polling timeout"

**Cause**: Processing taking longer than expected

**Possible reasons**:
- Large image (> 20 MB)
- All protection layers enabled
- Server under load

**Solution**:
1. Check job status manually: `GET /jobs/:job_id`
2. Wait and check again in 5 minutes
3. If status is "processing", be patient
4. If status is "failed", check error message

---

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

### Issue: Protected image looks different from original

**Cause**: Protection layers intentionally modify the image

**Expected behavior**:
- **Slight color shifts**: Adversarial perturbations
- **Subtle noise**: Mist/Nightshade layers
- **Minimal quality loss**: Compression from protection process

**Not expected**:
- **Obvious artifacts**: May indicate processing error
- **Complete corruption**: Contact support

**Remember**: The point is that AI sees the protected version, humans see the original via mask reconstruction.

---

### Issue: Mask overlay not showing

**Cause**: SAC file failed to load or parse

**Debugging steps**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for 404 on `.sac` file
4. Verify mask file exists: `curl -I https://cdn.com/image.jpg.sac`

**Common fixes**:
- CORS misconfiguration on CDN
- `.sac` file not uploaded to CDN
- Wrong CDN URL in config

---

### Issue: "Job not found" error

**Cause**: Job ID doesn't exist in system

**Possible reasons**:
1. Typo in job ID
2. Job expired (older than retention period)
3. Router database cleared

**Solution**: Submit artwork again

---

## Best Practices

### 1. Organize Your Workflow

```
1. Batch collect artwork to protect
2. Fill in metadata in a spreadsheet
3. Upload and process in sequence
4. Download protected files and masks
5. Upload to your CDN
6. Update your website with new URLs
```

---

### 2. Metadata Standards

**Be consistent**:
```
Artist Name: Jane Doe (always the same)
Titles: Use descriptive, searchable names
Tags: Standardize categories (e.g., "digital-art", "portrait")
```

**Why**: Easier to search and filter in backend database

---

### 3. File Naming

**Before upload**:
```
original_artwork.jpg  -> Upload as is
```

**After protection**:
```
60f7b3b3b3b3b3b3b3b3b3b3.jpg     (protected image)
60f7b3b3b3b3b3b3b3b3b3b3.jpg.sac (mask)
```

**On your CDN**:
```
https://cdn.artorize.com/i/60f7b3b3b3b3b3b3b3b3b3b3.jpg
https://cdn.artorize.com/i/60f7b3b3b3b3b3b3b3b3b3b3.jpg.sac
```

---

### 4. Version Control

Keep a local database of your submissions:

| Original File | Job ID | Backend ID | Protected URL | Upload Date |
|---------------|--------|------------|---------------|-------------|
| `forest.jpg` | `f2dc197c...` | `60f7b3b3...` | `cdn.com/i/60f7b3b3.jpg` | 2024-11-09 |
| `portrait.png` | `a1b2c3d4...` | `789abc12...` | `cdn.com/i/789abc12.jpg` | 2024-11-09 |

**Tools**: Spreadsheet, Airtable, or custom database

---

### 5. Testing

**Before going live**:
1. Test with low-stakes artwork
2. Verify protected image displays correctly
3. Test mask overlay on your website
4. Check CDN cache headers
5. Validate C2PA manifest (if enabled)

---

## Advanced Usage

### Programmatic Upload

For bulk operations, use the Router API directly:

```bash
curl -X POST https://api.artorize.com/protect \
  -F "image=@artwork.jpg" \
  -F "artist_name=Jane Doe" \
  -F "artwork_title=Forest Scene" \
  -F "enable_mist=true" \
  -F "enable_photoguard=true"
```

See **[router-api.md](./router-api.md)** for complete API documentation.

---

### Custom Protection Scripts

Use the `ArtworkUploader` class for custom workflows:

```javascript
const uploader = new ArtworkUploader(window.ArtorizeConfig);

// Upload with custom options
const result = await uploader.submitArtwork({
  imageFile: file,
  artist_name: 'Jane Doe',
  artwork_title: 'Custom Artwork',
  protectionOptions: {
    enable_fawkes: false,
    enable_mist: true,
    watermark_strategy: 'tree-ring'
  }
});

// Poll for completion
const finalResult = await uploader.pollJobUntilComplete(result.job_id);

// Download protected variant
const blob = await uploader.downloadVariant(result.job_id, 'protected');
```

---

## FAQ

### Q: Can I protect the same artwork twice?

**A**: The system detects duplicates based on perceptual hashing. If you upload the same image, it returns the existing artwork ID.

---

### Q: How long are jobs retained?

**A**: Completed jobs are stored indefinitely in the backend. Processing jobs (Redis) are kept for 24 hours after completion.

---

### Q: Can I delete uploaded artwork?

**A**: Currently no delete function in the dashboard. Use the backend API directly or contact support.

---

### Q: What happens if I share the `.sac` file with a scraper?

**A**: The `.sac` file alone is useless without the client-side renderer. Scrapers typically don't execute JavaScript, so they won't reconstruct the original.

---

### Q: Can I use this for video?

**A**: Not yet. Currently only supports static images. Video protection is planned for v2.

---

### Q: How do I embed protected images on my website?

**A**: See **[CLIENT_INTEGRATION.md](./CLIENT_INTEGRATION.md)** for complete integration guide.

**Basic example**:
```html
<div class="image-container">
  <img id="artwork" src="https://cdn.artorize.com/i/60f7b3b3b3b3b3b3b3b3b3b3.jpg">
  <canvas id="mask"></canvas>
</div>

<script src="https://artorize.com/lib/sacParser.js"></script>
<script>
  const img = document.getElementById('artwork');
  const canvas = document.getElementById('mask');
  const sacUrl = 'https://cdn.artorize.com/i/60f7b3b3b3b3b3b3b3b3b3b3.jpg.sac';

  window.SAC.loadMaskAndRender(img, sacUrl, canvas, { opacity: 0.5 });
</script>
```

---

## Browser Compatibility

### Supported Browsers

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Required Browser Features

- `fetch()` API
- `ArrayBuffer` and `DataView`
- `Int16Array` typed arrays
- Canvas 2D rendering context
- ES6+ JavaScript support

### Known Limitations

- Internet Explorer: Not supported
- Mobile Safari: Limited file upload size
- Firefox: Occasional slider performance issues

---

## Performance Tips

### For Large Images (>10MB)

1. Use WebP format for smaller file sizes
2. Consider reducing resolution before upload
3. Enable browser hardware acceleration
4. Close other browser tabs during processing

### For Batch Processing

1. Process one image at a time
2. Wait for complete job before starting next
3. Download results before next upload
4. Clear browser cache periodically

### Optimal Settings

**Fast Processing:**
- Disable unnecessary protection layers
- Use lower resolution images
- Enable only essential protections

**Maximum Protection:**
- Enable all protection layers
- Use highest quality source images
- Consider C2PA manifest for provenance

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
ROUTER_URL: 'https://api.artorize.com',  // Correct
CDN_URL: 'https://cdn.artorize.com',     // Correct

// Never in production
ROUTER_URL: 'http://api.artorize.com',   // INSECURE
```

---

### 5. Data Privacy

- Original images stored securely in backend
- Only protected images served via CDN
- SAC masks contain no original data
- All data transfer uses HTTPS in production

### 6. Best Practices

1. Always enable C2PA manifest for provenance
2. Use all protection layers for high-value artwork
3. Keep original files backed up separately
4. Verify CDN URLs before sharing publicly
5. Rotate AUTH_TOKEN periodically in production

---

## Support

For configuration issues:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test Router API with `curl` or Postman
4. Review Router logs for backend errors

For usage questions:
1. Check this guide and related documentation
2. Review browser console for error messages
3. Check Router API health: `GET /health`
4. Contact support with job ID and error details

---

## Related Documentation

- **[backend-api.md](./backend-api.md)** - Backend storage API
- **[auth.md](./auth.md)** - Authentication reference
- **[router-api.md](./router-api.md)** - Router API reference

---

**Last Updated**: 2025-11-25
**Version**: 2.0.0
