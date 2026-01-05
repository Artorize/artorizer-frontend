/**
 * User Profile Component
 *
 * Renders user profile information and handles profile-related interactions.
 */

/**
 * User Profile Component Class
 */
export class UserProfile {
  constructor(containerSelector) {
    this.container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!this.container) {
      console.error('UserProfile: Container not found');
    }

    this.onSignOut = null;
    this.onProfileClick = null;
  }

  /**
   * Render user profile
   * @param {Object} user - User object from session
   */
  render(user) {
    if (!this.container) return;

    if (!user) {
      this.container.innerHTML = '';
      return;
    }

    const avatarUrl = user.image || this.getDefaultAvatar(user);
    const userName = user.name || user.email || 'User';
    const userEmail = user.email || '';

    this.container.innerHTML = `
      <div class="user-profile">
        <button class="profile-button" id="profile-btn">
          <img src="${avatarUrl}"
               alt="${userName}"
               class="user-avatar"
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect width=%22150%22 height=%22150%22 fill=%22%23667eea%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2260%22%3E${userName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E'">
          <div class="user-info">
            <span class="user-name">${this.escapeHtml(userName)}</span>
            ${userEmail ? `<span class="user-email">${this.escapeHtml(userEmail)}</span>` : ''}
          </div>
          <svg class="dropdown-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>

        <div class="dropdown-menu hidden" id="profile-menu">
          <div class="dropdown-header">
            <div class="dropdown-user-name">${this.escapeHtml(userName)}</div>
            <div class="dropdown-user-email">${this.escapeHtml(userEmail)}</div>
          </div>
          <div class="dropdown-divider"></div>
          <a href="/dashboard/dashboard-modular.html" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Dashboard
          </a>
          <a href="/dashboard/gallery.html" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
            </svg>
            My Artworks
          </a>
          <a href="/dashboard/dashboard-modular.html" class="dropdown-item" id="settings-link" data-action="settings">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
            Settings
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="sign-out-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.injectStyles();
  }

  /**
   * Attach event listeners to profile elements
   */
  attachEventListeners() {
    const profileBtn = document.getElementById('profile-btn');
    const menu = document.getElementById('profile-menu');
    const settingsLink = document.getElementById('settings-link');
    const signOutBtn = document.getElementById('sign-out-btn');

    if (profileBtn && menu) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');

        if (this.onProfileClick) {
          this.onProfileClick();
        }
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });
    }

    if (settingsLink) {
      settingsLink.addEventListener('click', (e) => {
        if (window.openSettingsModal) {
          e.preventDefault();
          menu?.classList.add('hidden');
          window.openSettingsModal();
        }
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        if (this.onSignOut) {
          this.onSignOut();
        }
      });
    }
  }

  /**
   * Get default avatar based on user's initials
   */
  getDefaultAvatar(user) {
    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='60'%3E${initial}%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('user-profile-styles')) return;

    const styles = `
      <style id="user-profile-styles">
        .user-profile {
          position: relative;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-button:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .user-email {
          font-size: 12px;
          color: #6b7280;
        }

        .dropdown-icon {
          color: #9ca3af;
          transition: transform 0.2s;
        }

        .profile-button:hover .dropdown-icon {
          color: #667eea;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 240px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          padding: 8px;
          z-index: 1000;
        }

        .dropdown-menu.hidden {
          display: none;
        }

        .dropdown-header {
          padding: 12px;
        }

        .dropdown-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .dropdown-user-email {
          font-size: 12px;
          color: #6b7280;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 8px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          color: #374151;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
        }

        .dropdown-item svg {
          flex-shrink: 0;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .user-info {
            display: none;
          }

          .dropdown-menu {
            right: -8px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Clear the profile display
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
