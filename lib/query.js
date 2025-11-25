var dom = require('dom-events');
var cm = require('codemirror');
var js = require('codemirror/mode/javascript/javascript')
var css = require('codemirror/mode/css/css.js')
var xtend = require('xtend');
var debounce = require('debounce');

window.lint = require('codemirror/addon/lint/lint');
window.jslint = require('codemirror/addon/lint/javascript-lint');
window.jsonlint = require('codemirror/addon/lint/json-lint');

const Tree = require('level-subtree');
const { ipcRenderer } = require('electron');
let remote, dialog;
try {
  const remoteModule = require('@electron/remote');
  remote = remoteModule.remote || remoteModule;
  dialog = remoteModule.dialog;
} catch(e) {
  console.warn('@electron/remote not available:', e);
}

var queryEl;
var editorEl;
var upperBoundEl;
var lowerBoundEl;
var limitEl;
var reverseEl;
var keysEl;
var deleteEl;
var sublevelsBtn;
var resultsEl;
var treeEl;
var rootEl;

var editor;

var mapNodes = Array.prototype.map;

var tree;
var treeHandle;
var treeMap = {};

function buildTree(tree, parentNode, path) {
  parentNode.innerHTML = '';
  for (var branch in tree) {
    path.push(branch);
    treeMap['tree-' + branch] = path.join('#');

    var li = document.createElement('li');
    var label = document.createElement('label');
    var input = document.createElement('input');
    var ul = document.createElement('ul');

    input.id = 'tree-' + branch;
    input.type = 'checkbox';
    
    label.setAttribute('for', input.id);
    label.innerText = branch;
    
    li.appendChild(input);
    li.appendChild(label);
    li.appendChild(ul);
    
    parentNode.appendChild(li);

    buildTree(tree[branch], ul, path);
    path.pop();
  }
}



exports.getKeys = debounce(async function(database, config) {
  deleteEl.setAttribute('disabled', true);

  // Build query options - when bounds are empty, load ALL keys
  var upperBound = upperBoundEl.value.trim();
  var lowerBound = lowerBoundEl.value.trim();
  
  var limit = parseInt(limitEl.value, 10);
  config.query.limit = isNaN(limit) ? 1000 : limit;
  config.query.reverse = reverseEl.hasAttribute('checked');
  
  // Level 8.x: .keys() returns async iterator
  // When bounds are empty, don't set gte/lte to get ALL keys
  var opts = {
    reverse: config.query.reverse,
    limit: config.query.limit
  };
  
  // Only add gte/lte if bounds are specified
  if (lowerBound !== '') {
    opts.gte = config.query.prefix + lowerBound;
  }
  if (upperBound !== '') {
    opts.lte = config.query.prefix + upperBound;
  }
  
  // Special handling for prefix-only queries
  if (lowerBound === '' && upperBound === '' && config.query.prefix !== '') {
    opts.gte = config.query.prefix;
    opts.lte = config.query.prefix + '~'; // ~ is after all printable chars
  }
  
  editor.doc.setValue('');
  keysEl.innerHTML = '';

  // Level 8.x uses .keys() async iterator instead of createReadStream()
  try {
    if (!database.handle) {
      console.error('Database handle is not available');
      return;
    }
    
    let count = 0;
    for await (const key of database.handle.keys(opts)) {
      if (count >= opts.limit) break;
      var o = document.createElement('option');
      o.value = o.title = key;
      o.innerText = key.replace(config.query.prefix, '');
      keysEl.appendChild(o);
      count++;
    }
    
    // Update delete button state
    if (count > 0) {
      deleteEl.removeAttribute('disabled');
    } else {
      deleteEl.setAttribute('disabled', true);
    }
    
    console.log(`Loaded ${count} keys from database`);
  } catch(err) {
    console.error('Error reading keys:', err);
    // Show error in UI
    if (keysEl) {
      keysEl.innerHTML = '<option disabled>Error loading keys: ' + (err.message || err.toString()) + '</option>';
    }
    throw err; // Re-throw so caller can handle it
  }
}, 250);

