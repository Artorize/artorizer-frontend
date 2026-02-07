/**
 * Artorizer Export Window - macOS Dock-Style Interface
 * Handles artwork selection, export functionality, and customization
 */

(function() {
    'use strict';

    // State management
    const state = {
        artworks: [],
        selectedArtworks: new Set(),
        multiSelectMode: false,
        contextMenuTarget: null,
        isOpen: false
    };

    // DOM Elements (cached after initialization)
    let elements = {};

    /**
     * Initialize the Export Window
     */
    function init() {
        createExportWindowHTML();
        cacheElements();
        attachEventListeners();
        loadArtworks();
    }

    /**
     * Create the Export Window HTML structure
     */
    function createExportWindowHTML() {
        const windowHTML = `
            <!-- Export Window Overlay -->
            <div class="export-window-overlay" id="export-window-overlay">
                <div class="export-window" id="export-window">
                    <!-- Standard Modern Header -->
                    <div class="export-window-header">
                        <div class="export-window-header-left">
                            <!-- Window Title -->
                            <div class="export-window-title">
                                <svg class="export-window-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                <span>Export to Website</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="export-window-actions">
                            <!-- Add Artwork Button -->
                            <button class="artorize-btn artorize-btn-primary artorize-btn-sm"
                                    onclick="ExportWindow.openAddArtworkModal()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                                Add Artwork
                            </button>
                        </div>
                    </div>

                    <!-- Window Body with Artwork Grid -->
                    <div class="export-window-body">
                        <div class="artwork-grid" id="artwork-grid">
                            <!-- Artworks will be rendered here -->
                        </div>
                    </div>

                    <!-- Footer Toolbar -->
                    <div class="export-window-footer">
                        <div class="export-window-footer-left">
                            <span class="export-window-footer-info" id="selection-info">
                                0 items selected
                            </span>
                        </div>
                        <div class="export-window-footer-right">
                            <button class="artorize-btn artorize-btn-secondary"
                                    id="delete-selected-btn"
                                    onclick="ExportWindow.deleteSelected()"
                                    style="display: none;">
                                Delete Selected
                            </button>
                            <button class="artorize-btn artorize-btn-primary"
                                    id="export-btn"
                                    onclick="ExportWindow.exportSelected()">
                                Export Selected
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Context Menu -->
            <div class="artwork-context-menu" id="artwork-context-menu">
                <div class="context-menu-group-label">Artwork Settings</div>
                <button class="context-menu-item" onclick="ExportWindow.renameArtwork()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <span>Rename URL</span>
                </button>
                <button class="context-menu-item" onclick="ExportWindow.changeResolution()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <span>Default Resolution</span>
                </button>
                <div class="context-menu-separator"></div>
                <div class="context-menu-group-label">CDN Settings</div>
                <button class="context-menu-item" onclick="ExportWindow.configureCDN()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>Configure CDN</span>
                </button>
                <button class="context-menu-item" onclick="ExportWindow.copyEmbedCode()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                    </svg>
                    <span>Copy Embed Code</span>
                </button>
                <div class="context-menu-separator"></div>
                <button class="context-menu-item context-menu-item--danger" onclick="ExportWindow.deleteArtwork()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    <span>Delete</span>
                </button>
            </div>
        `;

        // Insert into document body
        const container = document.createElement('div');
        container.innerHTML = windowHTML;
        document.body.appendChild(container);
    }

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements = {
            overlay: document.getElementById('export-window-overlay'),
            window: document.getElementById('export-window'),
            grid: document.getElementById('artwork-grid'),
            contextMenu: document.getElementById('artwork-context-menu'),
            selectionInfo: document.getElementById('selection-info'),
            deleteSelectedBtn: document.getElementById('delete-selected-btn'),
            exportBtn: document.getElementById('export-btn'),
            multiSelectBtn: document.getElementById('multi-select-btn')
        };
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Close on overlay click
        elements.overlay.addEventListener('click', (e) => {
            if (e.target === elements.overlay) {
                close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isOpen) {
                if (elements.contextMenu.classList.contains('visible')) {
                    hideContextMenu();
                } else {
                    close();
                }
            }
        });

        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (!elements.contextMenu.contains(e.target)) {
                hideContextMenu();
            }
        });

        // Prevent context menu from closing when clicking inside
        elements.contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Load artworks from API or local storage
     */
    function loadArtworks() {
        // Filler images for local testing
        state.artworks = [
            { id: 1, name: 'Abstract Harmony', thumbnail: 'https://picsum.photos/400/300?random=1', url: 'abstract-harmony', resolution: '1920x1080', cdn: 'default' },
            { id: 2, name: 'Urban Dreams', thumbnail: 'https://picsum.photos/300/400?random=2', url: 'urban-dreams', resolution: '1920x1080', cdn: 'default' },
            { id: 3, name: 'Neon Nights', thumbnail: 'https://picsum.photos/400/400?random=3', url: 'neon-nights', resolution: '1920x1080', cdn: 'default' },
            { id: 4, name: 'Silence', thumbnail: 'https://picsum.photos/400/250?random=4', url: 'silence', resolution: '1920x1080', cdn: 'default' },
            { id: 5, name: 'Chaos Theory', thumbnail: 'https://picsum.photos/300/300?random=5', url: 'chaos-theory', resolution: '1920x1080', cdn: 'default' },
            { id: 6, name: 'Serenity', thumbnail: 'https://picsum.photos/400/500?random=6', url: 'serenity', resolution: '1920x1080', cdn: 'default' },
        ];
    }

    /**
     * Render artworks in the grid
     */
    function renderArtworks() {
        if (state.artworks.length === 0) {
            elements.grid.innerHTML = `
                <div class="artwork-grid-empty">
                    <svg class="artwork-grid-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p class="artwork-grid-empty-text">No artworks to export</p>
                    <p class="artwork-grid-empty-hint">Process some artworks first to see them here</p>
                </div>
            `;
            return;
        }

        elements.grid.innerHTML = state.artworks.map(artwork => `
            <div class="artwork-item ${state.selectedArtworks.has(artwork.id) ? 'selected' : ''}"
                 data-artwork-id="${artwork.id}"
                 onclick="ExportWindow.selectArtwork(${artwork.id}, event)"
                 oncontextmenu="ExportWindow.showContextMenu(event, ${artwork.id})">
                <div class="artwork-thumbnail">
                    <img src="${artwork.thumbnail}" alt="${artwork.name}" loading="lazy">
                </div>
                <div class="artwork-content">
                    <div class="artwork-header">
                        <span class="artwork-name" title="${artwork.name}">${artwork.name}</span>
                    </div>
                    
                    <div class="artwork-url-config" onclick="event.stopPropagation()">
                        <label class="text-xs text-subtle font-medium mb-1 block">URL Slug</label>
                        <div class="artwork-url-container">
                            <span class="url-prefix">/</span>
                            <input type="text" 
                                   class="artwork-url-input" 
                                   value="${artwork.url}" 
                                   placeholder="slug"
                                   onchange="ExportWindow.updateUrl(${artwork.id}, this.value)">
                        </div>
                        <div class="mt-2">
                            <label class="text-xs text-subtle font-medium mb-1 block">Embed URL</label>
                            <div class="flex items-center gap-1 bg-gray-50 rounded px-2 py-1 border border-gray-200">
                                <code class="text-[10px] text-gray-500 truncate flex-1 font-mono">https://cdn.artorize.com/e/${artwork.url}</code>
                                <button class="text-gray-400 hover:text-gray-700 transition-colors" onclick="navigator.clipboard.writeText('https://cdn.artorize.com/e/${artwork.url}'); this.style.color='#10b981'; setTimeout(() => this.style.color='', 1000);" title="Copy URL">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Open the export window
     */
    function open() {
        state.isOpen = true;
        state.selectedArtworks.clear();
        state.multiSelectMode = false;
        renderArtworks();
        updateSelectionInfo();
        elements.overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the export window
     */
    function close() {
        state.isOpen = false;
        elements.overlay.classList.remove('visible');
        document.body.style.overflow = '';
        hideContextMenu();
    }

    /**
     * Select an artwork
     */
    function selectArtwork(id, event) {
        event.preventDefault();

        if (state.multiSelectMode || event.ctrlKey || event.metaKey) {
            // Multi-select mode: toggle selection
            if (state.selectedArtworks.has(id)) {
                state.selectedArtworks.delete(id);
            } else {
                state.selectedArtworks.add(id);
            }
        } else {
            // Single-select mode: replace selection
            state.selectedArtworks.clear();
            state.selectedArtworks.add(id);
        }

        renderArtworks();
        updateSelectionInfo();
    }

    /**
     * Toggle multi-select mode
     */
    function toggleMultiSelect() {
        state.multiSelectMode = !state.multiSelectMode;
        elements.multiSelectBtn.classList.toggle('active', state.multiSelectMode);
        renderArtworks();
    }

    /**
     * Update selection info in footer
     */
    function updateSelectionInfo() {
        const count = state.selectedArtworks.size;
        elements.selectionInfo.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
        elements.deleteSelectedBtn.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    /**
     * Show context menu
     */
    function showContextMenu(event, artworkId) {
        event.preventDefault();
        event.stopPropagation();

        state.contextMenuTarget = artworkId;

        // Position the menu
        const x = Math.min(event.clientX, window.innerWidth - 200);
        const y = Math.min(event.clientY, window.innerHeight - 300);

        elements.contextMenu.style.left = `${x}px`;
        elements.contextMenu.style.top = `${y}px`;
        elements.contextMenu.classList.add('visible');
    }

    /**
     * Hide context menu
     */
    function hideContextMenu() {
        elements.contextMenu.classList.remove('visible');
        state.contextMenuTarget = null;
    }

    /**
     * Rename artwork URL
     */
    function renameArtwork() {
        const artwork = state.artworks.find(a => a.id === state.contextMenuTarget);
        if (!artwork) return;

        const newUrl = prompt('Enter new URL slug:', artwork.url);
        if (newUrl && newUrl !== artwork.url) {
            artwork.url = newUrl.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            showNotification(`Renamed to: ${artwork.url}`);
        }
        hideContextMenu();
    }

    /**
     * Change default resolution
     */
    function changeResolution() {
        const artwork = state.artworks.find(a => a.id === state.contextMenuTarget);
        if (!artwork) return;

        const resolutions = ['1920x1080', '1280x720', '3840x2160', '800x600'];
        const currentIndex = resolutions.indexOf(artwork.resolution);
        const newResolution = prompt(
            `Select resolution:\n${resolutions.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nEnter number (1-${resolutions.length}):`,
            String(currentIndex + 1)
        );

        const index = parseInt(newResolution) - 1;
        if (index >= 0 && index < resolutions.length) {
            artwork.resolution = resolutions[index];
            showNotification(`Resolution set to: ${artwork.resolution}`);
        }
        hideContextMenu();
    }

    /**
     * Configure CDN settings
     */
    function configureCDN() {
        const artwork = state.artworks.find(a => a.id === state.contextMenuTarget);
        if (!artwork) return;

        const cdnOptions = ['default', 'cloudflare', 'aws-cloudfront', 'bunny-cdn', 'custom'];
        const newCDN = prompt(
            `Select CDN:\n${cdnOptions.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nEnter number (1-${cdnOptions.length}):`,
            String(cdnOptions.indexOf(artwork.cdn) + 1)
        );

        const index = parseInt(newCDN) - 1;
        if (index >= 0 && index < cdnOptions.length) {
            artwork.cdn = cdnOptions[index];
            showNotification(`CDN set to: ${artwork.cdn}`);
        }
        hideContextMenu();
    }

    /**
     * Copy embed code for artwork
     */
    function copyEmbedCode() {
        const artwork = state.artworks.find(a => a.id === state.contextMenuTarget);
        if (!artwork) return;

        const embedCode = `<iframe src="https://cdn.artorizer.com/embed/${artwork.url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;

        navigator.clipboard.writeText(embedCode).then(() => {
            showNotification('Embed code copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = embedCode;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('Embed code copied to clipboard!');
        });

        hideContextMenu();
    }

    /**
     * Delete artwork (from context menu)
     */
    function deleteArtwork() {
        const artwork = state.artworks.find(a => a.id === state.contextMenuTarget);
        if (!artwork) return;

        if (confirm(`Delete "${artwork.name}"?`)) {
            state.artworks = state.artworks.filter(a => a.id !== state.contextMenuTarget);
            state.selectedArtworks.delete(state.contextMenuTarget);
            renderArtworks();
            updateSelectionInfo();
            showNotification('Artwork deleted');
        }
        hideContextMenu();
    }

    /**
     * Quick delete artwork
     */
    function quickDelete(id) {
        const artwork = state.artworks.find(a => a.id === id);
        if (!artwork) return;

        if (confirm(`Delete "${artwork.name}"?`)) {
            state.artworks = state.artworks.filter(a => a.id !== id);
            state.selectedArtworks.delete(id);
            renderArtworks();
            updateSelectionInfo();
            showNotification('Artwork deleted');
        }
    }

    /**
     * Open Add Artwork Modal
     */
    function openAddArtworkModal() {
        // Create a simple modal for selection
        const modalHTML = `
            <div class="export-window-overlay visible" id="add-artwork-modal" style="z-index: 110;">
                <div class="export-window" style="width: 400px; height: auto; max-height: 80vh;">
                    <div class="export-window-header">
                        <div class="export-window-title">Select Artwork</div>
                        <button class="export-window-close-btn" onclick="document.getElementById('add-artwork-modal').remove()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="export-window-body" style="background: var(--art-surface);">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <button class="artwork-item" style="flex-direction: row; align-items: center; padding: 0.75rem; gap: 1rem; width: 100%; text-align: left;" 
                                    onclick="ExportWindow.mockAddArtwork('New Uploaded Artwork'); document.getElementById('add-artwork-modal').remove();">
                                <div style="width: 48px; height: 48px; background: var(--art-surface-hover); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color: var(--art-text-muted);">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21 15 16 10 5 21"/>
                                     </svg>
                                </div>
                                <span class="artwork-name">New Uploaded Artwork</span>
                            </button>
                            <button class="artwork-item" style="flex-direction: row; align-items: center; padding: 0.75rem; gap: 1rem; width: 100%; text-align: left;"
                                    onclick="ExportWindow.mockAddArtwork('Generated Artwork'); document.getElementById('add-artwork-modal').remove();">
                                <div style="width: 48px; height: 48px; background: var(--art-surface-hover); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color: var(--art-text-muted);">
                                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                                        <path d="M12 8v8"/>
                                        <path d="M8 12h8"/>
                                     </svg>
                                </div>
                                <span class="artwork-name">Generated Artwork</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Mock function to add artwork from the modal
     */
    function mockAddArtwork(name) {
        const id = Date.now();
        state.artworks.push({
            id: id,
            name: name,
            thumbnail: 'https://picsum.photos/400/300?random=' + id,
            url: name.toLowerCase().replace(/ /g, '-'),
        });
        renderArtworks();
        showNotification(`Added ${name}`);
    }

    /**
     * Delete selected artworks
     */
    function deleteSelected() {
        const count = state.selectedArtworks.size;
        if (count === 0) return;

        if (confirm(`Delete ${count} selected artwork${count > 1 ? 's' : ''}?`)) {
            state.artworks = state.artworks.filter(a => !state.selectedArtworks.has(a.id));
            state.selectedArtworks.clear();
            renderArtworks();
            updateSelectionInfo();
            showNotification(`${count} artwork${count > 1 ? 's' : ''} deleted`);
        }
    }

    /**
     * Add shared network
     */
    function addNetwork() {
        const networks = ['Instagram', 'Twitter/X', 'Facebook', 'Pinterest', 'LinkedIn', 'Custom'];
        const selection = prompt(
            `Add shared network:\n${networks.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\nEnter number (1-${networks.length}):`
        );

        const index = parseInt(selection) - 1;
        if (index >= 0 && index < networks.length) {
            showNotification(`Added network: ${networks[index]}`);
            // TODO: Implement actual network integration
        }
    }

    /**
     * Export selected artworks
     */
    function exportSelected() {
        if (state.selectedArtworks.size === 0) {
            showNotification('Please select at least one artwork to export');
            return;
        }

        const selectedArtworks = state.artworks.filter(a => state.selectedArtworks.has(a.id));
        console.log('Exporting artworks:', selectedArtworks);

        // TODO: Implement actual export functionality
        showNotification(`Exporting ${selectedArtworks.length} artwork${selectedArtworks.length > 1 ? 's' : ''}...`);

        // Close window after export
        setTimeout(() => {
            close();
        }, 1500);
    }

    /**
     * Show notification
     */
    function showNotification(message) {
        // Simple notification - can be enhanced with a toast library
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: hsl(240, 3%, 11%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Add animation keyframes if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, 20px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Update artwork URL slug
     */
    function updateUrl(id, newSlug) {
        const artwork = state.artworks.find(a => a.id === id);
        if (!artwork) return;

        // Simple validation/sanitization
        const sanitized = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        artwork.url = sanitized;
        
        // If input value differs from sanitized, update it
        const input = document.querySelector(`.artwork-item[data-artwork-id="${id}"] .artwork-url-input`);
        if (input && input.value !== sanitized) {
            input.value = sanitized;
        }
        
        console.log(`Updated URL for artwork ${id} to ${sanitized}`);
    }

    /**
     * Set artworks from external source
     */
    function setArtworks(artworks) {
        state.artworks = artworks;
        if (state.isOpen) {
            renderArtworks();
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API
    window.ExportWindow = {
        open,
        close,
        selectArtwork,
        toggleMultiSelect,
        showContextMenu,
        renameArtwork,
        changeResolution,
        configureCDN,
        copyEmbedCode,
        deleteArtwork,
        quickDelete,
        deleteSelected,
        addNetwork,
        exportSelected,
        setArtworks,
        updateUrl,
        openAddArtworkModal,
        mockAddArtwork
    };

})();
