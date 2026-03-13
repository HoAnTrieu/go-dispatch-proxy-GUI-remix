// Since nodeIntegration is true, we can use require() and ipcRenderer directly
const { ipcRenderer } = require('electron');

console.log('[Preload] Preload script loaded - using nodeIntegration');

// Expose electronAPI to renderer
window.electronAPI = {
  setMinimizeToTray: (value) => {
    console.log('[Preload] setMinimizeToTray:', value);
    ipcRenderer.send('set-minimize-to-tray', value);
  },
  
  showNotification: (title, body) => {
    console.log('[Preload] showNotification:', title, body);
    ipcRenderer.send('show-notification', { title, body });
  },
  
  onTrayStartProxy: (callback) => {
    console.log('[Preload] onTrayStartProxy registered');
    ipcRenderer.on('tray-start-proxy', () => {
      console.log('[Preload] tray-start-proxy event received');
      callback();
    });
  },
  
  onTrayStopProxy: (callback) => {
    console.log('[Preload] onTrayStopProxy registered');
    ipcRenderer.on('tray-stop-proxy', () => {
      console.log('[Preload] tray-stop-proxy event received');
      callback();
    });
  }
};
