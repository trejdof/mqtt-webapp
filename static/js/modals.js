// Modal Management

function setupConfigViewModal() {
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
    const html = buildConfigDetailsHtml(config);
    scheduleDiv.innerHTML = html;

    modal.style.display = 'block';
}

function setupChangeConfigModal() {
    const modal = document.getElementById('change-config-modal');
    const closeBtn = document.querySelector('.close-change-modal');
    const cancelBtn = document.getElementById('cancel-change-btn');
    const confirmBtn = document.getElementById('confirm-change-btn');
    const changeConfigBtn = document.getElementById('change-config-btn');
    const addConfigBtn = document.getElementById('add-config-btn');

    // Open modal
    changeConfigBtn.onclick = function() {
        openChangeConfigModal();
    }

    // Add new config
    addConfigBtn.onclick = async function() {
        const configName = prompt('Enter a name for the new configuration:');

        if (!configName) {
            return; // User cancelled
        }

        // Validate name
        if (configName.trim() === '') {
            showMessage('Configuration name cannot be empty', 'error');
            return;
        }

        try {
            const { response, data } = await createConfig(configName.trim());

            if (response.ok) {
                showMessage(`Configuration "${configName}" created with default intervals`, 'success');
                // Reload the modal to show the new config
                await openChangeConfigModal();
            } else {
                showMessage(`Error: ${data.detail}`, 'error');
            }
        } catch (error) {
            console.error('Error creating configuration:', error);
            showMessage('Failed to create configuration', 'error');
        }
    };

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
        const { response, data: configs } = await fetchAllConfigs();

        if (!response.ok) {
            showMessage('Error loading configurations', 'error');
            return;
        }

        // Get current state to know which config is active
        const state = await fetchState();
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
                            <button class="delete-config-btn" data-config="${configName}" title="Delete configuration">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                            <svg class="expand-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="config-details">
                            <div class="config-details-content">
                                <div class="config-details-header">
                                    <button class="btn-edit-config" data-config="${configName}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Edit Schedule
                                    </button>
                                </div>
                                <div class="config-view-mode">
                                    ${detailsHtml}
                                </div>
                                <div class="config-edit-mode" style="display: none;">
                                    <!-- Edit mode content will be populated here -->
                                </div>
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
            const deleteBtn = item.querySelector('.delete-config-btn');
            const editBtn = item.querySelector('.btn-edit-config');
            const configName = item.getAttribute('data-config');
            const configData = configs[configName];

            // Delete button handler
            deleteBtn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const configName = this.getAttribute('data-config');
                await handleDeleteConfig(configName, currentConfig);
            });

            // Edit button handler
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                enterEditMode(item, configName, configData);
            });

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

                // Don't toggle if clicking on delete button
                if (e.target.closest('.delete-config-btn')) {
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

async function changeConfiguration(configName) {
    try {
        const { response, data } = await selectConfig(configName);

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

async function handleDeleteConfig(configName, currentConfig) {
    // Prevent deletion of currently active config
    if (configName === currentConfig) {
        showMessage(`Cannot delete "${configName}" - it is currently active. Please select a different configuration first.`, 'error');
        return;
    }

    // Confirmation for deletion
    const confirmDelete = confirm(
        `Are you sure you want to delete configuration "${configName}"?\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const { response, data } = await deleteConfig(configName);

        if (response.ok) {
            showMessage(`Configuration "${configName}" deleted successfully`, 'success');
            // Reload the modal to refresh the list
            await openChangeConfigModal();
        } else {
            showMessage(`Error: ${data.detail}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting configuration:', error);
        showMessage('Failed to delete configuration', 'error');
    }
}

// Edit mode functions
function enterEditMode(item, configName, configData) {
    const viewMode = item.querySelector('.config-view-mode');
    const editMode = item.querySelector('.config-edit-mode');
    const editBtn = item.querySelector('.btn-edit-config');

    // Hide view mode, show edit mode
    viewMode.style.display = 'none';
    editMode.style.display = 'block';
    editBtn.style.display = 'none';

    // Build edit UI
    const editHtml = buildEditModeHtml(configData);
    editMode.innerHTML = editHtml;

    // Add event listeners for edit mode controls
    setupEditModeHandlers(editMode, item, configName, configData);
}

function exitEditMode(item) {
    const viewMode = item.querySelector('.config-view-mode');
    const editMode = item.querySelector('.config-edit-mode');
    const editBtn = item.querySelector('.btn-edit-config');

    // Show view mode, hide edit mode
    viewMode.style.display = 'block';
    editMode.style.display = 'none';
    editBtn.style.display = 'inline-flex';
}

function buildEditModeHtml(configData) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let html = '<div class="edit-mode-container">';

    html += '<div class="edit-mode-actions">';
    html += '<button class="btn btn-primary save-edit-btn">Save Changes</button>';
    html += '<button class="btn btn-secondary cancel-edit-btn">Cancel</button>';
    html += '</div>';

    days.forEach(day => {
        const intervals = configData[day] || [];
        html += `<div class="day-edit-section" data-day="${day}">`;
        html += `<div class="day-edit-header">`;
        html += `<span class="day-name">${day.charAt(0).toUpperCase() + day.slice(1)}</span>`;
        html += `<button class="btn-add-interval" data-day="${day}">+ Add Interval</button>`;
        html += `</div>`;
        html += `<div class="intervals-edit">`;

        intervals.forEach((interval, idx) => {
            html += buildIntervalEditHtml(day, idx, interval);
        });

        html += `</div></div>`;
    });

    html += '</div>';
    return html;
}

function buildIntervalEditHtml(day, index, interval) {
    const startHour = String(interval.start_time.hour).padStart(2, '0');
    const startMin = String(interval.start_time.minute).padStart(2, '0');
    const endHour = String(interval.end_time.hour).padStart(2, '0');
    const endMin = String(interval.end_time.minute).padStart(2, '0');

    return `
        <div class="interval-edit-item" data-day="${day}" data-index="${index}">
            <div class="interval-edit-row">
                <div class="interval-time-edit">
                    <label>Start:</label>
                    <input type="time" class="interval-start-time" value="${startHour}:${startMin}">
                    <label>End:</label>
                    <input type="time" class="interval-end-time" value="${endHour}:${endMin}">
                </div>
                <div class="interval-temp-edit">
                    <label>ON:</label>
                    <input type="number" class="interval-on-temp" value="${interval.ON_temperature}" step="0.5" min="0" max="50">
                    <label>°C</label>
                    <label>OFF:</label>
                    <input type="number" class="interval-off-temp" value="${interval.OFF_temperature}" step="0.5" min="0" max="50">
                    <label>°C</label>
                </div>
                <button class="btn-delete-interval" data-day="${day}" data-index="${index}">
                    Remove Interval
                </button>
            </div>
        </div>
    `;
}

function setupEditModeHandlers(editMode, item, configName, configData) {
    // Save button
    const saveBtn = editMode.querySelector('.save-edit-btn');
    saveBtn.addEventListener('click', function() {
        saveConfigChanges(editMode, item, configName);
    });

    // Cancel button
    const cancelBtn = editMode.querySelector('.cancel-edit-btn');
    cancelBtn.addEventListener('click', function() {
        exitEditMode(item);
    });

    // Add interval buttons
    editMode.querySelectorAll('.btn-add-interval').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            addNewInterval(editMode, day, configData);
        });
    });

    // Delete interval buttons
    editMode.querySelectorAll('.btn-delete-interval').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const index = this.getAttribute('data-index');
            deleteInterval(editMode, day, index, configData);
        });
    });

    // Add real-time validation on input change
    setupRealtimeValidation(editMode);
}

