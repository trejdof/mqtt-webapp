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
