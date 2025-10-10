// Configuration Selection and Management Functions

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
