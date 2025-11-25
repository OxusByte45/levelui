# Demo Database

A sample LevelDB database has been created for testing LevelUI.

## Location
`./demo-db/`

## How to Use

1. **Start LevelUI:**
   ```bash
   npm start
   ```

2. **Open the Demo Database:**
   - Click on the "Connections" tab (database icon)
   - In the "Local Connection" section, enter the path:
     ```
     /home/fourty5/bin/levelui/demo-db
     ```
   - Click "Open"

3. **Explore the Data:**
   - Switch to the "Query" tab to browse keys
   - Use the query controls to filter keys:
     - **Lower Bound**: Start typing a prefix (e.g., `user:`)
     - **Upper Bound**: End of range
     - **Limit**: Number of results to show
   - Click on any key to view/edit its value

## Sample Data Included

The demo database contains 23 key-value pairs:

### Users (3 entries)
- `user:1` - Alice (admin)
- `user:2` - Bob (user)
- `user:3` - Charlie (user)

### Configuration (4 entries)
- `config:app:name` - Application name
- `config:app:version` - Version number
- `config:features:darkMode` - Feature flags
- `config:features:notifications` - Feature flags

### Sessions (2 entries)
- `session:abc123` - User session data
- `session:def456` - User session data

### Products (3 entries)
- `product:laptop:001` - Gaming Laptop
- `product:laptop:002` - Business Laptop
- `product:phone:001` - Smartphone Pro

### Orders (3 entries)
- `orders:2024:001` - Order details
- `orders:2024:002` - Order details
- `orders:2024:003` - Order details

### Logs (3 entries)
- `log:2024-11-24:001` - Info log
- `log:2024-11-24:002` - Warning log
- `log:2024-11-24:003` - Error log

### Messages (2 entries)
- `message:welcome` - Welcome message
- `message:goodbye` - Goodbye message

### Statistics (3 entries)
- `stats:totalUsers` - User count
- `stats:totalOrders` - Order count
- `stats:totalRevenue` - Revenue total

## Recreate the Database

To recreate the demo database (useful if you've modified it):

```bash
npm run demo-db
```

Or directly:
```bash
node create-demo-db.js
```

## Testing Tips

1. **Query by Prefix:**
   - Set Lower Bound to `user:` to see all users
   - Set Lower Bound to `product:` to see all products
   - Set Lower Bound to `orders:2024:` to see all 2024 orders

2. **Edit Values:**
   - Click on any key in the Query section
   - Edit the JSON value in the editor
   - Changes are saved automatically

3. **Add New Keys:**
   - Go to the "Put" tab
   - Enter a key and value (JSON format)
   - Click "Save"

4. **Delete Keys:**
   - In the Query section, select a key
   - Click the delete button (trash icon)

## Notes

- All values are stored as JSON
- The database uses LevelDB format
- The database is persistent - changes are saved immediately
- You can safely delete and recreate the demo database anytime

