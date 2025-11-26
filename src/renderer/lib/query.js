// Query module - uses secure IPC API
import dbAPI from './db-api.js';

// Native debounce implementation
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let database = null;
let config = null;
let keysList = [];
let selectedKey = null;
let reverseOrder = false; // Track reverse sort order state

export function init(db, cfg) {
  database = db;
  config = cfg;
  
  const section = document.querySelector('section.query');
  if (!section) return;
  
  const upperBound = section.querySelector('input.upperbound');
  const lowerBound = section.querySelector('input.lowerbound');
  const limit = section.querySelector('input.limit');
  const reverse = section.querySelector('input.reverse');
  const deleteBtn = section.querySelector('input.delete');
  const sublevels = section.querySelector('input.sublevels');
  const keysSelect = section.querySelector('.keys select');
  const valueTextarea = section.querySelector('.value textarea');
  
  // Set default limit
  if (limit) {
    limit.value = '100';
  }
  
  // Query on input changes
  const queryDebounced = debounce(() => {
    getKeys(database, config);
  }, 300);
  
  if (upperBound) {
    upperBound.addEventListener('input', queryDebounced);
  }
  
  if (lowerBound) {
    lowerBound.addEventListener('input', queryDebounced);
  }
  
  if (limit) {
    limit.addEventListener('input', queryDebounced);
  }
  
  if (reverse) {
    reverse.addEventListener('click', () => {
      // Toggle reverse order
      reverseOrder = !reverseOrder;
      // Update button visual state (toggle between up/down arrow)
      if (reverseOrder) {
        reverse.value = 'navigateup'; // Up arrow when reversed (descending)
        reverse.title = 'Descending (click for Ascending)';
      } else {
        reverse.value = 'navigatedown'; // Down arrow when normal (ascending)
        reverse.title = 'Ascending (click for Descending)';
      }
      // Refresh query with new order (but preserve tree structure)
      getKeys(database, config, true); // Pass flag to skip tree rebuild
    });
    // Set initial state (ascending by default)
    reverse.value = 'navigatedown';
    reverse.title = 'Ascending (click for Descending)';
  }
  
  if (keysSelect) {
    keysSelect.addEventListener('change', () => {
      const selectedIndex = keysSelect.selectedIndex;
      if (selectedIndex >= 0 && keysList[selectedIndex]) {
        selectedKey = keysList[selectedIndex];
        loadValue(selectedKey);
      }
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (selectedKey && database.handle) {
        try {
          await database.handle.del(selectedKey);
          await getKeys(database, config);
          if (valueTextarea) {
            valueTextarea.value = '';
          }
        } catch (err) {
          console.error('Error deleting key:', err);
        }
      }
    });
  }
  
  // Show results panel initially
  const resultsPanel = section.querySelector('.results');
  if (resultsPanel) {
    resultsPanel.classList.add('open');
  }
  
  // Toggle tree on sublevels button click
  if (sublevels) {
    sublevels.addEventListener('click', () => {
      // Toggle tree visibility
      const treeContainer = section.querySelector('.tree-container');
      const resultsPanel = section.querySelector('.results');
      const splitx = section.querySelector('.results .splitx');
      const keysPanel = section.querySelector('.results .keys');
      if (treeContainer && resultsPanel && splitx && keysPanel) {
        const isHidden = treeContainer.style.display === 'none';
        if (isHidden) {
          treeContainer.style.display = 'block';
          resultsPanel.classList.add('open');
          const treeWidth = treeContainer.offsetWidth || 300;
          resultsPanel.style.left = `${treeWidth}px`;
          // splitx position is relative to results panel, keep it at keysWidth
          const keysWidth = keysPanel.offsetWidth || 300;
          splitx.style.left = `${keysWidth}px`;
        } else {
          treeContainer.style.display = 'none';
          resultsPanel.classList.remove('open');
          resultsPanel.style.left = '0px';
          // splitx position is relative to results panel, keep it at keysWidth
          const keysWidth = keysPanel.offsetWidth || 300;
          splitx.style.left = `${keysWidth}px`;
        }
      }
    });
  }
  
  // Toggle tree on root checkbox click
  const rootCheckbox = section.querySelector('#root');
  if (rootCheckbox) {
    rootCheckbox.addEventListener('change', (e) => {
      const treeContainer = section.querySelector('.tree-container');
      const resultsPanel = section.querySelector('.results');
      const splitx = section.querySelector('.results .splitx');
      const keysPanel = section.querySelector('.results .keys');
      if (treeContainer && resultsPanel && splitx && keysPanel) {
        if (e.target.checked) {
          treeContainer.style.display = 'block';
          resultsPanel.classList.add('open');
          const treeWidth = treeContainer.offsetWidth || 300;
          resultsPanel.style.left = `${treeWidth}px`;
          // splitx position is relative to results panel, keep it at keysWidth
          const keysWidth = keysPanel.offsetWidth || 300;
          splitx.style.left = `${keysWidth}px`;
        } else {
          treeContainer.style.display = 'none';
          resultsPanel.classList.remove('open');
          resultsPanel.style.left = '0px';
          // splitx position is relative to results panel, keep it at keysWidth
          const keysWidth = keysPanel.offsetWidth || 300;
          splitx.style.left = `${keysWidth}px`;
        }
      }
    });
    // Initially show tree
    rootCheckbox.checked = true;
  }
  
  // Initialize resizable panes
  initResizablePanes(section);
  
  // Initial load
  getKeys(database, config);
}

