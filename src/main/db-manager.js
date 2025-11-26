// Database manager for main process
// Handles all LevelDB operations securely in the main process
import { Level } from 'level';
import multilevel from 'multilevel';

class DatabaseManager {
  constructor() {
    this.databases = new Map(); // Store database handles by ID
    this.currentDbId = null;
  }

  /**
   * Open a local LevelDB database
   * @param {string} location - Database path
   * @param {object} config - Configuration options
   * @returns {string} Database ID
   */
  async openLocal(location, config = {}) {
    // Close existing database if any
    if (this.currentDbId && this.databases.has(this.currentDbId)) {
      await this.close(this.currentDbId);
    }

    const dbOptions = {
      valueEncoding: config.valueEncoding || 'json',
      keyEncoding: config.keyEncoding || 'utf8',
      ...config
    };

    try {
      const dbHandle = new Level(location, dbOptions);
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.databases.set(dbId, { handle: dbHandle, location, type: 'local' });
      this.currentDbId = dbId;
      return dbId;
    } catch (err) {
      console.error('Error creating LevelDB connection:', err);
      throw err;
    }
  }

  /**
   * Open a network LevelDB connection
   * @param {string} location - Connection string (tcp://host:port)
   * @param {object} config - Configuration options
   * @returns {string} Database ID
   */
  async openNetwork(location, config = {}) {
    // Close existing database if any
    if (this.currentDbId && this.databases.has(this.currentDbId)) {
      await this.close(this.currentDbId);
    }

    const parts = location.replace('tcp://', '').split(':');
    const host = parts[0] || '127.0.0.1';
    const port = parseInt(parts[1] || '8001', 10);
    
    const db = multilevel.client();
    const stream = db.createRpcStream();
    
    // Note: Network connection implementation would need proper stream handling
    const dbId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.databases.set(dbId, { handle: db, location, type: 'network', host, port });
    this.currentDbId = dbId;
    return dbId;
  }

  /**
   * Get database handle
   * @param {string} dbId - Database ID (optional, uses current if not provided)
   * @returns {object} Database handle
   */
  getHandle(dbId = null) {
    const id = dbId || this.currentDbId;
    if (!id || !this.databases.has(id)) {
      return null;
    }
    return this.databases.get(id).handle;
  }

  /**
   * Get a value from the database
   * @param {string} key - Key to retrieve
   * @param {string} dbId - Database ID (optional)
   * @returns {*} Value
   */
  async get(key, dbId = null) {
    const handle = this.getHandle(dbId);
    if (!handle) {
      throw new Error('No database connection available');
    }
    return await handle.get(key);
  }

  /**
   * Put a value into the database
   * @param {string} key - Key
   * @param {*} value - Value
   * @param {string} dbId - Database ID (optional)
   */
  async put(key, value, dbId = null) {
    const handle = this.getHandle(dbId);
    if (!handle) {
      throw new Error('No database connection available');
    }
    await handle.put(key, value);
  }

  /**
   * Delete a key from the database
   * @param {string} key - Key to delete
   * @param {string} dbId - Database ID (optional)
   */
  async del(key, dbId = null) {
    const handle = this.getHandle(dbId);
    if (!handle) {
      throw new Error('No database connection available');
    }
    await handle.del(key);
  }

  /**
   * Get keys from the database
   * @param {object} options - Query options (lt, gte, limit, reverse)
   * @param {string} dbId - Database ID (optional)
   * @returns {Array<string>} Array of keys
   */
  async getKeys(options = {}, dbId = null) {
    const handle = this.getHandle(dbId);
    if (!handle) {
      throw new Error('No database connection available');
    }

    const keys = [];
    for await (const key of handle.keys(options)) {
      keys.push(key);
      if (options.limit && keys.length >= options.limit) {
        break;
      }
    }
    return keys;
  }

  /**
   * Close a database connection
   * @param {string} dbId - Database ID (optional)
   */
  async close(dbId = null) {
    const id = dbId || this.currentDbId;
    if (!id || !this.databases.has(id)) {
      return;
    }

    const dbInfo = this.databases.get(id);
    if (dbInfo.handle && typeof dbInfo.handle.close === 'function') {
      try {
        await dbInfo.handle.close();
      } catch (err) {
        console.error('Error closing database:', err);
      }
    }
    this.databases.delete(id);
    if (this.currentDbId === id) {
      this.currentDbId = null;
    }
  }

  /**
   * Get current database ID
   * @returns {string|null} Current database ID
   */
  getCurrentDbId() {
    return this.currentDbId;
  }
}

// Singleton instance
const dbManager = new DatabaseManager();
export default dbManager;

