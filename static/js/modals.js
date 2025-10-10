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
            const deleteBtn = item.querySelector('.delete-config-btn');

            // Delete button handler
            deleteBtn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const configName = this.getAttribute('data-config');
                await handleDeleteConfig(configName, currentConfig);
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
