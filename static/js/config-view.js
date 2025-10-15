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
