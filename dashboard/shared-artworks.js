/**
 * Artorizer Shared Artworks Manager - Floating Window
 * Manage artwork visibility, sharing links, and bulk operations
 */
(function() {
    'use strict';

    const state = {
        artworks: [],
        selectedIds: new Set(),
        filter: 'all',
        searchQuery: '',
        debounceTimer: null,
        isOpen: false
    };

    let elements = {};

    function init() {
        createWindowHTML();
        cacheElements();
        attachEventListeners();
        loadArtworks();
    }

    function createWindowHTML() {
        // Inject scoped styles for hover/selection effects
        const styleEl = document.createElement('style');
        styleEl.id = 'shared-artworks-styles';
        styleEl.textContent = `
            .shared-artwork-card img:hover {
                box-shadow: 0 0 0 2px var(--art-border-hover);
            }
            .shared-artwork-card.shared-selected img {
                box-shadow: 0 0 0 2px var(--art-primary) !important;
                opacity: 0.85;
            }
        `;
        document.head.appendChild(styleEl);

        const windowHTML = `
            <div class="export-window-overlay" id="shared-window-overlay">
                <div class="export-window" id="shared-window" style="width: min(900px, calc(100vw - 48px));">
                    <div class="export-window-header">
                        <div class="export-window-header-left">
                            <div class="export-window-title">
                                <span>Shared Artworks</span>
                            </div>
                        </div>
                        <div class="export-window-actions">
                            <button class="artorize-btn artorize-btn-secondary artorize-btn-sm"
                                    id="shared-select-all-btn"
                                    onclick="SharedArtworks.selectAll()">
                                Select All
                            </button>
                        </div>
                    </div>

                    <div style="padding: var(--art-space-3) var(--art-space-4); border-bottom: 1px solid var(--art-border); display: flex; align-items: center; gap: var(--art-space-3); flex-wrap: wrap;">
                        <div style="position: relative; flex: 1; min-width: 200px;">
                            <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--art-text-muted); pointer-events: none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input type="text"
                                   class="artorize-input"
                                   id="shared-search-input"
                                   placeholder="Search artworks..."
                                   style="padding-left: 36px;"
                                   oninput="SharedArtworks.handleSearch(this.value)">
                        </div>

                        <div style="display: flex; gap: var(--art-space-2);">
                            <button class="artorize-btn artorize-btn-secondary artorize-btn-sm share-filter-btn active"
                                    data-filter="all"
                                    onclick="SharedArtworks.setFilter('all')">
                                All
                            </button>
                            <button class="artorize-btn artorize-btn-ghost artorize-btn-sm share-filter-btn"
                                    data-filter="public"
                                    onclick="SharedArtworks.setFilter('public')">
                                Public
                            </button>
                            <button class="artorize-btn artorize-btn-ghost artorize-btn-sm share-filter-btn"
                                    data-filter="private"
                                    onclick="SharedArtworks.setFilter('private')">
                                Private
                            </button>
                        </div>

                        <div id="shared-bulk-actions" style="display: none; align-items: center; gap: var(--art-space-2);">
                            <span class="header-separator" style="width: 1px; height: 20px; background: var(--art-border); margin: 0 var(--art-space-1);"></span>
                            <button class="artorize-btn artorize-btn-ghost artorize-btn-xs"
                                    onclick="SharedArtworks.deselectAll()">
                                Deselect
                            </button>
                            <button class="artorize-btn artorize-btn-secondary artorize-btn-xs"
                                    onclick="SharedArtworks.bulkSetVisibility(true)">
                                Set Public
                            </button>
                            <button class="artorize-btn artorize-btn-secondary artorize-btn-xs"
                                    onclick="SharedArtworks.bulkSetVisibility(false)">
                                Set Private
                            </button>
                            <button class="artorize-btn artorize-btn-danger artorize-btn-xs"
                                    onclick="SharedArtworks.bulkDelete()">
                                Delete
                            </button>
                        </div>
                    </div>

                    <div class="export-window-body">
                        <div class="artwork-grid" id="shared-artwork-grid"></div>
                        <div id="shared-empty-state" style="display: none; padding: 3rem var(--art-space-6); text-align: center; color: var(--art-text-muted);">
                            <svg style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.25;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="7" height="9" rx="1"/>
                                <rect x="14" y="3" width="7" height="5" rx="1"/>
                                <rect x="14" y="12" width="7" height="9" rx="1"/>
                                <rect x="3" y="16" width="7" height="5" rx="1"/>
                            </svg>
                            <p style="font-size: var(--art-text-sm); font-weight: 500; margin-bottom: 0.25rem;">No artworks found</p>
                            <p style="font-size: var(--art-text-xs); color: var(--art-text-faint);">Try adjusting your filters or search</p>
                        </div>
                    </div>

                    <div class="export-window-footer">
                        <div class="export-window-footer-left">
                            <span class="export-window-footer-info" id="shared-artwork-count">0 artworks</span>
                        </div>
                        <div class="export-window-footer-right">
                            <button class="artorize-btn artorize-btn-secondary"
                                    onclick="SharedArtworks.close()">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = windowHTML;
        document.body.appendChild(container);
    }

    function cacheElements() {
        elements = {
            overlay: document.getElementById('shared-window-overlay'),
            window: document.getElementById('shared-window'),
            grid: document.getElementById('shared-artwork-grid'),
            emptyState: document.getElementById('shared-empty-state'),
            artworkCount: document.getElementById('shared-artwork-count'),
            bulkActions: document.getElementById('shared-bulk-actions'),
            searchInput: document.getElementById('shared-search-input'),
            selectAllBtn: document.getElementById('shared-select-all-btn')
        };
    }

    function attachEventListeners() {
        elements.overlay.addEventListener('click', (e) => {
            if (e.target === elements.overlay) {
                close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isOpen) {
                close();
            }
        });
    }

    function loadArtworks() {
        state.artworks = [
            { id: 1, title: 'Abstract Harmony', thumbnailUrl: 'https://picsum.photos/400/300?random=101', isPublic: true, shareSlug: 'abstract-harmony', createdAt: '2025-12-01T10:00:00Z' },
            { id: 2, title: 'Urban Dreams', thumbnailUrl: 'https://picsum.photos/300/400?random=102', isPublic: false, shareSlug: 'urban-dreams', createdAt: '2025-11-28T14:30:00Z' },
            { id: 3, title: 'Neon Nights', thumbnailUrl: 'https://picsum.photos/400/400?random=103', isPublic: true, shareSlug: 'neon-nights', createdAt: '2025-12-03T09:15:00Z' },
            { id: 4, title: 'Silence', thumbnailUrl: 'https://picsum.photos/400/250?random=104', isPublic: false, shareSlug: 'silence', createdAt: '2025-10-15T16:45:00Z' },
            { id: 5, title: 'Chaos Theory', thumbnailUrl: 'https://picsum.photos/300/300?random=105', isPublic: true, shareSlug: 'chaos-theory', createdAt: '2025-12-05T11:00:00Z' },
            { id: 6, title: 'Serenity', thumbnailUrl: 'https://picsum.photos/400/500?random=106', isPublic: false, shareSlug: 'serenity', createdAt: '2025-09-20T08:30:00Z' },
            { id: 7, title: 'Digital Bloom', thumbnailUrl: 'https://picsum.photos/350/450?random=107', isPublic: true, shareSlug: 'digital-bloom', createdAt: '2025-11-10T13:20:00Z' },
            { id: 8, title: 'Fractured Light', thumbnailUrl: 'https://picsum.photos/450/300?random=108', isPublic: false, shareSlug: 'fractured-light', createdAt: '2025-12-04T17:00:00Z' }
        ];
    }

    function renderGrid() {
        const filtered = filterArtworks();

        if (filtered.length === 0) {
            elements.grid.style.display = 'none';
            elements.emptyState.style.display = 'block';
            updateFooter();
            return;
        }

        elements.emptyState.style.display = 'none';
        elements.grid.style.display = 'block';

        elements.grid.innerHTML = filtered.map(artwork => {
            const isSelected = state.selectedIds.has(artwork.id);
            const formattedDate = formatDate(artwork.createdAt);
            const embedUrl = `${typeof ArtorizeConfig !== 'undefined' ? ArtorizeConfig.EMBED_URL : 'https://embed.artorize.com'}/${artwork.shareSlug}`;

            return `
                <div class="shared-artwork-card ${isSelected ? 'shared-selected' : ''}"
                     data-id="${artwork.id}"
                     onclick="SharedArtworks.toggleSelect(${artwork.id}, event)"
                     style="break-inside: avoid; margin-bottom: 1.25rem; cursor: pointer;">
                    <img src="${artwork.thumbnailUrl}"
                         alt="${artwork.title}"
                         loading="lazy"
                         style="width: 100%; height: auto; display: block; border-radius: var(--art-radius-md); transition: box-shadow 0.2s ease, opacity 0.2s ease;"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                    <div style="padding: 0.5rem 0.125rem 0;" onclick="event.stopPropagation()">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                            <span style="font-weight: 600; font-size: var(--art-text-sm); color: var(--art-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${artwork.title}">${artwork.title}</span>
                            <button class="artorize-toggle ${artwork.isPublic ? 'active' : ''}"
                                    onclick="SharedArtworks.toggleVisibility(${artwork.id})"
                                    title="${artwork.isPublic ? 'Public' : 'Private'}">
                            </button>
                        </div>
                        <div class="artwork-url-container" style="margin-top: 0.375rem;">
                            <span class="url-prefix">/</span>
                            <input type="text"
                                   class="artwork-url-input"
                                   value="${artwork.shareSlug}"
                                   placeholder="url-slug"
                                   onchange="SharedArtworks.updateSlug(${artwork.id}, this.value)">
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; padding: 0.2rem 0.4rem; background: var(--art-surface-hover); border-radius: var(--art-radius-sm);">
                            <code style="font-size: 10px; color: var(--art-text-faint); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--art-font-mono);">${embedUrl}</code>
                            <button onclick="SharedArtworks.copyUrl('${artwork.shareSlug}')"
                                    style="border: none; background: none; cursor: pointer; color: var(--art-text-faint); padding: 2px;"
                                    title="Copy URL">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect width="14" height="14" x="8" y="8" rx="2"/>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                            </button>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.375rem;">
                            <span style="font-size: 11px; color: var(--art-text-faint);">${formattedDate}</span>
                            <span style="font-size: 10px; padding: 1px 6px; border-radius: 9999px; font-weight: 500; ${artwork.isPublic ? 'background: #ecfdf5; color: var(--art-success);' : 'background: var(--art-surface-hover); color: var(--art-text-muted);'}">
                                ${artwork.isPublic ? 'Public' : 'Private'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        updateFooter();
        updateToolbar();
    }

    function filterArtworks() {
        let filtered = state.artworks;

        if (state.filter === 'public') {
            filtered = filtered.filter(a => a.isPublic);
        } else if (state.filter === 'private') {
            filtered = filtered.filter(a => !a.isPublic);
        }

        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.shareSlug.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Unknown date';
        }
    }

    function toggleSelect(id, event) {
        if (state.selectedIds.has(id)) {
            state.selectedIds.delete(id);
        } else {
            state.selectedIds.add(id);
        }

        renderGrid();
    }

    function selectAll() {
        const filtered = filterArtworks();
        filtered.forEach(artwork => state.selectedIds.add(artwork.id));
        renderGrid();
    }

    function deselectAll() {
        state.selectedIds.clear();
        renderGrid();
    }

    function toggleVisibility(id) {
        const artwork = state.artworks.find(a => a.id === id);
        if (!artwork) return;

        artwork.isPublic = !artwork.isPublic;
        renderGrid();
        showNotification(`Artwork set to ${artwork.isPublic ? 'public' : 'private'}`);
    }

    function updateSlug(id, newSlug) {
        const artwork = state.artworks.find(a => a.id === id);
        if (!artwork) return;

        const sanitized = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
        if (!sanitized) {
            showNotification('Invalid URL slug');
            renderGrid();
            return;
        }

        artwork.shareSlug = sanitized;
        renderGrid();
        showNotification('URL slug updated');
    }

    function bulkSetVisibility(isPublic) {
        if (state.selectedIds.size === 0) return;

        state.selectedIds.forEach(id => {
            const artwork = state.artworks.find(a => a.id === id);
            if (artwork) {
                artwork.isPublic = isPublic;
            }
        });

        renderGrid();
        showNotification(`${state.selectedIds.size} artwork${state.selectedIds.size > 1 ? 's' : ''} set to ${isPublic ? 'public' : 'private'}`);
    }

    function bulkDelete() {
        if (state.selectedIds.size === 0) return;

        const count = state.selectedIds.size;
        if (!confirm(`Delete ${count} selected artwork${count > 1 ? 's' : ''}? This cannot be undone.`)) {
            return;
        }

        state.artworks = state.artworks.filter(a => !state.selectedIds.has(a.id));
        state.selectedIds.clear();
        renderGrid();
        showNotification(`${count} artwork${count > 1 ? 's' : ''} deleted`);
    }

    function setFilter(filter) {
        state.filter = filter;

        elements.overlay.querySelectorAll('.share-filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('artorize-btn-secondary');
            btn.classList.add('artorize-btn-ghost');
        });

        const activeBtn = elements.overlay.querySelector(`.share-filter-btn[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.classList.add('artorize-btn-secondary');
            activeBtn.classList.remove('artorize-btn-ghost');
        }

        renderGrid();
    }

    function handleSearch(query) {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            state.searchQuery = query.trim();
            renderGrid();
        }, 200);
    }

    function copyUrl(slug) {
        const fullUrl = `${typeof ArtorizeConfig !== 'undefined' ? ArtorizeConfig.EMBED_URL : 'https://embed.artorize.com'}/${slug}`;

        navigator.clipboard.writeText(fullUrl).then(() => {
            showNotification('URL copied to clipboard!');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = fullUrl;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('URL copied to clipboard!');
        });
    }

    function updateToolbar() {
        const selectedCount = state.selectedIds.size;
        elements.bulkActions.style.display = selectedCount > 0 ? 'flex' : 'none';
    }

    function updateFooter() {
        const total = state.artworks.length;
        const publicCount = state.artworks.filter(a => a.isPublic).length;
        const filteredCount = filterArtworks().length;

        if (state.filter !== 'all' || state.searchQuery) {
            elements.artworkCount.textContent = `${filteredCount} of ${total} artwork${total !== 1 ? 's' : ''} • ${publicCount} public`;
        } else {
            elements.artworkCount.textContent = `${total} artwork${total !== 1 ? 's' : ''} • ${publicCount} public`;
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: hsl(240, 3%, 11%);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        if (!document.getElementById('shared-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'shared-notification-styles';
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

    function open() {
        state.isOpen = true;
        state.selectedIds.clear();
        state.filter = 'all';
        state.searchQuery = '';
        if (elements.searchInput) {
            elements.searchInput.value = '';
        }
        // Reset filter button visuals
        elements.overlay.querySelectorAll('.share-filter-btn').forEach(btn => {
            btn.classList.remove('active', 'artorize-btn-secondary');
            btn.classList.add('artorize-btn-ghost');
        });
        const allBtn = elements.overlay.querySelector('.share-filter-btn[data-filter="all"]');
        if (allBtn) {
            allBtn.classList.add('active', 'artorize-btn-secondary');
            allBtn.classList.remove('artorize-btn-ghost');
        }
        renderGrid();
        elements.overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        state.isOpen = false;
        elements.overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.SharedArtworks = {
        open,
        close,
        toggleSelect,
        selectAll,
        deselectAll,
        toggleVisibility,
        updateSlug,
        bulkSetVisibility,
        bulkDelete,
        setFilter,
        handleSearch,
        copyUrl
    };

})();
