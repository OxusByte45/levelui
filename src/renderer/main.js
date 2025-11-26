// Main renderer entry point - no Node.js APIs, uses IPC via preload script
import * as menu from './lib/menu.js';
import * as header from './lib/header.js';
import * as query from './lib/query.js';
import * as put from './lib/put.js';
import * as settings from './lib/settings.js';
import * as connections from './lib/connections.js';
import dbAPI from './lib/db-api.js';
import { initAllCodeMirrors } from './lib/codemirror-init.js';

// Load configuration via IPC
async function loadConfig() {
  let configData = {};
  
  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.fs.readDefaults();
      if (result.success) {
        configData = result.config;
      }
    } catch (e) {
      console.warn('Could not load defaults.json:', e);
    }
  }
  
  // Simple config object (rc functionality can be added via IPC if needed)
  return configData;
}

// Database object that mimics the old interface but uses IPC
// database.handle will point to dbAPI when database is opened
const database = {
  handle: null, // Will be set to dbAPI when database is opened
  dbId: null
};

// DOM ready check (replaces domready package)
function domReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

domReady(async function() {
  // Verify electronAPI is available
  if (!window.electronAPI) {
    console.error('ERROR: window.electronAPI is not available! Preload script may not be loaded.');
    alert('ERROR: Electron API not available. Please check console and restart the application.');
    return;
  }

  // Initialize config
  const config = await loadConfig();
  await dbAPI.init(config);

  // Initialize CodeMirror editors first
  initAllCodeMirrors();

  // Initialize modules
  header.init();
  query.init(database, config);
  put.init(database, config);
  settings.init(database, config);
  connections.init(database, config);
});
