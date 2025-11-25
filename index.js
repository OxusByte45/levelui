const { app, BrowserWindow, ipcMain, dialog } = require('electron');
require('@electron/remote/main').initialize();

let mainWindow = null;

// IPC handlers for dialogs
ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), options);
});

ipcMain.handle('show-message-box', async (event, options) => {
  return await dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), options);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({ 
    width: 900, 
    height: 600, 
    minWidth: 900,
    minHeight: 600, 
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  require('@electron/remote/main').enable(mainWindow.webContents);
  
  // DevTools disabled by default (enable manually if needed for debugging)
  // mainWindow.webContents.openDevTools();
  
  // Log all console messages from renderer (only in development)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[Renderer ${level}]`, message);
    });
  }
  
  mainWindow.loadURL('file://' + __dirname + '/assets/html/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

