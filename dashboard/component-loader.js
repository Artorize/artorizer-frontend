/**
 * Component Loader
 * Loads HTML components dynamically and initializes them in the correct order
 */

(function() {
    'use strict';

    const componentConfig = [
        { name: 'sidebar', selector: '[data-component="sidebar"]', path: 'components/sidebar.html' },
        { name: 'header', selector: '[data-component="header"]', path: 'components/header.html' },
        { name: 'upload-zone', selector: '[data-component="upload-zone"]', path: 'components/upload-zone.html' },
        { name: 'config-panel', selector: '[data-component="config-panel"]', path: 'components/config-panel.html' },
        { name: 'progress-panel', selector: '[data-component="progress-panel"]', path: 'components/progress-panel.html' }
    ];

    async function loadComponent(config) {
        try {
            const response = await fetch(config.path);
            if (!response.ok) {
                throw new Error(`Failed to load ${config.name}: ${response.status}`);
            }
            const html = await response.text();
            return { config, html };
        } catch (error) {
            console.error(`Error loading component ${config.name}:`, error);
            return { config, html: `<div class="p-4 text-red-500">Error loading ${config.name}</div>`, error };
        }
    }

    async function loadAllComponents() {
        // Fetch all components in parallel for performance
        const promises = componentConfig.map(loadComponent);
        const results = await Promise.all(promises);

        // Inject components in the specified order
        results.forEach(({ config, html, error }) => {
            const container = document.querySelector(config.selector);
            if (container) {
                container.outerHTML = html;
                if (!error) {
                    console.log(`Component ${config.name} loaded successfully`);
                } else {
                    console.error(`Component ${config.name} failed to load`);
                }
            } else {
                console.warn(`Container not found for component: ${config.name}`);
            }
        });

        // Dispatch custom event to signal all components are ready
        const event = new CustomEvent('components:ready', {
            detail: {
                loaded: results.filter(r => !r.error).map(r => r.config.name),
                failed: results.filter(r => r.error).map(r => r.config.name)
            }
        });
        document.dispatchEvent(event);

        return results;
    }

    // Auto-load components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllComponents);
    } else {
        loadAllComponents();
    }

    // Export for potential manual reloading
    window.ComponentLoader = {
        reload: loadAllComponents
    };
})();
