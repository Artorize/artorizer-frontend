# Artorize Dashboard User Guide

Complete guide for using the Artorize Dashboard to protect your artwork from AI scraping.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Artwork](#uploading-artwork)
3. [Protection Options](#protection-options)
4. [Understanding the Results](#understanding-the-results)
5. [Downloading Protected Files](#downloading-protected-files)
6. [Technical Details](#technical-details)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Dashboard

**Local Development**:
```bash
cd artorizer-frontend
npm start
# Opens http://localhost:8080/dashboard/
```

**Production**:
Navigate to your deployed dashboard URL (e.g., `https://artorize.com/dashboard/`)

---

### Dashboard Layout

The dashboard consists of four main sections:

1. **Upload Area**: Select your image file
2. **Metadata Section**: Enter artist name, creation date, description
3. **Protection Options**: Configure protection layers
4. **Results Area**: View protected artwork with mask overlay (appears after processing)

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
| **Artist Name** | ✓ Yes | 120 chars | Your name or pseudonym |
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

#### Protection Layers

| Option | Description | Use Case |
|--------|-------------|----------|
| **Enable Fawkes** | Facial feature perturbation | Portraits, character art |
| **Enable Photoguard** | Anti-mimicry protection | Style protection |
| **Enable Mist** | Adversarial noise injection | General AI poisoning |
| **Enable Nightshade** | Model-poisoning attack | Strong anti-scraping |
| **Enable C2PA Manifest** | Cryptographic provenance | Copyright tracking |

**Default**: All enabled

---

#### Watermark Strategy

| Strategy | Description | Visibility |
|----------|-------------|------------|
| **Invisible Watermark** | Frequency-domain watermark | Invisible to eye |
| **Tree Ring** | Ring-pattern watermark | Configurable visibility |
| **None** | No watermark | Not recommended |

**Default**: Invisible Watermark

---

### Step 4: Submit

Click **"Generate"** to start processing.

---

## Protection Options

### Understanding Protection Layers

#### Fawkes
- **Purpose**: Protect facial features from recognition systems
- **How it works**: Adds imperceptible perturbations to faces
- **Best for**: Portraits, character art, selfies
- **Processing time**: ~30-60 seconds
- **Recommendation**: Enable for any artwork with human faces

---

#### Photoguard
- **Purpose**: Prevent style mimicry by diffusion models
- **How it works**: Immunizes images against style transfer
- **Best for**: Unique art styles you want to protect
- **Processing time**: ~45-90 seconds
- **Recommendation**: Enable for signature styles

---

#### Mist
- **Purpose**: Inject adversarial noise to corrupt AI training
- **How it works**: Adds imperceptible perturbations that cause model errors
- **Best for**: General anti-scraping protection
- **Processing time**: ~20-40 seconds
- **Recommendation**: Enable for all artwork

---

#### Nightshade
- **Purpose**: Aggressive model poisoning
- **How it works**: Creates data points that degrade model quality
- **Best for**: Maximum protection against unauthorized training
- **Processing time**: ~60-120 seconds
- **Warning**: Most aggressive option, may have slight visual artifacts

---

#### C2PA Manifest
- **Purpose**: Cryptographic proof of authorship
- **How it works**: Embeds signed metadata according to C2PA standard
- **Best for**: Copyright enforcement, provenance tracking
- **Processing time**: ~5-10 seconds
- **Recommendation**: Enable for commercial artwork

---

### Recommended Presets

#### Preset 1: Maximum Protection
```
✓ Fawkes
✓ Photoguard
✓ Mist
✓ Nightshade
✓ C2PA Manifest
Watermark: Tree Ring
```
**Use case**: High-value artwork, commercial work
**Processing time**: 3-5 minutes

---

#### Preset 2: Balanced Protection
```
✓ Mist
✓ Photoguard
✓ C2PA Manifest
☐ Fawkes (unless faces present)
☐ Nightshade
Watermark: Invisible Watermark
```
**Use case**: General artwork sharing
**Processing time**: 1-2 minutes

---

#### Preset 3: Minimal Protection
```
✓ Mist
✓ C2PA Manifest
☐ Fawkes
☐ Photoguard
☐ Nightshade
Watermark: Invisible Watermark
```
**Use case**: Quick protection, low-stakes sharing
**Processing time**: 30-60 seconds

---

## Understanding the Results

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

### Result Display

The result section shows:

#### 1. Protected Image with Mask Overlay

A **stacked canvas** displaying:
- **Base layer**: Protected (polluted) image
- **Overlay layer**: SAC mask visualization

**Visual effect**: A semi-transparent white overlay indicating the mask strength.

---

#### 2. Mask Opacity Slider

Adjust the overlay visibility (0-100%) to inspect the mask.

**Usage**:
- **0%**: See only the protected image (what AI scrapers see)
- **50%**: Default, balanced view
- **100%**: See full mask strength

**Note**: This is for visualization only - the actual mask file is separate.

---

#### 3. Job Information

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

## Downloading Protected Files

### Download Protected Image

Click **"Download Protected"** to save the protected JPEG file.

**File format**: JPEG (may be PNG depending on processor settings)

**What you get**:
- Polluted version of the artwork
- All protection layers applied
- Watermark embedded
- C2PA manifest (if enabled)

**Use this file** to:
- Post on social media
- Share on portfolio sites
- Upload to art communities

**Do NOT share**: The original unprotected file

---

### Download Mask (.sac)

Click **"Download Mask (.sac)"** to save the reconstruction mask.

**File format**: SAC v1 binary (`.sac`)

**What you get**:
- Two int16 arrays (Array A and Array B)
- Dimensions metadata
- Reconstruction information

**Use this file** to:
- Enable legitimate viewers to see the original quality
- Embed on your website with the SAC renderer
- Distribute via your CDN

**How it works**:
1. Scraper downloads protected image → sees polluted version
2. Legitimate viewer fetches image + `.sac` file → JavaScript reconstructs original
3. Human sees high quality, AI sees poisoned data

---

### CDN Integration

For production use, upload both files to your CDN:

```
https://cdn.artorize.com/i/60f7b3b3b3b3b3b3b3b3b3b3.jpg      ← Protected image
https://cdn.artorize.com/i/60f7b3b3b3b3b3b3b3b3b3b3.jpg.sac  ← Mask file
```

**Embed on your website**:
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

See **[CLIENT_INTEGRATION.md](./CLIENT_INTEGRATION.md)** for complete integration guide.

---

## Technical Details

### How the Protection Works

```
Original Image
    ↓
[Router] → Validate metadata
    ↓
[Processor] → Apply protection layers
    ↓
Protected Image = Original + Perturbations
    ↓
Mask = Reconstruction Information
    ↓
[Backend] → Store protected image + mask
    ↓
[CDN] → Serve files
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
- Dimensions: width × height

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

## Troubleshooting

### Issue: Upload fails with "File size exceeds maximum"

**Cause**: File too large

**Solution**:
1. Check file size (right-click → Properties)
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
original_artwork.jpg  → Upload as is
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

See **[ROUTER-API.md](./ROUTER-API.md)** for complete API documentation.

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

## Related Documentation

- **[DASHBOARD_CONFIGURATION.md](./DASHBOARD_CONFIGURATION.md)** - Configuration guide
- **[CLIENT_INTEGRATION.md](./CLIENT_INTEGRATION.md)** - Website integration guide
- **[ROUTER-API.md](./ROUTER-API.md)** - API reference
- **[sac_v_1_cdn_mask_transfer_protocol.md](./sac_v_1_cdn_mask_transfer_protocol.md)** - SAC protocol spec

---

## Support

For issues or questions:
1. Check this guide and related documentation
2. Review browser console for error messages
3. Check Router API health: `GET /health`
4. Contact support with job ID and error details

---

**Last Updated**: 2025-11-09
