document.addEventListener('DOMContentLoaded', function() {
    loadSystemState();
    loadDeviceStatus();
    setInterval(loadSystemState, 1000);
    setInterval(loadDeviceStatus, 2000);

    setupConfigViewModal();
    setupChangeConfigModal();

    setupHysteresisInput();
});

async function loadSystemState() {
    try {
        const data = await fetchState();
        updateStatusDisplay(data);

        loadActiveIntervalDetails();

        loadActiveConfig();
    } catch (error) {
        showMessage('Failed to connect to server', 'error');
        console.error('Error loading system state:', error);
    }
}

function setupHysteresisInput() {
    const input = document.getElementById('hysteresis-input');
    let timeoutId = null;

    input.addEventListener('input', function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
            const value = parseFloat(input.value);

            if (isNaN(value) || value < 0 || value > 5) {
                showMessage('Hysteresis must be between 0 and 5°C', 'error');
                return;
            }

            try {
                await updateHysteresis(value);
                showMessage('Hysteresis updated successfully', 'success');
            } catch (error) {
                showMessage('Failed to update hysteresis', 'error');
                console.error('Error updating hysteresis:', error);
            }
        }, 500);
    });
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

async function loadDeviceStatus() {
    try {
        const data = await fetchDeviceStatus();
        updateDeviceStatusDisplay(data);
    } catch (error) {
        console.error('Error loading device status:', error);
    }
}

function updateDeviceStatusDisplay(data) {
    const sensorBadge = document.getElementById('sensor-status-badge');
    const sensorDeviceId = document.getElementById('sensor-device-id');
    const sensorIp = document.getElementById('sensor-ip');

    if (data.sensor && data.sensor.status === 'online') {
        sensorBadge.textContent = 'Online';
        sensorBadge.className = 'device-status-badge online';
        sensorDeviceId.textContent = data.sensor.device_id || '--';
        sensorIp.textContent = data.sensor.ip_address || '--';
    } else {
        sensorBadge.textContent = 'Offline';
        sensorBadge.className = 'device-status-badge offline';
        sensorDeviceId.textContent = '--';
        sensorIp.textContent = '--';
    }

    const relayBadge = document.getElementById('relay-status-badge');
    const relayDeviceId = document.getElementById('relay-device-id');
    const relayIp = document.getElementById('relay-ip');

    if (data.relay && data.relay.status === 'online') {
        relayBadge.textContent = 'Online';
        relayBadge.className = 'device-status-badge online';
        relayDeviceId.textContent = data.relay.device_id || '--';
        relayIp.textContent = data.relay.ip_address || '--';
    } else {
        relayBadge.textContent = 'Offline';
        relayBadge.className = 'device-status-badge offline';
        relayDeviceId.textContent = '--';
        relayIp.textContent = '--';
    }
}
