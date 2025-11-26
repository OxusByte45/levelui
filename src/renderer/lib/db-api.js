// Database API wrapper for renderer
// Provides a clean interface to database operations via IPC
// This replaces direct LevelDB handle usage

class DatabaseAPI {
  constructor() {
    this.dbId = null;
    this.config = null;
  }

  /**
   * Initialize with config
   */
  async init(config) {
    this.config = config;
    // Load defaults if available
    if (window.electronAPI) {
      const defaultsResult = await window.electronAPI.fs.readDefaults();
      if (defaultsResult.success) {
        this.config = { ...defaultsResult.config, ...config };
      }
    }
  }

  /**
   * Open a local database
   */
  async openLocal(location, config = {}) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const result = await window.electronAPI.db.openLocal(location, { ...this.config, ...config });
    if (result.success) {
      this.dbId = result.dbId;
      return true;
    } else {
      throw new Error(result.error || 'Failed to open database');
    }
  }

  /**
   * Open a network database
   */
  async openNetwork(location, config = {}) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const result = await window.electronAPI.db.openNetwork(location, { ...this.config, ...config });
    if (result.success) {
      this.dbId = result.dbId;
      return true;
    } else {
      throw new Error(result.error || 'Failed to open network database');
    }
  }

  /**
   * Get a value
   */
  async get(key) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const result = await window.electronAPI.db.get(key, this.dbId);
    if (result.success) {
      return result.value;
    } else {
      throw new Error(result.error || 'Failed to get value');
    }
  }

  /**
   * Put a value
   */
  async put(key, value) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const result = await window.electronAPI.db.put(key, value, this.dbId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to put value');
    }
  }

  /**
   * Delete a key
   */
  async del(key) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const result = await window.electronAPI.db.del(key, this.dbId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete key');
    }
  }

  /**
   * Get keys (returns async iterator-like array)
   */
  async *keys(options = {}) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const result = await window.electronAPI.db.keys(options, this.dbId);
    if (result.success) {
      for (const key of result.keys) {
        yield key;
      }
    } else {
      throw new Error(result.error || 'Failed to get keys');
    }
  }

  /**
   * Close the database
   */
  async close() {
    if (!window.electronAPI || !this.dbId) {
      return;
    }

    await window.electronAPI.db.close(this.dbId);
    this.dbId = null;
  }

  /**
   * Check if database is open
   */
  get isOpen() {
    return this.dbId !== null;
  }
}

// Create singleton instance
const dbAPI = new DatabaseAPI();
export default dbAPI;

