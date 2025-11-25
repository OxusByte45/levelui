var dom = require('dom-events');
var cm = require('codemirror');
var js = require('codemirror/mode/javascript/javascript')
var css = require('codemirror/mode/css/css.js')
var xtend = require('xtend');
var query = require('../lib/query');

var lint = require('codemirror/addon/lint/lint');
var jslint = require('codemirror/addon/lint/javascript-lint');
var jsonlint = require('codemirror/addon/lint/json-lint');

const { ipcRenderer } = require('electron');
let remote, dialog;
try {
  const remoteModule = require('@electron/remote');
  remote = remoteModule.remote || remoteModule;
  dialog = remoteModule.dialog;
} catch(e) {
  console.warn('@electron/remote not available:', e);
}

var keyEditor;
var valueEditor;

exports.init = function(database, config) {

  // Window not needed for IPC
  var win = remote && remote.getCurrentWindow ? remote.getCurrentWindow() : null;

  var dialogOpts = {
    buttons: ['OK'] 
  };

  var editorOpts = {
    lineNumbers: true,
    mode: 'application/json',
    gutters: ['CodeMirror-lint-markers'],
    lintWith: cm.jsonValidator,
    viewportMargin: Infinity
  };

  var section = document.querySelector('section.put');
  
  keyEl = section.querySelector('.key textarea');
  valueEl = section.querySelector('.value textarea');
  saveBtn = section.querySelector('.save');
  clearBtn = section.querySelector('.clear');
  keyEncodingInput = section.querySelector('.keyEncoding');
  valueEncodingInput = section.querySelector('.valueEncoding');

  keyEditor = cm.fromTextArea(keyEl, editorOpts);
  valueEditor = cm.fromTextArea(valueEl, editorOpts);

  // Clear button functionality
  if (clearBtn) {
    dom.on(clearBtn, 'click', function() {
      keyEditor.doc.setValue('');
      valueEditor.doc.setValue('');
      keyEditor.focus();
    });
  }

  // Save button - migrated to Level 8.x promises
  dom.on(saveBtn, 'click', async function() {
    var key = keyEditor.doc.getValue().trim();
    var value = valueEditor.doc.getValue().trim();

    if (!key) {
      dialogOpts.title = 'Error';
      dialogOpts.message = 'Key cannot be empty';
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        await ipcRenderer.invoke('show-message-box', dialogOpts);
      } else if (dialog && win) {
        await dialog.showMessageBox(win, dialogOpts);
      }
      return;
    }

    // Handle value encoding - parse JSON if valueEncoding is 'json' or if config says so
    var valueEncoding = valueEncodingInput.value.trim() || config.valueEncoding || 'json';
    var processedValue = value;

    if (valueEncoding === 'json' && value) {
      try {
        processedValue = JSON.parse(value);
      } catch (parseErr) {
        dialogOpts.title = 'Error';
        dialogOpts.message = 'Invalid JSON: ' + (parseErr.message || parseErr.toString());
        if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
          await ipcRenderer.invoke('show-message-box', dialogOpts);
        } else if (dialog && win) {
          await dialog.showMessageBox(win, dialogOpts);
        }
        return;
      }
    }

    try {
      // Level 8.x: put() returns a promise, encoding options are passed in constructor
      // For per-operation encoding, we need to handle it differently
      // Since Level 8.x uses constructor-level encoding, we'll use the database's encoding
      await database.handle.put(key, processedValue);
      
      dialogOpts.title = 'Success';
      dialogOpts.message = 'Key added to the database';
      
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        await ipcRenderer.invoke('show-message-box', dialogOpts);
      } else if (dialog && win) {
        await dialog.showMessageBox(win, dialogOpts);
      }
      
      // Refresh the query tab to show the new key
      query.getKeys(database, config).catch(function(err) {
        console.error('Error refreshing keys after put:', err);
      });
    } catch (err) {
      dialogOpts.title = 'Error';
      dialogOpts.message = err.message || err.toString();
      
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        await ipcRenderer.invoke('show-message-box', dialogOpts);
      } else if (dialog && win) {
        await dialog.showMessageBox(win, dialogOpts);
      }
    }
  });

};

exports.onShow = function() {
  keyEditor.refresh();
  valueEditor.refresh();
};
