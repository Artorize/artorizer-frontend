/**
 * Error Handler Component
 *
 * Provides toast notifications and error handling UI.
 */

/**
 * Error Handler Singleton
 */
export class ErrorHandler {
  static toasts = [];
  static stylesInjected = false;

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'error', 'success', 'warning', 'info'
   * @param {number} duration - Duration in ms (default 5000)
   */
  static show(message, type = 'info', duration = 5000) {
    this.injectStyles();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Add icon based on type
    const icon = this.getIcon(type);
    toast.innerHTML = `
      <div class="toast-content">
        ${icon}
        <span class="toast-message">${this.escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
      </div>
    `;

    // Add to container
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    container.appendChild(toast);
    this.toasts.push(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Setup close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.hideToast(toast);
    });

    // Auto-hide
    if (duration > 0) {
      setTimeout(() => {
        this.hideToast(toast);
      }, duration);
    }

    return toast;
  }

  /**
   * Hide a specific toast
   */
  static hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  }

  /**
   * Show error toast
   */
  static showError(error) {
    let message = 'An error occurred';

    if (typeof error === 'string') {
      message = error;
    } else if (error.code) {
      message = this.getErrorMessage(error.code, error.message);
    } else if (error.message) {
      message = error.message;
    }

    this.show(message, 'error');
  }

  /**
   * Show success toast
   */
  static showSuccess(message) {
    this.show(message, 'success');
  }

  /**
   * Show warning toast
   */
  static showWarning(message) {
    this.show(message, 'warning');
  }

  /**
   * Show info toast
   */
  static showInfo(message) {
    this.show(message, 'info');
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(code, fallback) {
    const messages = {
      'AUTH_REQUIRED': 'Please sign in to continue',
      'SESSION_EXPIRED': 'Your session has expired. Please sign in again.',
      'FORBIDDEN': 'You do not have permission to access this resource',
      'NETWORK_ERROR': 'Network error. Please check your connection.',
      'UPLOAD_FAILED': 'Upload failed. Please try again.',
      'INVALID_FILE_TYPE': 'Invalid file type. Please upload a valid image.',
      'FILE_TOO_LARGE': 'File is too large. Maximum size is 10MB.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.'
    };

    return messages[code] || fallback || 'An error occurred';
  }

  /**
   * Get icon for toast type
   */
  static getIcon(type) {
    const icons = {
      error: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`,
      success: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`,
      warning: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`,
      info: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`
    };

    return icons[type] || icons.info;
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Inject toast styles
   */
  static injectStyles() {
    if (this.stylesInjected) return;

    const styles = `
      <style id="toast-styles">
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 420px;
        }

        .toast {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .toast.show {
          opacity: 1;
          transform: translateX(0);
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .toast-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }

        .toast-close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .toast-close:hover {
          background: #f3f4f6;
          color: #6b7280;
        }

        .toast-error {
          border-left: 4px solid #ef4444;
        }

        .toast-error .toast-icon {
          color: #ef4444;
        }

        .toast-success {
          border-left: 4px solid #10b981;
        }

        .toast-success .toast-icon {
          color: #10b981;
        }

        .toast-warning {
          border-left: 4px solid #f59e0b;
        }

        .toast-warning .toast-icon {
          color: #f59e0b;
        }

        .toast-info {
          border-left: 4px solid #3b82f6;
        }

        .toast-info .toast-icon {
          color: #3b82f6;
        }

        @media (max-width: 640px) {
          .toast-container {
            left: 20px;
            right: 20px;
            max-width: none;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
    this.stylesInjected = true;
  }

  /**
   * Clear all toasts
   */
  static clearAll() {
    this.toasts.forEach(toast => this.hideToast(toast));
  }
}
