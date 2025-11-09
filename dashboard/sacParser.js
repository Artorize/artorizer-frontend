/**
 * SAC v1 (Simple Array Container) Parser and Mask Renderer
 *
 * Implements the SAC v1 protocol for parsing binary mask files and rendering
 * them as canvas overlays on protected artwork.
 *
 * Protocol: sac_v_1_cdn_mask_transfer_protocol.md
 */

/**
 * SAC v1 Header structure (24 bytes, little-endian):
 * - Bytes 0-3:   Magic "SAC1"
 * - Byte 4:      Flags (reserved)
 * - Byte 5:      Data type (1 = int16)
 * - Byte 6:      Array count (must be 2)
 * - Byte 7:      Reserved
 * - Bytes 8-11:  Length of array A (uint32)
 * - Bytes 12-15: Length of array B (uint32)
 * - Bytes 16-19: Width (uint32, optional)
 * - Bytes 20-23: Height (uint32, optional)
 */

const SAC_MAGIC = 'SAC1';
const SAC_HEADER_SIZE = 24;
const SAC_DATA_TYPE_INT16 = 1;
const SAC_ARRAY_COUNT = 2;

/**
 * Parse SAC v1 binary data
 * @param {ArrayBuffer} buffer - The SAC file contents
 * @returns {Object} Parsed SAC data with { arrayA, arrayB, width, height }
 * @throws {Error} If parsing fails or format is invalid
 */
function parseSAC(buffer) {
  if (buffer.byteLength < SAC_HEADER_SIZE) {
    throw new Error(`SAC file too small: ${buffer.byteLength} bytes (minimum ${SAC_HEADER_SIZE})`);
  }

  const view = new DataView(buffer);

  // Validate magic number
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (magic !== SAC_MAGIC) {
    throw new Error(`Invalid SAC magic: expected "${SAC_MAGIC}", got "${magic}"`);
  }

  // Read header fields (little-endian)
  const flags = view.getUint8(4);
  const dataType = view.getUint8(5);
  const arrayCount = view.getUint8(6);
  const reserved = view.getUint8(7);
  const lengthA = view.getUint32(8, true);  // little-endian
  const lengthB = view.getUint32(12, true); // little-endian
  const width = view.getUint32(16, true);   // little-endian
  const height = view.getUint32(20, true);  // little-endian

  // Validate header
  if (dataType !== SAC_DATA_TYPE_INT16) {
    throw new Error(`Unsupported data type: ${dataType} (expected ${SAC_DATA_TYPE_INT16} for int16)`);
  }
  if (arrayCount !== SAC_ARRAY_COUNT) {
    throw new Error(`Invalid array count: ${arrayCount} (expected ${SAC_ARRAY_COUNT})`);
  }
  if (lengthA !== lengthB) {
    throw new Error(`Array length mismatch: A=${lengthA}, B=${lengthB}`);
  }
  if (width && height && lengthA !== width * height) {
    throw new Error(`Array length ${lengthA} doesn't match dimensions ${width}x${height}=${width * height}`);
  }

  // Calculate expected file size
  const bytesPerElement = 2; // int16
  const expectedSize = SAC_HEADER_SIZE + (lengthA * bytesPerElement * 2);
  if (buffer.byteLength < expectedSize) {
    throw new Error(`SAC file truncated: ${buffer.byteLength} bytes (expected ${expectedSize})`);
  }

  // Extract arrays as Int16Array views (zero-copy)
  const offsetA = SAC_HEADER_SIZE;
  const offsetB = offsetA + (lengthA * bytesPerElement);

  const arrayA = new Int16Array(buffer, offsetA, lengthA);
  const arrayB = new Int16Array(buffer, offsetB, lengthB);

  return {
    arrayA,
    arrayB,
    width: width || null,
    height: height || null,
    metadata: { flags, reserved }
  };
}

/**
 * Fetch SAC file from URL
 * @param {string} url - URL to fetch (typically image_url + '.sac')
 * @returns {Promise<ArrayBuffer>} SAC file contents
 */
async function fetchSAC(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    throw new Error(`Failed to fetch SAC from ${url}: ${error.message}`);
  }
}

/**
 * Render SAC mask on canvas overlay
 * @param {Object} sacData - Parsed SAC data from parseSAC()
 * @param {HTMLCanvasElement} canvas - Canvas element to render on
 * @param {Object} options - Rendering options
 * @param {number} options.opacity - Mask opacity (0-1, default: 0.5)
 * @param {string} options.colorMode - 'white', 'red', 'green', 'blue', 'rainbow' (default: 'white')
 * @param {number} options.width - Canvas width (defaults to sacData.width)
 * @param {number} options.height - Canvas height (defaults to sacData.height)
 */