exports.init = function(database, config) {

  queryEl = document.querySelector('section.query');
  resultsEl = queryEl.querySelector('.results');
  editorEl = document.querySelector('.codemirror');
  upperBoundEl = queryEl.querySelector('.upperbound');
  lowerBoundEl = queryEl.querySelector('.lowerbound');
  limitEl = queryEl.querySelector('.limit');
  reverseEl = queryEl.querySelector('.reverse');
  keysEl = queryEl.querySelector('.keys select');
  deleteEl = queryEl.querySelector('.delete');
  sublevelsBtn = queryEl.querySelector('.sublevels');
  treeEl = queryEl.querySelector('.tree');
  rootEl = treeEl.querySelector('ul.root');

  var dialogOpts = {
    buttons: ['OK', 'CANCEL']
  };

  // Window not needed for IPC, but keep for compatibility
  var win = remote && remote.getCurrentWindow ? remote.getCurrentWindow() : null;

  editor = cm.fromTextArea(editorEl, {
    lineNumbers: true,
    lint: true,
    mode: 'application/json',
    gutters: ['CodeMirror-lint-markers'],
    lintWith: cm.jsonValidator,
    viewportMargin: Infinity
  });

  editor.on('change', async function() {
    var key = keysEl.value;
    if (!key) return; // No key selected

    var val = editor.doc.getValue();

    if (config.valueEncoding == 'json') {
      try {
        val = JSON.parse(val);
      }
      catch(err) {
        // Invalid JSON - don't save, but don't show error on every keystroke
        return;
      }
    }

    try {
      // Level 8.x: put() returns a promise
      await database.handle.put(key, val);
    } catch (err) {
      var opts = xtend(dialogOpts, { 
        title: 'Error',
        message: err.message || err.toString() 
      });
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        await ipcRenderer.invoke('show-message-box', opts);
      } else if (dialog && win) {
        await dialog.showMessageBox(win, opts);
      }
    }
  });

  config.query = config.query || { 
    limit: 1000, 
    valueEncoding: 'json',
    prefix: ''
  };

  var limitText = 'Limit (' + config.limit + ')';
  limitEl.setAttribute('placeholder', limitText);

  function getKeys() {
    exports.getKeys(database, config);
  }

  getKeys();

  dom.on(upperBoundEl, 'keyup', getKeys);
  dom.on(lowerBoundEl, 'keyup', getKeys);
  dom.on(limitEl, 'keyup', getKeys);

  dom.on(reverseEl, 'click', function() {
    if (this.hasAttribute('checked')) {
      this.value = 'navigatedown';
      this.removeAttribute('checked');
    }
    else {
      this.value = 'navigateup';
      this.setAttribute('checked', true);
    }
    getKeys();
  });

  dom.on(deleteEl, 'click', async function() {
    // Use IPC for dialogs
    const showDialog = async function(opts) {
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        return await ipcRenderer.invoke('show-message-box', opts);
      } else if (dialog && win) {
        return await dialog.showMessageBox(win, opts);
      }
      return { response: 0 };
    };
    
    const result = await showDialog(dialogOpts);
    if (result.response == 1) return; // User cancelled

    try {
      if(keysEl.selectedOptions.length > 1) {
        // Delete multiple keys - Level 8.x: batch() returns a promise
        var ops = [];
        for (var i = 0; i < keysEl.selectedOptions.length; i++) {
          ops.push({type: 'del', key: keysEl.selectedOptions[i].value});
        }
        await database.handle.batch(ops);
        dialogOpts.message = 'The items were removed from the database';
      } else {
        // Delete single key - Level 8.x: del() returns a promise
        await database.handle.del(keysEl.value);
        dialogOpts.message = 'The item was removed from the database';
      }
      
      // Refresh keys and show success
      await exports.getKeys(database, config);
      await showDialog(dialogOpts);
    } catch (err) {
      dialogOpts.message = err.message || err.toString();
      await showDialog(dialogOpts);
    }
  });

  dom.on(keysEl, 'change', async function() {
    if (!keysEl.value) return;
    
    deleteEl.removeAttribute('disabled');

    try {
      // Level 8.x: get() returns a promise
      const value = await database.handle.get(keysEl.value);
      
      var displayValue = value;
      if (config.valueEncoding == 'json') {
        try {
          displayValue = JSON.stringify(value, null, 2);
        }
        catch(ex) {
          // If stringify fails, use value as-is
          displayValue = String(value);
        }
      } else {
        displayValue = String(value);
      }

      editor.doc.setValue(displayValue);
    } catch (err) {
      dialogOpts.message = (err.message || err.toString()) + '\nPossible encoding error';
      if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
        await ipcRenderer.invoke('show-message-box', dialogOpts);
      } else if (dialog && win) {
        await dialog.showMessageBox(win, dialogOpts);
      }
      // Clear editor on error
      editor.doc.setValue('');
    }
  });

  dom.on(sublevelsBtn, 'click', function() {
      treeHandle = Tree(database.handle);
      treeHandle.init(function(err, data) {
        tree = data;
        buildTree(data, rootEl, []);
      });

    if (resultsEl.classList.contains('open')) {
      return resultsEl.classList.remove('open');
    }
    resultsEl.classList.add('open');
  });
  
  dom.on(treeEl, 'click', function(event) {
    // Use event.target instead of deprecated event.srcElement
    var target = event.target || event.srcElement;
    
    mapNodes.call(treeEl.querySelectorAll('input'), function(el) {
      el.classList.remove('active');
    });
    
    if (target && target.tagName == 'INPUT') {
      target.classList.add('active');
      var mappedName = treeMap[target.id];
      config.query.prefix = mappedName
        ? ('!' + mappedName + '!') 
        : '';
      exports.getKeys(database, config);
    }
  });

  // Initialize split/resize functionality in init() so it's always available
  // Wait a bit for DOM to be fully ready
  setTimeout(function() {
    var splitEl = queryEl.querySelector('.results .split') || queryEl.querySelector('.results .splitx');
    var keysElForResize = queryEl.querySelector('.results .keys');
    var valueElForResize = queryEl.querySelector('.results .value');
    
    if (!splitEl || !keysElForResize || !valueElForResize) {
      console.warn('Split resize elements not found:', {
        split: !!splitEl,
        keys: !!keysElForResize,
        value: !!valueElForResize
      });
      return;
    }
    
    var isResizing = false;
    var startX = 0;
    var startWidth = 0;
    var splitWidth = 10;
    
    // Get actual split width
    try {
      var computed = window.getComputedStyle(splitEl);
      splitWidth = parseInt(computed.width) || 10;
    } catch(e) {
      splitWidth = 10;
    }
    
    // Ensure split element is clickable
    splitEl.style.pointerEvents = 'auto';
    splitEl.style.zIndex = '100';
    
    // Use native addEventListener for more reliable event handling
    var mousedownHandler = function(e) {
      isResizing = true;
      startX = e.clientX;
      startWidth = keysElForResize.offsetWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      resultsEl.classList.add('resizing');
      e.preventDefault();
      e.stopPropagation();
    };
    
    splitEl.addEventListener('mousedown', mousedownHandler);
    
    var mousemoveHandler = function(e) {
      if (!isResizing) return;
      
      var diff = e.clientX - startX;
      var newWidth = Math.max(150, Math.min(600, startWidth + diff));
      
      keysElForResize.style.width = newWidth + 'px';
      splitEl.style.left = newWidth + 'px';
      valueElForResize.style.left = (newWidth + splitWidth) + 'px';
    };
    
    var mouseupHandler = function() {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resultsEl.classList.remove('resizing');
      }
    };
    
    document.addEventListener('mousemove', mousemoveHandler);
    document.addEventListener('mouseup', mouseupHandler);
  }, 100);

};

exports.onShow = function() {
  editor.refresh();
};

