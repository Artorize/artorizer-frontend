/**
 * Artorize Dashboard V2 - Image Upload and Protection Workflow
 *
 * This script handles the complete workflow for uploading and protecting images
 * Requires authentication - will redirect to login if not authenticated
 */

(function () {
  'use strict';

  // State management
  let uploader = null;
  let selectedFile = null;
  let currentJobId = null;
  let currentResult = null;
  let currentUser = null;
  let images = {
    original: null,
    protected: null,
    mask: null
  };
  let completedSteps = new Set();
  let lastProcessedProtection = null;

  // Auto-fill metadata fields from user profile
  function autoFillMetadata() {
    // Auto-fill author name
    const authorInput = document.getElementById('author-name');
    if (authorInput && !authorInput.value && currentUser) {
      const userName = currentUser.name || currentUser.displayName || currentUser.username ||
        (currentUser.email ? currentUser.email.split('@')[0] : '');
      if (userName) {
        authorInput.value = userName;
        authorInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[AutoFill] Author name set to:', userName);
      }
    }

    // Auto-fill creation date to today
    const dateDisplay = document.getElementById('creation-date-display');
    const dateHidden = document.getElementById('creation-date');
    if (dateDisplay && dateHidden && !dateHidden.value) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      dateHidden.value = `${yyyy}-${mm}-${dd}`;
      dateDisplay.value = `${monthNames[today.getMonth()]} ${today.getDate()}, ${yyyy}`;
      console.log('[AutoFill] Creation date set to:', dateHidden.value);
    }
  }

  // Main initialization logic
  async function initializeDashboard() {
    console.log('Artorize Dashboard V2 initializing...');

    // Check authentication first
    if (window.DashboardAuth) {
      try {
        const session = await window.DashboardAuth.init();
        console.log('[Auth] Session response:', session);
        if (!session) {
          // User is being redirected to login
          return;
        }
        // Extract user from session - handle nested structure {session: {...}, user: {...}}
        currentUser = session.user || session;
        console.log('[Auth] User authenticated:', currentUser);
        console.log('[Auth] User name:', currentUser?.name);
        console.log('[Auth] User email:', currentUser?.email);
        // Auto-fill metadata from user profile
        setTimeout(() => {
          autoFillMetadata();
        }, 500);
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Continue without auth if DashboardAuth throws
      }
    } else {
      console.warn('DashboardAuth not loaded - running without authentication');
    }

    // Initialize uploader
    if (window.ArtorizeConfig && window.ArtworkUploader) {
      uploader = new ArtworkUploader(window.ArtorizeConfig);
    } else {
      console.error('Required dependencies not loaded');
      return;
    }

    initializeUploadHandlers();
    initializeTabSwitching();
    initializeFileUpload();
    initializeProtectButton();
    initializeDownloadButtons();
    initializeSidebarToggle();
    initializeUserMenu();
    initializeMyselfButton();
    initializeEditingHistory();

    console.log('Artorize Dashboard V2 initialized successfully');
  }

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', async function () {
    // Check if we are in modular mode and components are pending
    if (document.querySelector('[data-component]')) {
      console.log('Modular dashboard detected: Waiting for components...');
      document.addEventListener('components:ready', initializeDashboard);
    } else {
      // Standard dashboard or components already loaded
      initializeDashboard();
    }
  });

  /**
   * Initialize upload handlers
   */
  function initializeUploadHandlers() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('image-upload');
    const resultsSection = document.getElementById('image-results-section');

    if (!uploadZone || !fileInput) {
      console.warn('Upload elements not found');
      return;
    }

    // Click to upload
    uploadZone.addEventListener('click', function (e) {
      if (e.target.tagName !== 'INPUT') {
        fileInput.click();
      }
    });

    // Drag and drop support for upload zone
    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', function () {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;

          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        } else {
          showStatus('Please upload an image file', 'error');
        }
      }
    });

    // Drag and drop support for results section (allows dropping new image to process)
    if (resultsSection) {
      resultsSection.addEventListener('dragover', function (e) {
        e.preventDefault();
        resultsSection.classList.add('drag-over');
      });

      resultsSection.addEventListener('dragleave', function (e) {
        // Only remove class if leaving the results section, not entering a child
        if (!resultsSection.contains(e.relatedTarget)) {
          resultsSection.classList.remove('drag-over');
        }
      });

      resultsSection.addEventListener('drop', function (e) {
        e.preventDefault();
        resultsSection.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
          } else {
            showStatus('Please upload an image file', 'error');
          }
        }
      });
    }

    // File input change handler
    fileInput.addEventListener('change', function (e) {
      const file = this.files[0];
      if (file) {
        handleFileSelect(file);
      }
    });
  }

  /**
   * Handle file selection
   */
  function handleFileSelect(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showStatus('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus('Image size must be less than 100MB', 'error');
      return;
    }

    selectedFile = file;
    console.log('File selected:', file.name);

    // Show preview
    showFilePreview(file);

    // Enable protect button
    const protectButton = document.getElementById('protect-button');
    if (protectButton) {
      protectButton.disabled = false;
    }

    showStatus(`File selected: ${file.name}`, 'success');

    // Auto-apply Lite preset if no protections are selected
    const hasProtections = document.querySelectorAll('.protection-card.selected').length > 0;
    if (!hasProtections && typeof window.applyPreset === 'function') {
      window.applyPreset('lite');
      console.log('[AutoPreset] Applied Lite preset');
    }
  }

  /**
   * Show file preview
   */
  function showFilePreview(file) {
    console.log(`File uploaded: ${file.name}`);

    const uploadZone = document.getElementById('upload-zone');
    const resultsSection = document.getElementById('image-results-section');
    const previewImage = document.getElementById('preview-image');

    // Hide slider components just in case
    const protectedImg = document.getElementById('comparison-protected');
    const overlay = document.getElementById('comparison-overlay');
    const slider = document.getElementById('comparison-slider');
    const downloadBtn = document.getElementById('download-all-btn');

    if (protectedImg) protectedImg.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    if (slider) slider.style.display = 'none';
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.dataset.loading = 'false';
    }

    if (uploadZone) {
      uploadZone.style.display = 'none';
    }

    if (resultsSection && previewImage) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        resultsSection.style.display = 'flex';
      }
      reader.readAsDataURL(file);
    }
  }

  /**
   * Initialize tab switching functionality
   */
  function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    const indicator = document.getElementById('tab-active-indicator');

    function updateIndicator(activeButton) {
      if (!indicator || !activeButton) return;

      const left = activeButton.offsetLeft;
      const width = activeButton.offsetWidth;

      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
    }

    // Initialize indicator position with multiple attempts to ensure layout is ready
    function initIndicator() {
      const activeBtn = document.querySelector('[role="tab"][data-state="active"]');
      if (activeBtn) {
        updateIndicator(activeBtn);
      }
    }

    // Try immediately
    initIndicator();

    // Try after DOM is stable
    setTimeout(initIndicator, 0);

    // Try after transitions/animations might complete
    setTimeout(initIndicator, 100);

    // Also update on window load to catch any late-loading elements
    if (document.readyState === 'loading') {
      window.addEventListener('load', initIndicator);
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        const targetId = this.getAttribute('aria-controls');

        // Update button states
        tabButtons.forEach(btn => {
          btn.setAttribute('aria-selected', 'false');
          btn.setAttribute('data-state', 'inactive');
        });

        this.setAttribute('aria-selected', 'true');
        this.setAttribute('data-state', 'active');

        // Update indicator
        updateIndicator(this);

        // Update panel visibility
        tabPanels.forEach(panel => {
          if (panel.id === targetId) {
            panel.style.display = 'block';
            panel.style.opacity = '1';
            panel.setAttribute('data-state', 'active');
          } else {
            panel.style.display = 'none';
            panel.style.opacity = '0';
            panel.setAttribute('data-state', 'inactive');
          }
        });
      });
    });

    // Update on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce resize updates
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentActive = document.querySelector('[role="tab"][data-state="active"]');
        if (currentActive) updateIndicator(currentActive);
      }, 50);
    });

    // Also observe the sidebar for width changes
    const sidebar = document.querySelector('[aria-expanded]');
    if (sidebar) {
      const sidebarObserver = new MutationObserver(() => {
        // Sidebar state changed, update indicator after transition
        setTimeout(() => {
          const currentActive = document.querySelector('[role="tab"][data-state="active"]');
          if (currentActive) updateIndicator(currentActive);
        }, 150); // Wait for sidebar transition to complete
      });

      sidebarObserver.observe(sidebar, {
        attributes: true,
        attributeFilter: ['aria-expanded']
      });
    }
  }

  /**
   * Initialize file upload interactions
   */
  function initializeFileUpload() {
    const fileInput = document.getElementById('image-upload');
    const uploadArea = document.querySelector('[role="presentation"]');

    if (fileInput && uploadArea) {
      // Click upload area to trigger file input
      uploadArea.addEventListener('click', function (e) {
        if (e.target.tagName !== 'INPUT') {
          fileInput.click();
        }
      });
    }
  }

  /**
   * Initialize protect button
   */
  function initializeProtectButton() {
    const protectButton = document.getElementById('protect-button');
    if (protectButton) {
      protectButton.addEventListener('click', handleProtectArtwork);
    }
  }

  /**
   * Handle protect artwork submission
   */
  async function handleProtectArtwork() {
    // Validate session before submission
    if (window.DashboardAuth) {
      try {
        const session = await window.DashboardAuth.getSession();
        if (!session) {
          showStatus('Session expired. Please log in again.', 'error');
          setTimeout(() => {
            window.DashboardAuth.requireAuth();
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('[Auth] Session validation failed:', error);
        showStatus('Authentication error. Please try again.', 'error');
        return;
      }
    }

    // Validate file selection
    if (!selectedFile) {
      showStatus('Please select an image file first', 'error');
      return;
    }

    // Get selected protections from the protection cards
    const selectedProtections = Array.from(document.querySelectorAll('.protection-card.selected'))
      .map(card => card.getAttribute('data-protection'));

    if (selectedProtections.length === 0) {
      showStatus('Please select at least one protection layer', 'error');
      return;
    }

    const protectButton = document.getElementById('protect-button');
    protectButton.disabled = true;
    protectButton.setAttribute('data-loading', 'true');

    try {
      // Reset progress tracker for new job
      resetProgressTracker();

      // Prepare form data from actual form fields
      const formData = {
        imageFile: selectedFile,
        artist_name: document.getElementById('author-name')?.value || currentUser?.name || 'Artist',
        artwork_title: document.getElementById('artwork-title')?.value || selectedFile.name.replace(/\.[^/.]+$/, ''),
        description: document.getElementById('description')?.value || '',
        creation_date: document.getElementById('creation-date')?.value || '',
        protectionOptions: {
          enable_fawkes: selectedProtections.includes('fawkes'),
          enable_photoguard: selectedProtections.includes('photoguard'),
          enable_mist: selectedProtections.includes('mist'),
          enable_nightshade: selectedProtections.includes('nightshade'),
          enable_c2pa_manifest: selectedProtections.includes('c2pa'),
          watermark_strategy: document.getElementById('watermark-strategy')?.value || 'invisible-watermark'
        }
      };

      // Submit artwork
      showStatus('Preparing upload...', 'info');

      // Mark upload step as in-progress
      if (window.updateProgressStep) {
        window.updateProgressStep('upload', 'in-progress');
      }

      const submitResult = await uploader.submitArtwork(formData, (percent) => {
        if (typeof percent === 'number' && !Number.isNaN(percent)) {
          const rounded = Math.max(0, Math.min(100, Math.round(percent)));
          showStatus(`Uploading artwork... ${rounded}%`, 'info');
        }
      });

      // Mark upload step as complete
      if (window.updateProgressStep) {
        window.updateProgressStep('upload', 'success');
      }

      currentJobId = submitResult.job_id;

      // Switch to Progress tab to show real-time updates
      switchToProgressTab();

      // Poll for completion
      showStatus('Processing your artwork with protection layers...', 'info');

      const result = await uploader.pollJobUntilComplete(
        currentJobId,
        (status) => {
          console.log('Status update:', status);
          const progress = status.progress || {};
          const currentStep = progress.current_step || status.status || 'Processing';
          const percentage = progress.percentage || 0;

          let statusMessage = currentStep;
          if (percentage > 0 && percentage < 100) {
            statusMessage += ` - ${Math.round(percentage)}%`;
          }

          showStatus(statusMessage, 'info');
          updateProgressTracker(status);
        }
      );

      console.log('[Progress] Final result from polling:', result);

      // Check final status
      if (result.status === 'failed') {
        showStatus(`Processing failed: ${result.error?.message || 'Unknown error'}`, 'error');
        return;
      }

      // Ensure all progress steps are marked as complete
      // This handles cases where the final 'completed' status wasn't properly processed during polling
      if (result.status === 'completed' || result.job_id) {
        console.log('[Progress] Ensuring all steps marked complete after successful result');
        updateProgressTracker({ status: 'completed', progress: { percentage: 100 } });
      }

      // Display result
      await displayResult(result);

      // Refresh editing history so new item appears immediately
      await refreshEditingHistory();

    } catch (error) {
      console.error('Submission error:', error);
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      protectButton.disabled = false;
      protectButton.setAttribute('data-loading', 'false');
    }
  }

  /**
   * Initialize slider
   */
  function initializeSlider(container, overlay, originalImg, slider) {
    let isDragging = false;

    // Force style to prevent stretching
    originalImg.style.maxWidth = 'none';
    originalImg.style.height = '100%';
    originalImg.style.objectFit = 'cover'; // Ensure it covers the area if aspect ratios slightly mismatch

    const syncWidth = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        originalImg.style.width = `${rect.width}px`;
      }
    };

    const updateSlider = (x) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return;

      let percentage = ((x - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));

      overlay.style.width = `${percentage}%`;
      // Slider uses transform: translateX(-50%) so left % works correctly
      slider.style.left = `${percentage}%`;
    };

    // Initial sync
    syncWidth();

    // Resize observer to keep width synced (handles window resize and image loading)
    const resizeObserver = new ResizeObserver(() => {
      syncWidth();
    });
    resizeObserver.observe(container);

    // Events
    const startDrag = (e) => {
      isDragging = true;
      e.preventDefault(); // Prevent selection
    };

    const stopDrag = () => {
      isDragging = false;
    };

    const doDrag = (clientX) => {
      if (!isDragging) return;
      updateSlider(clientX);
    };

    slider.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', (e) => doDrag(e.clientX));

    slider.addEventListener('touchstart', startDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchmove', (e) => doDrag(e.touches[0].clientX));

    // Click to jump
    container.addEventListener('click', (e) => {
      // Prevent jumping if clicking the slider handle itself
      if (e.target === slider || slider.contains(e.target)) return;
      updateSlider(e.clientX);
    });
  }

  /**
   * Display protected artwork result
   */
  async function displayResult(result) {
    currentResult = result;
    showStatus('Loading images...', 'info');

    try {
      showStatus('Downloading images...', 'info');

      const [originalBlob, protectedBlob] = await Promise.all([
        uploader.downloadVariant(result.job_id, 'original'),
        uploader.downloadVariant(result.job_id, 'protected')
      ]);

      images.original = originalBlob;
      images.protected = protectedBlob;

      showStatus('Images loaded successfully!', 'success');

      const resultsSection = document.getElementById('image-results-section');
      const previewImage = document.getElementById('preview-image');
      const comparisonProtected = document.getElementById('comparison-protected');
      const comparisonOriginal = document.getElementById('comparison-original');
      const comparisonOverlay = document.getElementById('comparison-overlay');
      const comparisonSlider = document.getElementById('comparison-slider');
      const downloadBtn = document.getElementById('download-all-btn');
      const container = document.getElementById('image-comparison-container');

      if (resultsSection) {
        // Hide preview
        if (previewImage) previewImage.style.display = 'none';

        // Setup Protected (Background)
        comparisonProtected.src = URL.createObjectURL(protectedBlob);
        comparisonProtected.style.display = 'block';

        // Setup Original (Foreground)
        comparisonOriginal.src = URL.createObjectURL(originalBlob);
        comparisonOverlay.style.display = 'block';

        // Show Slider
        comparisonSlider.style.display = 'block';

        // Enable Download
        if (downloadBtn) {
          downloadBtn.disabled = false;
        }

        // Reset slider to 50%
        comparisonOverlay.style.width = '50%';
        comparisonSlider.style.left = '50%';

        // Initialize slider
        initializeSlider(container, comparisonOverlay, comparisonOriginal, comparisonSlider);

        // Scroll to results
        setTimeout(() => {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }

    } catch (error) {
      showStatus(`Failed to load images: ${error.message}`, 'error');
      console.error('Display error:', error);
    }
  }

  /**
   * Switch to the Progress tab
   */
  function switchToProgressTab() {
    const progressButton = document.querySelector('[data-tab="progress"]');
    if (progressButton) {
      progressButton.click();
    }
  }

  /**
   * Reset progress tracker for a new job
   */
  function resetProgressTracker() {
    completedSteps.clear();
    lastProcessedProtection = null;
    console.log('[Progress Tracker] Reset completed steps');
  }

  /**
   * Update progress tracker based on router callbacks
   *
   * This function processes status updates from the Artorizer router and updates
   * the visual progress tracker in the UI. It maps router step names to protection
   * types and updates each step's status (pending, in-progress, success, error).
   *
   * Expected status object structure (from router):
   * {
   *   job_id: string,
   *   status: 'queued' | 'processing' | 'completed' | 'failed',
   *   current_step: string,  // e.g., 'grid', 'poison', 'watermark', 'c2pa'
   *   steps: {
   *     [stepName]: {
   *       status: 'queued' | 'processing' | 'completed' | 'failed',
   *       duration?: number,  // Duration in seconds
   *       error?: string,     // Error message if failed
   *       started_at?: string,
   *       completed_at?: string
   *     }
   *   },
   *   progress?: {
   *     current_step: string,  // e.g., "Processing imagehash"
   *     step_number: number,   // Current step number (1-based)
   *     total_steps: number,   // Total number of steps
   *     percentage: number     // Overall percentage (0-100)
   *   }
   * }
   *
   * Router callback endpoints that trigger updates:
   * - POST /callbacks/grid-complete - Grid processing step complete
   * - POST /callbacks/poison-complete - Poison processing step complete
   * - POST /callbacks/watermark-complete - Watermark step complete
   * - POST /callbacks/c2pa-complete - C2PA manifest step complete
   * - POST /callbacks/process-complete - All processing complete
   *
   * @param {Object} status - Status object from router API
   */
  function updateProgressTracker(status) {
    console.log('[Progress Tracker] Status update:', status);

    // Mapping of router step names to protection types displayed in UI
    // Router step names come from the backend processing pipeline
    // Protection types match the data-protection attributes in the HTML
    const stepToProtectionMap = {
      'upload': 'upload',
      'metadata': 'upload',
      'imagehash': 'upload',
      'dhash': 'upload',
      'grid': 'fawkes',  // Grid processing maps to Fawkes cloaking
      'poison': 'nightshade',  // Poison processing maps to Nightshade
      'watermark': 'watermark',
      'c2pa': 'c2pa',
      'photoguard': 'photoguard',
      'mist': 'mist',
      'fawkes': 'fawkes',  // Direct mapping
      'nightshade': 'nightshade'  // Direct mapping
    };

    // Check if we have the new progress format
    const progress = status.progress || {};
    if (progress.current_step && progress.step_number) {
      // Parse the current step name (remove "Processing " prefix if present)
      let currentStepName = progress.current_step;
      if (currentStepName.toLowerCase().startsWith('processing ')) {
        currentStepName = currentStepName.substring(11); // Remove "Processing " (11 chars)
      }
      // Normalize to lowercase for consistent mapping
      currentStepName = currentStepName.toLowerCase().trim();

      const stepNumber = progress.step_number;
      const percentage = progress.percentage || 0;

      console.log('[Progress Tracker] Parsed step:', {
        originalStep: progress.current_step,
        parsedStep: currentStepName,
        stepNumber: stepNumber,
        percentage: percentage
      });

      // Map step name to protection type
      const currentProtection = stepToProtectionMap[currentStepName];

      if (currentProtection) {
        // If we're tracking a different protection than before, mark the previous one as completed
        if (lastProcessedProtection && lastProcessedProtection !== currentProtection && !completedSteps.has(lastProcessedProtection)) {
          console.log('[Progress Tracker] Step transition: completing previous step:', lastProcessedProtection);
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(lastProcessedProtection, 'success');
            completedSteps.add(lastProcessedProtection);
          }
        }

        // Mark current step as in-progress if not already completed
        if (!completedSteps.has(currentProtection)) {
          console.log('[Progress Tracker] Updating step:', currentProtection, 'to in-progress');
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(currentProtection, 'in-progress');
          }
          lastProcessedProtection = currentProtection;
        }
      }

      // If percentage is 100 or status is completed, mark current step as complete
      if (percentage >= 100 || status.status === 'completed') {
        if (currentProtection && !completedSteps.has(currentProtection)) {
          console.log('[Progress Tracker] Completing step:', currentProtection);
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(currentProtection, 'success');
            completedSteps.add(currentProtection);
          }
        }
      }
    }

    // Backward compatibility: check for old format with status.steps
    const steps = status.steps || {};
    if (Object.keys(steps).length > 0) {
      const currentStep = status.current_step || '';

      // Update each step based on its status
      Object.entries(steps).forEach(([stepName, stepData]) => {
        const protection = stepToProtectionMap[stepName];
        if (!protection) return;

        const stepStatus = stepData.status || '';
        const duration = stepData.duration ? `${stepData.duration.toFixed(1)}s` : null;

        // Map status to progress step status
        if (stepStatus === 'completed' || stepStatus === 'success') {
          // Call the global updateProgressStep function from HTML
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(protection, 'success', duration);
            completedSteps.add(protection);
          }
        } else if (stepStatus === 'processing' || stepStatus === 'in-progress') {
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(protection, 'in-progress');
          }
        } else if (stepStatus === 'failed' || stepStatus === 'error') {
          const errorMsg = stepData.error || 'Failed';
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(protection, 'error', errorMsg);
          }
        }
      });

      // If we have a current step, mark it as in-progress
      if (currentStep) {
        const currentProtection = stepToProtectionMap[currentStep];
        if (currentProtection && typeof window.updateProgressStep === 'function') {
          // Only mark as in-progress if not already completed
          const stepData = steps[currentStep] || {};
          if (stepData.status !== 'completed' && stepData.status !== 'success') {
            window.updateProgressStep(currentProtection, 'in-progress');
          }
        }
      }
    }

    // When job is completed, mark ALL pending steps as complete
    if (status.status === 'completed') {
      console.log('[Progress Tracker] Job completed, marking all pending steps as success');

      // Get all progress steps from the UI and mark any pending ones as complete
      const allSteps = document.querySelectorAll('[data-protection]');
      allSteps.forEach(step => {
        const protection = step.getAttribute('data-protection');
        const conclusion = step.getAttribute('data-conclusion');

        // Mark any step that isn't already completed/success as success
        if (conclusion !== 'success' && conclusion !== 'failure' && !completedSteps.has(protection)) {
          console.log('[Progress Tracker] Marking step as success:', protection);
          if (typeof window.updateProgressStep === 'function') {
            window.updateProgressStep(protection, 'success');
            completedSteps.add(protection);
          }
        }
      });
    }

    // Show percentage if available
    const progressPercentage = progress.percentage || 0;
    if (progressPercentage > 0) {
      const currentStepDisplay = progress.current_step || status.current_step || 'Processing';
      console.log(`Progress: ${currentStepDisplay} - ${Math.round(progressPercentage)}%`);
    }
  }

  // Expose resetProgressTracker to window scope
  window.resetProgressTracker = resetProgressTracker;

  /**
   * Initialize download buttons
   */
  function initializeDownloadButtons() {
    const downloadBtn = document.getElementById('download-all-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => downloadImage('protected'));
    }
  }

  /**
   * Download image variant
   */
  async function downloadImage(variant) {
    try {
      const blob = images[variant];
      if (!blob) {
        showStatus(`Image not available`, 'error');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use currentResult job_id if available, or generic name
      const jobId = currentResult ? currentResult.job_id : 'artwork';
      a.download = `protected_${jobId}.jpg`;

      a.click();
      URL.revokeObjectURL(url);

      showStatus(`Downloaded image`, 'success');
    } catch (error) {
      showStatus(`Failed to download: ${error.message}`, 'error');
    }
  }

  /**
   * Show status message
   */
  function showStatus(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]`, message);

    // Create a simple toast notification
    const existingToast = document.querySelector('.status-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `status-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
      color: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideInUp 0.3s ease-out;
      font-size: 14px;
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds for success/info, 5 seconds for errors
    const timeout = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, timeout);
  }

  /**
   * Initialize sidebar toggle functionality
   */
  function initializeSidebarToggle() {
    const sidebar = document.querySelector('[aria-expanded]');
    const toggleButton = sidebar?.querySelector('button[data-state]');
    const logoContainer = sidebar?.querySelector('.group\\/header-logo');

    if (!sidebar || !toggleButton) {
      console.warn('Sidebar toggle elements not found');
      return;
    }

    // SVG for collapse icon (original - shorter rectangle in middle)
    const collapseSVG = `
      <svg width="20px" height="20px" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="w-5 h-5">
        <rect x="7" y="6.5" width="7" height="1.5" rx="0.75" transform="rotate(90 7 6.5)" fill="currentColor"></rect>
        <rect x="3" y="4" width="14" height="12" rx="2.8" stroke="currentColor" stroke-width="1.5"></rect>
      </svg>
    `;

    // SVG for expand icon (longer rectangle at top, near border)
    const expandSVG = `
      <svg width="20px" height="20px" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="w-5 h-5">
        <rect x="7" width="7" rx="0.75" transform="rotate(90 7 6.5)" fill="currentColor" height="5" y="0"></rect>
        <rect x="3" y="4" width="14" height="12" rx="2.8" stroke="currentColor" stroke-width="1.5"></rect>
      </svg>
    `;

    // Create expand icon element that will replace logo text when collapsed
    const expandIconContainer = document.createElement('div');
    expandIconContainer.className = 'hidden items-center translate-x-[13px] transition-transform duration-150';
    expandIconContainer.id = 'sidebar-expand-icon';
    expandIconContainer.innerHTML = `
      <button class="relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-ring bg-transparent hover:bg-gray-alpha-100 rounded-[10px] p-0 h-8 w-8 text-gray-500 hover:text-gray-alpha-950 duration-100 transition-colors">
        ${expandSVG}
      </button>
    `;

    // Insert expand icon after logo container's parent to maintain position
    if (logoContainer && logoContainer.parentElement && logoContainer.parentElement.parentElement) {
      logoContainer.parentElement.parentElement.insertBefore(expandIconContainer, logoContainer.parentElement.nextSibling);
    }

    // Add debug border to toggle button container for visibility
    const toggleButtonContainer = toggleButton.parentElement;

    // Get the parent flex container that controls layout
    const headerContainer = logoContainer?.parentElement;

    // Handle toggle button click
    toggleButton.addEventListener('click', function (e) {
      e.stopPropagation();
      const isExpanded = sidebar.getAttribute('aria-expanded') === 'true';

      // Toggle sidebar state
      sidebar.setAttribute('aria-expanded', !isExpanded);

      // Update sidebar width
      const root = document.documentElement;
      // Get the "Artorize" text div (first child of logoContainer)
      const brandTextDiv = logoContainer?.children[0];

      if (isExpanded) {
        // Collapse: set to icon-only width
        root.style.setProperty('--eleven-sidebar-width', '4rem');
        // Hide only the "Artorize" text, keep toggle container visible
        if (brandTextDiv) {
          brandTextDiv.style.visibility = 'hidden';
          brandTextDiv.style.opacity = '0';
          brandTextDiv.style.position = 'absolute';
        }
        expandIconContainer.style.display = 'none';

        // Update toggle button icon to expand icon
        toggleButton.innerHTML = expandSVG;

        // Center toggle button container in collapsed sidebar
        toggleButtonContainer.style.position = 'relative';
        toggleButtonContainer.style.left = 'auto';
        toggleButtonContainer.style.right = 'auto';
        toggleButtonContainer.style.transform = 'none';
        toggleButtonContainer.style.margin = '0 auto';
      } else {
        // Expand: set to full width
        root.style.setProperty('--eleven-sidebar-width', '16rem');
        // Show "Artorize" text again
        if (brandTextDiv) {
          brandTextDiv.style.visibility = 'visible';
          brandTextDiv.style.opacity = '1';
          brandTextDiv.style.position = 'relative';
        }
        expandIconContainer.style.display = 'none';
        // Update toggle button icon back to collapse icon
        toggleButton.innerHTML = collapseSVG;
        // Reset toggle button position when expanded
        if (headerContainer) {
          headerContainer.style.justifyContent = 'space-between';
        }
        toggleButtonContainer.style.position = 'absolute';
        toggleButtonContainer.style.left = 'auto';
        toggleButtonContainer.style.right = '0.125rem';
        toggleButtonContainer.style.transform = 'none';
        toggleButtonContainer.style.margin = '0';
      }
    });

    // Also handle click on expand icon when collapsed
    expandIconContainer.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleButton.click();
    });

    // Also allow clicking the "A" brand to expand the sidebar
    const collapsedBrand = sidebar.querySelector('.artorize-collapsed-brand');
    if (collapsedBrand) {
      collapsedBrand.style.cursor = 'pointer';
      collapsedBrand.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleButton.click();
      });
    }
  }

  /**
   * Initialize user menu functionality
   */
  function initializeUserMenu() {
    const userMenuButton = document.querySelector('[data-testid="user-menu-button"]');
    if (!userMenuButton) {
      console.warn('User menu button not found');
      return;
    }

    // Create user menu dropdown and append to body to avoid clipping
    const menuDropdown = createUserMenuDropdown();
    document.body.appendChild(menuDropdown);

    // Position dropdown relative to button
    function positionDropdown() {
      const buttonRect = userMenuButton.getBoundingClientRect();

      // Temporarily show dropdown to measure it (opacity 0)
      menuDropdown.style.visibility = 'hidden';
      menuDropdown.style.display = 'block';
      const dropdownRect = menuDropdown.getBoundingClientRect();
      menuDropdown.style.visibility = 'visible';

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Check if there's enough room to the right of the button
      const spaceOnRight = viewportWidth - buttonRect.right - 8;
      const hasRoomOnRight = spaceOnRight >= dropdownRect.width;

      if (hasRoomOnRight) {
        // Position to the right of the button
        menuDropdown.style.left = `${buttonRect.right + 8}px`;
      } else {
        // Not enough room on right, position above the button instead
        menuDropdown.style.left = `${buttonRect.left}px`;
      }

      // Calculate vertical position
      let topPosition;
      if (hasRoomOnRight) {
        // Align bottom of dropdown with bottom of button
        topPosition = buttonRect.bottom - dropdownRect.height;
      } else {
        // Position above the button
        topPosition = buttonRect.top - dropdownRect.height - 8;
      }

      // Make sure it doesn't go off screen vertically
      if (topPosition < 10) {
        topPosition = 10;
      }
      if (topPosition + dropdownRect.height > viewportHeight - 10) {
        topPosition = viewportHeight - dropdownRect.height - 10;
      }

      menuDropdown.style.top = `${topPosition}px`;
    }

    // Find the chevron icon container
    const chevronContainer = userMenuButton.querySelector('.flex.h-4.w-4');

    // Toggle menu on click
    userMenuButton.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = menuDropdown.style.display !== 'none';
      if (!isOpen) {
        menuDropdown.style.display = 'block';
        positionDropdown();
        // Rotate chevron 180 degrees when opening (from 90 to 270)
        if (chevronContainer) {
          chevronContainer.style.transform = 'rotate(270deg)';
        }
      } else {
        menuDropdown.style.display = 'none';
        // Reset chevron to default 90 degrees when closing
        if (chevronContainer) {
          chevronContainer.style.transform = 'rotate(90deg)';
        }
      }
      userMenuButton.setAttribute('data-state', isOpen ? 'closed' : 'open');
      userMenuButton.setAttribute('aria-expanded', !isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!userMenuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
        menuDropdown.style.display = 'none';
        userMenuButton.setAttribute('data-state', 'closed');
        userMenuButton.setAttribute('aria-expanded', 'false');
        // Reset chevron rotation when closing via outside click
        if (chevronContainer) {
          chevronContainer.style.transform = 'rotate(90deg)';
        }
      }
    });

    // Reposition on scroll/resize
    window.addEventListener('resize', () => {
      if (menuDropdown.style.display !== 'none') positionDropdown();
    });
  }

  /**
   * Create user menu dropdown
   */
  function createUserMenuDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'user-menu-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      min-width: 200px;
      background: #ffffff;
      border: 1px solid var(--gray-alpha-200, rgba(0,0,0,0.08));
      border-radius: 10px;
      z-index: 9999;
      display: none;
      padding: 4px;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.04);
    `;

    // Button styles matching sidebar exactly: text-sm font-medium text-gray-600
    // gap-2 (8px), px-1.5 (6px), h-8 (32px), rounded-lg, icon 1.25rem (20px)
    const buttonStyle = `
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 6px;
      height: 32px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #4b5563;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, color 0.15s;
    `;

    dropdown.innerHTML = `
      <button data-action="gallery" class="user-menu-item" style="${buttonStyle}"
        onmouseover="this.style.background='rgba(0,0,0,0.05)'; this.style.color='var(--gray-alpha-950, #111)'"
        onmouseout="this.style.background='transparent'; this.style.color='#4b5563'">
        <div style="display: flex; align-items: center; justify-content: center; height: 32px; width: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </div>
        <span style="white-space: nowrap;">Gallery</span>
      </button>

      <button data-action="settings" class="user-menu-item" style="${buttonStyle}"
        onmouseover="this.style.background='rgba(0,0,0,0.05)'; this.style.color='var(--gray-alpha-950, #111)'"
        onmouseout="this.style.background='transparent'; this.style.color='#4b5563'">
        <div style="display: flex; align-items: center; justify-content: center; height: 32px; width: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <span style="white-space: nowrap;">Settings</span>
      </button>

      <button data-action="sign-out" class="user-menu-item" style="${buttonStyle}"
        onmouseover="this.style.background='rgba(0,0,0,0.05)'; this.style.color='var(--gray-alpha-950, #111)'"
        onmouseout="this.style.background='transparent'; this.style.color='#4b5563'">
        <div style="display: flex; align-items: center; justify-content: center; height: 32px; width: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </div>
        <span style="white-space: nowrap;">Sign out</span>
      </button>
    `;

    // Add gallery handler
    const galleryBtn = dropdown.querySelector('[data-action="gallery"]');
    if (galleryBtn) {
      galleryBtn.addEventListener('click', function (e) {
        e.preventDefault();
        // Close the user menu dropdown
        dropdown.style.display = 'none';
        // Toggle the gallery floating window
        if (typeof window.toggleHistoryModal === 'function') {
          window.toggleHistoryModal();
        }
      });
    }

    // Add settings handler
    const settingsBtn = dropdown.querySelector('[data-action="settings"]');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function (e) {
        e.preventDefault();
        // Open settings modal
        if (window.openSettingsModal) {
          window.openSettingsModal();
        } else {
          // Fallback: navigate to dashboard
          window.location.href = '/dashboard/dashboard-modular.html';
        }
      });
    }

    // Add sign-out handler
    const signOutBtn = dropdown.querySelector('[data-action="sign-out"]');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (window.DashboardAuth) {
          await window.DashboardAuth.signOut();
        } else {
          // Fallback: redirect to login
          window.location.href = '/auth/login.html';
        }
      });
    }

    return dropdown;
  }

  /**
   * Initialize "Myself" button for author name
   */
  function initializeMyselfButton() {
    const myselfBtn = document.getElementById('myself-btn');
    const authorNameInput = document.getElementById('author-name');

    if (!myselfBtn || !authorNameInput) {
      console.warn('Myself button or author name input not found');
      return;
    }

    myselfBtn.addEventListener('click', async function () {
      console.log('[MyselfBtn] Button clicked, currentUser:', currentUser);

      let userName = 'User';

      // Try to get user from currentUser first
      if (currentUser) {
        console.log('[MyselfBtn] currentUser.name:', currentUser.name);
        // Handle various user object formats from different OAuth providers
        userName = currentUser.name ||
          currentUser.displayName ||
          currentUser.full_name ||
          currentUser.username ||
          (currentUser.email ? currentUser.email.split('@')[0] : null) ||
          'User';
      }

      // If currentUser is not set or name is still 'User', try to fetch from DashboardAuth
      if ((!currentUser || userName === 'User') && window.DashboardAuth) {
        try {
          console.log('[MyselfBtn] Fetching user from DashboardAuth...');
          const session = await window.DashboardAuth.getSession();
          console.log('[MyselfBtn] Session response:', session);

          // Extract user from session - handle nested structure
          const user = session?.user || session;
          console.log('[MyselfBtn] Extracted user:', user);

          if (user) {
            userName = user.name ||
              user.displayName ||
              user.full_name ||
              user.username ||
              (user.email ? user.email.split('@')[0] : null) ||
              'User';
            // Update currentUser for future calls
            currentUser = user;
          }
        } catch (error) {
          console.warn('[MyselfBtn] Failed to get user:', error);
        }
      }

      console.log('[MyselfBtn] Final userName:', userName);
      authorNameInput.value = userName;
      // Trigger change event in case anything listens to it
      authorNameInput.dispatchEvent(new Event('change', { bubbles: true }));
      // Focus the input after filling
      authorNameInput.focus();
    });
  }

  /**
   * Initialize editing history in sidebar
   * Fetches user's artwork history from /artworks/me endpoint and displays in sidebar
   *
   * API Reference (from docs/ROUTER-API.md):
   * - GET /artworks/me - Returns user's artwork history (requires authentication)
   * - GET /auth/me - Returns only user info {user, session} - NO history data
   */
  async function initializeEditingHistory() {
    const historyList = document.getElementById('editing-history-list');
    if (!historyList) {
      console.warn('[EditingHistory] History list element not found');
      return;
    }

    const apiUrl = window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com';
    console.log('[EditingHistory] Fetching user history from:', apiUrl);

    try {
      // Fetch user's artwork history from /artworks/me
      const historyUrl = `${apiUrl}/artworks/me`;

      const response = await fetch(historyUrl, {
        method: 'GET',
        credentials: 'include', // Include session cookie
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle different error types
        if (response.status === 404) {
          console.warn('[EditingHistory] /artworks/me endpoint not available. History feature requires router setup.');
          renderHistoryItems(historyList, [], 'History feature coming soon');
        } else if (response.status === 401) {
          console.warn('[EditingHistory] User not authenticated');
          renderHistoryItems(historyList, [], 'Please log in to view history');
        } else {
          console.error('[EditingHistory] Error fetching history:', response.status);
          renderHistoryItems(historyList, [], 'Unable to load history');
        }
        return;
      }

      const data = await response.json();
      console.log('[EditingHistory] Response:', data);

      // Extract artworks array from response
      // Expected format: { artworks: [...], total: number, userId: string }
      const artworks = data.artworks || [];

      if (artworks.length > 0) {
        console.log(`[EditingHistory] Loaded ${artworks.length} artwork(s)`);
      } else {
        console.log('[EditingHistory] No artworks found');
      }

      // Render history items
      renderHistoryItems(historyList, artworks);

    } catch (error) {
      console.error('[EditingHistory] Error:', error.message);
      renderHistoryItems(historyList, [], 'Failed to load history');
    }
  }

  async function refreshEditingHistory() {
    await initializeEditingHistory();
  }

  window.refreshEditingHistory = refreshEditingHistory;

  /**
   * Render history items in the sidebar list
   * @param {HTMLElement} container - The container element for the list
   * @param {Array} items - The history items to render
   * @param {string} [emptyMessage] - Custom message when no items (defaults to 'No history yet')
   */
  function renderHistoryItems(container, items, emptyMessage = 'No history yet') {
    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = `
        <li class="text-xs text-gray-alpha-400 ml-3 py-1 group-aria-expanded/sidebar:opacity-100 opacity-0 transition-opacity duration-150">
          ${emptyMessage}
        </li>
      `;
      return;
    }

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'group w-full';

      // Get the image name - try multiple possible field names from API response
      const imageName = item.title ||
        item.artwork_title ||
        item.artworkTitle ||
        item.artist ||
        `Artwork #${index + 1}`;

      // Get the artwork ID - MongoDB ObjectId from the response
      const artworkId = item._id || item.id || '';

      li.innerHTML = `
        <button
          class="history-item-btn block w-full text-left rounded-lg outline-foreground"
          data-artwork-id="${artworkId}"
          data-index="${index}">
          <div class="relative group rounded-lg overflow-hidden bg-transparent transition-all duration-150 w-[calc(var(--eleven-sidebar-width)-1.8125rem)] hover:text-gray-alpha-950 hover:bg-gray-alpha-100 text-gray-500">
            <div class="flex items-center gap-2 px-1.5 min-w-36 ml-2">
              <div class="flex items-center justify-between flex-1 h-7 transition-all duration-150 group-aria-expanded/sidebar:opacity-100 opacity-0 translate-x-1 group-aria-expanded/sidebar:translate-x-0">
                <p class="text-sm whitespace-nowrap max-w-[160px] truncate">
                  ${escapeHtml(imageName)}
                </p>
              </div>
            </div>
          </div>
        </button>
      `;

      // Add click handler to load the protected image
      const btn = li.querySelector('.history-item-btn');
      btn.addEventListener('click', function () {
        const artworkId = this.dataset.artworkId;
        if (artworkId) {
          loadHistoryItem(artworkId, item);
        }
      });

      container.appendChild(li);
    });

    console.log(`[EditingHistory] Rendered ${items.length} item(s)`);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Load a history item's protected image
   * Uses the router API endpoint to fetch the protected variant
   */
  async function loadHistoryItem(artworkId, item) {
    console.log('[EditingHistory] Loading artwork:', artworkId);

    const apiUrl = window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com';

    // Construct URL to protected image using the backend/router API
    // GET /artworks/{id}?variant=protected
    const protectedUrl = `${apiUrl}/artworks/${artworkId}?variant=protected`;

    // Open in new tab
    window.open(protectedUrl, '_blank');
  }


  /**
   * Clear editing history
   * Clears the displayed history items
   */
  function clearEditingHistory() {
    const historyList = document.getElementById("editing-history-list");
    if (!historyList) {
      console.warn("[EditingHistory] History list element not found");
      return;
    }

    // Confirm with user before clearing
    if (!confirm("Are you sure you want to clear your editing history?")) {
      return;
    }

    console.log("[EditingHistory] Clearing history...");

    // Clear the displayed list
    historyList.innerHTML = "";

    // Show empty state message
    renderHistoryItems(historyList, [], "History cleared");
  }

})();
