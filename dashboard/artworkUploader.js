/**
 * Artwork Uploader - Router API Client
 *
 * Handles artwork submission, job status polling, and result fetching
 * from the Artorizer Router API.
 */

class ArtworkUploader {
  constructor(config = window.ArtorizeConfig) {
    this.config = config;
    this.routerUrl = config.ROUTER_URL;
    this.cdnUrl = config.CDN_URL;
    this.authToken = config.AUTH_TOKEN;
    this.pollingConfig = config.POLLING;
  }

  /**
   * Build headers for API requests
   * @param {Object} extraHeaders - Additional headers to include
   * @returns {Object} Headers object
   */
  _buildHeaders(extraHeaders = {}) {
    const headers = {
      ...extraHeaders
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Submit artwork for protection
   * @param {Object} params - Submission parameters
   * @param {File} params.imageFile - Image file to upload
   * @param {string} params.artist_name - Artist name (required)
   * @param {string} params.artwork_title - Artwork title (required)
   * @param {string} [params.artwork_description] - Artwork description
   * @param {Date|string} [params.artwork_creation_time] - Creation time
   * @param {string[]} [params.tags] - Tags array
   * @param {Object} [params.protectionOptions] - Protection layer options
   * @param {Function} [onProgress] - Upload progress callback (0-100)
   * @returns {Promise<Object>} { job_id, status }
   */
  async submitArtwork(params, onProgress = null) {
    const {
      imageFile,
      artist_name,
      artwork_title,
      artwork_description,
      artwork_creation_time,
      tags,
      protectionOptions = {}
    } = params;

    // Validate required fields
    if (!imageFile) {
      throw new Error('Image file is required');
    }
    if (!artist_name || artist_name.trim().length === 0) {
      throw new Error('Artist name is required');
    }
    if (!artwork_title || artwork_title.trim().length === 0) {
      throw new Error('Artwork title is required');
    }

    // Validate file size
    if (imageFile.size > this.config.UPLOAD.MAX_FILE_SIZE) {
      const maxMB = Math.round(this.config.UPLOAD.MAX_FILE_SIZE / 1024 / 1024);
      throw new Error(`File size ${Math.round(imageFile.size / 1024 / 1024)}MB exceeds maximum ${maxMB}MB`);
    }

    // Validate file type
    if (!this.config.UPLOAD.ACCEPTED_TYPES.includes(imageFile.type)) {
      throw new Error(`File type ${imageFile.type} not accepted. Use: ${this.config.UPLOAD.ACCEPTED_TYPES.join(', ')}`);
    }

    // Build multipart form data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('artist_name', artist_name.trim());
    formData.append('artwork_title', artwork_title.trim());

    if (artwork_description && artwork_description.trim()) {
      formData.append('artwork_description', artwork_description.trim());
    }

    if (artwork_creation_time) {
      const isoDate = artwork_creation_time instanceof Date
        ? artwork_creation_time.toISOString()
        : artwork_creation_time;
      formData.append('artwork_creation_time', isoDate);
    }

    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    // Add protection options (merge with defaults)
    const finalOptions = {
      ...this.config.DEFAULTS,
      ...protectionOptions
    };

    for (const [key, value] of Object.entries(finalOptions)) {
      formData.append(key, value);
    }

    // Submit to router
    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', `${this.routerUrl}/protect`);

        // Set headers (excluding Content-Type - browser sets it with boundary)
        if (this.authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || `HTTP ${xhr.status}: ${xhr.statusText}`));
            } catch (e) {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timeout'));

        xhr.send(formData);
      });

      return response;
    } catch (error) {
      console.error('Failed to submit artwork:', error);
      throw error;
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID returned from submitArtwork
   * @returns {Promise<Object>} Job status object
   */
  async getJobStatus(jobId) {
    try {
      const response = await fetch(`${this.routerUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: this._buildHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Get complete job result
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Complete job result with URLs
   */
  async getJobResult(jobId) {
    try {
      const response = await fetch(`${this.routerUrl}/jobs/${jobId}/result`, {
        method: 'GET',
        headers: this._buildHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        if (response.status === 409) {
          throw new Error('Job is still processing');
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get job result:', error);
      throw error;
    }
  }

  /**
   * Poll job status until completion or failure
   * @param {string} jobId - Job ID to poll
   * @param {Function} onStatusUpdate - Callback(status) called on each poll
   * @returns {Promise<Object>} Final job result
   */
  async pollJobUntilComplete(jobId, onStatusUpdate = null) {
    let attempt = 0;
    let delay = this.pollingConfig.INITIAL_DELAY;

    while (attempt < this.pollingConfig.MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, delay));

      const status = await this.getJobStatus(jobId);

      if (onStatusUpdate) {
        onStatusUpdate(status);
      }

      // Check terminal states
      if (status.status === 'completed' || status.status === 'failed') {
        // Fetch complete result
        try {
          return await this.getJobResult(jobId);
        } catch (error) {
          // If result fetch fails, return status object
          console.warn('Failed to fetch complete result, returning status:', error);
          return status;
        }
      }

      // Increment attempt and apply backoff
      attempt++;
      delay = Math.min(
        delay * this.pollingConfig.BACKOFF_MULTIPLIER,
        10000 // max 10s
      );
    }

    throw new Error(`Job polling timeout after ${this.pollingConfig.MAX_ATTEMPTS} attempts`);
  }

  /**
   * Download protected image blob
   * @param {string} jobId - Job ID
   * @param {string} variant - 'original', 'protected', or 'mask'
   * @returns {Promise<Blob>} Image blob
   */
  async downloadVariant(jobId, variant = 'protected') {
    try {
      const response = await fetch(`${this.routerUrl}/jobs/${jobId}/download/${variant}`, {
        method: 'GET',
        headers: this._buildHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job or variant not found');
        }
        if (response.status === 409) {
          throw new Error('Job is still processing');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Failed to download ${variant}:`, error);
      throw error;
    }
  }

  /**
   * Get CDN URL for protected image
   * @param {string} artworkId - Backend artwork ID
   * @param {string} variant - 'original', 'protected', or 'mask'
   * @returns {string} CDN URL
   */
  getCDNUrl(artworkId, variant = 'protected') {
    const extension = variant === 'mask' ? '.sac' : '.jpg';
    return `${this.cdnUrl}/i/${artworkId}${extension}`;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ArtworkUploader = ArtworkUploader;
}

// ES module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArtworkUploader;
}
