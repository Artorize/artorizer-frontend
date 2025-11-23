/**
 * Artorize Dashboard V2 - Image Upload and Protection Workflow
 *
 * This script handles the complete workflow for uploading and protecting images
 */

(function() {
  'use strict';

  // State management
  let uploader = null;
  let selectedFile = null;
  let currentJobId = null;
  let currentResult = null;
  let images = {
    original: null,
    protected: null,
    mask: null
  };

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Artorize Dashboard V2 initializing...');

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

    console.log('Artorize Dashboard V2 initialized successfully');
  });

  /**
   * Initialize upload handlers
   */
  function initializeUploadHandlers() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('image-upload');

    if (!uploadZone || !fileInput) {
      console.warn('Upload elements not found');
      return;
    }

    // Click to upload
    uploadZone.addEventListener('click', function(e) {
      if (e.target.tagName !== 'INPUT') {
        fileInput.click();
      }
    });

    // Drag and drop support
    uploadZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', function() {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', function(e) {
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

    // File input change handler
    fileInput.addEventListener('change', function(e) {
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
       reader.onload = function(e) {
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

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const targetId = this.getAttribute('aria-controls');

        // Update button states
        tabButtons.forEach(btn => {
          btn.setAttribute('aria-selected', 'false');
          btn.setAttribute('data-state', 'inactive');
        });

        this.setAttribute('aria-selected', 'true');
        this.setAttribute('data-state', 'active');

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
  }

  /**
   * Initialize file upload interactions
   */
  function initializeFileUpload() {
    const fileInput = document.getElementById('image-upload');
    const uploadArea = document.querySelector('[role="presentation"]');

    if (fileInput && uploadArea) {
      // Click upload area to trigger file input
      uploadArea.addEventListener('click', function(e) {
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
      // Prepare form data
      const formData = {
        imageFile: selectedFile,
        artist_name: 'Artist', // You can add input fields for these
        artwork_title: selectedFile.name,
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

      const submitResult = await uploader.submitArtwork(formData, (percent) => {
        if (typeof percent === 'number' && !Number.isNaN(percent)) {
          const rounded = Math.max(0, Math.min(100, Math.round(percent)));
          showStatus(`Uploading artwork... ${rounded}%`, 'info');
        }
      });

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

      // Check final status
      if (result.status === 'failed') {
        showStatus(`Processing failed: ${result.error?.message || 'Unknown error'}`, 'error');
        return;
      }

      // Display result
      await displayResult(result);

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
         comparisonSlider.style.display = 'flex';
         
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
   *     current_step: string,
   *     percentage: number
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
      'grid': 'fawkes',  // Grid processing maps to Fawkes cloaking
      'poison': 'nightshade',  // Poison processing maps to Nightshade
      'watermark': 'watermark',
      'c2pa': 'c2pa',
      'photoguard': 'photoguard',
      'mist': 'mist'
    };

    // Parse the status to identify completed and in-progress steps
    const steps = status.steps || {};
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

    // Show percentage if available
    const progress = status.progress || {};
    const percentage = progress.percentage || 0;
    if (percentage > 0) {
      console.log(`Progress: ${currentStep} - ${Math.round(percentage)}%`);
    }
  }

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

    // Create expand icon element that will replace logo text when collapsed
    const expandIconContainer = document.createElement('div');
    expandIconContainer.className = 'hidden items-center translate-x-[13px] transition-transform duration-150';
    expandIconContainer.id = 'sidebar-expand-icon';
    expandIconContainer.innerHTML = `
      <button class="relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-ring bg-transparent hover:bg-gray-alpha-100 rounded-[10px] p-0 h-8 w-8 text-gray-500 hover:text-gray-alpha-950 duration-100 transition-colors">
        <svg width="20px" height="20px" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="w-5 h-5">
          <rect x="7" y="6.5" width="12" height="1.5" rx="0.75" transform="rotate(90 7 6.5)" fill="currentColor"></rect>
          <rect x="3" y="4" width="14" height="12" rx="2.8" stroke="currentColor" stroke-width="1.5"></rect>
        </svg>
      </button>
    `;

    // Insert expand icon after logo container
    if (logoContainer && logoContainer.parentElement) {
      logoContainer.parentElement.insertBefore(expandIconContainer, logoContainer.nextSibling);
    }

    // Handle toggle button click
    toggleButton.addEventListener('click', function(e) {
      e.stopPropagation();
      const isExpanded = sidebar.getAttribute('aria-expanded') === 'true';

      // Toggle sidebar state
      sidebar.setAttribute('aria-expanded', !isExpanded);

      // Update sidebar width
      const root = document.documentElement;
      if (isExpanded) {
        // Collapse: set to icon-only width
        root.style.setProperty('--eleven-sidebar-width', '4rem');
        // Hide logo, show expand icon
        if (logoContainer) {
          logoContainer.style.display = 'none';
        }
        expandIconContainer.style.display = 'flex';
        // Update collapse icon to expand icon (longer rectangle)
        updateToggleIcon(toggleButton, false);
      } else {
        // Expand: set to full width
        root.style.setProperty('--eleven-sidebar-width', '16rem');
        // Show logo, hide expand icon
        if (logoContainer) {
          logoContainer.style.display = 'flex';
        }
        expandIconContainer.style.display = 'none';
        // Update expand icon to collapse icon (shorter rectangle)
        updateToggleIcon(toggleButton, true);
      }
    });

    // Also handle click on expand icon when collapsed
    expandIconContainer.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleButton.click();
    });
  }

  /**
   * Update toggle icon between collapse and expand states
   */
  function updateToggleIcon(button, isExpanded) {
    const svg = button.querySelector('svg');
    if (!svg) return;

    // Update the rectangle height (7 for collapse, 12 for expand)
    const rect = svg.querySelector('rect[transform]');
    if (rect) {
      rect.setAttribute('height', isExpanded ? '7' : '12');
    }
  }

})();
