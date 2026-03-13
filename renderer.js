const { execFile, spawn } = require('child_process');
const path = require('path');

const exePath = path.join(__dirname, 'go-dispatch-proxy.exe');

let isRunning = false;
let mode = 'direct';
let addresses = [];
let spawnProcess = null;

function log(message, type = 'info') {
    const logs = document.getElementById('logs');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + (type === 'error' ? 'error' : 'info');
    entry.textContent = typeof message === 'string' ? message : String(message);
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
}

function updateStatus(running) {
    isRunning = running;
    const badge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const directSection = document.getElementById('direct-section');
    const tunnelSection = document.getElementById('tunnel-section');

    if (running) {
        badge.className = 'status-badge running';
        statusText.textContent = 'Running';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        if (window.electronAPI) {
            window.electronAPI.showNotification('Go Dispatch Proxy', 'Proxy started successfully');
        }
    } else {
        badge.className = 'status-badge stopped';
        statusText.textContent = 'Stopped';
        startBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
    }

    const inputs = document.querySelectorAll('input, button.mode-btn, button.refresh-btn');
    inputs.forEach(input => {
        if (input.id !== 'start-btn' && input.id !== 'stop-btn') {
            input.disabled = running;
        }
    });
}

function renderNetworks() {
    const container = document.getElementById('networks-container');
    container.innerHTML = '';

    addresses.forEach(addr => {
        if (!addr.exists) return;

        const item = document.createElement('div');
        item.className = 'network-item' + (addr.isOn ? ' active' : '') + (addr.isLoading ? ' loading' : '');
        item.innerHTML = `
            <div class="network-info">
                <input type="checkbox" class="network-checkbox" ${addr.isOn ? 'checked' : ''} 
                       onchange="toggleAddress('${addr.name}')">
                <div class="network-details">
                    <span class="network-name">${addr.name}</span>
                    <span class="network-ip">${addr.ip}</span>
                </div>
            </div>
            <div class="ratio-control">
                <input type="number" class="ratio-input" value="${addr.ratio}" min="1" max="10" 
                       onchange="updateRatio('${addr.name}', this.value)">
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleAddress(name) {
    const addr = addresses.find(a => a.name === name);
    if (addr) addr.isOn = !addr.isOn;
    renderNetworks();
    saveSettings();
}

function updateRatio(name, value) {
    const addr = addresses.find(a => a.name === name);
    if (addr) addr.ratio = parseInt(value) || 1;
    saveSettings();
}

function setMode(newMode) {
    mode = newMode;
    document.getElementById('mode-direct').className = 'mode-btn' + (mode === 'direct' ? ' active' : '');
    document.getElementById('mode-tunnel').className = 'mode-btn' + (mode === 'tunnel' ? ' active' : '');
    document.getElementById('direct-section').style.display = mode === 'direct' ? 'block' : 'none';
    document.getElementById('tunnel-section').style.display = mode === 'tunnel' ? 'block' : 'none';
    saveSettings();
}

function listInterfaces() {
    execFile(exePath, ['-list'], { stdio: ['ignore', 'pipe', 'pipe'] }, (error, stdout, stderr) => {
        if (error) {
            log("Error: " + error.message, 'error');
            return;
        }

        const regex = /^\[.\] ([^,]*), IPv.:(.*)/gm;
        let m;
        const newAddresses = [];

        // Mark all existing addresses as not found first
        const existingAddresses = [...addresses];
        existingAddresses.forEach(addr => addr.exists = false);

        while ((m = regex.exec(stdout)) !== null) {
            const name = m[1];
            const ip = m[2];
            const item = existingAddresses.find(e => e.name === name);

            if (item) {
                // Interface exists, keep its settings but update IP
                newAddresses.push({
                    isOn: item.isOn,
                    name: item.name,
                    ip: ip,
                    ratio: item.ratio,
                    exists: true,
                    isLoading: false
                });
            } else {
                // New interface found, add it (off by default)
                newAddresses.push({
                    isOn: false,
                    name: name,
                    ip: ip,
                    ratio: 1,
                    exists: true,
                    isLoading: false
                });
            }
        }

        addresses = newAddresses;
        renderNetworks();
    });
}

function startProxy() {
    // Validate that we have at least one valid interface selected
    if (mode === 'direct') {
        const validAddresses = addresses.filter(addr => addr.isOn && addr.exists);
        if (validAddresses.length === 0) {
            log("Error: No valid network interface selected", 'error');
            return;
        }
    }
    
    if (mode === 'tunnel') {
        const tunnelInput = document.getElementById('tunnel-input').value.trim();
        if (!tunnelInput) {
            log("Error: No tunnel addresses provided", 'error');
            return;
        }
    }
    
    saveSettings();
    updateStatus(true);
    document.getElementById('logs').innerHTML = '';

    let args = [];

    const listenHost = document.getElementById('listen-host').value;
    let listenPort = document.getElementById('listen-port').value;
    
    if (!listenPort) {
        listenPort = '8081';
    }

    if (listenHost && listenHost !== '127.0.0.1') {
        args.push('-lhost', listenHost);
    }
    
    if (listenPort !== '8081') {
        args.push('-lport', listenPort);
    }

    if (mode === 'tunnel') {
        args.push('-tunnel');
        const tunnels = document.getElementById('tunnel-input').value.trim().split(/\s+/);
        args.push(...tunnels);
    } else {
        addresses.forEach(addr => {
            if (addr.isOn) {
                args.push(addr.ip + "@" + addr.ratio);
            }
        });
    }

    log("Starting proxy with args: " + args.join(' '));

    try {
        spawnProcess = spawn(exePath, args, {
            stdio: ['ignore', 'pipe', 'pipe']
        });
    } catch (e) {
        log("Failed to start proxy: " + e.message, 'error');
        updateStatus(false);
        return;
    }

    spawnProcess.on('error', (err) => {
        log("Spawn error: " + err.message, 'error');
    });

    spawnProcess.stdout.on('data', (data) => {
        log(data);
    });

    spawnProcess.stderr.on('data', (data) => {
        log(data, 'error');
    });

    spawnProcess.on('close', (code) => {
        log("Proxy exited with code " + code);
        if (isRunning) {
            if (window.electronAPI) {
                window.electronAPI.showNotification('Go Dispatch Proxy', 'Proxy stopped (exit code: ' + code + ')');
            }
            stopProxy();
        }
    });
}

function stopProxy() {
    if (spawnProcess) {
        spawnProcess.kill('SIGTERM');
    }
    spawnProcess = null;
    updateStatus(false);
    log("Proxy stopped");
    if (window.electronAPI) {
        window.electronAPI.showNotification('Go Dispatch Proxy', 'Proxy stopped');
    }
}

function saveSettings() {
    localStorage.setItem("settings", JSON.stringify({
        mode: mode,
        autostart: document.getElementById('autostart').checked,
        tunnelInput: document.getElementById('tunnel-input').value,
        listenHost: document.getElementById('listen-host').value,
        listenPort: document.getElementById('listen-port').value,
        addresses: addresses
    }));
}

function loadSettings() {
    const saved = localStorage.getItem("settings");
    if (saved) {
        const settings = JSON.parse(saved);
        mode = settings.mode || 'direct';
        document.getElementById('autostart').checked = settings.autostart || false;
        document.getElementById('tunnel-input').value = settings.tunnelInput || '';
        document.getElementById('listen-host').value = settings.listenHost || '127.0.0.1';
        document.getElementById('listen-port').value = settings.listenPort || '';
        addresses = settings.addresses || [];
    }
    
    // Load minimize to tray setting separately
    const minimizeToTray = localStorage.getItem('minimizeToTray') === 'true';
    document.getElementById('minimize-to-tray').checked = minimizeToTray;
    console.log('Loading settings, minimizeToTray:', minimizeToTray);
    
    if (window.electronAPI) {
        window.electronAPI.setMinimizeToTray(minimizeToTray);
    }
    
    setMode(mode);
    renderNetworks();
}

loadSettings();

function onMinimizeToTrayChange() {
    const checked = document.getElementById('minimize-to-tray').checked;
    console.log('onMinimizeToTrayChange called, value:', checked);
    localStorage.setItem('minimizeToTray', checked);
    if (window.electronAPI) {
        window.electronAPI.setMinimizeToTray(checked);
    }
}

document.getElementById('autostart').addEventListener('change', function() {
    saveSettings();
});
listInterfaces();

if (document.getElementById('autostart').checked) {
    startProxy();
}

function setupTrayListeners() {
    if (window.electronAPI) {
        window.electronAPI.onTrayStartProxy(() => {
            console.log('Tray start proxy received');
            if (!isRunning) {
                startProxy();
            }
        });
        
        window.electronAPI.onTrayStopProxy(() => {
            console.log('Tray stop proxy received');
            if (isRunning) {
                stopProxy();
            }
        });
    } else {
        setTimeout(setupTrayListeners, 500);
    }
}

setupTrayListeners();
