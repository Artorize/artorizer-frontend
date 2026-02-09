(function () {
  'use strict';

console.log('[Dashboard Enhancements] Version: 1.0.2 | Last Updated: 2025-12-12 15:45 UTC');

// State management
const selectedProtections = new Set();

// Protection name mapping
const protectionNames = {
  'upload': 'Uploading Artwork',
  'fawkes': 'Face Privacy',
  'photoguard': 'Edit Guard',
  'mist': 'Training Block',
  'nightshade': 'Data Poison',
  'c2pa': 'Proof of Origin',
  'watermark': 'Visible Mark'
};

// Toggle protection card selection
function toggleProtection(card) {
  const protection = card.getAttribute('data-protection');

  if (card.classList.contains('selected')) {
    card.classList.remove('selected');
    selectedProtections.delete(protection);
  } else {
    card.classList.add('selected');
    selectedProtections.add(protection);
  }

  updateProgressTracker();
}

// Preset definitions
const presets = {
  'lite': ['nightshade'],
  'partial': ['nightshade', 'mist', 'c2pa'],
  'full': ['fawkes', 'photoguard', 'mist', 'nightshade', 'c2pa', 'watermark']
};

// Apply a protection preset
function applyPreset(presetName) {
  const protections = presets[presetName];
  if (!protections) return;

  // Clear all current selections
  document.querySelectorAll('.protection-card.selected').forEach(card => {
    card.classList.remove('selected');
  });
  selectedProtections.clear();

  // Select the preset's protections
  protections.forEach(protection => {
    const card = document.querySelector(`.protection-card[data-protection="${protection}"]`);
    if (card) {
      card.classList.add('selected');
      selectedProtections.add(protection);
    }
  });

  // Update preset button highlights
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.remove('border-foreground', 'bg-gray-50', 'text-foreground');
    btn.classList.add('border-gray-200', 'text-subtle');
  });
  const activePreset = document.querySelector(`.preset-btn[data-preset="${presetName}"]`);
  if (activePreset) {
    activePreset.classList.add('border-foreground', 'bg-gray-50', 'text-foreground');
    activePreset.classList.remove('border-gray-200', 'text-subtle');
  }

  // Set watermark strategy based on preset
  if (presetName === 'lite' || presetName === 'partial') {
    selectWatermarkStrategy('invisible-watermark', 'Invisible Watermark');
  } else if (presetName === 'full') {
    selectWatermarkStrategy('visible-watermark', 'Visible Watermark');
  }

  updateProgressTracker();
}