function setupRealtimeValidation(editMode) {
    // Listen to all time and temperature inputs
    const allInputs = editMode.querySelectorAll('.interval-start-time, .interval-end-time, .interval-on-temp, .interval-off-temp');

    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Debounce validation slightly
            clearTimeout(input.validationTimeout);
            input.validationTimeout = setTimeout(() => {
                validateInRealtime(editMode);
            }, 300);
        });

        input.addEventListener('blur', function() {
            // Immediate validation on blur
            validateInRealtime(editMode);
        });
    });
}

function validateInRealtime(editMode) {
    // Clear all previous error states
    editMode.querySelectorAll('.day-edit-section').forEach(section => {
        section.classList.remove('has-error');
        const existingError = section.querySelector('.day-validation-error');
        if (existingError) {
            existingError.remove();
        }
    });

    editMode.querySelectorAll('.interval-edit-item').forEach(item => {
        item.classList.remove('has-error');
    });

    editMode.querySelectorAll('input').forEach(input => {
        input.classList.remove('error');
    });

    // Collect and validate data
    const updatedConfig = collectIntervalData(editMode);
    const error = validateConfigurationDetailed(updatedConfig, editMode);

    // No errors - all good!
    if (!error) {
        return true;
    }

    return false;
}

// Enhanced validation that marks specific fields with errors
function validateConfigurationDetailed(config, editMode) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
        const intervals = config[day];
        const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);

        // Rule 1: No empty intervals
        if (!intervals || intervals.length === 0) {
            markDayError(daySection, `Must have at least one interval`);
            return true;
        }

        // Rule 2: Check continuous coverage and wrap-around
        const firstStart = intervals[0].start_time.timestamp;
        const lastEnd = intervals[intervals.length - 1].end_time.timestamp;
        const expectedFirstStart = (lastEnd + 1) % (24 * 60);

        if (firstStart !== expectedFirstStart) {
            // Calculate what the last interval end should be
            const expectedLastEnd = (firstStart - 1 + 24 * 60) % (24 * 60);

            markDayError(daySection, `Must cover full 24 hours. Last interval should end at ${formatTimestamp(expectedLastEnd)}`);
            // Mark last interval as error
            const lastInterval = daySection.querySelector(`.interval-edit-item[data-index="${intervals.length - 1}"]`);
            if (lastInterval) {
                lastInterval.classList.add('has-error');
                lastInterval.querySelector('.interval-end-time').classList.add('error');
            }
            return true;
        }

        // Rule 3: Check continuity between intervals
        let midnightCrossings = 0;
        for (let i = 0; i < intervals.length; i++) {
            const current = intervals[i];
            const start = current.start_time.timestamp;
            const end = current.end_time.timestamp;

            // Check for midnight crossing
            if (start > end) {
                midnightCrossings++;
                if (midnightCrossings > 1) {
                    markDayError(daySection, `Only one interval can cross midnight`);
                    return true;
                }
            }

            // Check continuity with previous interval
            if (i > 0) {
                const prevEnd = intervals[i - 1].end_time.timestamp;
                const expectedStart = (prevEnd + 1) % (24 * 60);

                if (start !== expectedStart) {
                    markDayError(daySection, `Gap between intervals. This interval should start at ${formatTimestamp(expectedStart)}`);
                    // Mark the problematic interval
                    const intervalItem = daySection.querySelector(`.interval-edit-item[data-index="${i}"]`);
                    if (intervalItem) {
                        intervalItem.classList.add('has-error');
                        intervalItem.querySelector('.interval-start-time').classList.add('error');
                    }
                    return true;
                }
            }
        }
    }

    return false; // No errors
}

