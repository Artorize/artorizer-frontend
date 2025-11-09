# Artorize Dashboard Features

## Overview

The Artorize Dashboard provides a comprehensive interface for protecting artwork and comparing different image variants. This document describes all features and functionality available in the dashboard.

## Table of Contents

1. [Artwork Upload & Protection](#artwork-upload--protection)
2. [Protection Layers](#protection-layers)
3. [Image Comparison Views](#image-comparison-views)
4. [CDN Integration](#cdn-integration)
5. [Download Options](#download-options)
6. [Configuration](#configuration)

---

## Artwork Upload & Protection

### Uploading Artwork

1. Click the **+** button in the upload area
2. Select an image file (JPEG, PNG, WebP, or TIFF)
3. Maximum file size: **256 MB**
4. Fill in required metadata:
   - **Author Name** (required, max 120 characters)
   - **Creation Date** (optional)
   - **Description** (optional)

### Protection Options

Configure which protection layers to apply:

- **Fawkes**: Facial protection against facial recognition
- **Photoguard**: Protection against style mimicry
- **Mist**: Adversarial noise injection
- **Nightshade**: Model poisoning protection
- **C2PA Manifest**: Cryptographic provenance tracking
- **Watermark Strategy**:
  - Invisible Watermark
  - Tree Ring

### Submission Process

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

## Image Comparison Views

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

### Comparison Modes

When in **Compare View**, select from three comparison modes:

#### Side-by-Side
```
┌─────────┬─────────┬─────────┐
│Original │Protected│Reconstructed│
└─────────┴─────────┴─────────┘
```
- All three images displayed simultaneously
- Equal sizing for easy comparison
- Best for overall visual comparison

#### Slider
```
┌──────────────────────────────┐
│  Original  │  Protected      │
│           ◉                  │
└──────────────────────────────┘
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
┌──────────────────────────────┐
│     Base Image               │
│     + Overlay (adjustable)   │
└──────────────────────────────┘
```
- Stack images with adjustable opacity
- Select which image to overlay
- Opacity slider (0-100%)
- Best for transparency comparison

**Controls:**
- **Select Image**: Choose Original, Protected, or Reconstructed
- **Opacity**: Adjust visibility of overlay (0% = invisible, 100% = opaque)

---

## CDN Integration

### How CDN Protection Works

1. **Original Upload**: Original artwork stored securely
2. **Protection Processing**: Protection layers applied
3. **CDN Storage**: Protected image + SAC mask uploaded to CDN
4. **Public Access**: Only protected image visible to scrapers
5. **Reconstruction**: Legitimate viewers fetch mask and reconstruct

### CDN Configuration

Default URLs (configurable in `config.js`):

```javascript
ROUTER_URL: 'http://localhost:7000'  // Backend/Router API
CDN_URL: 'http://localhost:3000'     // CDN Server
```

### CDN Endpoints

Images are served from CDN with the following URL structure:

```
Protected Image: http://localhost:3000/i/{artwork_id}.jpg
SAC Mask:        http://localhost:3000/i/{artwork_id}.sac
```

### Reconstruction Process

The dashboard automatically:

1. Downloads protected image from Router API
2. Downloads SAC mask from Router API
3. Attempts to fetch from CDN (if backend_artwork_id available)
4. Compares CDN version with Router version
5. Displays reconstructed image in comparison view

**Note**: If CDN is not available, the Router protected image is used as fallback.

---

## Download Options

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

### SAC Mask Format

The SAC (Simple Array Container) v1.1 format is a binary container for mask data:

- **Size**: 50% smaller than JSON Base64
- **Structure**: 24-byte header + two int16 arrays
- **Purpose**: Contains reconstruction information
- **Compatibility**: Works with all Artorize CDN implementations

**Header Structure:**
```
[0-3]:   Magic "SAC1"
[4]:     Flags
[5]:     Data type (1 = int16)
[6]:     Array count (2)
[7]:     Reserved
[8-11]:  Array A length
[12-15]: Array B length
[16-19]: Width
[20-23]: Height
```

---

## Configuration

### Dashboard Configuration

Edit `/dashboard/config.js`:

```javascript
const ArtorizeConfig = {
  // API Endpoints
  ROUTER_URL: 'http://localhost:7000',
  CDN_URL: 'http://localhost:3000',

  // Optional Authentication
  AUTH_TOKEN: null,

  // Job Polling
  POLLING: {
    INITIAL_DELAY: 2000,      // Initial wait before first poll (ms)
    INTERVAL: 3000,           // Polling interval (ms)
    MAX_ATTEMPTS: 100,        // Maximum polling attempts
    BACKOFF_MULTIPLIER: 1.2   // Exponential backoff multiplier
  },

  // Default Protection Settings
  DEFAULTS: {
    include_hash_analysis: true,
    include_protection: true,
    enable_fawkes: true,
    enable_photoguard: true,
    enable_mist: true,
    enable_nightshade: true,
    enable_c2pa_manifest: true,
    watermark_strategy: 'invisible-watermark'
  },

  // Upload Constraints
  UPLOAD: {
    MAX_FILE_SIZE: 268435456,  // 256MB in bytes
    ACCEPTED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff'
    ]
  }
};
```

### Production Deployment

For production use, override the URLs in `index.html`:

```html
<script>
// Override configuration
window.ArtorizeConfig.ROUTER_URL = 'https://api.artorize.com';
window.ArtorizeConfig.CDN_URL = 'https://cdn.artorize.com';
window.ArtorizeConfig.AUTH_TOKEN = 'your-auth-token-here';
</script>
```

### Environment-Specific Configuration

**Development:**
```javascript
ROUTER_URL: 'http://localhost:7000'
CDN_URL: 'http://localhost:3000'
AUTH_TOKEN: null
```

**Staging:**
```javascript
ROUTER_URL: 'https://staging-api.artorize.com'
CDN_URL: 'https://staging-cdn.artorize.com'
AUTH_TOKEN: 'staging-token'
```

**Production:**
```javascript
ROUTER_URL: 'https://api.artorize.com'
CDN_URL: 'https://cdn.artorize.com'
AUTH_TOKEN: 'production-token'
```

---

## Job Information Display

After processing completion, detailed job information is displayed:

- **Job ID**: Unique identifier for this protection job
- **Status**: Current job status (completed/failed)
- **Backend ID**: Artwork ID in the backend storage system
- **Completed**: Timestamp of job completion
- **Router URL**: Active Router API endpoint
- **CDN URL**: Active CDN endpoint

This information is useful for:
- Debugging CDN access issues
- Tracking artwork in the backend system
- Verifying correct API endpoints

---

## Troubleshooting

### Common Issues

#### 1. CDN Not Available
**Symptom**: "CDN not available, using router protected image"

**Solution**:
- Verify CDN server is running on localhost:3000
- Check CDN_URL in config.js
- Ensure backend_artwork_id is present in job result

#### 2. Image Not Loading
**Symptom**: Images don't appear in comparison view

**Solution**:
- Check browser console for errors
- Verify file size is under 256MB
- Ensure supported image format (JPEG/PNG/WebP/TIFF)

#### 3. Slider Not Working
**Symptom**: Slider comparison mode doesn't respond

**Solution**:
- Ensure JavaScript is enabled
- Check for JavaScript errors in console
- Try refreshing the page

#### 4. Upload Timeout
**Symptom**: Upload fails with timeout error

**Solution**:
- Reduce image file size
- Check network connection
- Increase timeout in config (if possible)
- Verify Router API is accessible

---

## Keyboard Shortcuts

### View Navigation
- `1`: Switch to Original view
- `2`: Switch to Protected view
- `3`: Switch to Reconstructed view
- `4`: Switch to Compare view

*Note: Keyboard shortcuts are not currently implemented but planned for future release*

---

## Browser Compatibility

### Supported Browsers

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

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

## API Reference

For complete API documentation, see:
- [Backend API Reference](../docs/BACKEND_API.md)
- [Router API Documentation](https://github.com/Artorize/Artorizer-core-router)
- [CDN Documentation](https://github.com/Artorize/artorize-cdn)

---

## Security Considerations

### Data Privacy

- Original images are stored securely in backend
- Only protected images are served via CDN
- SAC masks are publicly accessible but contain no original data
- All data transfer uses HTTPS in production

### Authentication

- Optional AUTH_TOKEN for API access
- Recommended for production deployments
- Not required for local development

### Best Practices

1. Always enable C2PA manifest for provenance
2. Use all protection layers for high-value artwork
3. Keep original files backed up separately
4. Verify CDN URLs before sharing publicly
5. Rotate AUTH_TOKEN periodically in production

---

## Future Features

Planned enhancements for future releases:

- [ ] Batch upload support
- [ ] Keyboard shortcuts for view navigation
- [ ] Advanced mask visualization modes
- [ ] Artwork gallery view
- [ ] Historical job tracking
- [ ] Export comparison reports (PDF)
- [ ] Mobile-responsive design improvements
- [ ] Real-time collaboration features

---

## Support & Feedback

For issues, questions, or feature requests:

- **GitHub Issues**: [Artorize Frontend Issues](https://github.com/Artorize/artorizer-frontend/issues)
- **Documentation**: [Complete Docs](../docs/)
- **CDN Documentation**: [CDN Guide](https://github.com/Artorize/artorize-cdn)
- **Router API**: [Router Docs](https://github.com/Artorize/Artorizer-core-router)

---

## License

Private project for Artorize AI art protection system.

---

**Last Updated**: 2025-11-09
**Version**: 2.0.0
**Dashboard**: Artorize Protection Dashboard with Full CDN Integration
