// Use require for Node.js modules
const { Level } = require('level');
const multilevel = require('multilevel');

/**
 * Create a database connection
 * @param {string} location - Database path (local) or connection string (network)
 * @param {object} config - Configuration options
 * @returns {object} Database handle
 */
export default function db(location, config = {}) {
  // Check if it's a network connection (starts with tcp://)
  if (location && typeof location === 'string' && location.startsWith('tcp://')) {
    // Network connection using multilevel
    const parts = location.replace('tcp://', '').split(':');
    const host = parts[0] || '127.0.0.1';
    const port = parseInt(parts[1] || '8001', 10);
    
    const db = multilevel.client();
    const stream = db.createRpcStream();
    
    // Connect to the multilevel server
    // Note: In a real implementation, you'd use a WebSocket or similar
    // For now, we'll return a mock that indicates network connection needed
    // Return a multilevel client
    return db;
  } else {
    // Local LevelDB connection
    const dbOptions = {
      valueEncoding: config.valueEncoding || 'json',
      keyEncoding: config.keyEncoding || 'utf8',
      ...config
    };
    
    try {
      const dbHandle = new Level(location, dbOptions);
      return dbHandle;
    } catch (err) {
      console.error('Error creating LevelDB connection:', err);
      throw err;
    }
  }
}