function markDayError(daySection, message) {
    daySection.classList.add('has-error');

    // Add error message if not already present
    if (!daySection.querySelector('.day-validation-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'day-validation-error';
        errorDiv.textContent = message;
        daySection.querySelector('.intervals-edit').insertAdjacentElement('afterend', errorDiv);
    }
}

function addNewInterval(editMode, day, configData) {
    showMessage('Add interval functionality coming soon', 'error');
    // TODO: Implement add interval logic
}

function deleteInterval(editMode, day, index, configData) {
    const intervals = configData[day];
    if (intervals.length <= 1) {
        showMessage(`Cannot delete the only interval for ${day}`, 'error');
        return;
    }

    // Remove interval from data
    intervals.splice(index, 1);

    // Rebuild the day's intervals UI
    const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);
    const intervalsContainer = daySection.querySelector('.intervals-edit');
    intervalsContainer.innerHTML = '';
    intervals.forEach((interval, idx) => {
        intervalsContainer.innerHTML += buildIntervalEditHtml(day, idx, interval);
    });

    // Re-attach delete handlers
    intervalsContainer.querySelectorAll('.btn-delete-interval').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const index = this.getAttribute('data-index');
            deleteInterval(editMode, day, index, configData);
        });
    });

    // Re-attach real-time validation to new inputs
    setupRealtimeValidation(editMode);

    // Validate immediately after deletion
    validateInRealtime(editMode);
}

