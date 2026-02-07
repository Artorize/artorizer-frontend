/**
 * Settings Modal Logic
 * Handles username update and artwork history management in a modal dialog
 */

(function() {
  'use strict';

  let isUpdating = false;
  let isLoadingHistory = false;
  let isDeleting = false;
  let isInitialized = false;
  let showingAllHistory = false;
  let allArtworks = [];

  const modal = document.getElementById('settings-modal');
  const modalContent = modal?.querySelector('.settings-modal-content');
  const modalBackdrop = modal?.querySelector('.settings-modal-backdrop');
  const closeButtons = modal?.querySelectorAll('.settings-modal-close');

  /**
   * Open settings modal and initialize content
   */
  function openSettingsModal() {
    if (!modal) {
      console.error('Settings modal not found');
      return;
    }

    modal.classList.remove('hidden');

    requestAnimationFrame(() => {
      if (modalBackdrop) modalBackdrop.style.opacity = '1';
      if (modalContent) {
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
      }
    });

    if (!isInitialized) {
      initSettings();
      isInitialized = true;
    } else {
      loadArtworkHistory();
    }
  }

  /**
   * Close settings modal
   */
  function closeSettingsModal() {
    if (!modal) return;

    if (modalBackdrop) modalBackdrop.style.opacity = '0';
    if (modalContent) {
      modalContent.style.opacity = '0';
      modalContent.style.transform = 'scale(0.95)';
    }

    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  }

  /**
   * Initialize settings modal functionality
   */
  async function initSettings() {
    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const usernameStatus = document.getElementById('username-status');

    if (!usernameInput || !saveUsernameBtn || !usernameStatus) {
      console.error('Required settings elements not found');
      return;
    }

    await loadCurrentUsername();

    saveUsernameBtn.addEventListener('click', handleUsernameSave);

    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleUsernameSave();
      }
    });

    await loadArtworkHistory();
  }

  /**
   * Load current username from backend
   */
  async function loadCurrentUsername() {
    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.username) {
          const usernameInput = document.getElementById('username-input');
          if (usernameInput) {
            usernameInput.value = data.user.username;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load username:', error);
    }
  }

  /**
   * Handle username save
   */
  async function handleUsernameSave() {
    if (isUpdating) return;

    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const usernameStatus = document.getElementById('username-status');

    const newUsername = usernameInput.value.trim();

    if (!newUsername) {
      showStatus(usernameStatus, 'Username cannot be empty', 'error');
      return;
    }

    if (newUsername.length < 3) {
      showStatus(usernameStatus, 'Username must be at least 3 characters', 'error');
      return;
    }

    if (newUsername.length > 30) {
      showStatus(usernameStatus, 'Username must be 30 characters or less', 'error');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(newUsername)) {
      showStatus(usernameStatus, 'Username can only contain letters, numbers, underscores, and hyphens', 'error');
      return;
    }

    isUpdating = true;
    saveUsernameBtn.disabled = true;
    showStatus(usernameStatus, 'Updating username...', 'info');

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/users/me`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newUsername })
      });

      const data = await response.json();

      if (response.ok) {
        showStatus(usernameStatus, 'Username updated successfully!', 'success');
      } else if (response.status === 409) {
        showStatus(usernameStatus, data.message || 'Username already taken', 'error');
      } else if (response.status === 401) {
        showStatus(usernameStatus, 'Please log in to update your username', 'error');
        setTimeout(() => {
          window.location.href = '/auth/login.html';
        }, 2000);
      } else {
        showStatus(usernameStatus, data.message || 'Failed to update username', 'error');
      }
    } catch (error) {
      console.error('Username update error:', error);
      showStatus(usernameStatus, 'Network error. Please try again.', 'error');
    } finally {
      isUpdating = false;
      saveUsernameBtn.disabled = false;
    }
  }

  /**
   * Load artwork history from backend
   */
  async function loadArtworkHistory() {
    if (isLoadingHistory) return;

    const historyList = document.getElementById('history-list');
    const historyLoading = document.getElementById('history-loading');
    const historyEmpty = document.getElementById('history-empty');
    const historyError = document.getElementById('history-error');

    if (!historyList || !historyLoading || !historyEmpty || !historyError) {
      console.error('Required history elements not found');
      return;
    }

    isLoadingHistory = true;
    historyLoading.classList.remove('hidden');
    historyEmpty.classList.add('hidden');
    historyError.classList.add('hidden');
    historyList.innerHTML = '';

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/artworks/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        historyLoading.classList.add('hidden');

        if (!data.artworks || data.artworks.length === 0) {
          historyEmpty.classList.remove('hidden');
          return;
        }

        allArtworks = data.artworks;
        showingAllHistory = false;
        renderHistory();

      } else if (response.status === 401) {
        historyLoading.classList.add('hidden');
        showError('Please log in to view your artwork history');
        setTimeout(() => {
          window.location.href = '/auth/login.html';
        }, 2000);
      } else {
        historyLoading.classList.add('hidden');
        showError('Failed to load artwork history');
      }
    } catch (error) {
      console.error('History load error:', error);
      historyLoading.classList.add('hidden');
      showError('Network error. Please try again.');
    } finally {
      isLoadingHistory = false;
    }

    function showError(message) {
      historyError.textContent = message;
      historyError.classList.remove('hidden');
    }
  }

  /**
   * Render history with view all/show less toggle
   */
  function renderHistory() {
    const historyList = document.getElementById('history-list');
    const artworkCountEl = document.getElementById('settings-artwork-count');
    if (!historyList) return;

    historyList.innerHTML = '';

    // Update artwork count
    if (artworkCountEl) {
      artworkCountEl.textContent = allArtworks.length === 1 ? '1 artwork' : `${allArtworks.length} artworks`;
    }

    const artworksToShow = showingAllHistory ? allArtworks : allArtworks.slice(0, 5);

    // Render list items directly (no wrapper needed with new styling)
    artworksToShow.forEach(artwork => {
      const item = createHistoryItem(artwork);
      historyList.appendChild(item);
    });

    // Add toggle button if more than 5 items
    if (allArtworks.length > 5) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'artorize-btn artorize-btn-sm artorize-btn-secondary view-all-history-btn';
      toggleBtn.innerHTML = showingAllHistory
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>Show Less`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>View All (${allArtworks.length})`;
      toggleBtn.addEventListener('click', toggleHistoryView);
      historyList.appendChild(toggleBtn);
    }

    // Add clear all button
    if (allArtworks.length > 0) {
      const clearAllBtn = createClearAllButton();
      historyList.appendChild(clearAllBtn);
    }
  }

  /**
   * Toggle between showing all history and showing only 5 items
   */
  function toggleHistoryView() {
    showingAllHistory = !showingAllHistory;
    renderHistory();
  }

  /**
   * Create a history item element (shadcn-style)
   */
  function createHistoryItem(artwork) {
    const li = document.createElement('li');
    li.className = 'settings-history-item';

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'settings-history-icon';
    iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`;

    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'settings-history-content';

    const title = document.createElement('p');
    title.className = 'settings-history-title';
    title.textContent = artwork.title || 'Untitled';

    const subtitle = document.createElement('p');
    subtitle.className = 'settings-history-subtitle';
    subtitle.textContent = artwork.artist || 'Unknown Artist';

    contentDiv.appendChild(title);
    contentDiv.appendChild(subtitle);

    // Meta (date + status badge)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'settings-history-meta';

    // Status badge
    const isPublic = artwork.isPublic || artwork.visibility === 'public';
    const badge = document.createElement('span');
    badge.className = `artorize-badge ${isPublic ? 'artorize-badge-success' : 'artorize-badge-default'}`;
    badge.innerHTML = isPublic
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Public`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Private`;

    // Date
    const dateSpan = document.createElement('span');
    dateSpan.className = 'settings-history-date';
    const createdAt = new Date(artwork.createdAt);
    dateSpan.textContent = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    metaDiv.appendChild(badge);
    metaDiv.appendChild(dateSpan);

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'settings-history-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'settings-delete-btn';
    deleteBtn.title = 'Delete artwork';
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
    deleteBtn.addEventListener('click', () => deleteArtwork(artwork.id, deleteBtn));

    actionsDiv.appendChild(deleteBtn);

    // Assemble
    li.appendChild(iconDiv);
    li.appendChild(contentDiv);
    li.appendChild(metaDiv);
    li.appendChild(actionsDiv);

    return li;
  }

  /**
   * Create clear all button
   */
  function createClearAllButton() {
    const container = document.createElement('div');
    container.style.cssText = 'margin-top: var(--art-space-4); padding-top: var(--art-space-4); border-top: 1px solid var(--art-border-subtle);';

    const clearAllBtn = document.createElement('button');
    clearAllBtn.id = 'clear-all-btn';
    clearAllBtn.className = 'artorize-btn artorize-btn-sm artorize-btn-danger';
    clearAllBtn.style.width = '100%';
    clearAllBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>Clear All History`;
    clearAllBtn.addEventListener('click', clearAllHistory);

    container.appendChild(clearAllBtn);
    return container;
  }

  /**
   * Delete a single artwork
   */
  async function deleteArtwork(artworkId, button) {
    if (isDeleting) return;

    if (!confirm('Are you sure you want to delete this artwork? This action cannot be undone.')) {
      return;
    }

    isDeleting = true;
    const originalText = button.textContent;
    button.textContent = 'Deleting...';
    button.disabled = true;

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/artworks/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from allArtworks array
        allArtworks = allArtworks.filter(a => a.id !== artworkId);

        // Refresh the view
        if (allArtworks.length === 0) {
          const historyEmpty = document.getElementById('history-empty');
          if (historyEmpty) {
            historyEmpty.classList.remove('hidden');
          }
          const historyList = document.getElementById('history-list');
          if (historyList) {
            historyList.innerHTML = '';
          }
        } else {
          renderHistory();
        }
      } else if (response.status === 401) {
        alert('Please log in to delete artwork');
        setTimeout(() => {
          window.location.href = '/auth/login.html';
        }, 1000);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete artwork');
        button.textContent = originalText;
        button.disabled = false;
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Network error. Please try again.');
      button.textContent = originalText;
      button.disabled = false;
    } finally {
      isDeleting = false;
    }
  }

  /**
   * Clear all artwork history
   */
  async function clearAllHistory() {
    if (isDeleting) return;

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (!clearAllBtn) return;

    if (!confirm('Are you sure you want to delete all your artwork history? This action cannot be undone.')) {
      return;
    }

    isDeleting = true;
    const originalText = clearAllBtn.textContent;
    clearAllBtn.textContent = 'Clearing...';
    clearAllBtn.disabled = true;

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/artworks/me`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Clear allArtworks array
        allArtworks = [];

        // Show empty state
        const historyEmpty = document.getElementById('history-empty');
        if (historyEmpty) {
          historyEmpty.classList.remove('hidden');
        }

        const historyList = document.getElementById('history-list');
        if (historyList) {
          historyList.innerHTML = '';
        }
      } else if (response.status === 401) {
        alert('Please log in to clear your history');
        setTimeout(() => {
          window.location.href = '/auth/login.html';
        }, 1000);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to clear history');
        clearAllBtn.textContent = originalText;
        clearAllBtn.disabled = false;
      }
    } catch (error) {
      console.error('Clear history error:', error);
      alert('Network error. Please try again.');
      clearAllBtn.textContent = originalText;
      clearAllBtn.disabled = false;
    } finally {
      isDeleting = false;
    }
  }

  /**
   * Show status message
   */
  function showStatus(element, message, type) {
    if (!element) return;

    element.textContent = message;
    element.className = 'text-xs mt-2';

    switch (type) {
      case 'success':
        element.classList.add('text-green-600');
        break;
      case 'error':
        element.classList.add('text-red-500');
        break;
      case 'info':
        element.classList.add('text-blue-500');
        break;
      default:
        element.classList.add('text-gray-alpha-500');
    }
  }

  /**
   * Setup modal event listeners
   */
  function setupModalListeners() {
    if (closeButtons) {
      closeButtons.forEach(btn => {
        btn.addEventListener('click', closeSettingsModal);
      });
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', closeSettingsModal);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
        closeSettingsModal();
      }
    });
  }

  // Export function to open modal
  window.openSettingsModal = openSettingsModal;

  // Setup modal listeners when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupModalListeners);
  } else {
    setupModalListeners();
  }
})();
