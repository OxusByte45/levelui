const { Level } = require('level');
const path = require('path');
const fs = require('fs');

// Create demo database directory
const dbPath = path.join(__dirname, 'demo-db');

// Remove existing demo database if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing demo database...');
  fs.rmSync(dbPath, { recursive: true, force: true });
}

console.log('Creating demo LevelDB database at:', dbPath);

// Create and populate the database
const db = new Level(dbPath, { valueEncoding: 'json' });

async function createDemoDatabase() {
  try {
    // Create hierarchical data using colon-separated keys
    console.log('Creating hierarchical database...');
    
    const sampleData = [
      // Root entries
      { key: 'Root', value: { type: 'container', description: 'Root level database entries', count: 42 } },
      
      // Robots hierarchy
      { key: 'Robots', value: { active: true, totalRobots: 15, online: 12, offline: 3 } },
      { key: 'Robots:RootTests', value: { testsPassed: 127, testsFailed: 3, lastRun: '2024-11-24T08:30:00Z', coverage: 94.5 } },
      
      // SL1 hierarchy
      { key: 'SL1', value: { enabled: true, priority: 1, tasks: ['monitor', 'alert', 'backup'], timeout: 30000 } },
      { key: 'SL1:config', value: { maxRetries: 3, interval: 5000, debug: false, logLevel: 'info' } },
      
      // SL2 with nested SL2A
      { key: 'SL2', value: { version: '2.1.0', beta: false, features: ['sync', 'cache', 'compression'], size: 1024 } },
      { key: 'SL2:SL2A', value: { subVersion: 'A', mode: 'production', secure: true, port: 8080 } },
      { key: 'SL2:SL2A:deep', value: { nested: true, depth: 3, value: 'deeply nested data', id: 99 } },
      
      // Ratings hierarchy
      { key: 'Ratings', value: { averageRating: 4.7, totalReviews: 234, distribution: [5, 12, 28, 89, 100] } },
      { key: 'Ratings:user:1', value: { userId: 1, rating: 5, comment: 'Excellent product!', helpful: 23, date: '2024-11-20' } },
      { key: 'Ratings:user:2', value: { userId: 2, rating: 4, comment: 'Good but expensive', helpful: 15, date: '2024-11-22' } },
      
      // Permissions hierarchy
      { key: 'Permissions', value: { enabled: true, strict: false, requireAuth: true, allowGuest: false } },
      { key: 'Permissions:admin', value: { read: true, write: true, delete: true, execute: true, level: 10 } },
      { key: 'Permissions:user', value: { read: true, write: false, delete: false, execute: false, level: 1 } },
      
      // Users hierarchy
      { key: 'Users', value: { total: 1523, active: 1402, suspended: 121, deleted: null, premium: 456 } },
      { key: 'Users:alice', value: { id: 1, name: 'Alice', email: 'alice@example.com', verified: true, lastLogin: null } },
      { key: 'Users:bob', value: { id: 2, name: 'Bob', email: null, verified: false, lastLogin: '2024-11-23T14:22:00Z' } },
      
      // Favorites hierarchy
      { key: 'Favorites', value: { items: ['item1', 'item2', 'item3'], tags: ['important', 'starred'], count: 3 } },
      { key: 'Favorites:movies', value: { titles: ['Inception', 'Matrix', 'Interstellar'], ratings: [9.5, 9.0, 9.2], watched: [true, true, false] } },
      
      // File operations
      { key: 'fileDownload', value: { totalDownloads: 45678, bandwidth: 234.56, format: 'zip', compressed: true, size: null } },
      { key: 'fileDownload:recent', value: { files: ['doc.pdf', 'image.jpg', 'video.mp4'], sizes: [1024, 2048, 10240], success: [true, true, false] } },
      
      { key: 'fileUpload', value: { totalUploads: 23456, maxSize: 52428800, allowedTypes: ['.jpg', '.png', '.pdf'], enabled: true } },
      { key: 'fileUpload:pending', value: { count: 12, oldest: '2024-11-23T09:00:00Z', priority: 'high', autoProcess: false } },
      
      // Metadata hierarchy
      { key: 'Metadata', value: { version: 1, schema: 'v2', locked: false, timestamp: 1732435200000, owner: null } },
      { key: 'Metadata:schema', value: { 
          fields: ['id', 'name', 'email', 'created'], 
          types: ['number', 'string', 'string', 'date'],
          required: [true, true, false, true],
          defaults: [null, '', null, null]
        } 
      }
    ];

    console.log(`Inserting ${sampleData.length} key-value pairs...`);

    // Insert all data
    for (const item of sampleData) {
      await db.put(item.key, item.value);
      console.log(`  ✓ Inserted: ${item.key}`);
    }

    // Verify by reading back
    console.log('\nVerifying database...');
    const robotsData = await db.get('Robots');
    console.log(`  ✓ Verified: Robots =`, robotsData);

    // Get some stats
    let count = 0;
    for await (const key of db.keys()) {
      count++;
    }
    console.log(`\n✓ Database created successfully!`);
    console.log(`  Total keys: ${count}`);
    console.log(`  Database path: ${dbPath}`);
    console.log(`\nYou can now open this database in LevelUI:`);
    console.log(`  Path: ${dbPath}`);
    console.log(`\n  Keys are structured hierarchically with colons (e.g., Robots:RootTests).`);

    await db.close();
  } catch (error) {
    console.error('Error creating database:', error);
    await db.close();
    process.exit(1);
  }
}

createDemoDatabase();