// Update progress tracker based on selected protections
function updateProgressTracker() {
  const container = document.getElementById('progress-tracker-content');

  // Check if watermark is selected
  const watermarkSelect = document.getElementById('watermark-strategy');
  const hasWatermark = watermarkSelect && watermarkSelect.value;

  // Build array of selected protections
  const protections = Array.from(selectedProtections);
  if (hasWatermark) {
    protections.push('watermark');
  }

  if (protections.length === 0) {
    // Show empty state
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-16 h-16 text-gray-300 mb-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="4" stroke-dasharray="6 4"/>
          <path d="M16 24l6 6 10-12" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="text-sm text-subtle">Select protection layers to begin</p>
      </div>
    `;
    return;
  }

  // Always add upload as the first step
  protections.unshift('upload');

  // Generate progress steps - all start as pending
  let stepsHTML = '';
  protections.forEach((protection, index) => {
    const name = protectionNames[protection] || protection;

    // All steps start as pending (will be updated by API callback)
    const iconHTML = `<svg class="mr-3 flex-shrink-0 ml-1" height="16" viewBox="0 0 16 16" version="1.1" width="16" aria-hidden="true">
      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z" fill="currentColor"></path>
    </svg>`;
    const timeHTML = `<div class="text-mono text-normal text-small float-right text-xs text-subtle">-</div>`;
    const textClass = 'text-subtle';

    stepsHTML += `
      <div class="CheckStep rounded-2 px-2" data-step-number="${index + 1}" data-conclusion="pending" data-protection="${protection}">
        <div class="CheckStep-header p-2 mb-1 rounded-2">
          <div class="d-flex flex-items-center">
            ${iconHTML}
            <span class="flex-1 ml-n1 mr-1 css-truncate css-truncate-overflow user-select-none text-sm ${textClass}">${name}</span>
            ${timeHTML}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = stepsHTML;
}

// Update progress step status (to be called by API callback)
// Usage: updateProgressStep('fawkes', 'in-progress') - start processing
//        updateProgressStep('fawkes', 'success', '2.5s') - mark complete
//        updateProgressStep('fawkes', 'error', 'Failed') - mark failed
// Supported status: 'pending', 'in-progress'/'processing', 'success'/'completed', 'error'/'failed'
function updateProgressStep(protection, status, time) {
  // Target only progress tracker items, not protection cards
  const container = document.getElementById('progress-tracker-content');
  const step = container ? container.querySelector(`[data-protection="${protection}"]`) : null;
  if (!step) {
    console.log(`[Progress] Step not found for protection: ${protection}`);
    return;
  }

  console.log(`[Progress] Updating step ${protection} to ${status}`, time !== undefined ? time : '');

  const header = step.querySelector('.CheckStep-header .d-flex');
  if (!header) {
    console.warn(`[Progress] Header element not found for protection: ${protection}`);
    return;
  }

  const name = protectionNames[protection] || protection;

  let iconHTML = '';
  let timeHTML = '';
  let textClass = '';

  if (status === 'success' || status === 'completed') {
    iconHTML = `<svg class="mr-3 flex-shrink-0 ml-1 text-green-600" title="This step passed" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
      <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z" fill="currentColor"></path>
    </svg>`;
    timeHTML = `<div class="text-mono text-normal text-small float-right text-xs">${time || '0.0s'}</div>`;
    step.setAttribute('data-conclusion', 'success');
  } else if (status === 'in-progress' || status === 'processing') {
    iconHTML = `<svg width="16" height="16" fill="none" class="anim-rotate mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" aria-label="In progress">
      <path opacity=".5" d="M8 15A7 7 0 108 1a7 7 0 000 14v0z" stroke="currentColor" stroke-width="2"></path>
      <path d="M15 8a7 7 0 01-7 7" stroke="currentColor" stroke-width="2"></path>
      <path d="M8 12a4 4 0 100-8 4 4 0 000 8z" fill="currentColor"></path>
    </svg>`;
    timeHTML = `<div class="text-mono text-normal text-small float-right text-xs">...</div>`;
    step.setAttribute('data-conclusion', 'in-progress');
  } else if (status === 'error' || status === 'failed') {
    iconHTML = `<svg class="mr-3 flex-shrink-0 ml-1 text-red-600" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
      <path d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z" fill="currentColor"></path>
    </svg>`;
    timeHTML = `<div class="text-mono text-normal text-small float-right text-xs text-red-600">${time || 'Failed'}</div>`;
    step.setAttribute('data-conclusion', 'failure');
  } else {
    // pending
    iconHTML = `<svg class="mr-3 flex-shrink-0 ml-1" height="16" viewBox="0 0 16 16" version="1.1" width="16" aria-hidden="true">
      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z" fill="currentColor"></path>
    </svg>`;
    timeHTML = `<div class="text-mono text-normal text-small float-right text-xs text-subtle">-</div>`;
    textClass = 'text-subtle';
    step.setAttribute('data-conclusion', 'pending');
  }

  header.innerHTML = `
    ${iconHTML}
    <span class="flex-1 ml-n1 mr-1 css-truncate css-truncate-overflow user-select-none text-sm ${textClass}">${name}</span>
    ${timeHTML}
  `;
}

// Gallery state
let galleryArtworksData = [];
let gallerySearchDebounce = null;

// Toggle Gallery Modal
function toggleHistoryModal() {
  console.log('[Gallery Modal] Toggling gallery modal...');
  let modal = document.getElementById('gallery-modal');

  if (!modal) {
    createGalleryModal();
    loadGalleryArtworks();
  } else {
    if (modal.style.display === 'none') {
      modal.style.display = 'flex';
      loadGalleryArtworks();
    } else {
      modal.style.display = 'none';
    }
  }
}

// Create gallery modal structure
function createGalleryModal() {
  const modal = document.createElement('div');
  modal.id = 'gallery-modal';
  modal.className = 'artorize-modal-backdrop';
  modal.style.cssText = 'position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);';

  modal.innerHTML = `
    <div class="artorize-modal-content" style="width: min(900px, calc(100vw - 48px)); max-height: calc(100vh - 96px); display: flex; flex-direction: column;">
      <div class="artorize-modal-header" style="display: flex; align-items: center; gap: 12px; padding: 20px 24px; border-bottom: 1px solid var(--art-border-subtle, #e5e7eb);">
        <h2 class="artorize-modal-title" style="flex: 1; font-size: 20px; font-weight: 600; margin: 0;">Gallery</h2>
        <div style="flex: 1; position: relative;">
          <input
            type="text"
            id="gallery-search-input"
            class="artorize-input"
            placeholder="Search artworks..."
            style="width: 100%; padding-left: 36px;"
            oninput="window.gallerySearchFilter(this.value)"
          />
          <svg style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--art-text-subtle, #6b7280);" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
        <button type="button" class="artorize-modal-close artorize-btn artorize-btn-ghost artorize-btn-sm" onclick="window.toggleHistoryModal()" style="flex-shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      <div class="artorize-modal-body" id="gallery-modal-body" style="flex: 1; overflow-y: auto; padding: 24px;">
        <div id="gallery-loading" style="display: flex; align-items: center; justify-content: center; padding: 48px; color: var(--art-text-subtle, #6b7280);">
          <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite; margin-right: 8px;">
            <path opacity=".5" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" stroke-width="2"/>
            <path d="M22 12c0-5.523-4.477-10-10-10" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Loading gallery...</span>
        </div>
        <div id="gallery-empty" style="display: none; flex-direction: column; align-items: center; justify-content: center; padding: 48px; text-align: center; color: var(--art-text-subtle, #6b7280);">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; opacity: 0.4;">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <p style="font-size: 16px; font-weight: 500; margin: 0;">No artworks yet</p>
          <p style="font-size: 14px; margin: 8px 0 0;">Upload an image to get started.</p>
        </div>
        <div id="gallery-grid" class="gallery-grid" style="display: none; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;"></div>
      </div>
      <div class="artorize-modal-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-top: 1px solid var(--art-border-subtle, #e5e7eb); background: var(--art-surface-subtle, #f9fafb);">
        <span id="gallery-count" style="font-size: 14px; color: var(--art-text-subtle, #6b7280);">0 artworks</span>
        <button type="button" class="artorize-btn artorize-btn-secondary artorize-btn-sm" onclick="window.toggleHistoryModal()">Close</button>
      </div>
    </div>
  `;

  // Add CSS for spinning animation
  if (!document.getElementById('gallery-styles')) {
    const style = document.createElement('style');
    style.id = 'gallery-styles';
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .gallery-grid {
        display: grid;
      }
      .gallery-card {
        background: white;
        border: 1px solid var(--art-border-default, #e5e7eb);
        border-radius: var(--art-radius-lg, 12px);
        overflow: hidden;
        transition: box-shadow 0.2s, transform 0.2s;
      }
      .gallery-card:hover {
        box-shadow: var(--art-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        transform: translateY(-2px);
      }
      .gallery-card-thumb {
        width: 100%;
        aspect-ratio: 1;
        background: var(--art-surface-subtle, #f9fafb);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .gallery-card-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .gallery-card-body {
        padding: 12px 16px;
      }
      .gallery-card-title {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 500;
        color: var(--art-text-primary, #111827);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .gallery-card-date {
        font-size: 12px;
        color: var(--art-text-subtle, #6b7280);
      }
      .gallery-card-actions {
        display: flex;
        gap: 4px;
        padding: 8px 12px;
        border-top: 1px solid var(--art-border-subtle, #e5e7eb);
      }
      .gallery-download-group {
        position: relative;
      }
      .gallery-download-menu {
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 4px;
        background: white;
        border: 1px solid var(--art-border-default, #e5e7eb);
        border-radius: var(--art-radius-md, 8px);
        box-shadow: var(--art-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        min-width: 160px;
        z-index: 10;
        overflow: hidden;
      }
      .gallery-download-menu.hidden {
        display: none;
      }
      .gallery-download-menu button {
        width: 100%;
        padding: 8px 12px;
        text-align: left;
        font-size: 13px;
        background: white;
        border: none;
        cursor: pointer;
        transition: background 0.15s;
      }
      .gallery-download-menu button:hover {
        background: var(--art-surface-hover, #f3f4f6);
      }
      .gallery-delete-btn:hover {
        color: var(--art-danger, #dc2626);
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      toggleHistoryModal();
    }
  });
}

// Load gallery artworks from API
async function loadGalleryArtworks() {
  const loadingEl = document.getElementById('gallery-loading');
  const emptyEl = document.getElementById('gallery-empty');
  const gridEl = document.getElementById('gallery-grid');
  const countEl = document.getElementById('gallery-count');

  if (loadingEl) loadingEl.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';
  if (gridEl) gridEl.style.display = 'none';

  try {
    const routerUrl = window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com';
    const response = await fetch(`${routerUrl}/artworks/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (loadingEl) loadingEl.style.display = 'none';

    if (response.ok) {
      const data = await response.json();
      galleryArtworksData = data.artworks || [];

      if (countEl) {
        countEl.textContent = galleryArtworksData.length === 1 ? '1 artwork' : `${galleryArtworksData.length} artworks`;
      }

      if (galleryArtworksData.length === 0) {
        if (emptyEl) emptyEl.style.display = 'flex';
      } else {
        renderGalleryGrid();
      }
    } else {
      if (emptyEl) {
        emptyEl.querySelector('p:first-of-type').textContent = 'Failed to load artworks';
        emptyEl.style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('[Gallery] Error loading artworks:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) {
      emptyEl.querySelector('p:first-of-type').textContent = 'Network error';
      emptyEl.style.display = 'flex';
    }
  }
}

// Render gallery grid
function renderGalleryGrid(filteredData) {
  const gridEl = document.getElementById('gallery-grid');
  const emptyEl = document.getElementById('gallery-empty');
  if (!gridEl) return;

  const artworks = filteredData || galleryArtworksData;

  gridEl.innerHTML = '';

  if (artworks.length === 0) {
    gridEl.style.display = 'none';
    if (emptyEl) {
      emptyEl.querySelector('p:first-of-type').textContent = 'No artworks found';
      emptyEl.style.display = 'flex';
    }
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  gridEl.style.display = 'grid';

  const cdnUrl = window.ArtorizeConfig?.CDN_URL || 'https://cdn.artorizer.com';

  artworks.forEach(artwork => {
    const artworkId = artwork.id || artwork._id;
    const title = artwork.title || 'Untitled';
    const createdAt = new Date(artwork.createdAt);
    const dateStr = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const escapedTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');

    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.dataset.artworkId = artworkId;
    card.innerHTML = `
      <div class="gallery-card-thumb">
        <img src="${cdnUrl}/api/artworks/${artworkId}?variant=protected" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;48&quot; height=&quot;48&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; style=&quot;color: var(--art-text-subtle);&quot;><rect width=&quot;18&quot; height=&quot;18&quot; x=&quot;3&quot; y=&quot;3&quot; rx=&quot;2&quot; ry=&quot;2&quot;/><circle cx=&quot;9&quot; cy=&quot;9&quot; r=&quot;2&quot;/><path d=&quot;m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21&quot;/></svg>';" />
      </div>
      <div class="gallery-card-body">
        <p class="gallery-card-title" title="${title}">${title}</p>
        <span class="gallery-card-date">${dateStr}</span>
      </div>
      <div class="gallery-card-actions">
        <div class="gallery-download-group">
          <button class="artorize-btn artorize-btn-xs artorize-btn-ghost" title="Download" onclick="window.galleryToggleDownloadMenu('${artworkId}', this)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <div class="gallery-download-menu hidden" id="download-menu-${artworkId}">
            <button onclick="window.galleryDownload('${artworkId}', 'protected'); window.galleryCloseDownloadMenu('${artworkId}');">Protected Image</button>
            <button onclick="window.galleryDownload('${artworkId}', 'mask'); window.galleryCloseDownloadMenu('${artworkId}');">SAC Mask</button>
            <button onclick="window.galleryDownload('${artworkId}', 'original'); window.galleryCloseDownloadMenu('${artworkId}');">Original</button>
          </div>
        </div>
        <button class="artorize-btn artorize-btn-xs artorize-btn-ghost" title="Copy embed URL" onclick="window.galleryCopyEmbed('${artworkId}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button class="artorize-btn artorize-btn-xs artorize-btn-ghost" title="Rename" onclick="window.galleryRename('${artworkId}', '${escapedTitle}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>
        <button class="artorize-btn artorize-btn-xs artorize-btn-ghost gallery-delete-btn" title="Delete" onclick="window.galleryDelete('${artworkId}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;
    gridEl.appendChild(card);
  });
}

// Toggle download menu for an artwork
function galleryToggleDownloadMenu(artworkId, btnEl) {
  const menu = document.getElementById(`download-menu-${artworkId}`);
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');

  // Close all other menus first
  document.querySelectorAll('.gallery-download-menu').forEach(m => {
    if (m !== menu) m.classList.add('hidden');
  });

  if (isHidden) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

// Close download menu
function galleryCloseDownloadMenu(artworkId) {
  const menu = document.getElementById(`download-menu-${artworkId}`);
  if (menu) menu.classList.add('hidden');
}

// Download artwork
async function galleryDownload(artworkId, variant) {
  try {
    const routerUrl = window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com';
    const response = await fetch(`${routerUrl}/artworks/${artworkId}?variant=${variant}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('[Gallery] Download failed:', response.status);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artwork-${artworkId}-${variant}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Gallery] Download error:', error);
  }
}

// Rename artwork
async function galleryRename(artworkId, currentTitle) {
  const newTitle = prompt('Enter new title:', currentTitle);
  if (!newTitle || newTitle.trim() === '' || newTitle === currentTitle) return;

  try {
    const routerUrl = window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com';
    const response = await fetch(`${routerUrl}/artworks/${artworkId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    if (response.ok) {
      // Update local data
      const artwork = galleryArtworksData.find(a => (a.id || a._id) === artworkId);
      if (artwork) artwork.title = newTitle.trim();

      // Update UI
      const card = document.querySelector(`.gallery-card[data-artwork-id="${artworkId}"]`);
      if (card) {
        const titleEl = card.querySelector('.gallery-card-title');
        if (titleEl) {
          titleEl.textContent = newTitle.trim();
          titleEl.title = newTitle.trim();
        }
      }
    } else {
      alert('Failed to rename artwork');
    }
  } catch (error) {
    console.error('[Gallery] Rename error:', error);
    alert('Network error');
  }
}

// Delete artwork
async function galleryDelete(artworkId) {
  if (!confirm('Are you sure you want to delete this artwork? This action cannot be undone.')) {
    return;
  }

  try {
    const routerUrl = window.ArtorizeConfig?.ROUTER_URL || 'https://router.artorizer.com';
    const response = await fetch(`${routerUrl}/artworks/${artworkId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) {
      // Remove from local data
      galleryArtworksData = galleryArtworksData.filter(a => (a.id || a._id) !== artworkId);

      // Remove card from UI
      const card = document.querySelector(`.gallery-card[data-artwork-id="${artworkId}"]`);
      if (card) card.remove();

      // Update count
      const countEl = document.getElementById('gallery-count');
      if (countEl) {
        countEl.textContent = galleryArtworksData.length === 1 ? '1 artwork' : `${galleryArtworksData.length} artworks`;
      }

      // Show empty state if no artworks left
      if (galleryArtworksData.length === 0) {
        const gridEl = document.getElementById('gallery-grid');
        const emptyEl = document.getElementById('gallery-empty');
        if (gridEl) gridEl.style.display = 'none';
        if (emptyEl) {
          emptyEl.querySelector('p:first-of-type').textContent = 'No artworks yet';
          emptyEl.style.display = 'flex';
        }
      }
    } else {
      alert('Failed to delete artwork');
    }
  } catch (error) {
    console.error('[Gallery] Delete error:', error);
    alert('Network error');
  }
}

// Copy embed URL to clipboard
function galleryCopyEmbed(artworkId) {
  const embedUrl = `${window.ArtorizeConfig?.EMBED_URL || 'https://artorizer.com/embed'}/${artworkId}`;

  navigator.clipboard.writeText(embedUrl).then(() => {
    // Find the button and show feedback
    const card = document.querySelector(`.gallery-card[data-artwork-id="${artworkId}"]`);
    if (card) {
      const btn = card.querySelector('[title="Copy embed URL"]');
      if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 2000);
      }
    }
  }).catch(err => {
    console.error('[Gallery] Copy error:', err);
  });
}

// Search filter with debounce
function gallerySearchFilter(query) {
  clearTimeout(gallerySearchDebounce);
  gallerySearchDebounce = setTimeout(() => {
    if (!query || query.trim() === '') {
      renderGalleryGrid();
      return;
    }

    const searchTerm = query.trim().toLowerCase();
    const filtered = galleryArtworksData.filter(artwork => {
      const title = (artwork.title || '').toLowerCase();
      const artist = (artwork.artist || '').toLowerCase();
      return title.includes(searchTerm) || artist.includes(searchTerm);
    });

    renderGalleryGrid(filtered);
  }, 200);
}

// Close download menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.gallery-download-group')) {
    document.querySelectorAll('.gallery-download-menu').forEach(menu => {
      menu.classList.add('hidden');
    });
  }
});

// --- Platform Switcher Logic ---
// We attach these to window explicitly to avoid scope issues with deferred scripts and dynamic components

window.currentPlatform = 'static-edit';

window.togglePlatformDropdown = function() {
  const content = document.getElementById('platform-dropdown-content');
  const trigger = document.getElementById('platform-switcher-trigger');

  if (!content || !trigger) return;

  const isClosed = content.classList.contains('hidden');

  if (isClosed) {
    // Position dropdown above the trigger using fixed positioning
    const rect = trigger.getBoundingClientRect();
    content.style.position = 'fixed';
    content.style.left = rect.left + 'px';
    content.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    content.style.width = '200px';
    content.style.zIndex = '200';
    content.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('data-state', 'open');
  } else {
    content.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('data-state', 'closed');
  }
};

window.selectPlatform = function(platform, label) {
  window.currentPlatform = platform;

  // Update label and indicator
  const labelDisplay = document.getElementById('platform-label-display');
  const triggerIcon = document.querySelector('#platform-switcher-trigger .bg-foreground span');

  if (labelDisplay) labelDisplay.textContent = label;
  if (triggerIcon) triggerIcon.textContent = platform === 'static-edit' ? 'S' : 'A';

  // Toggle checkmarks for all options
  const checkStatic = document.getElementById('check-static-edit');
  const checkShared = document.getElementById('check-shared-artworks');
  if (checkStatic) checkStatic.style.opacity = platform === 'static-edit' ? '1' : '0';
  if (checkShared) checkShared.style.opacity = platform === 'shared-artworks' ? '1' : '0';

  // Close dropdown
  window.togglePlatformDropdown();

  // Open Shared Artworks window when selected
  if (platform === 'shared-artworks' && window.SharedArtworks) {
      window.SharedArtworks.open();
  }

  console.log('[Platform] Selected:', platform);
};

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const content = document.getElementById('platform-dropdown-content');
  const trigger = document.getElementById('platform-switcher-trigger');
  
  if (!content || !trigger || content.classList.contains('hidden')) return;
  
  if (!content.contains(e.target) && !trigger.contains(e.target)) {
    content.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('data-state', 'closed');
  }
});

let shareArtworksData = [];
let shareArtworksFilter = 'all';

// Show Share Artworks Popup (formerly Embed Code Popup)
function showEmbedCodePopup() {
  const popup = document.getElementById('embed-code-popup');
  if (popup) {
    popup.classList.remove('hidden');
    loadShareArtworks();
  }
}

// Load artworks for sharing panel
async function loadShareArtworks() {
  const listEl = document.getElementById('share-artworks-list');
  const loadingEl = document.getElementById('share-artworks-loading');
  const emptyEl = document.getElementById('share-artworks-empty');
  const countEl = document.getElementById('share-artwork-count');

  if (!listEl) return;

  // Show loading
  if (loadingEl) loadingEl.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    const response = await fetch(`${window.ArtorizeConfig?.ROUTER_URL || ''}/artworks/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (loadingEl) loadingEl.style.display = 'none';

    if (response.ok) {
      const data = await response.json();
      shareArtworksData = data.artworks || [];

      if (shareArtworksData.length === 0) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (countEl) countEl.textContent = '0 artworks';
        return;
      }

      if (countEl) countEl.textContent = shareArtworksData.length === 1 ? '1 artwork' : `${shareArtworksData.length} artworks`;
      renderShareArtworks();
    } else {
      if (emptyEl) {
        emptyEl.querySelector('p:first-of-type').textContent = 'Failed to load artworks';
        emptyEl.style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('Error loading share artworks:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) {
      emptyEl.querySelector('p:first-of-type').textContent = 'Network error';
      emptyEl.style.display = 'flex';
    }
  }
}

// Render share artworks list
function renderShareArtworks() {
  const listEl = document.getElementById('share-artworks-list');
  const emptyEl = document.getElementById('share-artworks-empty');
  if (!listEl) return;

  // Clear existing rows (but keep loading/empty divs)
  const existingRows = listEl.querySelectorAll('.share-artwork-row');
  existingRows.forEach(row => row.remove());

  // Filter artworks
  let filtered = shareArtworksData;
  if (shareArtworksFilter === 'public') {
    filtered = shareArtworksData.filter(a => a.isPublic || a.visibility === 'public');
  } else if (shareArtworksFilter === 'private') {
    filtered = shareArtworksData.filter(a => !a.isPublic && a.visibility !== 'public');
  }

  // Search filter
  const searchInput = document.getElementById('share-search-input');
  if (searchInput && searchInput.value.trim()) {
    const query = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(query) ||
      (a.artist || '').toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    if (emptyEl) {
      emptyEl.querySelector('p:first-of-type').textContent = shareArtworksFilter === 'all' ? 'No artworks yet' : `No ${shareArtworksFilter} artworks`;
      emptyEl.style.display = 'flex';
    }
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  // Render rows
  filtered.forEach(artwork => {
    const row = createShareArtworkRow(artwork);
    listEl.appendChild(row);
  });
}

// Create a share artwork row
function createShareArtworkRow(artwork) {
  const row = document.createElement('div');
  row.className = 'share-artwork-row';
  row.dataset.artworkId = artwork.id;

  const isPublic = artwork.isPublic || artwork.visibility === 'public';
  const shareUrl = `${window.ArtorizeConfig?.EMBED_URL || 'https://artorizer.com/artwork'}/${artwork.id}`;
  const createdAt = new Date(artwork.createdAt);
  const dateStr = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  row.innerHTML = `
    <div class="share-artwork-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
    </div>
    <div class="share-artwork-info">
      <p class="share-artwork-title">${artwork.title || 'Untitled'}</p>
      <p class="share-artwork-meta">
        <span>${artwork.artist || 'Unknown'}</span>
        <span>•</span>
        <span>${dateStr}</span>
      </p>
    </div>
    <div class="share-artwork-actions">
      <span class="artorize-badge ${isPublic ? 'artorize-badge-success' : 'artorize-badge-default'}">
        ${isPublic ? 'Public' : 'Private'}
      </span>
      <button class="artorize-toggle ${isPublic ? 'active' : ''}" title="Toggle visibility" onclick="toggleArtworkVisibility('${artwork.id}', this)"></button>
      <button class="share-url-btn" title="Copy share URL" onclick="copyShareUrl('${shareUrl}', this)" ${!isPublic ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        Copy URL
      </button>
    </div>
  `;

  return row;
}

// Toggle artwork visibility (public/private)
async function toggleArtworkVisibility(artworkId, toggleEl) {
  const row = toggleEl.closest('.share-artwork-row');
  const badge = row.querySelector('.artorize-badge');
  const copyBtn = row.querySelector('.share-url-btn');
  const isCurrentlyPublic = toggleEl.classList.contains('active');
  const newVisibility = isCurrentlyPublic ? 'private' : 'public';

  // Optimistic UI update
  toggleEl.classList.toggle('active');
  badge.className = `artorize-badge ${newVisibility === 'public' ? 'artorize-badge-success' : 'artorize-badge-default'}`;
  badge.textContent = newVisibility === 'public' ? 'Public' : 'Private';
  if (copyBtn) {
    copyBtn.disabled = newVisibility !== 'public';
    copyBtn.style.opacity = newVisibility === 'public' ? '1' : '0.5';
    copyBtn.style.cursor = newVisibility === 'public' ? 'pointer' : 'not-allowed';
  }

  try {
    const response = await fetch(`${window.ArtorizeConfig?.ROUTER_URL || ''}/artworks/${artworkId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: newVisibility, isPublic: newVisibility === 'public' })
    });

    if (!response.ok) {
      // Revert on error
      toggleEl.classList.toggle('active');
      badge.className = `artorize-badge ${isCurrentlyPublic ? 'artorize-badge-success' : 'artorize-badge-default'}`;
      badge.textContent = isCurrentlyPublic ? 'Public' : 'Private';
      if (copyBtn) {
        copyBtn.disabled = !isCurrentlyPublic;
        copyBtn.style.opacity = isCurrentlyPublic ? '1' : '0.5';
        copyBtn.style.cursor = isCurrentlyPublic ? 'pointer' : 'not-allowed';
      }
      console.error('Failed to update artwork visibility');
    } else {
      // Update local data
      const artwork = shareArtworksData.find(a => a.id === artworkId);
      if (artwork) {
        artwork.isPublic = newVisibility === 'public';
        artwork.visibility = newVisibility;
      }
    }
  } catch (error) {
    console.error('Error updating visibility:', error);
    // Revert
    toggleEl.classList.toggle('active');
  }
}

// Copy share URL to clipboard
function copyShareUrl(url, btnEl) {
  navigator.clipboard.writeText(url).then(() => {
    btnEl.classList.add('copied');
    const originalHTML = btnEl.innerHTML;
    btnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Copied!`;
    setTimeout(() => {
      btnEl.classList.remove('copied');
      btnEl.innerHTML = originalHTML;
    }, 2000);
  });
}

// Filter share artworks
function filterShareArtworks(filter) {
  shareArtworksFilter = filter;

  // Update button states
  document.querySelectorAll('.share-filter-btn').forEach(btn => {
    btn.classList.remove('active', 'artorize-btn-secondary');
    btn.classList.add('artorize-btn-ghost');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active', 'artorize-btn-secondary');
      btn.classList.remove('artorize-btn-ghost');
    }
  });

  renderShareArtworks();
}

// Search handler for share artworks
function initShareArtworksSearch() {
  const searchInput = document.getElementById('share-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderShareArtworks();
      }, 200);
    });
  }
}

// Legacy function stubs for backward compatibility
function loadArtworksForEmbed() {
  loadShareArtworks();
}

function updateEmbedCode() {
  // No longer needed with new UI
}

// Close Embed Code Popup
function closeEmbedCodePopup() {
  const popup = document.getElementById('embed-code-popup');
  if (popup) {
    popup.classList.add('hidden');
  }
}

// Copy embed code to clipboard
function copyEmbedCode() {
  const codeEl = document.getElementById('embed-code-content');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      const btn = document.getElementById('copy-embed-btn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }
    });
  }
}

// Expose helpers to the global window scope for reuse
window.updateProgressStep = updateProgressStep;
window.toggleProtection = toggleProtection;
window.applyPreset = applyPreset;
window.toggleWatermarkDropdown = toggleWatermarkDropdown;
window.selectWatermarkStrategy = selectWatermarkStrategy;
window.toggleHistoryModal = toggleHistoryModal;
window.togglePlatformRadio = togglePlatformRadio;
window.togglePlatformDropdown = togglePlatformDropdown;
window.selectPlatform = selectPlatform;
window.showEmbedCodePopup = showEmbedCodePopup;
window.closeEmbedCodePopup = closeEmbedCodePopup;
window.copyEmbedCode = copyEmbedCode;
window.loadArtworksForEmbed = loadArtworksForEmbed;
window.updateEmbedCode = updateEmbedCode;
// Share artworks functions
window.loadShareArtworks = loadShareArtworks;
window.renderShareArtworks = renderShareArtworks;
window.toggleArtworkVisibility = toggleArtworkVisibility;
window.copyShareUrl = copyShareUrl;
window.filterShareArtworks = filterShareArtworks;
// Gallery functions
window.loadGalleryArtworks = loadGalleryArtworks;
window.galleryDownload = galleryDownload;
window.galleryRename = galleryRename;
window.galleryDelete = galleryDelete;
window.galleryCopyEmbed = galleryCopyEmbed;
window.gallerySearchFilter = gallerySearchFilter;
window.galleryToggleDownloadMenu = galleryToggleDownloadMenu;
window.galleryCloseDownloadMenu = galleryCloseDownloadMenu;

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

// Initialize watermark change listener
function initializeWatermarkListener() {
  const watermarkSelect = document.getElementById('watermark-strategy');
  if (watermarkSelect) {
    watermarkSelect.addEventListener('change', updateProgressTracker);
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('watermark-strategy-dropdown');
    const button = document.getElementById('watermark-strategy-button');
    if (dropdown && button && !button.contains(e.target) && !dropdown.contains(e.target)) {
      closeWatermarkDropdown();
    }
  });
}

// Toggle watermark dropdown
function toggleWatermarkDropdown() {
  const button = document.getElementById('watermark-strategy-button');
  const dropdown = document.getElementById('watermark-strategy-dropdown');

  if (!button || !dropdown) return;

  const isOpen = button.getAttribute('aria-expanded') === 'true';

  if (isOpen) {
    closeWatermarkDropdown();
  } else {
    openWatermarkDropdown();
  }
}

// Open watermark dropdown
function openWatermarkDropdown() {
  const button = document.getElementById('watermark-strategy-button');
  const dropdown = document.getElementById('watermark-strategy-dropdown');

  if (!button || !dropdown) return;

  button.setAttribute('aria-expanded', 'true');
  button.setAttribute('data-state', 'open');
  dropdown.style.display = 'block';
  dropdown.classList.remove('hidden');
}

// Close watermark dropdown
function closeWatermarkDropdown() {
  const button = document.getElementById('watermark-strategy-button');
  const dropdown = document.getElementById('watermark-strategy-dropdown');

  if (!button || !dropdown) return;

  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('data-state', 'closed');
  dropdown.style.display = 'none';
  dropdown.classList.add('hidden');
}

// Select watermark strategy
function selectWatermarkStrategy(value, label) {
  const hiddenSelect = document.getElementById('watermark-strategy');
  const labelElement = document.getElementById('watermark-strategy-label');

  if (hiddenSelect) {
    hiddenSelect.value = value;
    // Trigger change event for updateProgressTracker
    const event = new Event('change', { bubbles: true });
    hiddenSelect.dispatchEvent(event);
  }

  if (labelElement) {
    labelElement.textContent = label;
  }

  closeWatermarkDropdown();
}

// Flatpickr instance
let datePickerInstance = null;

function setupYearInputBehavior(instance) {
  if (!instance || !instance.calendarContainer) {
    return;
  }
  const yearWrapper = instance.calendarContainer.querySelector('.flatpickr-current-month .numInputWrapper');
  if (!yearWrapper) {
    return;
  }
  const yearInput = yearWrapper.querySelector('.cur-year');
  if (!yearInput) {
    return;
  }
  const updateShortLabel = () => {
    const fullYear = (yearInput.value || '').trim();
    const shortYear = fullYear.slice(-2).padStart(2, '0');
    yearWrapper.setAttribute('data-short-year', shortYear);
  };
  if (yearWrapper.dataset.enhanced === 'true') {
    updateShortLabel();
    return;
  }
  const showShortLabel = () => {
    updateShortLabel();
    yearWrapper.classList.add('show-short-year');
  };
  const hideShortLabel = () => {
    updateShortLabel();
    yearWrapper.classList.remove('show-short-year');
  };
  yearInput.addEventListener('focus', showShortLabel);
  yearInput.addEventListener('click', showShortLabel);
  yearInput.addEventListener('input', updateShortLabel);
  yearInput.addEventListener('blur', hideShortLabel);
  yearInput.addEventListener('change', hideShortLabel);
  yearWrapper.dataset.enhanced = 'true';
  updateShortLabel();
}

// Custom Date Picker functionality
function initializeDatePicker() {
  const displayInput = document.getElementById('creation-date-display');
  const hiddenInput = document.getElementById('creation-date');
  const calendarPopup = document.getElementById('calendar-popup');
  const monthYearDisplay = document.getElementById('calendar-month-year');
  const calendarDays = document.getElementById('calendar-days');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const todayBtn = document.getElementById('today-btn');

  if (!displayInput || !calendarPopup) return;

  let currentDate = new Date();
  let selectedDate = null;

  // Month names
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Format date for display (e.g., "January 15, 2025")
  const formatDisplayDate = (date) => {
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${monthName} ${day}, ${year}`;
  };

  // Render calendar for current month
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year display
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();

    // Get number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get number of days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Clear calendar
    calendarDays.innerHTML = '';

    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day other-month';
      dayEl.textContent = day;
      calendarDays.appendChild(dayEl);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;

      // Check if this is today
      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayEl.classList.add('today');
      }

      // Check if this is the selected date
      if (selectedDate &&
          year === selectedDate.getFullYear() &&
          month === selectedDate.getMonth() &&
          day === selectedDate.getDate()) {
        dayEl.classList.add('selected');
      }

      // Click handler
      dayEl.addEventListener('click', () => {
        selectedDate = new Date(year, month, day);
        hiddenInput.value = formatDate(selectedDate);
        displayInput.value = formatDisplayDate(selectedDate);
        calendarPopup.classList.add('hidden');
      });

      calendarDays.appendChild(dayEl);
    }

    // Add next month's leading days to fill the grid
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows x 7 days = 42 cells
    for (let day = 1; day <= remainingCells; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day other-month';
      dayEl.textContent = day;
      calendarDays.appendChild(dayEl);
    }
  };

  // Show/hide calendar
  displayInput.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    calendarPopup.classList.toggle('hidden');
    if (!calendarPopup.classList.contains('hidden')) {
      renderCalendar();
    }
  });

  // Previous month
  prevMonthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  // Next month
  nextMonthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Today button
  todayBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date();
    selectedDate = today;
    currentDate = new Date(today);
    hiddenInput.value = formatDate(today);
    displayInput.value = formatDisplayDate(today);
    renderCalendar();
    calendarPopup.classList.add('hidden');
  });

  // Close calendar when clicking outside
  document.addEventListener('click', (e) => {
    if (!displayInput.contains(e.target) &&
        !calendarPopup.contains(e.target) &&
        !todayBtn.contains(e.target)) {
      calendarPopup.classList.add('hidden');
    }
  });
}

// Initialize enhancers
function initEnhancements() {
  initializeTabs();
  initializeWatermarkListener();
  updateProgressTracker();
  initializeDatePicker();
  initShareArtworksSearch();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check if we are in modular mode and components are pending
    if (document.querySelector('[data-component]')) {
      document.addEventListener('components:ready', initEnhancements);
    } else {
      initEnhancements();
    }
  });
} else {
  // Check if we are in modular mode and components are pending
  if (document.querySelector('[data-component]')) {
    document.addEventListener('components:ready', initEnhancements);
  } else {
    initEnhancements();
  }
}

})();
