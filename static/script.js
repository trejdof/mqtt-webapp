// API Configuration
const API_BASE = window.location.origin;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadSystemState();
    // Refresh every 10 seconds
    setInterval(loadSystemState, 10000);
});

async function loadSystemState() {
    try {
        const response = await fetch(`${API_BASE}/state`);
        const data = await response.json();
        
        if (response.ok) {
            updateStatusDisplay(data);
            // Load detailed interval information
            loadActiveIntervalDetails();
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
    
    // Update active configuration
    document.getElementById('active-config').textContent = state.selected_config || 'None';
    
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