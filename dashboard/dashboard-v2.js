/**
 * Artorize Dashboard V2 - UI Interactions
 *
 * This script provides additional interactions specific to the V2 dashboard layout
 * It works alongside the main dashboard.js to provide a complete user experience
 */

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Artorize Dashboard V2 initializing...');

    // Initialize tab switching
    initializeTabs();

    // Initialize sidebar collapse/expand
    initializeSidebarToggle();

    // Initialize file upload interactions
    initializeFileUpload();

    // Initialize tooltips and info buttons
    initializeInfoButtons();

    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();

    console.log('Artorize Dashboard V2 initialized successfully');
  });

  /**
   * Initialize tab switching functionality
   */
  function initializeTabs() {
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
   * Initialize sidebar collapse/expand toggle
   */
  function initializeSidebarToggle() {
    const sidebarToggleBtn = document.querySelector('[aria-expanded]').parentElement.querySelector('button');
    const sidebar = document.querySelector('[aria-expanded]');

    if (sidebarToggleBtn && sidebar) {
      sidebarToggleBtn.addEventListener('click', function() {
        const isExpanded = sidebar.getAttribute('aria-expanded') === 'true';
        sidebar.setAttribute('aria-expanded', !isExpanded);

        // Update HTML custom property
        const htmlElement = document.documentElement;
        htmlElement.style.setProperty('--eleven-sidebar-collapsed', isExpanded ? '1' : '0');
      });
    }
  }

  /**
   * Initialize file upload interactions
   */
  function initializeFileUpload() {
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    const uploadArea = document.querySelector('[role="presentation"]');

    if (fileInput && uploadArea) {
      // Click upload area to trigger file input
      uploadArea.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT') {
          fileInput.click();
        }
      });

      // Drag and drop support
      uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });

      uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
      });

      uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          // Check if file is an image
          const file = files[0];
          if (file.type.startsWith('image/')) {
            // Set the file to the input element
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
          } else {
            alert('Please upload an image file');
          }
        }
      });

      // File input change handler
      fileInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) {
          console.log('File selected:', file.name);
          // The main dashboard.js will handle the actual processing
          // This is just for UI feedback
          showFilePreview(file);
        }
      });
    }
  }

  /**
   * Show file preview after upload
   */
  function showFilePreview(file) {
    // Create a preview or update UI to show the file is uploaded
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

    console.log(`File uploaded: ${fileName} (${fileSize})`);
  }

  /**
   * Initialize info button tooltips
   */
  function initializeInfoButtons() {
    const infoButtons = document.querySelectorAll('[aria-label*="info"], [aria-label*="Information"]');

    infoButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        // Show tooltip or modal with information
        // For now, just log to console
        console.log('Info button clicked');
      });
    });
  }

  /**
   * Initialize keyboard shortcuts
   */
  function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + Enter to submit form
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitButton = document.querySelector('button[aria-label*="Protect"], button[aria-label*="Generate"]');
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
        openDialogs.forEach(dialog => {
          const closeButton = dialog.querySelector('button[aria-label*="Close"]');
          if (closeButton) {
            closeButton.click();
          }
        });
      }
    });
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.Toastify');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'error' ? '#dd4949' : type === 'success' ? '#22c55e' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideInUp 0.3s ease-out;
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Export functions for use by dashboard.js
  window.ArtorizeV2 = {
    showToast: showToast
  };

})();
