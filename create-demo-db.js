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
    // Sample data - various types of keys and values
    const sampleData = [
      // Simple key-value pairs
      { key: 'user:1', value: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' } },
      { key: 'user:2', value: { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' } },
      { key: 'user:3', value: { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' } },
      
      // Configuration data
      { key: 'config:app:name', value: 'LevelUI Demo Application' },
      { key: 'config:app:version', value: '3.0.0' },
      { key: 'config:features:darkMode', value: true },
      { key: 'config:features:notifications', value: false },
      
      // Session data
      { key: 'session:abc123', value: { userId: 1, loginTime: '2024-11-24T10:00:00Z', ip: '192.168.1.100' } },
      { key: 'session:def456', value: { userId: 2, loginTime: '2024-11-24T11:30:00Z', ip: '192.168.1.101' } },
      
      // Product catalog
      { key: 'product:laptop:001', value: { name: 'Gaming Laptop', price: 1299.99, stock: 15, category: 'electronics' } },
      { key: 'product:laptop:002', value: { name: 'Business Laptop', price: 899.99, stock: 8, category: 'electronics' } },
      { key: 'product:phone:001', value: { name: 'Smartphone Pro', price: 699.99, stock: 25, category: 'electronics' } },
      
      // Nested/hierarchical data (using prefixes)
      { key: 'orders:2024:001', value: { orderId: 'ORD-2024-001', customerId: 1, total: 1999.98, items: ['laptop:001', 'phone:001'] } },
      { key: 'orders:2024:002', value: { orderId: 'ORD-2024-002', customerId: 2, total: 899.99, items: ['laptop:002'] } },
      { key: 'orders:2024:003', value: { orderId: 'ORD-2024-003', customerId: 3, total: 699.99, items: ['phone:001'] } },
      
      // Log entries
      { key: 'log:2024-11-24:001', value: { level: 'info', message: 'Application started', timestamp: '2024-11-24T08:00:00Z' } },
      { key: 'log:2024-11-24:002', value: { level: 'warning', message: 'High memory usage detected', timestamp: '2024-11-24T09:15:00Z' } },
      { key: 'log:2024-11-24:003', value: { level: 'error', message: 'Database connection failed', timestamp: '2024-11-24T10:30:00Z' } },
      
      // Simple string values
      { key: 'message:welcome', value: 'Welcome to LevelUI!' },
      { key: 'message:goodbye', value: 'Thank you for using LevelUI!' },
      
      // Numeric values
      { key: 'stats:totalUsers', value: 3 },
      { key: 'stats:totalOrders', value: 3 },
      { key: 'stats:totalRevenue', value: 3499.96 },
    ];

    console.log(`Inserting ${sampleData.length} key-value pairs...`);

    // Insert all data
    for (const item of sampleData) {
      await db.put(item.key, item.value);
      console.log(`  ✓ Inserted: ${item.key}`);
    }

    // Verify by reading back
    console.log('\nVerifying database...');
    const user1 = await db.get('user:1');
    console.log(`  ✓ Verified: user:1 =`, user1);

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

    await db.close();
  } catch (error) {
    console.error('Error creating database:', error);
    await db.close();
    process.exit(1);
  }
}

createDemoDatabase();

