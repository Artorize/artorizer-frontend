/**
 * Artorize Dashboard Controller
 *
 * Main controller for the Artorize dashboard UI.
 * Handles form submission, progress tracking, and result display.
 */

class ArtorizeDashboard {
  constructor() {
    this.uploader = new ArtworkUploader(window.ArtorizeConfig);
    this.currentJobId = null;
    this.selectedFile = null;

    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // Form inputs
    this.imageUploadInput = document.getElementById('image-upload');
    this.authorNameInput = document.getElementById('author-name');
    this.creationDateInput = document.getElementById('creation-date');
    this.descriptionInput = document.getElementById('description');

    // Protection options
    this.enableFawkesCheckbox = document.getElementById('enable-fawkes');
    this.enablePhotoguardCheckbox = document.getElementById('enable-photoguard');
    this.enableMistCheckbox = document.getElementById('enable-mist');
    this.enableNightshadeCheckbox = document.getElementById('enable-nightshade');
    this.enableC2paCheckbox = document.getElementById('enable-c2pa-manifest');
    this.watermarkStrategySelect = document.getElementById('watermark-strategy');

    // Buttons
    this.submitButton = document.getElementById('submit-button');
    this.generateButton = document.getElementById('generate-button');

    // Upload label
    this.uploadLabel = document.querySelector('.upload-label');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // File selection
    this.imageUploadInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Submit button (currently same as generate)
    this.submitButton.addEventListener('click', () => this.handleSubmit());

    // Generate button
    this.generateButton.addEventListener('click', () => this.handleSubmit());
  }

  /**
   * Handle file selection
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      this.updateUploadLabel('Upload Image:');
      return;
    }

    this.selectedFile = file;
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    this.updateUploadLabel(`Selected: ${file.name} (${fileSizeMB} MB)`);
  }

  /**
   * Update upload label text
   */
  updateUploadLabel(text) {
    this.uploadLabel.textContent = text;
  }

  /**
   * Validate form inputs
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateForm() {
    const errors = [];

    if (!this.selectedFile) {
      errors.push('Please select an image file');
    }

    const artistName = this.authorNameInput.value.trim();
    if (!artistName) {
      errors.push('Artist name is required');
    } else if (artistName.length > 120) {
      errors.push('Artist name must be 120 characters or less');
    }

    // Note: artwork_title is not in the current HTML, using author name as title for now
    // In a complete implementation, you'd add a title field

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gather form data
   * @returns {Object} Form data for submission
   */
  gatherFormData() {
    const artistName = this.authorNameInput.value.trim();
    const description = this.descriptionInput.value.trim();
    const creationDate = this.creationDateInput.value;

    // Protection options
    const protectionOptions = {
      enable_fawkes: this.enableFawkesCheckbox?.checked ?? true,
      enable_photoguard: this.enablePhotoguardCheckbox?.checked ?? true,
      enable_mist: this.enableMistCheckbox?.checked ?? true,
      enable_nightshade: this.enableNightshadeCheckbox?.checked ?? true,
      enable_c2pa_manifest: this.enableC2paCheckbox?.checked ?? true,
      watermark_strategy: this.watermarkStrategySelect?.value || 'invisible-watermark'
    };

    return {
      imageFile: this.selectedFile,
      artist_name: artistName,
      artwork_title: artistName, // Using artist name as title (you should add a title field)
      artwork_description: description || undefined,
      artwork_creation_time: creationDate || undefined,
      tags: [], // You could add a tags input field
      protectionOptions
    };
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    // Create or update status element
    let statusEl = document.getElementById('status-message');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'status-message';
      statusEl.style.cssText = `
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        font-size: 1rem;
        text-align: center;
      `;
      this.generateButton.parentElement.appendChild(statusEl);
    }

