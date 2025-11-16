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
    this.currentResult = null;

    // Image blobs for comparison
    this.images = {
      original: null,
      protected: null,
      reconstructed: null,
      mask: null
    };

    // Current view state
    this.currentView = 'comparison';
    this.comparisonMode = 'side-by-side';

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
    this.generateButton = document.getElementById('generate-button');

    // Upload elements
    this.uploadZone = document.getElementById('upload-zone');
    this.uploadLabel = document.querySelector('.upload-label');
    this.imagePreview = document.getElementById('image-preview');
    this.previewImage = document.getElementById('preview-image');
    this.removeImageBtn = document.getElementById('remove-image');

    // Status banner
    this.statusBanner = document.getElementById('status-banner');
    this.statusMessage = document.getElementById('status-message');

    // Today button
    this.todayBtn = document.getElementById('today-btn');

    // Global drop overlay
    this.globalDropOverlay = document.getElementById('global-drop-overlay');
    this.appBody = document.getElementById('app-body');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // File selection
    this.imageUploadInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Generate button
    this.generateButton.addEventListener('click', () => this.handleSubmit());

    // Remove image button
    if (this.removeImageBtn) {
      this.removeImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearImagePreview();
      });
    }

    // Today button
    if (this.todayBtn) {
      this.todayBtn.addEventListener('click', () => this.setTodayDate());
    }

    // Global drag and drop - anywhere on page
    this.setupGlobalDragAndDrop();

    // Drag and drop functionality for upload zone
    if (this.uploadZone) {
      this.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.uploadZone.classList.add('drag-over');
      });

      this.uploadZone.addEventListener('dragleave', () => {
        this.uploadZone.classList.remove('drag-over');
      });

      this.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.uploadZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.imageUploadInput.files = files;
          this.handleFileSelect({ target: { files: files } });
        }
      });
    }
  }

  /**
   * Initialize comparison controls
   */
  initializeComparisonControls() {
    // View toggle buttons
    document.getElementById('view-original-btn').addEventListener('click', () => this.switchView('original'));
    document.getElementById('view-protected-btn').addEventListener('click', () => this.switchView('protected'));
    document.getElementById('view-reconstructed-btn').addEventListener('click', () => this.switchView('reconstructed'));
    document.getElementById('view-comparison-btn').addEventListener('click', () => this.switchView('comparison'));

    // Comparison mode selector
    document.getElementById('comparison-mode-select').addEventListener('change', (e) => {
      this.comparisonMode = e.target.value;
      if (this.currentView === 'comparison') {
        this.renderComparisonView();
      }
    });

    // Download buttons
    document.getElementById('download-original-btn').addEventListener('click', () => this.downloadImage('original'));
    document.getElementById('download-protected-btn').addEventListener('click', () => this.downloadImage('protected'));
    document.getElementById('download-mask-btn').addEventListener('click', () => this.downloadImage('mask'));
    document.getElementById('download-reconstructed-btn').addEventListener('click', () => this.downloadImage('reconstructed'));
  }

  /**
   * Handle file selection
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
      this.clearImagePreview();
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showStatus('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showStatus('Image size must be less than 10MB', 'error');
      return;
    }

    this.selectedFile = file;
    this.showImagePreview(file);
  }

  /**
   * Show image preview
   */
  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImage.src = e.target.result;
      this.uploadLabel.style.display = 'none';
      this.imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  /**
   * Clear image preview
   */
  clearImagePreview() {
    this.selectedFile = null;
    this.imageUploadInput.value = '';
    this.previewImage.src = '';
    this.uploadLabel.style.display = 'flex';
    this.imagePreview.style.display = 'none';
  }

  /**
   * Set date input to today
   */
  setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.creationDateInput.value = `${yyyy}-${mm}-${dd}`;

    // Visual feedback
    this.todayBtn.style.background = 'var(--color-success)';
    this.todayBtn.style.color = 'white';
    this.todayBtn.style.borderColor = 'var(--color-success)';
    setTimeout(() => {
      this.todayBtn.style.background = '';
      this.todayBtn.style.color = '';
      this.todayBtn.style.borderColor = '';
    }, 500);
  }

  /**
   * Setup global drag and drop functionality
   */
  setupGlobalDragAndDrop() {
    let dragCounter = 0;

    // Prevent default drag behaviors on the entire document
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Show overlay when dragging over the body
    this.appBody.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;

      // Only show overlay if dragging files
      if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        this.globalDropOverlay.style.display = 'flex';
      }
    });

    this.appBody.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;

      if (dragCounter === 0) {
        this.globalDropOverlay.style.display = 'none';
      }
    });

    // Handle drop on overlay
    this.globalDropOverlay.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      this.globalDropOverlay.style.display = 'none';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Set the files to the input
        this.imageUploadInput.files = files;
        this.handleFileSelect({ target: { files: files } });

        // Scroll to upload section
        document.getElementById('upload-section').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });

    // Hide overlay when dragging over it
    this.globalDropOverlay.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
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
    const creationDateValue = this.creationDateInput.value;

    // Convert date string to Date object for proper ISO formatting
    // HTML date input returns "YYYY-MM-DD", but API needs full datetime
    let creationDate = undefined;
    if (creationDateValue) {
      creationDate = new Date(creationDateValue + 'T00:00:00.000Z');
    }

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
      artwork_creation_time: creationDate,
      tags: [], // You could add a tags input field
      protectionOptions
    };
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    // Use the status banner element
    if (!this.statusBanner || !this.statusMessage) {
      console.warn('Status banner elements not found');
      return;
    }

    // Remove all type classes
    this.statusBanner.classList.remove('success', 'error', 'warning', 'info');

    // Add the appropriate type class
    this.statusBanner.classList.add(type);

    // Update message
    this.statusMessage.textContent = message;

    // Show banner
    this.statusBanner.style.display = 'flex';

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        this.statusBanner.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    if (this.statusBanner) {
      this.statusBanner.style.display = 'none';
    }
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
   * Display protected artwork result with comparison views
   */
  async displayResult(result) {
    this.currentResult = result;
    this.showStatus('Loading images...', 'info');

    try {
      // Download all image variants
      this.showProgress(25, 'Downloading original image...');
      this.images.original = await this.uploader.downloadVariant(result.job_id, 'original');

      this.showProgress(50, 'Downloading protected image...');
      this.images.protected = await this.uploader.downloadVariant(result.job_id, 'protected');

      this.showProgress(75, 'Downloading mask...');
      this.images.mask = await this.uploader.downloadVariant(result.job_id, 'mask');

      // Reconstruct image from CDN
      this.showProgress(90, 'Reconstructing from CDN...');
      await this.reconstructFromCDN(result);

      this.hideProgress();
      this.showStatus('All images loaded successfully!', 'success');

      // Show comparison section
      document.getElementById('comparison-section').style.display = 'block';

      // Initialize comparison controls
      this.initializeComparisonControls();

      // Display job info
      this.displayJobInfo(result);

      // Render default comparison view
      this.switchView('comparison');

    } catch (error) {
      this.hideProgress();
      this.showStatus(`Failed to load images: ${error.message}`, 'error');
      console.error('Display error:', error);
    }
  }

  /**
   * Reconstruct image from CDN (protected + mask)
   */
  async reconstructFromCDN(result) {
    try {
      // If we have backend_artwork_id, try to fetch from CDN
      const artworkId = result.backend_artwork_id;
      if (!artworkId) {
        console.warn('No backend_artwork_id, using router protected image as reconstructed');
        this.images.reconstructed = this.images.protected;
        return;
      }

      // Fetch protected image from CDN
      const cdnProtectedUrl = this.uploader.getCDNUrl(artworkId, 'protected');
      const cdnMaskUrl = this.uploader.getCDNUrl(artworkId, 'mask');

      // Try to fetch from CDN
      try {
        const cdnProtectedResponse = await fetch(cdnProtectedUrl);
        if (cdnProtectedResponse.ok) {
          const cdnProtectedBlob = await cdnProtectedResponse.blob();

          // Create a reconstructed image by applying the mask
          // For now, we'll use the CDN protected image directly
          // In a real implementation, you'd apply the mask to reconstruct the original quality
          this.images.reconstructed = cdnProtectedBlob;
          console.log('Successfully fetched from CDN:', cdnProtectedUrl);
        } else {
          console.warn('CDN not available, using router protected image');
          this.images.reconstructed = this.images.protected;
        }
      } catch (cdnError) {
        console.warn('Failed to fetch from CDN, using router image:', cdnError);
        this.images.reconstructed = this.images.protected;
      }

    } catch (error) {
      console.error('Reconstruction error:', error);
      this.images.reconstructed = this.images.protected;
    }
  }

  /**
   * Display job information
   */
  displayJobInfo(result) {
    const jobInfo = document.getElementById('job-info');
    jobInfo.innerHTML = `
      <h3 style="margin-bottom: 1rem;">Job Information</h3>
      <div style="display: grid; grid-template-columns: 150px 1fr; gap: 0.5rem;">
        <strong>Job ID:</strong> <span>${result.job_id}</span>
        <strong>Status:</strong> <span>${result.status}</span>
        <strong>Backend ID:</strong> <span>${result.backend_artwork_id || 'N/A'}</span>
        <strong>Completed:</strong> <span>${result.completed_at || 'N/A'}</span>
        <strong>Router URL:</strong> <span>${this.uploader.routerUrl}</span>
        <strong>CDN URL:</strong> <span>${this.uploader.cdnUrl}</span>
      </div>
    `;
  }

  /**
   * Switch between different views
   */
  switchView(viewType) {
    this.currentView = viewType;

    // Update active button (using new class name)
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${viewType}-btn`).classList.add('active');

    // Show/hide comparison mode selector
    document.getElementById('comparison-mode').style.display =
      viewType === 'comparison' ? 'flex' : 'none';

    // Render the view
    if (viewType === 'comparison') {
      this.renderComparisonView();
    } else {
      this.renderSingleImageView(viewType);
    }
  }

  /**
   * Render single image view
   */
  async renderSingleImageView(imageType) {
    const container = document.getElementById('image-display-container');
    const blob = this.images[imageType];

    if (!blob) {
      container.innerHTML = `<p style="text-align: center; color: red;">Image not available</p>`;
      return;
    }

    const url = URL.createObjectURL(blob);
    const title = imageType.charAt(0).toUpperCase() + imageType.slice(1);

    container.innerHTML = `
      <div style="text-align: center;">
        <h3 style="margin-bottom: 1rem;">${title} Image</h3>
        <div class="image-container">
          <img src="${url}" alt="${title}" style="max-width: 100%; border-radius: 0.5rem;">
        </div>
      </div>
    `;
  }

  /**
   * Render comparison view based on current mode
   */
  async renderComparisonView() {
    const container = document.getElementById('image-display-container');

    switch (this.comparisonMode) {
      case 'side-by-side':
        await this.renderSideBySide(container);
        break;
      case 'slider':
        await this.renderSlider(container);
        break;
      case 'overlay':
        await this.renderOverlay(container);
        break;
    }
  }

  /**
   * Render side-by-side comparison
   */
  async renderSideBySide(container) {
    const originalUrl = URL.createObjectURL(this.images.original);
    const protectedUrl = URL.createObjectURL(this.images.protected);
    const reconstructedUrl = URL.createObjectURL(this.images.reconstructed);

    container.innerHTML = `
      <div class="side-by-side-container">
        <div class="comparison-image">
          <h3>Original</h3>
          <img src="${originalUrl}" alt="Original" style="max-width: 350px; border-radius: 0.5rem;">
        </div>
        <div class="comparison-image">
          <h3>Protected</h3>
          <img src="${protectedUrl}" alt="Protected" style="max-width: 350px; border-radius: 0.5rem;">
        </div>
        <div class="comparison-image">
          <h3>Reconstructed (CDN)</h3>
          <img src="${reconstructedUrl}" alt="Reconstructed" style="max-width: 350px; border-radius: 0.5rem;">
        </div>
      </div>
    `;
  }

  /**
   * Render slider comparison
   */
  async renderSlider(container) {
    const originalUrl = URL.createObjectURL(this.images.original);
    const protectedUrl = URL.createObjectURL(this.images.protected);

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 1rem;">
        <p>Drag the slider to compare Original (left) vs Protected (right)</p>
      </div>
      <div id="slider-container" style="position: relative; max-width: 800px; margin: 0 auto; height: 600px; overflow: hidden; border-radius: 0.5rem;">
        <img id="slider-img-1" src="${protectedUrl}" alt="Protected" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;">
        <div id="slider-overlay" style="position: absolute; top: 0; left: 0; width: 50%; height: 100%; overflow: hidden;">
          <img id="slider-img-2" src="${originalUrl}" alt="Original" style="position: absolute; top: 0; left: 0; width: 800px; height: 600px; max-width: none; object-fit: contain;">
        </div>
        <div id="slider-handle" style="position: absolute; top: 0; left: 50%; width: 4px; height: 100%; background: white; cursor: ew-resize; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 10;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>
        </div>
      </div>
    `;

    // Add slider interaction
    this.initializeSlider();
  }

  /**
   * Initialize slider interaction
   */
  initializeSlider() {
    const sliderContainer = document.getElementById('slider-container');
    const sliderHandle = document.getElementById('slider-handle');
    const sliderOverlay = document.getElementById('slider-overlay');

    if (!sliderContainer || !sliderHandle || !sliderOverlay) return;

    let isDragging = false;

    const updateSlider = (e) => {
      const rect = sliderContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

      sliderHandle.style.left = `${percentage}%`;
      sliderOverlay.style.width = `${percentage}%`;
    };

    sliderHandle.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (e) => {
      if (isDragging) updateSlider(e);
    });

    sliderContainer.addEventListener('click', updateSlider);
  }

  /**
   * Render overlay comparison
   */
  async renderOverlay(container) {
    const originalUrl = URL.createObjectURL(this.images.original);
    const protectedUrl = URL.createObjectURL(this.images.protected);
    const reconstructedUrl = URL.createObjectURL(this.images.reconstructed);

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 1rem;">
        <label for="overlay-selector">Select Image:</label>
        <select id="overlay-selector" style="margin-left: 1rem; padding: 0.5rem; font-size: 1rem;">
          <option value="original">Original</option>
          <option value="protected">Protected</option>
          <option value="reconstructed">Reconstructed (CDN)</option>
        </select>
        <label for="overlay-opacity" style="margin-left: 2rem;">Opacity:</label>
        <input type="range" id="overlay-opacity" min="0" max="100" value="100" style="width: 150px; margin-left: 0.5rem;">
        <span id="overlay-opacity-value" style="margin-left: 0.5rem;">100%</span>
      </div>
      <div class="overlay-container" style="position: relative; max-width: 800px; margin: 0 auto; height: 600px;">
        <img id="overlay-base" src="${originalUrl}" alt="Base" style="width: 100%; height: 100%; object-fit: contain;">
        <img id="overlay-top" src="${protectedUrl}" alt="Overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 1;">
      </div>
    `;

    // Add overlay controls
    const selector = document.getElementById('overlay-selector');
    const opacitySlider = document.getElementById('overlay-opacity');
    const opacityValue = document.getElementById('overlay-opacity-value');
    const overlayTop = document.getElementById('overlay-top');

    const urlMap = {
      original: originalUrl,
      protected: protectedUrl,
      reconstructed: reconstructedUrl
    };

    selector.addEventListener('change', (e) => {
      overlayTop.src = urlMap[e.target.value];
    });

    opacitySlider.addEventListener('input', (e) => {
      const opacity = e.target.value / 100;
      opacityValue.textContent = `${e.target.value}%`;
      overlayTop.style.opacity = opacity;
    });
  }

  /**
   * Download image variant
   */
  async downloadImage(variant) {
    try {
      const blob = this.images[variant];
      if (!blob) {
        this.showStatus(`${variant} image not available`, 'error');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const extension = variant === 'mask' ? '.sac' : '.jpg';
      a.download = `${variant}_${this.currentResult.job_id}${extension}`;

      a.click();
      URL.revokeObjectURL(url);

      // Add success class to download button temporarily
      const button = document.getElementById(`download-${variant}-btn`);
      if (button) {
        button.classList.add('success');
        setTimeout(() => button.classList.remove('success'), 2000);
      }

      this.showStatus(`Downloaded ${variant} image`, 'success');
    } catch (error) {
      this.showStatus(`Failed to download ${variant}: ${error.message}`, 'error');
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    // Validate form
    const validation = this.validateForm();
    if (!validation.valid) {
      this.showStatus(validation.errors.join('. '), 'error');
      return;
    }

    // Disable button and add loading state
    this.generateButton.disabled = true;
    this.generateButton.classList.add('loading');

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

        this.generateButton.disabled = false;
        this.generateButton.classList.remove('loading');
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
        this.generateButton.disabled = false;
        this.generateButton.classList.remove('loading');
        return;
      }

      // Display result
      await this.displayResult(result);

    } catch (error) {
      console.error('Submission error:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
      this.hideProgress();
    } finally {
      this.generateButton.disabled = false;
      this.generateButton.classList.remove('loading');
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new ArtorizeDashboard();
  console.log('Artorize Dashboard initialized');
});
