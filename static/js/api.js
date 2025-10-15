const API_BASE = window.location.origin;

async function fetchState() {
    const response = await fetch(`${API_BASE}/state`);
    return await response.json();
}

async function fetchActiveIntervalDetails() {
    const response = await fetch(`${API_BASE}/state/active-interval-details`);
    return await response.json();
}

async function fetchActiveConfig() {
    const response = await fetch(`${API_BASE}/state/active-config`);
    return await response.json();
}

async function selectConfig(configName) {
    const response = await fetch(`${API_BASE}/state/select-config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config_name: configName })
    });
    return { response, data: await response.json() };
}

async function updateHysteresis(value) {
    const response = await fetch(`${API_BASE}/state/hysteresis`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hysteresis: value })
    });
    return await response.json();
}

async function fetchAllConfigs() {
    const response = await fetch(`${API_BASE}/configs`);
    return { response, data: await response.json() };
}

async function fetchConfig(name) {
    const response = await fetch(`${API_BASE}/configs/${name}`);
    return await response.json();
}

async function createConfig(name) {
    const response = await fetch(`${API_BASE}/configs/${name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    return { response, data: await response.json() };
}

async function deleteConfig(name) {
    const response = await fetch(`${API_BASE}/configs/${name}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    return { response, data: await response.json() };
}

async function updateConfig(name, configData) {
    const response = await fetch(`${API_BASE}/configs/${name}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
    });
    return { response, data: await response.json() };
}

async function fetchDeviceStatus() {
    const response = await fetch(`${API_BASE}/devices/status`);
    return await response.json();
}
