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
    execFile(exePath, ['-list'], (error, stdout, stderr) => {
        if (error) {
            log("Error: " + error.message, 'error');
            return;
        }

        const regex = /^\[.\] ([^,]*), IPv.:(.*)/gm;
        let m;
        const newAddresses = [...addresses];

        newAddresses.forEach(addr => addr.exists = false);

        while ((m = regex.exec(stdout)) !== null) {
            const name = m[1];
            const ip = m[2];
            const item = newAddresses.find(e => e.name === name);

            if (item) {
                item.ip = ip;
                item.exists = true;
            } else {
                newAddresses.push({
                    isOn: true,
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

    log("Starting proxy...");

    spawnProcess = spawn(exePath, args);

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
        if (isRunning && spawnProcess) {
            log("Proxy exited with code " + code + ", not restarting automatically");
            stopProxy();
        }
    });
}

function stopProxy() {
    if (spawnProcess) {
        spawnProcess.stdin.pause();
        spawnProcess.kill();
    }
    spawnProcess = null;
    updateStatus(false);
    log("Proxy stopped");
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
    setMode(mode);
    renderNetworks();
}

loadSettings();
listInterfaces();

if (document.getElementById('autostart').checked) {
    startProxy();
}