function renderMask(sacData, canvas, options = {}) {
  const {
    opacity = 0.5,
    colorMode = 'white',
    width = sacData.width,
    height = sacData.height
  } = options;

  if (!width || !height) {
    throw new Error('Width and height must be specified (either in SAC data or options)');
  }

  const { arrayA, arrayB } = sacData;
  const pixelCount = width * height;

  if (arrayA.length !== pixelCount || arrayB.length !== pixelCount) {
    throw new Error(`Array size ${arrayA.length} doesn't match canvas ${width}x${height}=${pixelCount}`);
  }

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Render based on color mode
  for (let i = 0; i < pixelCount; i++) {
    const valueA = arrayA[i];
    const valueB = arrayB[i];

    // Normalize int16 values to 0-255 range
    // Assuming int16 range: -32768 to 32767
    const normalizeValue = (val) => Math.max(0, Math.min(255, ((val + 32768) / 65535) * 255));

    const normA = normalizeValue(valueA);
    const normB = normalizeValue(valueB);

    // Calculate pixel index in RGBA array
    const pixelIdx = i * 4;

    // Apply color mode
    switch (colorMode) {
      case 'white':
        // White overlay with alpha based on magnitude
        data[pixelIdx] = 255;     // R
        data[pixelIdx + 1] = 255; // G
        data[pixelIdx + 2] = 255; // B
        data[pixelIdx + 3] = normA * opacity; // A
        break;

      case 'red':
        data[pixelIdx] = normA;
        data[pixelIdx + 1] = 0;
        data[pixelIdx + 2] = 0;
        data[pixelIdx + 3] = 255 * opacity;
        break;

      case 'green':
        data[pixelIdx] = 0;
        data[pixelIdx + 1] = normA;
        data[pixelIdx + 2] = 0;
        data[pixelIdx + 3] = 255 * opacity;
        break;

      case 'blue':
        data[pixelIdx] = 0;
        data[pixelIdx + 1] = 0;
        data[pixelIdx + 2] = normA;
        data[pixelIdx + 3] = 255 * opacity;
        break;

      case 'rainbow':
        // Map magnitude to hue (0-360 degrees)
        const magnitude = Math.sqrt(normA * normA + normB * normB);
        const hue = (magnitude / 255) * 360;
        const rgb = hslToRgb(hue, 100, 50);
        data[pixelIdx] = rgb[0];
        data[pixelIdx + 1] = rgb[1];
        data[pixelIdx + 2] = rgb[2];
        data[pixelIdx + 3] = 255 * opacity;
        break;

      default:
        throw new Error(`Unknown color mode: ${colorMode}`);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {number[]} RGB values [r, g, b] (0-255)
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Load image, fetch SAC mask, and render complete protected artwork
 * @param {HTMLImageElement} imgElement - The polluted image element
 * @param {string} sacUrl - URL to SAC mask file
 * @param {HTMLCanvasElement} maskCanvas - Canvas for rendering mask overlay
 * @param {Object} options - Rendering options (opacity, colorMode, etc.)
 * @returns {Promise<Object>} Parsed SAC data
 */
async function loadMaskAndRender(imgElement, sacUrl, maskCanvas, options = {}) {
  try {
    // Ensure image is loaded
    if (!imgElement.complete) {
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = () => reject(new Error('Image failed to load'));
      });
    }

    // Fetch and parse SAC
    const sacBuffer = await fetchSAC(sacUrl);
    const sacData = parseSAC(sacBuffer);

    // Use image dimensions if SAC doesn't specify
    const width = sacData.width || imgElement.naturalWidth;
    const height = sacData.height || imgElement.naturalHeight;

    // Render mask
    renderMask(sacData, maskCanvas, {
      ...options,
      width,
      height
    });

    return sacData;
  } catch (error) {
    console.error('Failed to load and render mask:', error);
    throw error;
  }
}

// Export functions
if (typeof window !== 'undefined') {
  window.SAC = {
    parseSAC,
    fetchSAC,
    renderMask,
    loadMaskAndRender
  };
}

// ES module export (if supported)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseSAC,
    fetchSAC,
    renderMask,
    loadMaskAndRender
  };
}
