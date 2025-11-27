// Preload script - exposes safe API to renderer
// This runs in a context with access to Node.js APIs but isolated from the web page
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog operations
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),

  // Database operations
  db: {
    openLocal: (location, config) => ipcRenderer.invoke('db-open-local', location, config),
    openNetwork: (location, config) => ipcRenderer.invoke('db-open-network', location, config),
    get: (key, dbId) => ipcRenderer.invoke('db-get', key, dbId),
    put: (key, value, dbId) => ipcRenderer.invoke('db-put', key, value, dbId),
    del: (key, dbId) => ipcRenderer.invoke('db-del', key, dbId),
    keys: (options, dbId) => ipcRenderer.invoke('db-keys', options, dbId),
    close: (dbId) => ipcRenderer.invoke('db-close', dbId),
    getCurrentId: () => ipcRenderer.invoke('db-get-current-id')
  },

  // File system operations
  fs: {
    readDefaults: () => ipcRenderer.invoke('fs-read-defaults'),
    stat: (filePath) => ipcRenderer.invoke('fs-stat', filePath)
  },

  // App operations
  app: {
    getCwd: () => ipcRenderer.invoke('app-get-cwd')
  },

  // Theme operations
  theme: {
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    setOverride: (theme) => ipcRenderer.invoke('set-theme-override', theme),
    getOverride: () => ipcRenderer.invoke('get-theme-override'),
    onChanged: (callback) => {
      ipcRenderer.on('system-theme-changed', (event, theme) => callback(theme));
    }
  }
});
