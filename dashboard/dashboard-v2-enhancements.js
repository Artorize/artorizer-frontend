(function () {
  'use strict';

console.log('[Dashboard Enhancements] Version: 1.0.2 | Last Updated: 2025-12-12 15:45 UTC');

// State management
const selectedProtections = new Set();

// Protection name mapping
const protectionNames = {
  'upload': 'Uploading Artwork',
  'fawkes': 'Fawkes Protection',
  'photoguard': 'PhotoGuard Protection',
  'mist': 'MIST Protection',
  'nightshade': 'Nightshade Protection',
  'c2pa': 'C2PA Manifest',
  'watermark': 'Visible Watermark'
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

// Toggle History Modal
function toggleHistoryModal() {
  console.log('[History Modal] Toggling history modal...');
  let modal = document.getElementById('history-modal');

  if (!modal) {
    // Create the modal if it doesn't exist
    modal = document.createElement('div');
    modal.id = 'history-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">Full History</h2>
          <button type="button" onclick="toggleHistoryModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-4 overflow-y-auto max-h-[60vh]" id="history-modal-content">
          <p class="text-sm text-gray-500 text-center py-8">Loading history...</p>
        </div>
        <div class="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button type="button" onclick="clearEditingHistory()" class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
            Clear All History
          </button>
          <button type="button" onclick="toggleHistoryModal()" class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Load history content
    loadHistoryContent();
  } else {
    // Toggle existing modal
    if (modal.style.display === 'none') {
      modal.style.display = 'flex';
      loadHistoryContent();
    } else {
      modal.style.display = 'none';
    }
  }
}

// Load history content into modal
function loadHistoryContent() {
  const content = document.getElementById('history-modal-content');
  const historyList = document.getElementById('editing-history-list');

  if (content && historyList) {
    // Clone the history list content
    const historyItems = historyList.innerHTML;
    if (historyItems.trim()) {
      content.innerHTML = `<ul class="stack gap-2">${historyItems}</ul>`;
    } else {
      content.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">No history yet</p>';
    }
  }
}

// Current platform selection
let currentPlatform = 'static-edit';

// Toggle Platform Dropdown (new popper-based dropdown)
function togglePlatformDropdown() {
  const dropdown = document.getElementById('platform-dropdown');
  const button = document.getElementById('radix-:r1eo:');

  if (!dropdown) return;

  const isHidden = dropdown.classList.contains('hidden');

  if (isHidden) {
    // Position dropdown below the button
    if (button) {
      const rect = button.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.left = `${rect.left}px`;
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('data-state', 'open');
    }
    dropdown.classList.remove('hidden');
    dropdown.querySelector('[role="menu"]')?.setAttribute('data-state', 'open');
  } else {
    dropdown.classList.add('hidden');
    dropdown.querySelector('[role="menu"]')?.setAttribute('data-state', 'closed');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('data-state', 'closed');
    }
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('platform-dropdown');
  const button = document.getElementById('radix-:r1eo:');

  if (!dropdown || dropdown.classList.contains('hidden')) return;

  if (!dropdown.contains(e.target) && !button?.contains(e.target)) {
    dropdown.classList.add('hidden');
    dropdown.querySelector('[role="menu"]')?.setAttribute('data-state', 'closed');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('data-state', 'closed');
    }
  }
});

// Toggle Platform Radio (legacy function, kept for backward compatibility)
function togglePlatformRadio() {
  // Use the new dropdown toggle
  togglePlatformDropdown();
}

// Select Platform Card (new function for card-based selection)
function selectPlatformCard(platform) {
  currentPlatform = platform;

  // Remove selected class from all cards
  document.querySelectorAll('.platform-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Add selected class to the clicked card
  const selectedCard = document.querySelector(`.platform-card[data-platform="${platform}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  console.log('[Platform] Selected:', platform);

  // You can add additional logic here based on the selected platform
  // For example, switching views or loading different configurations
}

// Select Platform (legacy function, kept for backward compatibility)
function selectPlatform(platform, label) {
  currentPlatform = platform;

  // Update the sidebar platform label
  const sidebarLabel = document.getElementById('current-platform-label');
  if (sidebarLabel) {
    sidebarLabel.textContent = label;
  }

  // Update the short mode label next to logo
  const modeLabel = document.getElementById('platform-mode-label');
  if (modeLabel) {
    modeLabel.textContent = platform === 'static-edit' ? 'Static' : 'Export';
  }

  // Update the radio button label (legacy)
  const labelEl = document.getElementById('platform-radio-label');
  if (labelEl) {
    labelEl.textContent = label;
  }

  // Update radio indicators
  document.querySelectorAll('.platform-radio-indicator').forEach(indicator => {
    const indicatorPlatform = indicator.getAttribute('data-platform');
    if (indicatorPlatform === platform) {
      indicator.classList.remove('hidden', 'bg-transparent');
      indicator.classList.add('bg-blue-500');
    } else {
      indicator.classList.add('hidden', 'bg-transparent');
      indicator.classList.remove('bg-blue-500');
    }
  });

  // Update dropdown menu item selection
  document.querySelectorAll('.platform-menu-item-wrapper').forEach(item => {
    if (item.getAttribute('data-platform') === platform) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });

  // Collapse the radio after selection
  togglePlatformRadio();

  // Handle Export to Website - show embed popup
  if (platform === 'export-website') {
    showEmbedCodePopup();
  }

  console.log('[Platform] Selected:', platform, label);
}

// Show Embed Code Popup for Export to Website
function showEmbedCodePopup() {
  const popup = document.getElementById('embed-code-popup');
  if (popup) {
    popup.classList.remove('hidden');
    // Load artworks into the select dropdown
    loadArtworksForEmbed();
  }
}

// Load artworks into embed select dropdown
function loadArtworksForEmbed() {
  const select = document.getElementById('embed-artwork-select');
  if (!select) return;

  // Clear existing options except the placeholder
  select.innerHTML = '<option value="" disabled selected>Choose an artwork...</option>';

  // Get artworks from history or current session
  // This will be populated dynamically based on user's artworks
  const artworks = window.userArtworks || [];

  if (artworks.length === 0) {
    // Add a placeholder message if no artworks
    const option = document.createElement('option');
    option.value = '';
    option.disabled = true;
    option.textContent = 'No artworks available';
    select.appendChild(option);
    return;
  }

  artworks.forEach(artwork => {
    const option = document.createElement('option');
    option.value = artwork.id;
    option.textContent = artwork.name || `Artwork ${artwork.id}`;
    select.appendChild(option);
  });
}

// Update embed code when artwork is selected
function updateEmbedCode() {
  const select = document.getElementById('embed-artwork-select');
  const codeEl = document.getElementById('embed-code-content');

  if (!select || !codeEl) return;

  const embedUrl = window.ArtorizeConfig?.EMBED_URL || 'https://artorizer.com/embed';
  const artworkId = select.value;
  if (artworkId) {
    codeEl.textContent = `<iframe src="${embedUrl}/${artworkId}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
  } else {
    codeEl.textContent = `<iframe src="${embedUrl}/YOUR_ARTWORK_ID" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
  }
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
window.toggleWatermarkDropdown = toggleWatermarkDropdown;
window.selectWatermarkStrategy = selectWatermarkStrategy;
window.toggleHistoryModal = toggleHistoryModal;
window.loadHistoryContent = loadHistoryContent;
window.togglePlatformRadio = togglePlatformRadio;
window.togglePlatformDropdown = togglePlatformDropdown;
window.selectPlatform = selectPlatform;
window.showEmbedCodePopup = showEmbedCodePopup;
window.closeEmbedCodePopup = closeEmbedCodePopup;
window.copyEmbedCode = copyEmbedCode;
window.loadArtworksForEmbed = loadArtworksForEmbed;
window.updateEmbedCode = updateEmbedCode;

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
