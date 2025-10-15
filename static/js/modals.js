function setupConfigViewModal() {
    const modal = document.getElementById('config-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

function setupChangeConfigModal() {
    const modal = document.getElementById('change-config-modal');
    const closeBtn = document.querySelector('.close-change-modal');
    const cancelBtn = document.getElementById('cancel-change-btn');
    const confirmBtn = document.getElementById('confirm-change-btn');
    const changeConfigBtn = document.getElementById('change-config-btn');
    const addConfigBtn = document.getElementById('add-config-btn');

    changeConfigBtn.onclick = function() {
        openChangeConfigModal();
    }

    addConfigBtn.onclick = async function() {
        const configName = prompt('Enter a name for the new configuration:');

        if (!configName) {
            return;
        }

        if (configName.trim() === '') {
            showMessage('Configuration name cannot be empty', 'error');
            return;
        }

        try {
            const { response, data } = await createConfig(configName.trim());

            if (response.ok) {
                showMessage(`Configuration "${configName}" created with default intervals`, 'success');
                await openChangeConfigModal();
            } else {
                showMessage(`Error: ${data.detail}`, 'error');
            }
        } catch (error) {
            console.error('Error creating configuration:', error);
            showMessage('Failed to create configuration', 'error');
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

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