async function saveConfigChanges(editMode, item, configName) {
    // Gather all interval data from the form
    const updatedConfig = collectIntervalData(editMode);

    // Validate the configuration
    const validationError = validateConfiguration(updatedConfig);
    if (validationError) {
        showMessage(validationError, 'error');
        return;
    }

    // Send to API
    try {
        const { response, data } = await updateConfig(configName, updatedConfig);

        if (response.ok) {
            showMessage(`Configuration "${configName}" saved successfully`, 'success');

            // Update the view mode with new data
            const viewMode = item.querySelector('.config-view-mode');
            viewMode.innerHTML = buildConfigDetailsHtml(updatedConfig);

            // Exit edit mode
            exitEditMode(item);
        } else {
            showMessage(`Error saving: ${data.detail}`, 'error');
        }
    } catch (error) {
        console.error('Error saving configuration:', error);
        showMessage('Failed to save configuration', 'error');
    }
}

// Utility: Calculate timestamp from hour and minute
function calculateTimestamp(hour, minute) {
    return hour * 60 + minute;
}

// Utility: Parse time input (HH:MM) to hour and minute
function parseTimeInput(timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute, timestamp: calculateTimestamp(hour, minute) };
}

// Collect all interval data from the edit mode form
function collectIntervalData(editMode) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const config = {};

    days.forEach(day => {
        const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);
        const intervalItems = daySection.querySelectorAll('.interval-edit-item');

        config[day] = [];
        intervalItems.forEach(item => {
            const startTime = item.querySelector('.interval-start-time').value;
            const endTime = item.querySelector('.interval-end-time').value;
            const onTemp = parseFloat(item.querySelector('.interval-on-temp').value);
            const offTemp = parseFloat(item.querySelector('.interval-off-temp').value);

            const start = parseTimeInput(startTime);
            const end = parseTimeInput(endTime);

            config[day].push({
                start_time: { hour: start.hour, minute: start.minute, timestamp: start.timestamp },
                end_time: { hour: end.hour, minute: end.minute, timestamp: end.timestamp },
                ON_temperature: onTemp,
                OFF_temperature: offTemp
            });
        });
    });

    return config;
}

// Validate configuration following backend rules
function validateConfiguration(config) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
        const intervals = config[day];

        // Rule 1: No empty intervals
        if (!intervals || intervals.length === 0) {
            return `${day.charAt(0).toUpperCase() + day.slice(1)} must have at least one interval`;
        }

        // Rule 2: Check continuous coverage and wrap-around
        const firstStart = intervals[0].start_time.timestamp;
        const lastEnd = intervals[intervals.length - 1].end_time.timestamp;
        const expectedFirstStart = (lastEnd + 1) % (24 * 60);

        if (firstStart !== expectedFirstStart) {
            return `${day.charAt(0).toUpperCase() + day.slice(1)}: Intervals must cover full 24 hours with no gaps. First interval should start at ${formatTimestamp(expectedFirstStart)}, but starts at ${formatTimestamp(firstStart)}`;
        }

        // Rule 3: Check continuity between intervals
        let midnightCrossings = 0;
        for (let i = 0; i < intervals.length; i++) {
            const current = intervals[i];
            const start = current.start_time.timestamp;
            const end = current.end_time.timestamp;

            // Check for midnight crossing
            if (start > end) {
                midnightCrossings++;
                if (midnightCrossings > 1) {
                    return `${day.charAt(0).toUpperCase() + day.slice(1)}: Only one interval per day can cross midnight`;
                }
            }

            // Check continuity with previous interval
            if (i > 0) {
                const prevEnd = intervals[i - 1].end_time.timestamp;
                const expectedStart = (prevEnd + 1) % (24 * 60);

                if (start !== expectedStart) {
                    return `${day.charAt(0).toUpperCase() + day.slice(1)}: Gap between intervals ${i} and ${i + 1}. Interval ${i + 1} should start at ${formatTimestamp(expectedStart)}, but starts at ${formatTimestamp(start)}`;
                }
            }
        }
    }

    return null; // No errors
}

// Format timestamp (minutes from midnight) to HH:MM
function formatTimestamp(timestamp) {
    const hour = Math.floor(timestamp / 60);
    const minute = timestamp % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
