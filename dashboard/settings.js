/**
 * Settings Modal Logic
 * Handles username update and artwork table in settings
 */

(function() {
  'use strict';

  let isUpdating = false;
  let isLoadingHistory = false;
  let isDeleting = false;
  let isInitialized = false;
  let allArtworks = [];

  // Placeholder artworks for local development
  const placeholderArtworks = [
    { id: 'placeholder-1', title: 'Mountain Sunrise', artist: 'Demo', createdAt: '2026-02-08T10:30:00Z', isPublic: true, visibility: 'public' },
    { id: 'placeholder-2', title: 'Portrait Study #4', artist: 'Demo', createdAt: '2026-02-07T14:20:00Z', isPublic: false, visibility: 'private' },
    { id: 'placeholder-3', title: 'Abstract Flow', artist: 'Demo', createdAt: '2026-02-05T09:15:00Z', isPublic: true, visibility: 'public' },
    { id: 'placeholder-4', title: 'City at Night', artist: 'Demo', createdAt: '2026-01-28T16:45:00Z', isPublic: false, visibility: 'private' },
    { id: 'placeholder-5', title: 'Ocean Waves', artist: 'Demo', createdAt: '2026-01-20T11:00:00Z', isPublic: true, visibility: 'public' },
  ];

  const modal = document.getElementById('settings-modal');
  const modalContent = modal?.querySelector('.settings-modal-content');
  const modalBackdrop = modal?.querySelector('.settings-modal-backdrop');
  const closeButtons = modal?.querySelectorAll('.settings-modal-close');

  function openSettingsModal() {
    if (!modal) return;
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

  function closeSettingsModal() {
    if (!modal) return;
    if (modalBackdrop) modalBackdrop.style.opacity = '0';
    if (modalContent) {
      modalContent.style.opacity = '0';
      modalContent.style.transform = 'scale(0.95)';
    }
    setTimeout(() => { modal.classList.add('hidden'); }, 200);
  }

  async function initSettings() {
    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    if (!usernameInput || !saveUsernameBtn) return;

    await loadCurrentUsername();
    saveUsernameBtn.addEventListener('click', handleUsernameSave);
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleUsernameSave();
    });
    await loadArtworkHistory();
  }

  async function loadCurrentUsername() {
    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user?.username) {
          const input = document.getElementById('username-input');
          if (input) input.value = data.user.username;
        }
      }
    } catch (error) {
      console.error('Failed to load username:', error);
    }
  }

  async function handleUsernameSave() {
    if (isUpdating) return;
    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const usernameStatus = document.getElementById('username-status');
    const newUsername = usernameInput.value.trim();

    if (!newUsername || newUsername.length < 3) {
      showStatus(usernameStatus, 'Username must be at least 3 characters', 'error');
      return;
    }
    if (newUsername.length > 30) {
      showStatus(usernameStatus, 'Username must be 30 characters or less', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      showStatus(usernameStatus, 'Only letters, numbers, underscores, and hyphens', 'error');
      return;
    }

    isUpdating = true;
    saveUsernameBtn.disabled = true;
    showStatus(usernameStatus, 'Saving...', 'info');

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/users/me`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      });
      const data = await response.json();
      if (response.ok) {
        showStatus(usernameStatus, 'Saved', 'success');
      } else if (response.status === 409) {
        showStatus(usernameStatus, 'Username taken', 'error');
      } else {
        showStatus(usernameStatus, data.message || 'Failed', 'error');
      }
    } catch (error) {
      showStatus(usernameStatus, 'Network error', 'error');
    } finally {
      isUpdating = false;
      saveUsernameBtn.disabled = false;
    }
  }

  async function loadArtworkHistory() {
    if (isLoadingHistory) return;

    const historyList = document.getElementById('history-list');
    const historyLoading = document.getElementById('history-loading');
    const historyEmpty = document.getElementById('history-empty');
    const historyError = document.getElementById('history-error');
    const historyTable = document.getElementById('history-table');

    if (!historyList) return;

    isLoadingHistory = true;
    if (historyLoading) historyLoading.style.display = 'flex';
    if (historyEmpty) historyEmpty.style.display = 'none';
    if (historyError) historyError.style.display = 'none';
    if (historyTable) historyTable.style.display = 'none';
    historyList.innerHTML = '';

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/artworks/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (historyLoading) historyLoading.style.display = 'none';

      if (response.ok) {
        const data = await response.json();
        allArtworks = data.artworks || [];

        if (allArtworks.length === 0) {
          // Use placeholders for dev
          allArtworks = placeholderArtworks;
        }
        renderTable();
      } else {
        // Use placeholders on error (local dev)
        allArtworks = placeholderArtworks;
        renderTable();
      }
    } catch (error) {
      console.warn('Using placeholder data:', error.message);
      if (historyLoading) historyLoading.style.display = 'none';
      // Fall back to placeholder data for local dev
      allArtworks = placeholderArtworks;
      renderTable();
    } finally {
      isLoadingHistory = false;
    }
  }

  function renderTable() {
    const historyList = document.getElementById('history-list');
    const historyTable = document.getElementById('history-table');
    const historyEmpty = document.getElementById('history-empty');
    const artworkCountEl = document.getElementById('settings-artwork-count');

    if (!historyList) return;
    historyList.innerHTML = '';

    if (artworkCountEl) {
      artworkCountEl.textContent = allArtworks.length === 1 ? '1 artwork' : `${allArtworks.length} artworks`;
    }

    if (allArtworks.length === 0) {
      if (historyEmpty) historyEmpty.style.display = 'flex';
      if (historyTable) historyTable.style.display = 'none';
      return;
    }

    if (historyTable) historyTable.style.display = 'table';

    allArtworks.forEach(artwork => {
      const row = createTableRow(artwork);
      historyList.appendChild(row);
    });
  }

  function createTableRow(artwork) {
    const tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid var(--art-border-subtle);transition:background 0.1s;';
    tr.addEventListener('mouseenter', () => { tr.style.backgroundColor = 'var(--art-surface-hover)'; });
    tr.addEventListener('mouseleave', () => { tr.style.backgroundColor = ''; });

    const isPublic = artwork.isPublic || artwork.visibility === 'public';
    const createdAt = new Date(artwork.createdAt);
    const dateStr = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Name cell
    const nameCell = document.createElement('td');
    nameCell.style.cssText = 'padding:0.625rem var(--art-space-5);font-size:var(--art-text-sm);font-weight:500;color:var(--art-text);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    nameCell.textContent = artwork.title || 'Untitled';

    // Date cell
    const dateCell = document.createElement('td');
    dateCell.style.cssText = 'padding:0.625rem 0.75rem;font-size:var(--art-text-xs);color:var(--art-text-faint);white-space:nowrap;';
    dateCell.textContent = dateStr;

    // Status cell
    const statusCell = document.createElement('td');
    statusCell.style.cssText = 'padding:0.625rem 0.75rem;';

    const badge = document.createElement('span');
    badge.style.cssText = `display:inline-flex;align-items:center;padding:0.125rem 0.5rem;border-radius:9999px;font-size:0.6875rem;font-weight:500;${
      isPublic
        ? 'background:rgba(16,185,129,0.1);color:#059669;'
        : 'background:var(--art-surface-active);color:var(--art-text-muted);'
    }`;
    badge.textContent = isPublic ? 'Public' : 'Private';
    statusCell.appendChild(badge);

    // Action cell
    const actionCell = document.createElement('td');
    actionCell.style.cssText = 'padding:0.625rem var(--art-space-5);text-align:right;';

    const deleteBtn = document.createElement('button');
    deleteBtn.style.cssText = 'width:1.5rem;height:1.5rem;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--art-radius-sm);color:var(--art-text-faint);background:transparent;border:none;cursor:pointer;opacity:0;transition:all 0.15s;';
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteArtwork(artwork.id, tr);
    });
    deleteBtn.addEventListener('mouseenter', () => { deleteBtn.style.color = 'var(--art-danger)'; deleteBtn.style.background = 'var(--art-danger-bg)'; });
    deleteBtn.addEventListener('mouseleave', () => { deleteBtn.style.color = 'var(--art-text-faint)'; deleteBtn.style.background = 'transparent'; });

    // Show delete button on row hover
    tr.addEventListener('mouseenter', () => { deleteBtn.style.opacity = '1'; });
    tr.addEventListener('mouseleave', () => { deleteBtn.style.opacity = '0'; });

    actionCell.appendChild(deleteBtn);

    tr.appendChild(nameCell);
    tr.appendChild(dateCell);
    tr.appendChild(statusCell);
    tr.appendChild(actionCell);

    return tr;
  }

  async function deleteArtwork(artworkId, rowElement) {
    if (isDeleting) return;
    if (!confirm('Delete this artwork? This cannot be undone.')) return;

    isDeleting = true;
    rowElement.style.opacity = '0.5';

    try {
      const response = await fetch(`${window.ArtorizeConfig.ROUTER_URL}/artworks/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok || artworkId.startsWith('placeholder')) {
        allArtworks = allArtworks.filter(a => (a.id || a._id) !== artworkId);
        renderTable();
      } else {
        rowElement.style.opacity = '1';
        alert('Failed to delete artwork');
      }
    } catch (error) {
      rowElement.style.opacity = '1';
      // Allow placeholder deletion even on network error
      if (artworkId.startsWith('placeholder')) {
        allArtworks = allArtworks.filter(a => (a.id || a._id) !== artworkId);
        renderTable();
      }
    } finally {
      isDeleting = false;
    }
  }

  function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.style.color = type === 'success' ? 'var(--art-success)' : type === 'error' ? 'var(--art-danger)' : 'var(--art-text-muted)';
  }

  function setupModalListeners() {
    if (closeButtons) {
      closeButtons.forEach(btn => btn.addEventListener('click', closeSettingsModal));
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', closeSettingsModal);
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal?.classList.contains('hidden')) closeSettingsModal();
    });
  }

  window.openSettingsModal = openSettingsModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupModalListeners);
  } else {
    setupModalListeners();
  }
})();
