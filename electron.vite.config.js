import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      {
        name: 'ensure-cjs-file',
        closeBundle() {
          const jsPath = resolve(__dirname, 'dist/main/index.js');
          const cjsPath = resolve(__dirname, 'dist/main/index.cjs');
          // Copy .js to .cjs for electron-vite compatibility
          if (existsSync(jsPath) && !existsSync(cjsPath)) {
            copyFileSync(jsPath, cjsPath);
          }
        }
      }
    ],
    build: {
      outDir: 'dist/main',
      lib: {
        entry: resolve(__dirname, 'src/main/index.js'),
        fileName: 'index',
        formats: ['cjs']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: resolve(__dirname, 'src/preload/index.js'),
        fileName: 'index',
        formats: ['cjs'] // Use CJS format for preload to match Electron's expectations
      }
    }
  },
  renderer: {
    // Don't use externalizeDepsPlugin for renderer - we need to bundle CodeMirror
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    },
    build: {
      rollupOptions: {
        external: (id) => {
          // Only externalize Node.js built-ins and electron - bundle everything else (including CodeMirror)
          return id === 'electron' || 
                 id.startsWith('node:') ||
                 ['path', 'fs', 'fs/promises', 'os', 'crypto', 'stream', 'util', 
                  'events', 'buffer', 'url', 'querystring', 'http', 'https', 
                  'net', 'tls', 'child_process', 'cluster', 'dgram', 'dns', 
                  'readline', 'zlib'].includes(id);
        }
      }
    }
  }
});

