// UI Update Functions

let cachedConfigData = null;

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

    // Update temperature timestamp
    const lastUpdate = new Date(state.current_timestamp);
    const tempDateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const tempDateStr = lastUpdate.toLocaleDateString(undefined, tempDateOptions);
    const tempTimeStr = lastUpdate.toLocaleTimeString(undefined, { hour12: false });
    document.getElementById('temp-timestamp-value').textContent = `${tempDateStr} ${tempTimeStr}`;

    // Update temperature stale warning
    const staleWarning = document.getElementById('temp-stale-warning');
    const tempCard = document.getElementById('temp-card');
    if (state.is_temp_stale) {
        staleWarning.style.display = 'flex';
        tempCard.classList.add('temp-card-warning');
    } else {
        staleWarning.style.display = 'none';
        tempCard.classList.remove('temp-card-warning');
    }

    // Update system status title with server time
    const serverTime = new Date(state.server_time);
    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const dateStr = serverTime.toLocaleDateString(undefined, dateOptions);
    const timeStr = serverTime.toLocaleTimeString(undefined, { hour12: false });
    document.getElementById('status-title-time').textContent = `${dateStr} ${timeStr}`;
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

function updateConfigDisplay(data) {
    cachedConfigData = data;
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
