# Testing Guide - CRUD Operations

This guide helps you test all CRUD (Create, Read, Update, Delete) operations in LevelUI after the security modernization.

## Prerequisites

1. Build the application:
   ```bash
   npm run build
   ```

2. Create a demo database (optional):
   ```bash
   npm run demo-db
   ```

## Starting the Application

```bash
npm start
```

Or for development with hot reload:
```bash
npm run dev
```

## Test Plan

### 1. **CREATE (Put) Operations**

#### Test 1.1: Create a simple key-value pair
1. Open the application
2. Go to **Connections** tab
3. Click **Open** and select the `demo-db` directory (or any LevelDB directory)
4. Switch to **Put** tab
5. Enter a key: `test:simple`
6. Enter a value: `"Hello World"`
7. Click **Save**
8. **Expected**: Success notification appears, key is saved

#### Test 1.2: Create a JSON object
1. In **Put** tab
2. Key: `test:json`
3. Value:
   ```json
   {
     "name": "Test",
     "value": 123,
     "active": true
   }
   ```
4. Click **Save**
5. **Expected**: Success notification, JSON is saved

#### Test 1.3: Create with different encodings
1. Set **Value Encoding** to `utf8`
2. Key: `test:utf8`
3. Value: `Simple text string`
4. Click **Save**
5. **Expected**: Saved as string, not JSON

### 2. **READ (Query) Operations**

#### Test 2.1: Browse all keys
1. Switch to **Query** tab
2. **Expected**: All keys from database are listed in the tree and dropdown

#### Test 2.2: Filter by lower bound
1. In **Query** tab
2. Enter **Lower Bound**: `test:`
3. **Expected**: Only keys starting with `test:` are shown

#### Test 2.3: Filter by upper bound
1. Enter **Upper Bound**: `test:z`
2. **Expected**: Keys up to `test:z` are shown

#### Test 2.4: Limit results
1. Enter **Limit**: `5`
2. **Expected**: Maximum 5 keys are shown

#### Test 2.5: View value
1. Click on any key in the tree or dropdown
2. **Expected**: Value is displayed in the right panel, formatted as JSON if applicable

#### Test 2.6: Hierarchical tree view
1. Look at keys with colons (e.g., `user:1`, `config:app:name`)
2. **Expected**: Tree shows hierarchical structure with folders

### 3. **UPDATE Operations**

#### Test 3.1: Update existing key
1. In **Query** tab, click on an existing key (e.g., `test:simple`)
2. Note the current value
3. Switch to **Put** tab
4. Enter the same key: `test:simple`
5. Enter new value: `"Updated value"`
6. Click **Save**
7. **Expected**: Success notification
8. Switch back to **Query** tab and click the key again
9. **Expected**: New value is displayed

### 4. **DELETE Operations**

#### Test 4.1: Delete a key
1. In **Query** tab
2. Select a key from the dropdown or tree (e.g., `test:simple`)
3. Click the **Delete** button (trash icon)
4. **Expected**: Key is removed from the list, value panel is cleared
5. Try to query the key again
6. **Expected**: Key no longer exists (error if you try to view it)

#### Test 4.2: Delete with confirmation
- Note: Currently no confirmation dialog, but deletion should be immediate
- **Expected**: Key is deleted immediately

### 5. **Connection Operations**

#### Test 5.1: Open local database
1. Go to **Connections** tab
2. Click **Open** button
3. Select a LevelDB directory
4. **Expected**: 
   - Success notification
   - Automatically switches to Query tab
   - Keys are loaded

#### Test 5.2: Close and reopen
1. Open a database
2. Open a different database
3. **Expected**: Previous database is closed, new one opens

#### Test 5.3: Network connection (if multilevel server available)
1. Enter network address: `tcp://127.0.0.1:8001`
2. Click **Connect**
3. **Expected**: Connects to remote database (if server is running)

### 6. **Error Handling**

#### Test 6.1: Invalid database path
1. Try to open a non-existent directory
2. **Expected**: Error message displayed

#### Test 6.2: Invalid JSON value
1. In **Put** tab
2. Key: `test:invalid`
3. Value: `{ invalid json }`
4. Click **Save**
5. **Expected**: Error notification (or saved as string if encoding allows)

#### Test 6.3: Delete without selection
1. In **Query** tab
2. Don't select any key
3. Try to click Delete
4. **Expected**: Delete button is disabled

### 7. **UI/UX Tests**

