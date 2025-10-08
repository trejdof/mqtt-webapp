// Main Application Entry Point

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadSystemState();
    // Refresh every 10 seconds
    setInterval(loadSystemState, 1000);

    // Setup modals
    setupConfigViewModal();
    setupChangeConfigModal();
});

async function loadSystemState() {
    try {
        const data = await fetchState();
        updateStatusDisplay(data);

        // Load detailed interval information
        loadActiveIntervalDetails();

        // Load active configuration
        loadActiveConfig();
    } catch (error) {
        showMessage('Failed to connect to server', 'error');
        console.error('Error loading system state:', error);
    }
}

async function loadActiveIntervalDetails() {
    try {
        const data = await fetchActiveIntervalDetails();
        updateActiveIntervalDisplay(data);
    } catch (error) {
        console.error('Error loading interval details:', error);
    }
}

async function loadActiveConfig() {
    try {
        const data = await fetchActiveConfig();
        updateConfigDisplay(data);
    } catch (error) {
        console.error('Error loading active config:', error);
    }
}