/**
 * Initialize resizable panes for tree, keys, and value editor
 */
function initResizablePanes(section) {
  const treeContainer = section.querySelector('.tree-container');
  const resultsPanel = section.querySelector('.results');
  const splitx = section.querySelector('.results .splitx');
  const keysPanel = section.querySelector('.results .keys');
  const valuePanel = section.querySelector('.results .value');
  
  if (!treeContainer || !resultsPanel || !splitx || !keysPanel || !valuePanel) {
    return;
  }
  
  // Initialize widths from current state or defaults
  let treeWidth = treeContainer.offsetWidth || 300;
  let keysWidth = keysPanel.offsetWidth || 300;
  
  // Ensure initial positioning is correct
  function updatePositions() {
    treeContainer.style.width = `${treeWidth}px`;
    resultsPanel.style.left = `${treeWidth}px`;
    keysPanel.style.width = `${keysWidth}px`;
    splitx.style.left = `${keysWidth}px`;
    valuePanel.style.left = `${keysWidth}px`;
  }
  
  // Keep splitx within bounds when window resizes
  function constrainSplitx() {
    const resultsLeft = resultsPanel.offsetLeft;
    const resultsWidth = window.innerWidth - resultsLeft;
    const minKeysWidth = 200;
    const maxKeysWidth = resultsWidth - 200;
    
    if (keysWidth < minKeysWidth) {
      keysWidth = minKeysWidth;
    } else if (keysWidth > maxKeysWidth) {
      keysWidth = Math.max(minKeysWidth, maxKeysWidth);
    }
    
    updatePositions();
  }
  
  // Initialize positions
  updatePositions();
  
  let isResizingTree = false;
  let isResizingKeys = false;
  
  // Tree resizer
  const treeResizer = document.createElement('div');
  treeResizer.className = 'tree-resizer';
  treeContainer.appendChild(treeResizer);
  
  treeResizer.addEventListener('mousedown', (e) => {
    isResizingTree = true;
    resultsPanel.classList.add('resizing');
    document.addEventListener('mousemove', handleTreeResize);
    document.addEventListener('mouseup', stopTreeResize);
    e.preventDefault();
  });
  
  function handleTreeResize(e) {
    if (!isResizingTree) return;
    const newWidth = e.clientX;
    const minWidth = 200;
    const maxWidth = Math.max(minWidth + 200, window.innerWidth * 0.5);
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      treeWidth = newWidth;
      treeContainer.style.width = `${treeWidth}px`;
      resultsPanel.style.left = `${treeWidth}px`;
      // Constrain splitx after tree resize
      constrainSplitx();
    }
  }
  
  function stopTreeResize() {
    isResizingTree = false;
    resultsPanel.classList.remove('resizing');
    document.removeEventListener('mousemove', handleTreeResize);
    document.removeEventListener('mouseup', stopTreeResize);
  }
  
  // Keys/Value resizer
  splitx.addEventListener('mousedown', (e) => {
    isResizingKeys = true;
    resultsPanel.classList.add('resizing');
    document.addEventListener('mousemove', handleKeysResize);
    document.addEventListener('mouseup', stopKeysResize);
    e.preventDefault();
  });
  
  function handleKeysResize(e) {
    if (!isResizingKeys) return;
    const resultsLeft = resultsPanel.offsetLeft;
    const newKeysWidth = e.clientX - resultsLeft;
    const minWidth = 200;
    const availableWidth = window.innerWidth - resultsLeft;
    const maxWidth = Math.max(minWidth + 200, availableWidth - 200);
    if (newKeysWidth >= minWidth && newKeysWidth <= maxWidth) {
      keysWidth = newKeysWidth;
      keysPanel.style.width = `${keysWidth}px`;
      splitx.style.left = `${keysWidth}px`;
      valuePanel.style.left = `${keysWidth}px`;
    }
  }
  
  function stopKeysResize() {
    isResizingKeys = false;
    resultsPanel.classList.remove('resizing');
    document.removeEventListener('mousemove', handleKeysResize);
    document.removeEventListener('mouseup', stopKeysResize);
  }
  
  // Handle window resize to keep everything in bounds
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!isResizingTree && !isResizingKeys) {
        constrainSplitx();
      }
    }, 100);
  });
}

