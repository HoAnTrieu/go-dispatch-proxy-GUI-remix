// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu, ipcMain, Notification } = require('electron')
const path = require('path')

app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-gpu-rasterization')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-gpu-vsync')
app.disableHardwareAcceleration()
app.setPath('userData', path.join(app.getPath('appData'), 'go-dispatch-proxy-gui', 'temp'))

let mainWindow = null
let tray = null
let minimizeToTray = false

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false
    },
    icon: path.join(__dirname, 'icons/win/app.ico'),
    show: false
  })

  mainWindow.setMenu(null);
  mainWindow.loadFile('index.html')

  //mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    console.log('[Main] Window close event, minimizeToTray:', minimizeToTray, 'isQuitting:', app.isQuitting);
    if (minimizeToTray && !app.isQuitting) {
      console.log('[Main] Preventing close, hiding window');
      event.preventDefault();
      mainWindow.hide();
      showNotification('Go Dispatch Proxy', 'Application minimized to system tray');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icons/win/app.ico');
  
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    console.error('Failed to create tray:', e);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Start Proxy',
      click: () => {
        console.log('Tray: Start Proxy clicked');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('tray-start-proxy');
        }
      }
    },
    {
      label: 'Stop Proxy',
      click: () => {
        console.log('Tray: Stop Proxy clicked');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('tray-stop-proxy');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Go Dispatch Proxy');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, 'icons/win/app.ico')
    }).show();
  }
}

ipcMain.on('set-minimize-to-tray', (event, value) => {
  minimizeToTray = value;
  console.log('[Main] Minimize to tray set to:', value);
});

ipcMain.on('show-notification', (event, { title, body }) => {
  showNotification(title, body);
});

ipcMain.handle('get-minimize-to-tray', () => {
  return minimizeToTray;
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
