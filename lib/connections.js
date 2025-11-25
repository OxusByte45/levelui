const dom = require('dom-events')
const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')
const { remote, dialog: remoteDialog } = require('@electron/remote')
const query = require('./query')
const db = require('./db')

exports.init = function(database, config) {

  var section = document.querySelector('section.connections')
  if (!section) {
    console.error('Connections section not found!');
    return;
  }
  
  var pathInput = section.querySelector('input.path')
  var hostInput = section.querySelector('input.host')
  var openBtn = section.querySelector('input.openDirectory')
  var connectBtn = section.querySelector('input.openConnection')

  // Initialize connections

  var opts = {
    title: 'Connected',
    message: 'Connection successful...',
    buttons: ['OK']
  }

  pathInput.value = process.cwd()

  dom.on(connectBtn, 'click', function() {
    if (!hostInput.value) return

    // Safely close existing database handle
    if (database.handle && typeof database.handle.close === 'function') {
      try {
        const closeResult = database.handle.close()
        if (closeResult && typeof closeResult.catch === 'function') {
          closeResult.catch(function() {})
        }
      } catch (err) {
        // Ignore close errors
      }
    }

    database.handle = db(hostInput.value, config)
    
    // Switch to query tab and load keys
    const queryBtn = document.querySelector('header a.query')
    if (queryBtn) {
      queryBtn.click()
    }
    
    query.getKeys(database, config).catch(function(err) {
      console.error('Error loading keys after remote connection:', err)
    })

  })

  async function open(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Open button clicked - no debug alerts

    var opts = {
      title: 'Select LevelDB Database',
      defaultPath: pathInput.value.length > 0 ? pathInput.value : process.cwd(),
      properties: ['openFile', 'openDirectory'],
      message: 'LevelDB databases are stored as directories. Select the database directory (or any file within it).',
      filters: [
        { name: 'LevelDB Database', extensions: ['ldb', 'log'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }
    
    try {
      let result;
      // Use IPC (preferred) or @electron/remote as fallback
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        result = await ipcRenderer.invoke('show-open-dialog', opts);
      } else if (remoteDialog && typeof remoteDialog.showOpenDialog === 'function' && remote) {
        const win = remote.getCurrentWindow();
        if (!win) {
          throw new Error('Could not get current window');
        }
        result = await remoteDialog.showOpenDialog(win, opts);
      } else {
        console.error('No dialog method available');
        return;
      }
      
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return
      }

      let savePath = result.filePaths[0]

      // LevelDB databases are directories, but if user selected a file, use its parent directory
      try {
        const stats = fs.statSync(savePath)
        if (stats.isFile()) {
          // If a file was selected (shouldn't happen with openDirectory, but handle it)
          savePath = path.dirname(savePath)
        }
      } catch (statErr) {
        // If stat fails, assume it's a directory and proceed
      }

      try {
        // Safely close existing database handle
        if (database.handle && typeof database.handle.close === 'function') {
          try {
            const closeResult = database.handle.close()
            if (closeResult && typeof closeResult.catch === 'function') {
              closeResult.catch(function() {})
            }
          } catch (err) {
            // Ignore close errors
          }
        }
        
        pathInput.value = savePath
        database.handle = db(savePath, config)

        // Switch to query tab automatically
        const queryBtn = document.querySelector('header a.query')
        if (queryBtn) {
          queryBtn.click() // Automatically switch to query tab
        }
        
        // Load keys and show status
        try {
          await query.getKeys(database, config)
          
          // Show brief success indicator
          const statusMsg = document.createElement('div')
          statusMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:10px 20px;border-radius:4px;z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,0.2);font-family:sans-serif;'
          statusMsg.textContent = '✓ Database loaded successfully'
          document.body.appendChild(statusMsg)
          setTimeout(() => {
            if (statusMsg.parentNode) {
              statusMsg.remove()
            }
          }, 3000)
        } catch (loadErr) {
          console.error('Error loading keys:', loadErr)
          const errorMsg = document.createElement('div')
          errorMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:10px 20px;border-radius:4px;z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,0.2);font-family:sans-serif;'
          errorMsg.textContent = '✗ Error loading database: ' + (loadErr.message || loadErr.toString())
          document.body.appendChild(errorMsg)
          setTimeout(() => {
            if (errorMsg.parentNode) {
              errorMsg.remove()
            }
          }, 5000)
        }
      }
      catch(ex) {
        var errorOpts = {
          title: 'Error Opening Database',
          message: ex.message || ex.toString() + '\n\nNote: LevelDB databases are directories containing MANIFEST, LOG, and .ldb files.',
          buttons: ['OK']
        }
        await ipcRenderer.invoke('show-message-box', errorOpts);
      }
    } catch(err) {
      console.error('Error opening dialog:', err)
    }
  }

  if (!openBtn) {
    console.error('Open button not found in connections section');
  } else {
    // Attach click handler
    dom.on(openBtn, 'click', open);
  }
}

exports.onShow = function() {

}