export async function getKeys(db, cfg, skipTreeRebuild = false) {
  // Use dbAPI if database.handle is not available or is dbAPI
  const handle = db?.handle || (dbAPI.isOpen ? dbAPI : null);
  
  if (!handle) {
    // Don't log warning on initial load - database might not be opened yet
    if (keysList.length === 0) {
      return; // Silent return on initial load
    }
    console.warn('No database handle available');
    return;
  }
  
  const section = document.querySelector('section.query');
  if (!section) return;
  
  const upperBound = section.querySelector('input.upperbound');
  const lowerBound = section.querySelector('input.lowerbound');
  const limit = section.querySelector('input.limit');
  const keysSelect = section.querySelector('.keys select');
  const deleteBtn = section.querySelector('input.delete');
  const treeRoot = section.querySelector('.tree .root');
  
  try {
    const options = {};
    if (upperBound && upperBound.value) {
      options.lt = upperBound.value;
    }
    if (lowerBound && lowerBound.value) {
      options.gte = lowerBound.value;
    }
    if (limit && limit.value) {
      options.limit = parseInt(limit.value, 10);
    }
    // Add reverse option if enabled
    if (reverseOrder) {
      options.reverse = true;
    }
    
    keysList = [];
    if (keysSelect) {
      keysSelect.innerHTML = '';
    }
    // Only clear tree if we're doing a full rebuild (not just toggling sort order)
    if (treeRoot && !skipTreeRebuild) {
      treeRoot.innerHTML = '';
    }
    
    // Use async iterator for keys (dbAPI.keys() returns async generator)
    for await (const key of handle.keys(options)) {
      keysList.push(key);
      if (keysSelect) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keysSelect.appendChild(option);
      }
    }
    
    // Build hierarchical tree structure
    // Tree should always use sorted keys (alphabetical) regardless of reverse order
    // This maintains consistent hierarchical structure
    // Only rebuild tree if not skipping (i.e., on initial load or filter changes)
    if (treeRoot && !skipTreeRebuild) {
      const sortedKeysForTree = [...keysList].sort();
      buildTree(treeRoot, sortedKeysForTree);
    }
    
    if (deleteBtn) {
      deleteBtn.disabled = keysList.length === 0;
    }
  } catch (err) {
    console.error('Error loading keys:', err);
  }
}

/**
 * Build hierarchical tree structure from keys
 * Keys are assumed to be colon-separated (e.g., "Robots:RootTests", "SL1:config")
 */
