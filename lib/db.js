const { Level } = require('level')
const net = require('net')
const multilevel = require('multilevel')
const { ipcRenderer } = require('electron')
let remote, dialog;
try {
  const remoteModule = require('@electron/remote');
  remote = remoteModule.remote || remoteModule;
  dialog = remoteModule.dialog;
} catch(e) {
  console.warn('@electron/remote not available:', e);
}

module.exports = function(path, config) {

  path = String(path)

  if (path && path.indexOf(':') > -1 && path.indexOf('\\') == -1 ) {

    var opts = {
      title: 'Connected',
      message: 'Connection successful...',
      buttons: ['OK']
    }

    var win = remote && remote.getCurrentWindow ? remote.getCurrentWindow() : null
    var db = multilevel.client()
    var connection = path.split(':')
    var port = connection[connection.length-1]
    var host = connection[connection.length-2]

    if (!port || !host) {
      opts.title = 'Error'
      opts.message = 'A port and host are required'
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        ipcRenderer.invoke('show-message-box', opts)
      } else if (dialog && win) {
        dialog.showMessageBox(win, opts)
      }
      return null
    }

    var con = net.connect(parseInt(port))

    con.on('connect', function() {
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        ipcRenderer.invoke('show-message-box', opts)
      } else if (dialog && win) {
        dialog.showMessageBox(win, opts)
      }
    })

    con.on('error', function(err) {
      opts.title = 'Error'
      opts.message = err.message || err.toString()
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        ipcRenderer.invoke('show-message-box', opts)
      } else if (dialog && win) {
        dialog.showMessageBox(win, opts)
      }
    })

    con.pipe(db.createRpcStream()).pipe(con)

    return db
  }
  return new Level(path, { valueEncoding: config.valueEncoding || 'json' })
}
