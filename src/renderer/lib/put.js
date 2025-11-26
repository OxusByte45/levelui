// Put module - uses secure IPC API
import dbAPI from './db-api.js';

export function init(database, config) {
  const section = document.querySelector('section.put');
  if (!section) return;
  
  const keyEncoding = section.querySelector('input.keyEncoding');
  const valueEncoding = section.querySelector('input.valueEncoding');
  const saveBtn = section.querySelector('input.save');
  const clearBtn = section.querySelector('input.clear');
  const keyTextarea = section.querySelector('.key textarea');
  const valueTextarea = section.querySelector('.value textarea');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // Use dbAPI if database.handle is not available or is dbAPI
      const handle = database?.handle || (dbAPI.isOpen ? dbAPI : null);
      
      if (!handle) {
        console.error('No database handle available');
        return;
      }
      
      if (!keyTextarea || !keyTextarea.value) {
        console.error('Key is required');
        return;
      }
      
      try {
        const key = keyTextarea.value.trim();
        let value = valueTextarea ? valueTextarea.value : '';
        
        // Try to parse as JSON if value encoding is json
        const valEncoding = valueEncoding && valueEncoding.value ? valueEncoding.value : 'json';
        if (valEncoding === 'json' && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If not valid JSON, use as string
          }
        }
        
        await handle.put(key, value);
        
        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:12px 24px;border-radius:4px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-family:sans-serif;font-size:14px;';
        successMsg.textContent = '✓ Key saved successfully: ' + key;
        document.body.appendChild(successMsg);
        setTimeout(() => {
          if (successMsg.parentNode) {
            successMsg.style.transition = 'opacity 0.3s ease';
            successMsg.style.opacity = '0';
            setTimeout(() => {
              if (successMsg.parentNode) {
                successMsg.remove();
              }
            }, 300);
          }
        }, 2000);
        
        // Refresh keys list in background (without switching tabs)
        // Import query module statically at top level instead
        const { getKeys } = await import('./query.js');
        if (getKeys) {
          await getKeys(database, config);
        }
      } catch (err) {
        console.error('Error saving key:', err);
        
        // Show error feedback
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:12px 24px;border-radius:4px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-family:sans-serif;font-size:14px;';
        errorMsg.textContent = '✗ Error saving key: ' + (err.message || err.toString());
        document.body.appendChild(errorMsg);
        setTimeout(() => {
          if (errorMsg.parentNode) {
            errorMsg.style.transition = 'opacity 0.3s ease';
            errorMsg.style.opacity = '0';
            setTimeout(() => {
              if (errorMsg.parentNode) {
                errorMsg.remove();
              }
            }, 300);
          }
        }, 3000);
      }
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (keyTextarea) {
        keyTextarea.value = '';
      }
      if (valueTextarea) {
        valueTextarea.value = '';
      }
    });
  }
}