function buildTree(rootUl, keys) {
  const tree = {};
  
  // Build tree structure from keys
  keys.forEach(key => {
    const parts = key.split(':');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          name: part,
          fullKey: index === parts.length - 1 ? key : null,
          children: {}
        };
      }
      current = current[part].children;
    });
    
    // Mark the last part as a leaf node with the full key
    const lastPart = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    let leafNode = tree;
    parentParts.forEach(part => {
      leafNode = leafNode[part].children;
    });
    if (leafNode[lastPart]) {
      leafNode[lastPart].fullKey = key;
    }
  });
  
  // Render tree
  function renderNode(node, parentUl, depth = 0) {
    const li = document.createElement('li');
    
    const hasChildren = Object.keys(node.children).length > 0;
    const isLeaf = node.fullKey && !hasChildren;
    const isRootLevel = depth === 0;
    
    if (hasChildren || isLeaf) {
      // Has children or is a leaf node
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `tree-${node.name}-${Math.random().toString(36).substr(2, 9)}`;
      
      // For leaf nodes at sub-level, don't disable - they're just not expandable
      // Only disable if it's a root-level leaf (which shouldn't happen often)
      if (isLeaf && isRootLevel) {
        checkbox.disabled = true;
      }
      
      const label = document.createElement('label');
      label.setAttribute('for', checkbox.id);
      
      // Only add folder/file icons on root level (depth 0)
      // Sub-levels are just grayed out text with no icons
      if (isRootLevel) {
        if (hasChildren) {
          label.classList.add('ss-icon', 'ss-folder');
        } else if (isLeaf) {
          label.classList.add('ss-icon', 'ss-file');
        }
      } else {
        // Sub-levels: just grayed out text, no icons, no arrows
        label.classList.add('tree-sub-item');
      }
      
      label.textContent = node.name;
      
      if (node.fullKey) {
        label.addEventListener('click', (e) => {
          // Don't trigger if clicking the checkbox area
          if (e.target === checkbox) return;
          
          e.stopPropagation();
          
          // Remove active class from all labels in the tree
          const section = document.querySelector('section.query');
          if (section) {
            const allLabels = section.querySelectorAll('.tree label');
            allLabels.forEach(l => l.classList.remove('active'));
          }
          
          // Add active class to clicked label
          label.classList.add('active');
          
          selectedKey = node.fullKey;
          loadValue(node.fullKey);
          
          // Update select dropdown
          const keysSelect = document.querySelector('.keys select');
          if (keysSelect) {
            const index = keysList.indexOf(node.fullKey);
            if (index >= 0) {
              keysSelect.selectedIndex = index;
            }
          }
        });
      }
      
      li.appendChild(checkbox);
      li.appendChild(label);
      
      if (hasChildren) {
        const childUl = document.createElement('ul');
        Object.values(node.children).forEach(child => {
          renderNode(child, childUl, depth + 1);
        });
        li.appendChild(childUl);
      }
    } else {
      // Just a label (shouldn't happen in normal tree structure)
      const label = document.createElement('label');
      label.textContent = node.name;
      label.classList.add('ss-icon');
      li.appendChild(label);
    }
    
    parentUl.appendChild(li);
  }
  
  // Render all root nodes
  Object.values(tree).forEach(node => {
    renderNode(node, rootUl);
  });
}

async function loadValue(key) {
  // Use dbAPI if database.handle is not available or is dbAPI
  const handle = database?.handle || (dbAPI.isOpen ? dbAPI : null);
  
  if (!handle || !key) return;
  
  const section = document.querySelector('section.query');
  if (!section) return;
  
  const valueTextarea = section.querySelector('.value textarea');
  
  try {
    const value = await handle.get(key);
    if (valueTextarea) {
      // Format as JSON if it's an object
      let formattedValue;
      if (typeof value === 'object') {
        formattedValue = JSON.stringify(value, null, 2);
      } else {
        formattedValue = String(value);
      }
      
      // Update textarea value (which will sync to CodeMirror editor)
      valueTextarea.value = formattedValue;
      
      // Also update CodeMirror editor directly if it exists
      const codemirrorInit = await import('./codemirror-init.js');
      const editor = codemirrorInit.getEditor(valueTextarea);
      if (editor) {
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: formattedValue
          }
        });
      }
    }
  } catch (err) {
    console.error('Error loading value:', err);
    if (valueTextarea) {
      const errorMsg = `Error: ${err.message}`;
      valueTextarea.value = errorMsg;
      
      // Also update CodeMirror editor directly if it exists
      const codemirrorInit = await import('./codemirror-init.js');
      const editor = codemirrorInit.getEditor(valueTextarea);
      if (editor) {
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: errorMsg
          }
        });
      }
    }
  }
}

export function refreshTree(db) {
  // Tree refresh functionality
  getKeys(db, config);
}

