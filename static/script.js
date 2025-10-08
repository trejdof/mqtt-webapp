// API Configuration
const API_BASE = window.location.origin;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadSystemState();
    // Refresh every 10 seconds
    setInterval(loadSystemState, 10000);

    // Setup modals
    setupModal();
    setupChangeConfigModal();
});

async function loadSystemState() {
    try {
        const response = await fetch(`${API_BASE}/state`);
        const data = await response.json();

        if (response.ok) {
            updateStatusDisplay(data);
            // Load detailed interval information
            loadActiveIntervalDetails();
            // Load active configuration
            loadActiveConfig();
        } else {
            showMessage('Error loading system state: ' + data.detail, 'error');
        }
    } catch (error) {
        showMessage('Failed to connect to server', 'error');
        console.error('Error loading system state:', error);
    }
}

async function loadActiveIntervalDetails() {
    try {
        const response = await fetch(`${API_BASE}/state/active-interval-details`);
        const data = await response.json();
        
        if (response.ok) {
            updateActiveIntervalDisplay(data);
        } else {
            console.error('Error loading interval details:', data.detail);
        }
    } catch (error) {
        console.error('Error loading interval details:', error);
    }
}

function updateStatusDisplay(state) {
    // Update boiler status
    const boilerStatus = document.getElementById('boiler-status');
    boilerStatus.textContent = state.boiler_state ? 'ON' : 'OFF';
    boilerStatus.className = 'status-value ' + (state.boiler_state ? 'boiler-on' : 'boiler-off');

    // Update active configuration (clickable)
    const activeConfigElement = document.getElementById('active-config');
    activeConfigElement.textContent = state.selected_config || 'None';

    if (state.selected_config) {
        activeConfigElement.onclick = () => openConfigModal();
    } else {
        activeConfigElement.onclick = null;
        activeConfigElement.style.cursor = 'default';
    }

    // Update temperature
    document.getElementById('current-temp').textContent = `${state.current_temp}°C`;

    // Update temperature info
    const tempChange = state.current_temp - state.prev_temp;
    const tempInfo = document.getElementById('temp-info');
    if (tempChange > 0) {
        tempInfo.textContent = `+${tempChange.toFixed(1)}°C from previous`;
        tempInfo.style.color = '#e53e3e';
    } else if (tempChange < 0) {
        tempInfo.textContent = `${tempChange.toFixed(1)}°C from previous`;
        tempInfo.style.color = '#38a169';
    } else {
        tempInfo.textContent = 'No change from previous';
        tempInfo.style.color = '#718096';
    }

    // Update title with timestamp
    const lastUpdate = new Date(state.current_timestamp);
    document.getElementById('status-title').textContent = `System Status - ${lastUpdate.toLocaleTimeString()}`;
}

function updateActiveIntervalDisplay(intervalData) {
    const activeIntervalElement = document.getElementById('active-interval');
    
    if (intervalData.active_interval) {
        activeIntervalElement.innerHTML = `
            <strong>${intervalData.active_interval}</strong><br>
            <small>${intervalData.start_time} - ${intervalData.end_time}</small><br>
            <small>ON: ${intervalData.ON_temperature}°C | OFF: ${intervalData.OFF_temperature}°C</small>
        `;
    } else {
        activeIntervalElement.textContent = 'None';
    }
}

async function loadActiveConfig() {
    try {
        const response = await fetch(`${API_BASE}/state/active-config`);
        const data = await response.json();

        if (response.ok) {
            updateConfigDisplay(data);
        } else {
            console.error('Error loading active config:', data.detail);
        }
    } catch (error) {
        console.error('Error loading active config:', error);
    }
}

let cachedConfigData = null;

function updateConfigDisplay(data) {
    cachedConfigData = data;
}