    // Style based on type
    const colors = {
      info: { bg: '#e3f2fd', color: '#1976d2', border: '#1976d2' },
      success: { bg: '#e8f5e9', color: '#388e3c', border: '#388e3c' },
      error: { bg: '#ffebee', color: '#d32f2f', border: '#d32f2f' },
      warning: { bg: '#fff3e0', color: '#f57c00', border: '#f57c00' }
    };

    const style = colors[type] || colors.info;
    statusEl.style.backgroundColor = style.bg;
    statusEl.style.color = style.color;
    statusEl.style.border = `1px solid ${style.border}`;
    statusEl.textContent = message;
  }

  /**
   * Show progress
   */
  showProgress(percent, message) {
    let progressContainer = document.getElementById('progress-container');
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.id = 'progress-container';
      progressContainer.style.cssText = 'margin: 20px 0;';
      this.generateButton.parentElement.appendChild(progressContainer);
    }

    progressContainer.innerHTML = `
      <div style="margin-bottom: 10px; text-align: center; font-size: 1rem;">${message}</div>
      <div style="width: 100%; background: #e0e0e0; border-radius: 10px; overflow: hidden; height: 30px;">
        <div style="width: ${percent}%; background: linear-gradient(90deg, #4CAF50, #45a049); height: 100%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          ${percent}%
        </div>
      </div>
    `;
  }

  /**
   * Hide progress
   */
  hideProgress() {
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) {
      progressContainer.remove();
    }
  }

  /**
   * Display protected artwork result
   */
  async displayResult(result) {
    // Create result container
    let resultContainer = document.getElementById('result-container');
    if (!resultContainer) {
      resultContainer = document.createElement('div');
      resultContainer.id = 'result-container';
      resultContainer.style.cssText = `
        margin: 30px 0;
        padding: 20px;
        border: 2px solid #4CAF50;
        border-radius: 10px;
        background: #f9f9f9;
      `;
      this.generateButton.parentElement.appendChild(resultContainer);
    }

    resultContainer.innerHTML = `
      <h2 style="text-align: center; margin-bottom: 20px;">Protected Artwork</h2>
      <div style="position: relative; max-width: 800px; margin: 0 auto;">
        <div style="position: relative; display: inline-block;">
          <img id="protected-image" src="" alt="Protected artwork" style="max-width: 100%; display: block;">
          <canvas id="mask-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <label for="mask-opacity" style="margin-right: 10px;">Mask Opacity:</label>
        <input type="range" id="mask-opacity" min="0" max="100" value="50" style="width: 200px;">
        <span id="opacity-value" style="margin-left: 10px;">50%</span>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <button id="download-protected" style="padding: 10px 20px; margin: 5px; cursor: pointer; border-radius: 5px; border: 1px solid #4CAF50; background: #4CAF50; color: white; font-size: 1rem;">Download Protected</button>
        <button id="download-mask" style="padding: 10px 20px; margin: 5px; cursor: pointer; border-radius: 5px; border: 1px #2196F3; background: #2196F3; color: white; font-size: 1rem;">Download Mask (.sac)</button>
      </div>
      <div id="result-info" style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px; font-size: 0.9rem;">
        <strong>Job ID:</strong> ${result.job_id}<br>
        <strong>Status:</strong> ${result.status}<br>
        <strong>Backend Artwork ID:</strong> ${result.backend_artwork_id || 'N/A'}<br>
        <strong>Completed:</strong> ${result.completed_at || 'N/A'}
      </div>
    `;

    // Load protected image
    const protectedImg = document.getElementById('protected-image');
    const maskCanvas = document.getElementById('mask-canvas');

    try {
      // Download protected image from router
      const protectedBlob = await this.uploader.downloadVariant(result.job_id, 'protected');
      const protectedUrl = URL.createObjectURL(protectedBlob);
      protectedImg.src = protectedUrl;

      // Wait for image to load
      await new Promise((resolve, reject) => {
        protectedImg.onload = resolve;
        protectedImg.onerror = reject;
      });

      // Fetch and render SAC mask
      const maskUrl = result.urls?.mask || `${this.uploader.routerUrl}/jobs/${result.job_id}/download/mask`;

      try {
        const sacData = await window.SAC.loadMaskAndRender(
          protectedImg,
          maskUrl,
          maskCanvas,
          { opacity: 0.5, colorMode: 'white' }
        );

        // Setup opacity slider
        const opacitySlider = document.getElementById('mask-opacity');
        const opacityValue = document.getElementById('opacity-value');

        opacitySlider.addEventListener('input', (e) => {
          const opacity = e.target.value / 100;
          opacityValue.textContent = `${e.target.value}%`;

          window.SAC.renderMask(sacData, maskCanvas, {
            opacity,
            colorMode: 'white',
            width: protectedImg.naturalWidth,
            height: protectedImg.naturalHeight
          });
        });

        this.showStatus('Artwork protected successfully! Mask overlay is visible.', 'success');
      } catch (maskError) {
        console.warn('Failed to load mask, showing image only:', maskError);
        this.showStatus('Protected image loaded, but mask rendering failed.', 'warning');
      }

      // Download buttons
      document.getElementById('download-protected').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = protectedUrl;
        a.download = `protected_${result.job_id}.jpg`;
        a.click();
      });

      document.getElementById('download-mask').addEventListener('click', async () => {
        try {
          const maskBlob = await this.uploader.downloadVariant(result.job_id, 'mask');
          const maskUrl = URL.createObjectURL(maskBlob);
          const a = document.createElement('a');
          a.href = maskUrl;
          a.download = `mask_${result.job_id}.sac`;
          a.click();
          URL.revokeObjectURL(maskUrl);
        } catch (error) {
          this.showStatus(`Failed to download mask: ${error.message}`, 'error');
        }
      });

    } catch (error) {
      this.showStatus(`Failed to display result: ${error.message}`, 'error');
      console.error('Display error:', error);
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    // Validate form
    const validation = this.validateForm();
    if (!validation.valid) {
      this.showStatus(`Validation errors:\n${validation.errors.join('\n')}`, 'error');
      return;
    }

    // Disable buttons during upload
    this.submitButton.disabled = true;
    this.generateButton.disabled = true;

    try {
      // Gather form data
      const formData = this.gatherFormData();

      // Submit artwork
      this.showStatus('Preparing upload...', 'info');
      this.showProgress(0, 'Uploading artwork...');

      const submitResult = await this.uploader.submitArtwork(formData, (percent) => {
        this.showProgress(percent, 'Uploading artwork...');
      });

      this.currentJobId = submitResult.job_id;

      // Check if already exists
      if (submitResult.status === 'exists') {
        this.showStatus('Artwork already exists in the system', 'warning');
        this.hideProgress();

        // You could display the existing artwork here
        console.log('Existing artwork:', submitResult.artwork);

        this.submitButton.disabled = false;
        this.generateButton.disabled = false;
        return;
      }

      // Poll for completion
      this.showProgress(100, 'Processing artwork...');
      this.showStatus('Processing your artwork with protection layers...', 'info');

      const result = await this.uploader.pollJobUntilComplete(
        this.currentJobId,
        (status) => {
          console.log('Status update:', status);
          this.showStatus(`Processing... (${status.status})`, 'info');
        }
      );

      this.hideProgress();

      // Check final status
      if (result.status === 'failed') {
        this.showStatus(`Processing failed: ${result.error?.message || 'Unknown error'}`, 'error');
        this.submitButton.disabled = false;
        this.generateButton.disabled = false;
        return;
      }

      // Display result
      await this.displayResult(result);

    } catch (error) {
      console.error('Submission error:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
      this.hideProgress();
    } finally {
      this.submitButton.disabled = false;
      this.generateButton.disabled = false;
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new ArtorizeDashboard();
  console.log('Artorize Dashboard initialized');
});
