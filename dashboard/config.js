/**
 * Artorize Dashboard Configuration
 *
 * Configure router and CDN URLs for your deployment.
 *
 * Production example:
 *   ROUTER_URL: 'https://api.artorize.com'
 *   CDN_URL: 'https://cdn.artorize.com'
 *
 * Local development example:
 *   ROUTER_URL: 'http://localhost:7000'
 *   CDN_URL: 'http://localhost:3000'
 */

const ArtorizeConfig = {
  // Router API base URL (no trailing slash)
  ROUTER_URL: 'https://router.artorizer.com',

  // CDN base URL for protected images and SAC masks (no trailing slash)
  CDN_URL: 'https://cdn.artorizer.com',

  // Optional: Auth token if your router requires authentication
  AUTH_TOKEN: null,

  // Job status polling configuration
  POLLING: {
    // Initial delay before first status check (ms)
    INITIAL_DELAY: 2000,

    // Polling interval for checking job status (ms)
    INTERVAL: 3000,

    // Maximum number of polling attempts before timeout
    MAX_ATTEMPTS: 100,

    // Exponential backoff multiplier
    BACKOFF_MULTIPLIER: 1.2
  },

  // Default protection options
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

  // File upload constraints
  UPLOAD: {
    // Maximum file size in bytes (256MB default, should match router config)
    MAX_FILE_SIZE: 268435456,

    // Accepted image MIME types
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
  }
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.ArtorizeConfig = ArtorizeConfig;
}

// Export for ES modules (if supported)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArtorizeConfig;
}
