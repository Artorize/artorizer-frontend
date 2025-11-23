(function () {
  'use strict';

// State management
const selectedProtections = new Set();

// Protection name mapping
const protectionNames = {
  'fawkes': 'Fawkes Protection',
  'photoguard': 'PhotoGuard Protection',
  'mist': 'MIST Protection',
  'nightshade': 'Nightshade Protection',
  'c2pa': 'C2PA Manifest',
  'watermark': 'Apply Watermark'
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
        <img src="assets/svg/icons/icon-check-circle-large.svg" alt="icon-check-circle-large" class="text-gray-300 mb-4" />
        <p class="text-sm text-subtle">Select protection layers to begin</p>
      </div>
    `;
    return;
  }

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
  const step = document.querySelector(`[data-protection="${protection}"]`);
  if (!step) {
    console.log(`[Progress] Step not found for protection: ${protection}`);
    return;
  }

  console.log(`[Progress] Updating step ${protection} to ${status}`, time);

  const header = step.querySelector('.CheckStep-header .d-flex');
  const name = protectionNames[protection] || protection;

  let iconHTML = '';
  let timeHTML = '';
  let textClass = '';

  if (status === 'success' || status === 'completed') {
    iconHTML = `<img src="assets/svg/icons/icon-check.svg" alt="icon-check" class="mr-3 flex-shrink-0 ml-1" />`;
    timeHTML = `<div class="text-mono text-normal text-small float-right text-xs">${time || '0.0s'}</div>`;
    step.setAttribute('data-conclusion', 'success');
  } else if (status === 'in-progress' || status === 'processing') {
    iconHTML = `<img src="assets/svg/icons/icon-check-1606.svg" alt="icon-check" class="anim-rotate mr-2 flex-shrink-0" />`;
    timeHTML = `<div class="text-mono text-normal text-small float-right text-xs">...</div>`;
    step.setAttribute('data-conclusion', 'in-progress');
  } else if (status === 'error' || status === 'failed') {
    iconHTML = `<img src="assets/svg/icons/icon-error.svg" alt="icon-error" class="mr-3 flex-shrink-0 ml-1" />`;
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

// Expose helpers to the global window scope for reuse
window.updateProgressStep = updateProgressStep;
window.toggleProtection = toggleProtection;

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
  displayInput.addEventListener('click', () => {
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeWatermarkListener();
    updateProgressTracker();
    initializeDatePicker();
  });
} else {
  initializeTabs();
  initializeWatermarkListener();
  updateProgressTracker();
  initializeDatePicker();
}

})();
