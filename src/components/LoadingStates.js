/**
 * Loading States Component
 *
 * Provides various loading indicators and skeleton screens.
 */

/**
 * Loading States Manager
 */
export class LoadingStates {
  static stylesInjected = false;

  /**
   * Show page loading overlay
   * @param {string} message - Loading message
   */
  static showPageLoading(message = 'Loading...') {
    this.injectStyles();

    // Remove existing loader if present
    this.hidePageLoading();

    const loading = document.createElement('div');
    loading.id = 'page-loading';
    loading.className = 'page-loading-overlay';
    loading.innerHTML = `
      <div class="page-loading-content">
        <div class="spinner-large"></div>
        <p class="loading-message">${this.escapeHtml(message)}</p>
      </div>
    `;

    document.body.appendChild(loading);
    document.body.style.overflow = 'hidden';

    // Fade in
    setTimeout(() => {
      loading.classList.add('show');
    }, 10);
  }

  /**
   * Hide page loading overlay
   */
  static hidePageLoading() {
    const loading = document.getElementById('page-loading');
    if (loading) {
      loading.classList.remove('show');
      setTimeout(() => {
        loading.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  }

  /**
   * Update page loading message
   * @param {string} message - New loading message
   */
  static updatePageLoadingMessage(message) {
    const messageEl = document.querySelector('#page-loading .loading-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  /**
   * Show skeleton screen in container
   * @param {Element|string} container - Container element or selector
   * @param {number} lines - Number of skeleton lines (default 3)
   */
  static showSkeletonScreen(container, lines = 3) {
    this.injectStyles();

    const containerEl = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!containerEl) return;

    const skeletonLines = Array.from({ length: lines }, () =>
      '<div class="skeleton-line"></div>'
    ).join('');

    containerEl.innerHTML = `
      <div class="skeleton-container">
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          ${skeletonLines}
        </div>
      </div>
    `;
  }

  /**
   * Show skeleton grid in container
   * @param {Element|string} container - Container element or selector
   * @param {number} items - Number of skeleton items (default 6)
   */
  static showSkeletonGrid(container, items = 6) {
    this.injectStyles();

    const containerEl = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!containerEl) return;

    const skeletonItems = Array.from({ length: items }, () =>
      '<div class="skeleton-card"></div>'
    ).join('');

    containerEl.innerHTML = `
      <div class="skeleton-grid">
        ${skeletonItems}
      </div>
    `;
  }

  /**
   * Create a loading button
   * @param {string} text - Button text
   * @param {boolean} isLoading - Whether button is in loading state
   * @returns {HTMLButtonElement}
   */
  static createLoadingButton(text, isLoading = false) {
    this.injectStyles();

    const btn = document.createElement('button');
    btn.className = 'btn-loading';
    btn.disabled = isLoading;

    if (isLoading) {
      btn.innerHTML = `
        <span class="spinner-small"></span>
        <span>${this.escapeHtml(text)}</span>
      `;
      btn.classList.add('is-loading');
    } else {
      btn.textContent = text;
    }

    return btn;
  }

  /**
   * Show inline spinner
   * @param {Element|string} container - Container element or selector
   * @param {string} size - Size: 'small', 'medium', 'large'
   */
  static showSpinner(container, size = 'medium') {
    this.injectStyles();

    const containerEl = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!containerEl) return;

    containerEl.innerHTML = `
      <div class="spinner-container">
        <div class="spinner-${size}"></div>
      </div>
    `;
  }

  /**
   * Escape HTML
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Inject loading styles
   */
  static injectStyles() {
    if (this.stylesInjected) return;

    const styles = `
      <style id="loading-styles">
        /* Page Loading Overlay */
        .page-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .page-loading-overlay.show {
          opacity: 1;
        }

        .page-loading-content {
          text-align: center;
        }

        .loading-message {
          margin: 20px 0 0;
          color: #6b7280;
          font-size: 15px;
        }

        /* Spinners */
        .spinner-small,
        .spinner-medium,
        .spinner-large {
          border: 3px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        .spinner-medium {
          width: 32px;
          height: 32px;
        }

        .spinner-large {
          width: 48px;
          height: 48px;
          border-width: 4px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spinner-container {
          display: flex;
          justify-content: center;
          padding: 40px;
        }

        /* Skeleton Screens */
        .skeleton-container {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-header {
          width: 60%;
          height: 32px;
          background: #e5e7eb;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          height: 16px;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .skeleton-line:nth-child(1) {
          width: 90%;
        }

        .skeleton-line:nth-child(2) {
          width: 95%;
        }

        .skeleton-line:nth-child(3) {
          width: 85%;
        }

        /* Skeleton Grid */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 24px;
        }

        .skeleton-card {
          aspect-ratio: 4/3;
          background: #e5e7eb;
          border-radius: 12px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-card:nth-child(even) {
          animation-delay: 0.15s;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        /* Loading Button */
        .btn-loading {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-loading:not(.is-loading):hover {
          background: #5568d3;
          transform: translateY(-1px);
        }

        .btn-loading.is-loading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-loading .spinner-small {
          border-color: rgba(255, 255, 255, 0.3);
          border-top-color: white;
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
    this.stylesInjected = true;
  }
}

/**
 * Convenience functions
 */
export const showPageLoading = LoadingStates.showPageLoading.bind(LoadingStates);
export const hidePageLoading = LoadingStates.hidePageLoading.bind(LoadingStates);
export const showSkeletonScreen = LoadingStates.showSkeletonScreen.bind(LoadingStates);
export const showSkeletonGrid = LoadingStates.showSkeletonGrid.bind(LoadingStates);
export const showSpinner = LoadingStates.showSpinner.bind(LoadingStates);
