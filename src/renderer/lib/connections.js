// Connections module - uses secure IPC API
import * as query from './query.js';
import dbAPI from './db-api.js';

export function init(database, config) {
  const section = document.querySelector('section.connections');
  if (!section) {
    console.error('Connections section not found!');
    return;
  }
  
  const pathInput = section.querySelector('input.path');
  const hostInput = section.querySelector('input.host');
  const openBtn = section.querySelector('input.openDirectory');
  const connectBtn = section.querySelector('input.openConnection');

  // Initialize path input with current working directory
  if (pathInput && window.electronAPI) {
    window.electronAPI.app.getCwd().then(cwd => {
      pathInput.value = cwd;
    }).catch(() => {
      pathInput.value = '';
    });
  }

  // Network connection handler
  if (connectBtn) {
    connectBtn.addEventListener('click', async function() {
      if (!hostInput.value) return;

      try {
        // Close existing database
        await dbAPI.close();
        
        // Open network database
        await dbAPI.openNetwork(hostInput.value, config);
        database.dbId = dbAPI.dbId;
        database.handle = dbAPI; // Use dbAPI as handle proxy
        
        // Switch to query tab and load keys
        const queryBtn = document.querySelector('header a.query');
        if (queryBtn) {
          queryBtn.click();
        }
        
        await query.getKeys(database, config);
      } catch (err) {
        console.error('Error connecting to network database:', err);
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:10px 20px;border-radius:4px;z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,0.2);font-family:sans-serif;';
        errorMsg.textContent = '✗ Error connecting: ' + (err.message || err.toString());
        document.body.appendChild(errorMsg);
        setTimeout(() => {
          if (errorMsg.parentNode) {
            errorMsg.remove();
          }
        }, 5000);
      }
    });
  } else {
    console.warn('Connect button not found');
  }

  let isOpening = false;

  async function open(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (isOpening) {
      return;
    }
    
    isOpening = true;

    if (!window.electronAPI || !window.electronAPI.showOpenDialog) {
      console.error('Electron API not available');
      alert('Error: File dialog API not available. Please restart the application.');
      isOpening = false;
      return;
    }

    const opts = {
      title: 'Select LevelDB Database Directory',
      defaultPath: pathInput.value.length > 0 ? pathInput.value : '',
      properties: ['openDirectory'],
      message: 'LevelDB databases are stored as directories. Please select the database directory.'
    };
    
    try {
      const result = await window.electronAPI.showOpenDialog(opts);
      
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        isOpening = false;
        return;
      }

      let savePath = result.filePaths[0];

      // Verify it's a directory
      const statResult = await window.electronAPI.fs.stat(savePath);
      if (statResult.success && statResult.isFile) {
        // If somehow a file was selected, use its parent directory
        // Note: We'd need path.dirname via IPC, but for now just use the path as-is
        // The database library should handle this
      }

      try {
        // Close existing database
        await dbAPI.close();
        
        pathInput.value = savePath;
        
        // Open local database
        await dbAPI.openLocal(savePath, config);
        database.dbId = dbAPI.dbId;
        database.handle = dbAPI; // Use dbAPI as handle proxy

        // Switch to query tab automatically
        const queryBtn = document.querySelector('header a.query');
        if (queryBtn) {
          queryBtn.click();
        }
        
        // Load keys and show status
        try {
          await query.getKeys(database, config);
          
          if (typeof query.refreshTree === 'function') {
            query.refreshTree(database);
          }
          
          // Show success indicator
          const statusMsg = document.createElement('div');
          statusMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:10px 20px;border-radius:4px;z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,0.2);font-family:sans-serif;';
          statusMsg.textContent = '✓ Database loaded successfully';
          document.body.appendChild(statusMsg);
          setTimeout(() => {
            if (statusMsg.parentNode) {
              statusMsg.remove();
            }
          }, 3000);
        } catch (loadErr) {
          console.error('Error loading keys:', loadErr);
          const errorMsg = document.createElement('div');
          errorMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:10px 20px;border-radius:4px;z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,0.2);font-family:sans-serif;';
          errorMsg.textContent = '✗ Error loading database: ' + (loadErr.message || loadErr.toString());
          document.body.appendChild(errorMsg);
          setTimeout(() => {
            if (errorMsg.parentNode) {
              errorMsg.remove();
            }
          }, 5000);
        }
      } catch(ex) {
        const errorOpts = {
          title: 'Error Opening Database',
          message: ex.message || ex.toString() + '\n\nNote: LevelDB databases are directories containing MANIFEST, LOG, and .ldb files.',
          buttons: ['OK']
        };
        await window.electronAPI.showMessageBox(errorOpts);
      }
    } catch(err) {
      console.error('Error opening dialog:', err);
    } finally {
      isOpening = false;
    }
  }

  if (openBtn) {
    openBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      open(e);
    });
  } else {
    console.error('Open button not found in connections section!');
  }
}

export function onShow() {
  // Connections onShow handler
}
