![img](/src/renderer/assets/img/leveldb.png)

# LevelUI

A modern LevelDB GUI for Electron - **Revived and Modernized** from [heapwolf/levelui](https://github.com/heapwolf/levelui).

**Key Updates:**
- Modern Electron (v39+) with secure architecture
- electron-vite build system with hot reload
- CodeMirror 6 for enhanced JSON editing
- Improved UX and error handling

# SCREENSHOT

## QUERY
![img](/docs/screenshot1.png)

## CONNECT
![img](/docs/screenshot2.png)

## INSERT
![img](/docs/screenshot3.png)

# Quick Start

```bash
npm install
npm run dev    # Development with hot reload
npm start      # Build and run
npm run demo-db # Create demo database
```

# Features

- **Query**: Browse keys with filtering and hierarchical tree view
- **Put**: Insert/update key-value pairs with JSON/string encoding
- **Connections**: Open local LevelDB or connect via TCP
- **Settings**: Configure database options and encodings
- **Modern UI**: CodeMirror 6 editor with syntax highlighting

# Documentation

- [Migration Guide](./MIGRATION.md) - What changed from original
- [Comparison](./COMPARISON.md) - Detailed before/after comparison
- [Testing Guide](./TESTING.md) - CRUD operations testing
- [Demo Database](./DEMO_DB_README.md) - Demo database info

# LICENSE

MIT

[0]:https://github.com/hij1nx/lev
