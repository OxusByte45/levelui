![img](/src/renderer/assets/img/leveldb.png)

# LevelUI

A modern LevelDB GUI for Electron - **Revived and Modernized** from [heapwolf/levelui](https://github.com/heapwolf/levelui).

**Original Author:** [heapwolf](https://github.com/heapwolf) - Created the original LevelUI project

## What We've Accomplished

This project has been completely modernized from the original abandoned repository:

- ✅ **Security Overhaul**: Migrated from insecure `nodeIntegration: true` to secure `contextIsolation: true` with preload script
- ✅ **Electron Upgrade**: Updated from Electron 0.28.1 (atom-shell) to Electron 39.2.3
- ✅ **Build System**: Replaced manual node-gyp rebuilds with modern electron-vite
- ✅ **Code Editor**: Upgraded to CodeMirror 6 with JSON syntax highlighting and linting
- ✅ **Architecture**: Reorganized into proper Electron structure (`src/main/`, `src/renderer/`, `src/preload/`)
- ✅ **Module System**: Converted from CommonJS to ES6 modules
- ✅ **IPC Pattern**: Implemented secure IPC communication via context bridge
- ✅ **Developer Experience**: Added hot reload, modern tooling, and comprehensive documentation

# Screenshots

## Query Interface
![Query Interface](/docs/screenshot1.png)

## Connection Manager
![Connection Manager](/docs/screenshot2.png)

## Insert/Update Data
![Insert/Update](/docs/screenshot3.png)

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

# Credits

- **Original Project**: [heapwolf/levelui](https://github.com/heapwolf/levelui) by [heapwolf](https://github.com/heapwolf)
- **Modernized Fork**: [OxusByte45/levelui](https://github.com/OxusByte45/levelui)

# LICENSE

MIT

