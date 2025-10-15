// Configuration Edit Mode Functions

function enterEditMode(item, configName, configData) {
    const viewMode = item.querySelector('.config-view-mode');
    const editMode = item.querySelector('.config-edit-mode');
    const editBtn = item.querySelector('.btn-edit-config');

    // Hide view mode, show edit mode
    viewMode.style.display = 'none';
    editMode.style.display = 'block';
    editBtn.style.display = 'none';

    // Hide modal footer to maximize screen space
    const modalFooter = document.querySelector('#change-config-modal .modal-footer');
    if (modalFooter) {
        modalFooter.style.display = 'none';
    }

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

    // Show modal footer again
    const modalFooter = document.querySelector('#change-config-modal .modal-footer');
    if (modalFooter) {
        modalFooter.style.display = 'flex';
    }
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
                    <div class="time-input-wrapper">
                        <input type="text" class="interval-start-time" value="${startHour}:${startMin}" pattern="[0-2][0-9]:[0-5][0-9]" maxlength="5" placeholder="HH:MM">
                        <input type="time" class="interval-start-time-picker" value="${startHour}:${startMin}" step="60">
                    </div>
                    <label>End:</label>
                    <div class="time-input-wrapper">
                        <input type="text" class="interval-end-time" value="${endHour}:${endMin}" pattern="[0-2][0-9]:[0-5][0-9]" maxlength="5" placeholder="HH:MM">
                        <input type="time" class="interval-end-time-picker" value="${endHour}:${endMin}" step="60">
                    </div>
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
    const saveBtn = editMode.querySelector('.save-edit-btn');
    saveBtn.addEventListener('click', function() {
        saveConfigChanges(editMode, item, configName);
    });

    const cancelBtn = editMode.querySelector('.cancel-edit-btn');
    cancelBtn.addEventListener('click', function() {
        exitEditMode(item);
    });

    editMode.querySelectorAll('.btn-add-interval').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            addNewInterval(editMode, day, configData);
        });
    });

    editMode.querySelectorAll('.btn-delete-interval').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const index = this.getAttribute('data-index');
            deleteInterval(editMode, day, index, configData);
        });
    });

    setupTimeInputSync(editMode);
    setupRealtimeValidation(editMode);
}

function setupTimeInputSync(editMode) {
    // Sync time picker (mobile) with text input (desktop)
    editMode.querySelectorAll('.time-input-wrapper').forEach(wrapper => {
        const textInput = wrapper.querySelector('input[type="text"]');
        const timePickerInput = wrapper.querySelector('input[type="time"]');

        timePickerInput.addEventListener('change', function() {
            textInput.value = this.value;
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
            textInput.dispatchEvent(new Event('blur', { bubbles: true }));
        });

        timePickerInput.addEventListener('input', function() {
            textInput.value = this.value;
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
        });

        textInput.addEventListener('input', function() {
            if (this.value.match(/^[0-2][0-9]:[0-5][0-9]$/)) {
                timePickerInput.value = this.value;
            }
        });
    });
}

function addNewInterval(editMode, day, configData) {
    const newInterval = {
        start_time: { hour: 0, minute: 0 },
        end_time: { hour: 23, minute: 59 },
        ON_temperature: 20.0,
        OFF_temperature: 21.0
    };

    if (!configData[day]) {
        configData[day] = [];
    }
    configData[day].push(newInterval);

    const newIndex = configData[day].length - 1;

    const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);
    const intervalsContainer = daySection.querySelector('.intervals-edit');
    intervalsContainer.innerHTML = '';
    configData[day].forEach((interval, idx) => {
        intervalsContainer.innerHTML += buildIntervalEditHtml(day, idx, interval);
    });

    reattachIntervalHandlers(editMode, intervalsContainer, day, configData);
    setupRealtimeValidation(editMode);

    const newIntervalElement = intervalsContainer.querySelector(`.interval-edit-item[data-index="${newIndex}"]`);
    if (newIntervalElement) {
        const firstInput = newIntervalElement.querySelector('.interval-start-time');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }

    showMessage(`New interval added to ${day}`, 'success');
}

function reattachIntervalHandlers(editMode, intervalsContainer, day, configData) {
    intervalsContainer.querySelectorAll('.btn-delete-interval').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const index = this.getAttribute('data-index');
            deleteInterval(editMode, day, index, configData);
        });
    });

    setupTimeInputSync(editMode);
}

function deleteInterval(editMode, day, index, configData) {
    const intervals = configData[day];
    if (intervals.length <= 1) {
        showMessage(`Cannot delete the only interval for ${day}`, 'error');
        return;
    }

    intervals.splice(index, 1);

    const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);
    const intervalsContainer = daySection.querySelector('.intervals-edit');
    intervalsContainer.innerHTML = '';
    intervals.forEach((interval, idx) => {
        intervalsContainer.innerHTML += buildIntervalEditHtml(day, idx, interval);
    });

    reattachIntervalHandlers(editMode, intervalsContainer, day, configData);
    setupRealtimeValidation(editMode);
    validateInRealtime(editMode);
}

async function saveConfigChanges(editMode, item, configName) {
    const updatedConfig = collectIntervalData(editMode);

    const validationError = validateConfiguration(updatedConfig);
    if (validationError) {
        showMessage(validationError, 'error');
        return;
    }

    try {
        const { response, data } = await updateConfig(configName, updatedConfig);

        if (response.ok) {
            showMessage(`Configuration "${configName}" saved successfully`, 'success');

            const viewMode = item.querySelector('.config-view-mode');
            viewMode.innerHTML = buildConfigDetailsHtml(updatedConfig);

            exitEditMode(item);
        } else {
            showMessage(`Error saving: ${data.detail}`, 'error');
        }
    } catch (error) {
        console.error('Error saving configuration:', error);
        showMessage('Failed to save configuration', 'error');
    }
}