#### Test 7.1: Tab navigation
1. Click through all tabs: Connections, Query, Put, Settings
2. **Expected**: Each tab shows correct content

#### Test 7.2: CodeMirror editor
1. In **Put** tab, type in key or value fields
2. **Expected**: Syntax highlighting for JSON, line numbers visible

#### Test 7.3: Notifications
1. Perform any operation (save, delete, open)
2. **Expected**: Toast notifications appear and fade out

#### Test 7.4: Tree toggle
1. In **Query** tab
2. Click **Sublevels** button or uncheck root checkbox
3. **Expected**: Tree view toggles visibility

## Verification Checklist

After testing, verify:

- [ ] All CREATE operations work (simple, JSON, different encodings)
- [ ] All READ operations work (browse, filter, view values)
- [ ] UPDATE operations modify existing keys correctly
- [ ] DELETE operations remove keys
- [ ] Database connections work (local and network)
- [ ] Error handling works for invalid inputs
- [ ] UI is responsive and notifications appear
- [ ] No console errors related to IPC or database operations
- [ ] Content Security Policy warning is gone

## Known Issues to Watch For

1. **IPC Communication**: If operations fail, check browser console for IPC errors
2. **Database Handle**: Ensure `database.handle` is set after opening a database
3. **Async Operations**: All database operations are async - ensure proper error handling
4. **CodeMirror**: Editor should sync with textarea values

## Debugging

If something doesn't work:

1. Open DevTools (should be open by default in dev mode)
2. Check Console for errors
3. Check Network tab for IPC calls (if visible)
4. Verify `window.electronAPI` is available in renderer console
5. Check main process logs for database errors

## Automated Testing

For quick automated testing, you can use the test script in the browser console:

### Quick Test (Recommended)

1. **Start the application**: `npm run dev` or `npm start`
2. **Open DevTools**: Press `F12` or View > Toggle Developer Tools
3. **Open a database**: 
   - Go to **Connections** tab
   - Click **Open** button
   - Select a database directory (or use `demo-db` if you created it)
4. **Load and run the test** in Console:
   ```javascript
   // Load test script
   fetch('./test-crud.js')
     .then(r => r.text())
     .then(eval)
     .then(() => {
       console.log('✅ Test script loaded! Running tests...');
       return testCRUD();
     })
     .catch(err => console.error('Failed to load test:', err));
   ```

### What the test does:

- ✅ **CREATE**: Tests creating string, JSON, and number values
- ✅ **READ**: Tests reading values and querying keys with filters  
- ✅ **UPDATE**: Tests updating existing keys
- ✅ **DELETE**: Tests deleting keys

The test will automatically:
- Create test keys with different value types
- Read them back to verify
- Update them with new values
- Delete them and verify deletion
- Display a summary with pass/fail counts

### Expected Output:

```
🧪 Starting CRUD Tests...
✓ Database ID: db_1234567890_abc123
✓ Testing with database: db_1234567890_abc123

📝 TEST 1: CREATE Operations
─────────────────────────────
  ✓ CREATE string value: test:crud:string
  ✓ CREATE JSON object: test:crud:json
  ✓ CREATE number: test:crud:number

📖 TEST 2: READ Operations
─────────────────────────────
  ✓ READ string value: test:crud:string = Hello World
  ✓ READ JSON object: test:crud:json = {"name":"Test","value":123,"active":true}
  ✓ READ number: test:crud:number = 42
  ✓ READ keys with filter: Found 3 keys

✏️  TEST 3: UPDATE Operations
─────────────────────────────
  ✓ UPDATE string: test:crud:string = Updated Value
  ✓ UPDATE JSON: test:crud:json = {"name":"Updated","value":456,"active":false}

🗑️  TEST 4: DELETE Operations
─────────────────────────────
  ✓ DELETE string: test:crud:string (key deleted)
  ✓ DELETE JSON: test:crud:json (key deleted)
  ✓ DELETE number: test:crud:number (key deleted)

📊 TEST RESULTS SUMMARY
═══════════════════════════════════════
CREATE: 3 passed, 0 failed
READ:   4 passed, 0 failed
UPDATE: 2 passed, 0 failed
DELETE: 3 passed, 0 failed
───────────────────────────────────────
TOTAL:  12 passed, 0 failed

✅ ALL TESTS PASSED! CRUD operations are working correctly.
```

## Success Criteria

✅ All CRUD operations work correctly  
✅ No security warnings in console  
✅ No IPC communication errors  
✅ UI is responsive and user-friendly  
✅ Error handling works properly  

