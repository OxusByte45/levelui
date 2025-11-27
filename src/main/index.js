import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import dbManager from './db-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// IPC handlers for dialogs
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), options);
    return result;
  } catch (err) {
    console.error('IPC: show-open-dialog error:', err);
    throw err;
  }
});

ipcMain.handle('show-message-box', async (event, options) => {
  try {
    const result = await dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), options);
    return result;
  } catch (err) {
    console.error('IPC: show-message-box error:', err);
    throw err;
  }
});

// Database operations IPC handlers
ipcMain.handle('db-open-local', async (event, location, config) => {
  try {
    const dbId = await dbManager.openLocal(location, config);
    return { success: true, dbId };
  } catch (err) {
    console.error('IPC: db-open-local error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-open-network', async (event, location, config) => {
  try {
    const dbId = await dbManager.openNetwork(location, config);
    return { success: true, dbId };
  } catch (err) {
    console.error('IPC: db-open-network error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-get', async (event, key, dbId) => {
  try {
    const value = await dbManager.get(key, dbId);
    return { success: true, value };
  } catch (err) {
    console.error('IPC: db-get error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-put', async (event, key, value, dbId) => {
  try {
    await dbManager.put(key, value, dbId);
    return { success: true };
  } catch (err) {
    console.error('IPC: db-put error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-del', async (event, key, dbId) => {
  try {
    await dbManager.del(key, dbId);
    return { success: true };
  } catch (err) {
    console.error('IPC: db-del error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-keys', async (event, options, dbId) => {
  try {
    const keys = await dbManager.getKeys(options, dbId);
    return { success: true, keys };
  } catch (err) {
    console.error('IPC: db-keys error:', err);
    return { success: false, error: err.message, keys: [] };
  }
});

ipcMain.handle('db-close', async (event, dbId) => {
  try {
    await dbManager.close(dbId);
    return { success: true };
  } catch (err) {
    console.error('IPC: db-close error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-get-current-id', async (event) => {
  return dbManager.getCurrentDbId();
});

// File system operations IPC handlers
ipcMain.handle('fs-read-defaults', async (event) => {
  try {
    const defaultsPath = path.join(process.cwd(), 'defaults.json');
    const configData = JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'));
    return { success: true, config: configData };
  } catch (err) {
    console.warn('Could not load defaults.json:', err);
    return { success: false, config: {} };
  }
});

ipcMain.handle('fs-stat', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return { success: true, isFile: stats.isFile(), isDirectory: stats.isDirectory() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app-get-cwd', async (event) => {
  return process.cwd();
});

// Theme operations IPC handlers
ipcMain.handle('get-system-theme', async (event) => {
  try {
    const shouldUseDarkColors = nativeTheme.shouldUseDarkColors;
    return { success: true, theme: shouldUseDarkColors ? 'dark' : 'light' };
  } catch (err) {
    console.error('IPC: get-system-theme error:', err);
    return { success: false, theme: 'light' };
  }
});

ipcMain.handle('set-theme-override', async (event, theme) => {
  try {
    // Store theme override in user config file
    const userConfigPath = path.join(app.getPath('userData'), 'theme-config.json');
    const config = { themeOverride: theme };
    fs.writeFileSync(userConfigPath, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('IPC: set-theme-override error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-theme-override', async (event) => {
  try {
    const userConfigPath = path.join(app.getPath('userData'), 'theme-config.json');
    if (existsSync(userConfigPath)) {
      const configData = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
      return { success: true, themeOverride: configData.themeOverride || null };
    }
    return { success: true, themeOverride: null };
  } catch (err) {
    console.warn('IPC: get-theme-override error:', err);
    return { success: true, themeOverride: null };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  // Preload script path
  const preloadPath = path.join(__dirname, '../preload/index.js');
  
  // Verify preload file exists
  if (!existsSync(preloadPath)) {
    console.error('ERROR: Preload script not found at:', preloadPath);
  }

  mainWindow = new BrowserWindow({ 
    width: 900, 
    height: 600, 
    minWidth: 900,
    minHeight: 600, 
    frame: false,
    webPreferences: {
      // Modern secure settings
      nodeIntegration: false,  // Disabled for security
      contextIsolation: true,  // Enabled for security
      // Preload path: in production, __dirname is dist/main, so preload is at dist/preload/index.js
      preload: preloadPath,
      sandbox: false // Required for preload script to work with contextIsolation
    }
  });
  
  // Check if electronAPI is available in renderer (only log if missing)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript('typeof window.electronAPI !== "undefined"')
      .then(available => {
        if (!available) {
          console.error('ERROR: window.electronAPI is NOT available in renderer - preload script may have failed');
        }
      })
      .catch(err => console.error('Error checking electronAPI:', err));
  });
  
  // DevTools enabled for debugging
  mainWindow.webContents.openDevTools();
  
  
  // Determine if we're in dev mode (Vite dev server running) or production (built files)
  // electron-vite sets VITE_DEV_SERVER_URL, but if not set, try to detect dev server
  let devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !app.isPackaged;
  
  // If in dev mode but URL not set, try common Vite dev server port
  if (isDev && !devServerUrl) {
    devServerUrl = 'http://localhost:5173';
  }
  
  if (isDev && devServerUrl) {
    // Development mode: Try to load from Vite dev server
    try {
      await mainWindow.loadURL(devServerUrl);
    } catch (err) {
      // Fallback to built files if dev server not available
      const rendererPath = path.join(__dirname, '../../out/renderer/index.html');
      mainWindow.loadFile(rendererPath);
    }
  } else {
    // Production mode: load from built files
    // Renderer files are built to out/renderer/ by electron-vite
    // __dirname is dist/main, so we go up two levels to project root, then into out/renderer
    const rendererPath = path.join(__dirname, '../../out/renderer/index.html');
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Listen for system theme changes and notify renderer
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
      mainWindow.webContents.send('system-theme-changed', theme);
    }
  });
});

