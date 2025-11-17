/**
 * Process History Manager
 *
 * Handles localStorage persistence for previous protection processes
 */
class ProcessHistoryManager {
  constructor() {
    this.storageKey = 'artorize_process_history';
    this.maxHistoryItems = 50; // Limit history to 50 items
  }

  /**
   * Save a new process to history
   * @param {Object} processData - Process data to save
   * @returns {string} Process ID
   */
  saveProcess(processData) {
    const processes = this.getAllProcesses();
    const processId = Date.now().toString();

    const newProcess = {
      id: processId,
      filename: processData.filename,
      date: new Date().toISOString(),
      config: processData.config,
      metadata: processData.metadata,
      results: processData.results,
      jobInfo: processData.jobInfo,
      timestamp: processId
    };

    // Add to beginning of array
    processes.unshift(newProcess);

    // Limit history size
    if (processes.length > this.maxHistoryItems) {
      processes.splice(this.maxHistoryItems);
    }

    // Save to localStorage
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(processes));
      return processId;
    } catch (error) {
      console.error('Failed to save process to localStorage:', error);
      return null;
    }
  }

  /**
   * Load a specific process by ID
   * @param {string} processId - ID of process to load
   * @returns {Object|null} Process data or null if not found
   */
  loadProcess(processId) {
    const processes = this.getAllProcesses();
    return processes.find(p => p.id === processId) || null;
  }

  /**
   * Get all processes from history
   * @returns {Array} Array of process objects
   */
  getAllProcesses() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load processes from localStorage:', error);
      return [];
    }
  }

  /**
   * Delete a specific process
   * @param {string} processId - ID of process to delete
   * @returns {boolean} Success status
   */
  deleteProcess(processId) {
    const processes = this.getAllProcesses();
    const filteredProcesses = processes.filter(p => p.id !== processId);

    if (filteredProcesses.length === processes.length) {
      return false; // Process not found
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filteredProcesses));
      return true;
    } catch (error) {
      console.error('Failed to delete process from localStorage:', error);
      return false;
    }
  }

  /**
   * Clear all history
   * @returns {boolean} Success status
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * Format date for display
   * @param {string} isoDate - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }
}

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
    this.currentProcessId = null; // Currently loaded process ID

    // History manager
    this.historyManager = new ProcessHistoryManager();

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

    // Step timing tracking
    this.stepStartTimes = {};
    this.stepElapsedTimes = {};
    this.timerInterval = null;

    // Store the submitted processor config for progress tracking
    this.submittedProcessorConfig = null;

    // Sequential step processing
    this.currentProcessingStep = 0;
    this.totalProcessingSteps = 0;
    this.stepProcessingInterval = null;

    this.initializeElements();
    this.attachEventListeners();
    this.initializeProgressSection();
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
    this.uploadZoneStandalone = document.getElementById('upload-zone-standalone');
    this.uploadLabel = document.querySelector('.upload-label');
    this.imagePreview = document.getElementById('image-preview');
    this.previewImage = document.getElementById('preview-image');
    this.removeImageBtn = document.getElementById('remove-image');

    // Layout sections
    this.uploadSectionInitialCenter = document.getElementById('upload-section-initial-center');
    this.dashboardContentSplit = document.getElementById('dashboard-content-split');

    // Status banner
    this.statusBanner = document.getElementById('status-banner');
    this.statusMessage = document.getElementById('status-message');

    // Today button
    this.todayBtn = document.getElementById('today-btn');

    // Global drop overlay
    this.globalDropOverlay = document.getElementById('global-drop-overlay');
    this.appBody = document.getElementById('app-body');

    // Dashboard header for scroll effect
    this.dashboardHeader = document.querySelector('.dashboard-header');

    // CTA container for scroll effect
    this.ctaContainer = document.querySelector('.cta-container');

    // Main sections for scroll effect
    this.sections = document.querySelectorAll('.section');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // File selection
    this.imageUploadInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Generate button
    this.generateButton.addEventListener('click', () => this.handleSubmit());

    // Remove image button (old preview mode)
    if (this.removeImageBtn) {
      this.removeImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearImagePreview();
      });
    }

    // Change image button (new layout)
    const changeFileBtn = document.getElementById('change-file-btn');
    if (changeFileBtn) {
      changeFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearImagePreview();
      });
    }

    // Today button
    if (this.todayBtn) {
      this.todayBtn.addEventListener('click', () => this.setTodayDate());
    }

    // Global drag and drop - anywhere on page
    this.setupGlobalDragAndDrop();

    // Make config-option divs clickable
    this.setupClickableConfigOptions();

    // Header scroll effect
    this.setupHeaderScrollEffect();

    // Sidebar toggle buttons
    this.setupSidebarToggle();

    // Drag and drop functionality for upload zone (standalone)
    if (this.uploadZoneStandalone) {
      this.uploadZoneStandalone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.uploadZoneStandalone.classList.add('drag-over');
      });

      this.uploadZoneStandalone.addEventListener('dragleave', () => {
        this.uploadZoneStandalone.classList.remove('drag-over');
      });

      this.uploadZoneStandalone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.uploadZoneStandalone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.imageUploadInput.files = files;
          this.handleFileSelect({ target: { files: files } });
        }
      });
    }

    // Drag and drop functionality for upload zone (in sidebar)
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

    // Protect New button
    const protectNewBtn = document.getElementById('protect-new-btn');
    if (protectNewBtn) {
      protectNewBtn.addEventListener('click', () => this.handleProtectNew());
    }

    // Render process list on page load
    this.renderProcessList();
  }

  /**
   * Setup sidebar toggle functionality
   */
  setupSidebarToggle() {
    // Sidebar toggle button (in left panel)
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    // Collapsed sidebar toggle button (in collapsed column)
    const collapsedSidebarToggleBtn = document.getElementById('collapsed-sidebar-toggle-btn');
    if (collapsedSidebarToggleBtn) {
      collapsedSidebarToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    // Restore sidebar state from localStorage
    const sidebarHidden = localStorage.getItem('sidebar_hidden') === 'true';
    if (sidebarHidden) {
      const wrapper = document.querySelector('.dashboard-wrapper');
      if (wrapper) {
        wrapper.classList.add('sidebar-hidden');
      }
    }
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
   * Show image preview - Collapsed mode in left sidebar
   */
  showImagePreview(file) {
    // Hide initial upload section
    const uploadSectionInitial = document.getElementById('upload-section-initial');
    if (uploadSectionInitial) {
      uploadSectionInitial.style.display = 'none';
    }

    // Show uploaded section with filename
    const uploadSectionUploaded = document.getElementById('upload-section-uploaded');
    const uploadedFilename = document.getElementById('uploaded-filename');
    if (uploadSectionUploaded && uploadedFilename) {
      uploadedFilename.textContent = file.name;
      uploadSectionUploaded.style.display = 'block';
      uploadSectionUploaded.classList.add('fadeInUp');
    }

    // Show initial progress tracker with all pending steps
    this.showInitialProgressTracker();

    // Add listeners to rebuild tracker when config changes
    this.setupConfigChangeListeners();

    // Switch to progress tab to show the tracker
    const progressTabButton = document.querySelector('[data-tab="progress"]');
    if (progressTabButton) {
      progressTabButton.click();
    }
  }

  /**
   * Clear image preview
   */
  clearImagePreview() {
    this.selectedFile = null;
    this.imageUploadInput.value = '';
    this.currentJobId = null;

    // Show initial upload section
    const uploadSectionInitial = document.getElementById('upload-section-initial');
    if (uploadSectionInitial) {
      uploadSectionInitial.style.display = 'block';
      uploadSectionInitial.classList.add('fadeInUp');
    }

    // Hide uploaded section
    const uploadSectionUploaded = document.getElementById('upload-section-uploaded');
    if (uploadSectionUploaded) {
      uploadSectionUploaded.style.display = 'none';
    }

    // Hide progress tracker
    this.hideProgressTracker();

    // Switch back to configuration tab
    const configTabButton = document.querySelector('[data-tab="configuration"]');
    if (configTabButton) {
      configTabButton.click();
    }
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
    document.body.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;

      // Only show overlay if dragging files
      if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        this.globalDropOverlay.classList.add('flex');
      }
    });

    document.body.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;

      if (dragCounter === 0) {
        this.globalDropOverlay.classList.remove('flex');
      }
    });

    // Handle drop on overlay
    this.globalDropOverlay.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      this.globalDropOverlay.classList.remove('flex');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Set the files to the input
        this.imageUploadInput.files = files;
        this.handleFileSelect({ target: { files: files } });
      }
    });

    // Hide overlay when dragging over it
    this.globalDropOverlay.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  /**
   * Setup clickable config options
   */
  setupClickableConfigOptions() {
    const configOptions = document.querySelectorAll('.config-option');

    configOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        // Don't toggle if clicking on:
        // - the info button
        // - the checkbox itself (it handles its own toggle)
        // - the label or its children (label handles the toggle via 'for' attribute)
        if (e.target.closest('.info-btn') ||
            e.target.classList.contains('option-checkbox') ||
            e.target.closest('.option-label')) {
          return;
        }

        // Find the checkbox within this config option
        const checkbox = option.querySelector('.option-checkbox');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;

          // Trigger a change event in case there are listeners
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  /**
   * Setup header scroll slide-up effect - Simplified for new layout
   */
  setupHeaderScrollEffect() {
    if (!this.dashboardHeader) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const maxScroll = 150;

      // Header: subtle fade on scroll
      const headerProgress = Math.min(scrollY / maxScroll, 1);
      const headerOpacity = 1 - (headerProgress * 0.3); // Fade slightly

      this.dashboardHeader.style.opacity = headerOpacity;
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
   * Build processing steps from current form configuration
   * @param {Object} config - Optional processor configuration from API (if available)
   * @returns {Array} Array of step objects
   */
  buildProcessingSteps(config = null) {
    const steps = [];

    // If config is provided (from API), use it
    if (config) {
      // Add enabled processors
      if (config.processors && config.processors.length > 0) {
        config.processors.forEach(processor => {
          steps.push({
            id: `processor-${processor}`,
            title: `Processing ${processor}`,
            type: 'processor',
            processor: processor
          });
        });
      }

      // Add protection layers from API config
      if (config.protection_layers) {
        Object.entries(config.protection_layers).forEach(([layer, enabled]) => {
          if (enabled) {
            const layerNames = {
              fawkes: 'Fawkes Protection',
              photoguard: 'PhotoGuard Protection',
              mist: 'MIST Protection',
              nightshade: 'Nightshade Protection',
              stegano_embed: 'Steganography Embedding',
              c2pa_manifest: 'C2PA Manifest'
            };
            steps.push({
              id: `layer-${layer}`,
              title: `Applying ${layerNames[layer] || layer}`,
              type: 'protection',
              layer: layer
            });
          }
        });
      }

      // Add watermark step if configured
      if (config.watermark_strategy && config.watermark_strategy !== 'none') {
        const strategyNames = {
          'invisible-watermark': 'Invisible Watermark',
          'tree-ring': 'Tree Ring Watermark',
          'visible-watermark': 'Visible Watermark'
        };
        steps.push({
          id: 'watermark',
          title: `Applying ${strategyNames[config.watermark_strategy] || config.watermark_strategy}`,
          type: 'watermark',
          strategy: config.watermark_strategy
        });
      }
    } else {
      // Build from current form state (before submission)
      const layerNames = {
        fawkes: 'Fawkes Protection',
        photoguard: 'PhotoGuard Protection',
        mist: 'MIST Protection',
        nightshade: 'Nightshade Protection',
        c2pa_manifest: 'C2PA Manifest'
      };

      // Check each protection option checkbox
      if (this.enableFawkesCheckbox?.checked) {
        steps.push({
          id: 'layer-fawkes',
          title: `Applying ${layerNames.fawkes}`,
          type: 'protection',
          layer: 'fawkes'
        });
      }

      if (this.enablePhotoguardCheckbox?.checked) {
        steps.push({
          id: 'layer-photoguard',
          title: `Applying ${layerNames.photoguard}`,
          type: 'protection',
          layer: 'photoguard'
        });
      }

      if (this.enableMistCheckbox?.checked) {
        steps.push({
          id: 'layer-mist',
          title: `Applying ${layerNames.mist}`,
          type: 'protection',
          layer: 'mist'
        });
      }

      if (this.enableNightshadeCheckbox?.checked) {
        steps.push({
          id: 'layer-nightshade',
          title: `Applying ${layerNames.nightshade}`,
          type: 'protection',
          layer: 'nightshade'
        });
      }

      if (this.enableC2paCheckbox?.checked) {
        steps.push({
          id: 'layer-c2pa_manifest',
          title: `Applying ${layerNames.c2pa_manifest}`,
          type: 'protection',
          layer: 'c2pa_manifest'
        });
      }

      // Add watermark step
      const watermarkStrategy = this.watermarkStrategySelect?.value || 'invisible-watermark';
      if (watermarkStrategy && watermarkStrategy !== 'none') {
        const strategyNames = {
          'invisible-watermark': 'Invisible Watermark',
          'tree-ring': 'Tree Ring Watermark',
          'visible-watermark': 'Visible Watermark'
        };
        steps.push({
          id: 'watermark',
          title: `Applying ${strategyNames[watermarkStrategy] || watermarkStrategy}`,
          type: 'watermark',
          strategy: watermarkStrategy
        });
      }
    }

    // Add final upload step
    steps.push({
      id: 'upload',
      title: 'Uploading results to backend',
      type: 'upload'
    });

    return steps;
  }

  /**
   * Show progress tracker with GitHub Actions inspired styling
   *
   * Progress tracking logic based on step_number from callback:
   * - Steps BEFORE current step_number → marked as "completed" (green checkmark)
   * - Step AT current step_number → marked as "processing" (spinning icon)
   * - Steps AFTER current step_number → marked as "pending" (empty circle)
   *
   * Example: If step_number = 3, total_steps = 5:
   *   Step 1: completed ✓
   *   Step 2: completed ✓
   *   Step 3: processing ⟳
   *   Step 4: pending ○
   *   Step 5: pending ○
   *
   * @param {Object} statusData - Job status data from API
   * @param {Object} statusData.progress - Progress information
   * @param {number} statusData.progress.step_number - Current step number (1-based)
   * @param {number} statusData.progress.total_steps - Total number of steps
   * @param {string} statusData.progress.current_step - Description of current step
   * @param {number} statusData.progress.percentage - Overall progress (0-100)
   * @param {Object} statusData.progress.details - Additional step details
   */
  showProgressTracker(statusData) {
    console.log('[Progress Tracker] Called with statusData:', statusData);

    const progressSection = document.getElementById('progress-section');
    if (progressSection && progressSection.style.display === 'none') {
      progressSection.style.display = 'block';
      progressSection.style.animation = 'fadeInUp 0.3s ease-out';
    }

    const progressContainer = document.getElementById('progress-tracker-content');
    if (!progressContainer) {
      console.warn('Progress tracker content container not found');
      return;
    }

    const toStepKey = (value) => {
      if (value === undefined || value === null) return null;
      return String(value);
    };

    // Build steps from processor_config or fall back to current form configuration
    let steps = [];
    if (statusData.processor_config) {
      console.log('[Progress Tracker] Building steps from processor_config:', statusData.processor_config);
      steps = this.buildProcessingSteps(statusData.processor_config);
    } else {
      console.log('[Progress Tracker] No processor_config, building from form state');
      // Fallback to building from current form state
      steps = this.buildProcessingSteps();
    }

    console.log('[Progress Tracker] Built steps:', steps);

    // If still no steps, we can't show progress
    if (steps.length === 0) {
      console.warn('[Progress Tracker] No steps available to show progress');
      return;
    }

    const progress = statusData.progress || {};
    const currentStepNumber = progress.step_number || 0;
    const totalSteps = progress.total_steps || steps.length;
    const currentStepDescription = progress.current_step || '';
    const jobStatus = statusData.status || '';

    // Log progress for debugging
    console.log('Progress update:', {
      currentStepNumber,
      totalSteps,
      currentStepDescription,
      percentage: progress.percentage,
      details: progress.details,
      jobStatus
    });

    const completedSteps = new Set();
    const explicitStateById = {};
    const detailsByStep = {};

    if (progress.step_details) {
      Object.entries(progress.step_details).forEach(([key, value]) => {
        detailsByStep[toStepKey(key)] = value;
      });
    }

    (progress.completed_steps || []).forEach((id) => {
      const key = toStepKey(id);
      if (key) completedSteps.add(key);
    });

    (progress.completed_step_ids || []).forEach((id) => {
      const key = toStepKey(id);
      if (key) completedSteps.add(key);
    });

    const normalizeState = (value) => {
      if (!value || typeof value !== 'string') return null;
      const normalized = value.toLowerCase();
      if (normalized.includes('complete')) return 'completed';
      if (normalized.includes('process') || normalized.includes('run') || normalized.includes('active')) {
        return 'processing';
      }
      if (normalized.includes('pending') || normalized.includes('queue')) return 'pending';
      return null;
    };

    if (Array.isArray(progress.steps)) {
      progress.steps.forEach((stepState) => {
        if (!stepState) return;
        const stepKey = toStepKey(stepState.id || stepState.step_id || stepState.step || stepState.name);
        if (!stepKey) return;
        const normalized = normalizeState(stepState.state || stepState.status);
        if (normalized) {
          explicitStateById[stepKey] = normalized;
          if (normalized === 'completed') {
            completedSteps.add(stepKey);
          }
        }
        if (!detailsByStep[stepKey] && stepState.details) {
          detailsByStep[stepKey] = stepState.details;
        }
      });
    }

    const activeStepId =
      toStepKey(progress.current_step_id || progress.current_step) ||
      (steps[currentStepNumber - 1]?.id ? toStepKey(steps[currentStepNumber - 1].id) : null);

    const formatDetails = (detail) => {
      if (!detail) return '';
      return typeof detail === 'string' ? detail : this.formatProgressDetails(detail);
    };

    const stepsHtml = steps.length > 0
      ? steps.map((step, index) => {
        const stepNumber = index + 1;
        const safeId = step.id || `step-${index}`;
        const stepKey = toStepKey(safeId);
        let state = 'pending';

        // Determine state based on job status and step_number (sequential processing)
        if (jobStatus === 'completed' || currentStepNumber >= 999) {
          // Job is complete, mark all steps as completed
          state = 'completed';
        } else if (currentStepNumber > 0) {
          // Sequential step processing
          if (stepNumber < currentStepNumber) {
            // Steps before current step are completed (green checkmark)
            state = 'completed';
          } else if (stepNumber === currentStepNumber) {
            // Current step is processing (orange spinner)
            state = 'processing';
          } else {
            // Steps after current step are pending (gray circle)
            state = 'pending';
          }
        }

        // Override with explicit state if provided (for edge cases)
        if (completedSteps.has(stepKey)) {
          state = 'completed';
        } else if (explicitStateById[stepKey]) {
          state = explicitStateById[stepKey];
        } else if (activeStepId && stepKey === activeStepId) {
          state = 'processing';
        }

        // Get details for the current processing step
        const detailSource =
          detailsByStep[stepKey] || (state === 'processing' ? progress.details : null);
        const details = formatDetails(detailSource);
        const indicatorIcon = this.renderProgressIndicator(state);

        // Track step timing
        if (state === 'processing') {
          this.startStepTimer(safeId);
        } else if (state === 'completed') {
          this.completeStep(safeId);
        }

        // Get elapsed time for display
        let elapsedTimeDisplay = '';
        if (state === 'processing' && this.stepStartTimes[safeId]) {
          const elapsed = Date.now() - this.stepStartTimes[safeId];
          elapsedTimeDisplay = this.formatElapsedTime(elapsed);
        } else if (state === 'completed' && this.stepElapsedTimes[safeId]) {
          elapsedTimeDisplay = this.formatElapsedTime(this.stepElapsedTimes[safeId]);
        }

        console.log(`[Progress Tracker] Step "${step.title}" (${safeId}): state=${state}, elapsed=${elapsedTimeDisplay}`);

        return `
            <li class="progress-step ${state}" data-step-id="${safeId}">
              <div class="progress-step-indicator" aria-hidden="true">
                ${indicatorIcon}
              </div>
              <div class="progress-step-content">
                <div class="progress-step-header">
                  <div class="progress-step-title">${step.title}</div>
                  ${elapsedTimeDisplay ? `<div class="progress-step-elapsed">${elapsedTimeDisplay}</div>` : ''}
                </div>
                ${details ? `<div class="progress-step-details">${details}</div>` : ''}
              </div>
            </li>
          `;
        }).join('')
      : `
        <li class="progress-step empty-state">
          <div class="progress-step-content">
            <div class="progress-step-title">Awaiting processor updates...</div>
            <div class="progress-step-details">We'll refresh this list as soon as the job reports its stages.</div>
          </div>
        </li>
      `;

    progressContainer.innerHTML = `
      <ul class="progress-steps">
        ${stepsHtml}
      </ul>
    `;
  }

  /**
   * Show initial progress tracker with all pending steps (after file upload, before processing)
   */
  showInitialProgressTracker() {
    // Show progress section in left sidebar
    const progressSection = document.getElementById('progress-section');
    if (progressSection) {
      progressSection.style.display = 'block';
      progressSection.style.animation = 'fadeInUp 0.3s ease-out';
    }

    // Get the progress content container
    let progressContainer = document.getElementById('progress-tracker-content');

    if (!progressContainer) {
      console.warn('Progress tracker content container not found');
      return;
    }

    // Build steps from current form configuration (all pending)
    const steps = this.buildProcessingSteps();

    const stepsHtml = steps.length > 0
      ? steps.map((step, index) => {
        const safeId = step.id || `step-${index}`;
        return `
          <li class="progress-step pending" data-step-id="${safeId}">
            <div class="progress-step-indicator" aria-hidden="true">
              ${this.renderProgressIndicator('pending')}
            </div>
            <div class="progress-step-content">
              <div class="progress-step-header">
                <div class="progress-step-title">${step.title}</div>
              </div>
            </div>
          </li>
        `;
      }).join('')
      : `
        <li class="progress-step empty-state">
          <div class="progress-step-content">
            <div class="progress-step-title">No processors selected</div>
            <div class="progress-step-details">Toggle a protection layer to build the workflow.</div>
          </div>
        </li>
      `;

    progressContainer.innerHTML = `
      <ul class="progress-steps">
        ${stepsHtml}
      </ul>
    `;
  }

  /**
   * Render SVG indicator per state (GitHub-style icons)
   * @param {'pending'|'processing'|'completed'} state
   * @returns {string}
   */
  renderProgressIndicator(state) {
    if (state === 'completed') {
      return `
        <svg class="progress-icon octicon-check-circle-fill" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="completed">
          <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z" fill="currentColor"></path>
        </svg>
      `;
    }

    if (state === 'processing') {
      return `
        <svg class="progress-icon progress-spinner" width="16" height="16" fill="none" viewBox="0 0 16 16" role="img" aria-label="processing">
          <path opacity=".5" d="M8 15A7 7 0 108 1a7 7 0 000 14v0z" stroke="currentColor" stroke-width="2"></path>
          <path d="M15 8a7 7 0 01-7 7" stroke="currentColor" stroke-width="2"></path>
          <path d="M8 12a4 4 0 100-8 4 4 0 000 8z" fill="currentColor"></path>
        </svg>
      `;
    }

    return `
      <svg class="progress-icon octicon-circle" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="pending">
        <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z" fill="currentColor"></path>
      </svg>
    `;
  }

  /**
   * Setup listeners on config checkboxes to rebuild step list
   */
  setupConfigChangeListeners() {
    // Only setup once
    if (this._configListenersSetup) return;
    this._configListenersSetup = true;

    const checkboxes = [
      this.enableFawkesCheckbox,
      this.enablePhotoguardCheckbox,
      this.enableMistCheckbox,
      this.enableNightshadeCheckbox,
      this.enableC2paCheckbox
    ];

    const rebuildSteps = () => {
      // Only rebuild if we haven't started processing yet
      if (!this.currentJobId) {
        this.showInitialProgressTracker();
      }
    };

    checkboxes.forEach(checkbox => {
      if (checkbox) {
        checkbox.addEventListener('change', rebuildSteps);
      }
    });

    if (this.watermarkStrategySelect) {
      this.watermarkStrategySelect.addEventListener('change', rebuildSteps);
    }
  }

  /**
   * Format progress details for display
   * @param {Object} details - Progress details object
   * @returns {string} Formatted details string
   */
  formatProgressDetails(details) {
    const parts = [];

    if (details.processor) {
      parts.push(`Processor: ${details.processor}`);
    }
    if (details.hash_type) {
      parts.push(`Hash type: ${details.hash_type}`);
    }
    if (details.protection_layer) {
      parts.push(`Layer: ${details.protection_layer}`);
    }
    if (details.watermark_strategy) {
      parts.push(`Strategy: ${details.watermark_strategy}`);
    }
    if (details.operation) {
      parts.push(`Operation: ${details.operation}`);
    }

    return parts.join(' • ');
  }

  /**
   * Hide progress tracker
   */
  hideProgressTracker() {
    const progressSection = document.getElementById('progress-section');
    if (progressSection) {
      progressSection.style.display = 'none';
    }

    // Stop timer
    this.stopTimer();

    // Stop sequential processing
    if (this.stepProcessingInterval) {
      clearInterval(this.stepProcessingInterval);
      this.stepProcessingInterval = null;
    }

    // Reset sequential state
    this.currentProcessingStep = 0;
    this.totalProcessingSteps = 0;

    // Also clear the content
    const progressContainer = document.getElementById('progress-tracker-content');
    if (progressContainer) {
      progressContainer.innerHTML = '';
    }
  }

  /**
   * Initialize progress section to be visible by default
   */
  initializeProgressSection() {
    const progressSection = document.getElementById('progress-section');
    if (progressSection) {
      progressSection.style.display = 'block';
    }

    // Show initial steps based on configuration
    this.showInitialProgressTracker();

    // Set up listeners to update when checkboxes change
    this.setupConfigChangeListeners();
  }

  /**
   * Start tracking time for a step
   */
  startStepTimer(stepId) {
    if (!this.stepStartTimes[stepId]) {
      this.stepStartTimes[stepId] = Date.now();
    }

    // Start the update interval if not already running
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => this.updateStepTimers(), 1000);
    }
  }

  /**
   * Stop the timer interval
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Update all step timers in the UI
   */
  updateStepTimers() {
    Object.keys(this.stepStartTimes).forEach(stepId => {
      const elapsed = Date.now() - this.stepStartTimes[stepId];
      const elapsedElement = document.querySelector(`[data-step-id="${stepId}"] .progress-step-elapsed`);
      if (elapsedElement) {
        elapsedElement.textContent = this.formatElapsedTime(elapsed);
      }
    });
  }

  /**
   * Format elapsed time in seconds
   */
  formatElapsedTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Complete a step and record its final time
   */
  completeStep(stepId) {
    if (this.stepStartTimes[stepId]) {
      const elapsed = Date.now() - this.stepStartTimes[stepId];
      this.stepElapsedTimes[stepId] = elapsed;
      delete this.stepStartTimes[stepId];
    }
  }

  /**
   * Start sequential step processing simulation
   */
  startSequentialProcessing(totalSteps) {
    console.log('[Sequential] Starting sequential processing with', totalSteps, 'steps');

    this.currentProcessingStep = 0;
    this.totalProcessingSteps = totalSteps;

    // Clear existing timing data
    this.stepStartTimes = {};
    this.stepElapsedTimes = {};

    // Clear any existing interval
    if (this.stepProcessingInterval) {
      clearInterval(this.stepProcessingInterval);
    }

    // Advance to first step immediately
    this.currentProcessingStep = 1;
    this.updateProgressDisplay();
  }

  /**
   * Advance to next step in sequence
   */
  advanceToNextStep() {
    if (this.currentProcessingStep < this.totalProcessingSteps) {
      this.currentProcessingStep++;
      this.updateProgressDisplay();
      console.log('[Sequential] Advanced to step', this.currentProcessingStep, 'of', this.totalProcessingSteps);

      // If we've reached the last step, stop the interval and keep it spinning
      // until the actual job completes
      if (this.currentProcessingStep >= this.totalProcessingSteps) {
        if (this.stepProcessingInterval) {
          clearInterval(this.stepProcessingInterval);
          this.stepProcessingInterval = null;
        }
      }
    }
  }

  /**
   * Mark all steps as complete
   */
  completeAllSteps() {
    console.log('[Sequential] Completing all steps');
    this.currentProcessingStep = 999; // Special value for "all complete"
    this.updateProgressDisplay();

    // Stop the interval
    if (this.stepProcessingInterval) {
      clearInterval(this.stepProcessingInterval);
      this.stepProcessingInterval = null;
    }
  }

  /**
   * Update progress display based on current step
   */
  updateProgressDisplay() {
    if (this.submittedProcessorConfig) {
      this.showProgressTracker({
        processor_config: this.submittedProcessorConfig,
        progress: {
          step_number: this.currentProcessingStep,
          total_steps: this.totalProcessingSteps,
          current_step: 'Processing',
          percentage: (this.currentProcessingStep / this.totalProcessingSteps) * 100
        },
        status: this.currentProcessingStep >= 999 ? 'completed' : 'processing'
      });
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
      this.showStatus('Downloading original image...', 'info');
      this.images.original = await this.uploader.downloadVariant(result.job_id, 'original');

      this.showStatus('Downloading protected image...', 'info');
      this.images.protected = await this.uploader.downloadVariant(result.job_id, 'protected');

      this.showStatus('Downloading protection mask...', 'info');
      this.images.mask = await this.uploader.downloadVariant(result.job_id, 'mask');

      // Reconstruct image from CDN
      this.showStatus('Reconstructing preview from CDN...', 'info');
      await this.reconstructFromCDN(result);

      // Keep progress tracker visible to show completed steps
      // this.hideProgressTracker(); // Commented out to keep checkmarks visible
      this.showStatus('All images loaded successfully!', 'success');

      // Save the completed process to history
      this.saveCurrentProcess();

      // Show comparison section
      const comparisonSection = document.getElementById('comparison-section');
      comparisonSection.style.display = 'block';

      // Smooth scroll to results section with offset for better visibility
      setTimeout(() => {
        comparisonSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300); // Small delay to ensure section is rendered

      // Initialize comparison controls
      this.initializeComparisonControls();

      // Display job info
      this.displayJobInfo(result);

      // Render default comparison view
      this.switchView('comparison');

    } catch (error) {
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

      // Store the processor config for progress tracking
      this.submittedProcessorConfig = {
        protection_layers: {
          fawkes: formData.protectionOptions.enable_fawkes,
          photoguard: formData.protectionOptions.enable_photoguard,
          mist: formData.protectionOptions.enable_mist,
          nightshade: formData.protectionOptions.enable_nightshade,
          c2pa_manifest: formData.protectionOptions.enable_c2pa_manifest
        },
        watermark_strategy: formData.protectionOptions.watermark_strategy
      };

      console.log('[Dashboard] Stored processor config:', this.submittedProcessorConfig);

      // Submit artwork
      this.showStatus('Preparing upload...', 'info');

      const submitResult = await this.uploader.submitArtwork(formData, (percent) => {
        if (typeof percent === 'number' && !Number.isNaN(percent)) {
          const rounded = Math.max(0, Math.min(100, Math.round(percent)));
          this.showStatus(`Uploading artwork... ${rounded}%`, 'info');
        } else {
          this.showStatus('Uploading artwork...', 'info');
        }
      });

      this.currentJobId = submitResult.job_id;

      // Check if already exists
      if (submitResult.status === 'exists') {
        this.showStatus('Artwork already exists in the system', 'warning');

        // You could display the existing artwork here
        console.log('Existing artwork:', submitResult.artwork);

        this.generateButton.disabled = false;
        this.generateButton.classList.remove('loading');
        return;
      }

      // Count total steps
      const steps = this.buildProcessingSteps(this.submittedProcessorConfig);
      const totalSteps = steps.length;

      // Start sequential step processing
      this.startSequentialProcessing(totalSteps);

      // Create a timer to advance through steps sequentially
      // Each step takes ~400ms to "complete" for a nice sequential animation
      this.stepProcessingInterval = setInterval(() => {
        this.advanceToNextStep();
      }, 400);

      // Poll for completion
      this.showStatus('Processing your artwork with protection layers...', 'info');

      const result = await this.uploader.pollJobUntilComplete(
        this.currentJobId,
        (status) => {
          console.log('Status update:', status);

          // When job completes, mark all steps as complete
          if (status.status === 'completed') {
            this.completeAllSteps();
          }

          // Update status message
          const progress = status.progress || {};
          const currentStep = progress.current_step || status.status || 'Processing';
          const stepNumber = progress.step_number || 0;
          const totalSteps = progress.total_steps || 0;
          const percentage = progress.percentage || 0;

          // Build status message
          let statusMessage = currentStep;
          if (stepNumber > 0 && totalSteps > 0) {
            statusMessage += ` (Step ${stepNumber}/${totalSteps})`;
          }
          if (percentage > 0 && percentage < 100) {
            statusMessage += ` - ${Math.round(percentage)}%`;
          }

          this.showStatus(statusMessage, 'info');
        }
      );

      // Keep progress tracker visible to show completed steps
      // this.hideProgressTracker(); // Commented out to keep checkmarks visible

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
      this.hideProgressTracker();
    } finally {
      this.generateButton.disabled = false;
      this.generateButton.classList.remove('loading');
    }
  }

  /**
   * Render the list of previous processes in the left panel
   */
  renderProcessList() {
    const processList = document.getElementById('process-list');
    if (!processList) return;

    const processes = this.historyManager.getAllProcesses();

    if (processes.length === 0) {
      processList.innerHTML = '<div class="process-list-empty">No previous processes yet</div>';
      return;
    }

    processList.innerHTML = processes.map((process, index) => `
      <div class="process-item ${this.currentProcessId === process.id ? 'active' : ''}"
           data-process-id="${process.id}"
           style="animation-delay: ${index * 0.05}s">
        <svg class="process-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <div class="process-item-content">
          <div class="process-item-name">${this.escapeHtml(process.filename)}</div>
          <div class="process-item-date">${this.historyManager.formatDate(process.date)}</div>
        </div>
        <div class="process-item-delete" data-delete-id="${process.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
      </div>
    `).join('');

    // Attach event listeners to process items
    processList.querySelectorAll('.process-item').forEach(item => {
      const processId = item.dataset.processId;
      const deleteBtn = item.querySelector('.process-item-delete');

      // Click on item to load process
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.closest('.process-item-delete')) return;
        this.handleProcessClick(processId);
      });

      // Click on delete button
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleProcessDelete(processId, e);
        });
      }
    });
  }

  /**
   * Handle "Protect New" button click - reset to fresh state
   */
  handleProtectNew() {
    // Reset current process ID
    this.currentProcessId = null;

    // Clear file selection
    this.clearImagePreview();

    // Reset all form fields
    document.getElementById('enable-fawkes').checked = false;
    document.getElementById('enable-photoguard').checked = false;
    document.getElementById('enable-mist').checked = false;
    document.getElementById('enable-nightshade').checked = false;
    document.getElementById('enable-c2pa-manifest').checked = false;
    document.getElementById('watermark-strategy').value = 'invisible-watermark';
    document.getElementById('author-name').value = '';
    document.getElementById('creation-date').value = '';
    document.getElementById('description').value = '';

    // Hide results section
    document.getElementById('comparison-section').style.display = 'none';

    // Hide progress tracker
    this.hideProgressTracker();

    // Hide status banner
    document.getElementById('status-banner').style.display = 'none';

    // Scroll to top of center panel
    document.querySelector('.center-panel')?.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-render process list to clear active state
    this.renderProcessList();

    console.log('Reset to fresh state for new protection');
  }

  /**
   * Handle click on a process item - load process details
   */
  handleProcessClick(processId) {
    const process = this.historyManager.loadProcess(processId);
    if (!process) {
      this.showStatus('Failed to load process', 'error');
      return;
    }

    this.currentProcessId = processId;

    // Populate configuration
    document.getElementById('enable-fawkes').checked = process.config.enableFawkes || false;
    document.getElementById('enable-photoguard').checked = process.config.enablePhotoguard || false;
    document.getElementById('enable-mist').checked = process.config.enableMist || false;
    document.getElementById('enable-nightshade').checked = process.config.enableNightshade || false;
    document.getElementById('enable-c2pa-manifest').checked = process.config.enableC2paManifest || false;
    document.getElementById('watermark-strategy').value = process.config.watermarkStrategy || 'invisible-watermark';

    // Populate metadata
    document.getElementById('author-name').value = process.metadata.authorName || '';
    document.getElementById('creation-date').value = process.metadata.creationDate || '';
    document.getElementById('description').value = process.metadata.description || '';

    // Load and display results if available
    if (process.results) {
      this.currentResult = {
        job_id: process.jobInfo.job_id,
        status: process.jobInfo.status,
        timestamp: process.jobInfo.timestamp,
        original_url: process.results.originalUrl,
        protected_url: process.results.protectedUrl,
        mask_url: process.results.maskUrl,
        reconstructed_url: process.results.reconstructedUrl
      };

      // Display the results
      this.displayResult(this.currentResult).then(() => {
        // Scroll to results
        setTimeout(() => {
          document.getElementById('comparison-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 300);
      });
    }

    // Update process list UI to show active state
    this.renderProcessList();

    console.log('Loaded process:', processId);
  }

  /**
   * Handle delete button click on a process item
   */
  handleProcessDelete(processId, event) {
    event.stopPropagation();

    if (!confirm('Delete this process from history?')) {
      return;
    }

    const success = this.historyManager.deleteProcess(processId);

    if (success) {
      // If we deleted the currently loaded process, reset
      if (this.currentProcessId === processId) {
        this.handleProtectNew();
      }

      // Re-render the list
      this.renderProcessList();

      this.showStatus('Process deleted', 'success');
      setTimeout(() => {
        document.getElementById('status-banner').style.display = 'none';
      }, 2000);
    } else {
      this.showStatus('Failed to delete process', 'error');
    }
  }

  /**
   * Save the current process to history after successful completion
   */
  saveCurrentProcess() {
    if (!this.selectedFile || !this.currentResult) {
      console.log('Cannot save process: missing file or result');
      return;
    }

    const processData = {
      filename: this.selectedFile.name,
      config: {
        enableFawkes: document.getElementById('enable-fawkes').checked,
        enablePhotoguard: document.getElementById('enable-photoguard').checked,
        enableMist: document.getElementById('enable-mist').checked,
        enableNightshade: document.getElementById('enable-nightshade').checked,
        enableC2paManifest: document.getElementById('enable-c2pa-manifest').checked,
        watermarkStrategy: document.getElementById('watermark-strategy').value
      },
      metadata: {
        authorName: document.getElementById('author-name').value,
        creationDate: document.getElementById('creation-date').value,
        description: document.getElementById('description').value
      },
      results: {
        originalUrl: this.currentResult.original_url,
        protectedUrl: this.currentResult.protected_url,
        maskUrl: this.currentResult.mask_url,
        reconstructedUrl: this.currentResult.reconstructed_url
      },
      jobInfo: {
        job_id: this.currentResult.job_id,
        status: this.currentResult.status,
        timestamp: this.currentResult.timestamp
      }
    };

    const processId = this.historyManager.saveProcess(processData);

    if (processId) {
      this.currentProcessId = processId;
      this.renderProcessList();
      console.log('Process saved to history:', processId);
    }
  }

  /**
   * Toggle left sidebar visibility
   */
  toggleSidebar() {
    console.log('toggleSidebar called');
    const wrapper = document.querySelector('.dashboard-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('sidebar-hidden');
      console.log('Sidebar hidden:', wrapper.classList.contains('sidebar-hidden'));

      // Store preference in localStorage
      const isHidden = wrapper.classList.contains('sidebar-hidden');
      localStorage.setItem('sidebar_hidden', isHidden ? 'true' : 'false');
    } else {
      console.error('Dashboard wrapper not found');
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize tab switching functionality
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Update all buttons
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.setAttribute('aria-selected', 'true');
          btn.setAttribute('data-state', 'active');
        } else {
          btn.setAttribute('aria-selected', 'false');
          btn.setAttribute('data-state', 'inactive');
        }
      });

      // Update all tab panes
      tabPanes.forEach(pane => {
        if (pane.id === `tab-${tabName}`) {
          pane.style.display = 'block';
          pane.style.opacity = '1';
          pane.setAttribute('data-state', 'active');
        } else {
          pane.style.display = 'none';
          pane.style.opacity = '0';
          pane.setAttribute('data-state', 'inactive');
        }
      });
    });
  });
}

// Initialize upload zone interactions
function initializeUploadZone() {
  const uploadZone = document.getElementById('upload-zone');
  const imageUpload = document.getElementById('image-upload');

  if (uploadZone && imageUpload) {
    // Click on upload zone to trigger file input
    uploadZone.addEventListener('click', () => {
      imageUpload.click();
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        imageUpload.files = files;
        imageUpload.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new ArtorizeDashboard();
  initializeTabs();
  initializeUploadZone();
  console.log('Artorize Dashboard initialized');
});