function setupModal() {
    const modal = document.getElementById('config-modal');
    const closeBtn = document.querySelector('.close');

    // Close modal when clicking X
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

function openConfigModal() {
    if (!cachedConfigData || !cachedConfigData.config) {
        showMessage('No configuration data available', 'error');
        return;
    }

    const modal = document.getElementById('config-modal');
    const modalTitle = document.getElementById('modal-title');
    const scheduleDiv = document.getElementById('modal-config-schedule');

    modalTitle.textContent = `Configuration: ${cachedConfigData.config_name}`;

    const config = cachedConfigData.config;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    let html = '';
    days.forEach(day => {
        const intervals = config[day];
        if (intervals && intervals.length > 0) {
            html += `<div class="day-schedule">`;
            html += `<div class="day-name">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
            html += `<div class="intervals">`;

            intervals.forEach((interval, idx) => {
                const startTime = `${String(interval.start_time.hour).padStart(2, '0')}:${String(interval.start_time.minute).padStart(2, '0')}`;
                const endTime = `${String(interval.end_time.hour).padStart(2, '0')}:${String(interval.end_time.minute).padStart(2, '0')}`;

                html += `
                    <div class="interval-item">
                        <span class="interval-time">${startTime} - ${endTime}</span>
                        <span class="interval-temps">ON: ${interval.ON_temperature}°C | OFF: ${interval.OFF_temperature}°C</span>
                    </div>
                `;
            });

            html += `</div></div>`;
        }
    });

    if (html === '') {
        scheduleDiv.innerHTML = '<p style="color: #737373;">Configuration is empty</p>';
    } else {
        scheduleDiv.innerHTML = html;
    }

    modal.style.display = 'block';
}

function setupChangeConfigModal() {
    const modal = document.getElementById('change-config-modal');
    const closeBtn = document.querySelector('.close-change-modal');
    const cancelBtn = document.getElementById('cancel-change-btn');
    const confirmBtn = document.getElementById('confirm-change-btn');
    const changeConfigBtn = document.getElementById('change-config-btn');

    // Open modal
    changeConfigBtn.onclick = function() {
        openChangeConfigModal();
    }

    // Close modal handlers
    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    // Close when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Confirm selection
    confirmBtn.onclick = async function() {
        const selectedRadio = document.querySelector('input[name="config-select"]:checked');
        if (!selectedRadio) {
            showMessage('Please select a configuration', 'error');
            return;
        }

        const configName = selectedRadio.value;
        await changeConfiguration(configName);
        closeModal();
    };
}

async function openChangeConfigModal() {
    const modal = document.getElementById('change-config-modal');
    const configListDiv = document.getElementById('config-list');

    // Fetch all configurations
    try {
        const response = await fetch(`${API_BASE}/configs`);
        const configs = await response.json();

        if (!response.ok) {
            showMessage('Error loading configurations', 'error');
            return;
        }

        // Get current state to know which config is active
        const stateResponse = await fetch(`${API_BASE}/state`);
        const state = await stateResponse.json();
        const currentConfig = state.selected_config;

        // Build the config list
        let html = '';
        const configNames = Object.keys(configs);

        if (configNames.length === 0) {
            html = '<p style="color: #737373;">No configurations available</p>';
        } else {
            configNames.forEach(configName => {
                const isSelected = configName === currentConfig;
                const configData = configs[configName];

                // Build details HTML
                const detailsHtml = buildConfigDetailsHtml(configData);

                html += `
                    <div class="config-list-item ${isSelected ? 'selected' : ''}" data-config="${configName}">
                        <div class="config-item-header">
                            <input type="radio" name="config-select" value="${configName}" id="config-${configName}" ${isSelected ? 'checked' : ''}>
                            <label for="config-${configName}">${configName}</label>
                            <svg class="expand-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="config-details">
                            <div class="config-details-content">
                                ${detailsHtml}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        configListDiv.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.config-list-item').forEach(item => {
            const header = item.querySelector('.config-item-header');
            const radio = item.querySelector('input[type="radio"]');
            const expandIcon = item.querySelector('.expand-icon');
            const details = item.querySelector('.config-details');

            // Click on header to select
            header.addEventListener('click', function(e) {
                // If clicking on radio or label, let default behavior happen
                if (e.target === radio || e.target.tagName === 'LABEL') {
                    radio.checked = true;
                    // Update selected class
                    document.querySelectorAll('.config-list-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    return;
                }

                // Otherwise toggle expansion
                e.stopPropagation();
                toggleConfigDetails(item);
            });

            // Click on expand icon to toggle
            expandIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleConfigDetails(item);
            });

            // Radio change handler
            radio.addEventListener('change', function() {
                if (this.checked) {
                    document.querySelectorAll('.config-list-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            });
        });

        modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading configurations:', error);
        showMessage('Failed to load configurations', 'error');
    }
}

function toggleConfigDetails(item) {
    const details = item.querySelector('.config-details');
    const expandIcon = item.querySelector('.expand-icon');
    const isExpanded = details.classList.contains('expanded');

    // Collapse all other items
    document.querySelectorAll('.config-list-item').forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.querySelector('.config-details').classList.remove('expanded');
            otherItem.querySelector('.expand-icon').classList.remove('expanded');
        }
    });

    // Toggle current item
    if (isExpanded) {
        details.classList.remove('expanded');
        expandIcon.classList.remove('expanded');
    } else {
        details.classList.add('expanded');
        expandIcon.classList.add('expanded');
    }
}

function buildConfigDetailsHtml(configData) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let html = '';

    days.forEach(day => {
        const intervals = configData[day];
        if (intervals && intervals.length > 0) {
            html += `<div class="day-schedule">`;
            html += `<div class="day-name">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
            html += `<div class="intervals">`;

            intervals.forEach((interval, idx) => {
                const startTime = `${String(interval.start_time.hour).padStart(2, '0')}:${String(interval.start_time.minute).padStart(2, '0')}`;
                const endTime = `${String(interval.end_time.hour).padStart(2, '0')}:${String(interval.end_time.minute).padStart(2, '0')}`;

                html += `
                    <div class="interval-item">
                        <span class="interval-time">${startTime} - ${endTime}</span>
                        <span class="interval-temps">ON: ${interval.ON_temperature}°C | OFF: ${interval.OFF_temperature}°C</span>
                    </div>
                `;
            });

            html += `</div></div>`;
        }
    });

    if (html === '') {
        html = '<p style="color: #737373; font-size: 0.875rem;">No intervals configured</p>';
    }

    return html;
}

async function changeConfiguration(configName) {
    try {
        const response = await fetch(`${API_BASE}/state/select-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ config_name: configName })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`Configuration changed to: ${configName}`, 'success');
            // Reload state to reflect the change
            loadSystemState();
        } else {
            showMessage(`Error: ${data.detail}`, 'error');
        }
    } catch (error) {
        console.error('Error changing configuration:', error);
        showMessage('Failed to change configuration', 'error');
    }
}

function showMessage(text, type) {
    const messagesDiv = document.getElementById('messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    messagesDiv.appendChild(message);

    // Auto-remove message after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}