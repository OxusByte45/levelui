# Theming System Documentation

## Overview

The LevelUI theming system is a **centralized, CSS variable-based architecture** that provides automatic system theme detection with manual override capability. All styling is managed through CSS custom properties in a single source of truth file.

## Core Principles

- **Centralized Styling**: All styles in CSS files, no inline styles
- **CSS Variables Only**: All colors, spacing, fonts via CSS custom properties
- **Single Source of Truth**: Theme definitions in `src/renderer/styles/variables.css` only
- **No Patching**: Clean architecture, no scattered style definitions
- **Exception Rule**: Inline styles only for dynamic runtime values (e.g., calculated positions)

## Architecture

### 1. System Theme Detection

The app automatically detects and follows the system theme preference using Electron's `nativeTheme` API:

- **Main Process** (`src/main/index.js`): IPC handlers for theme detection
- **Preload** (`src/preload/index.js`): Exposes safe theme API to renderer
- **Theme Manager** (`src/renderer/lib/theme-manager.js`): Pure logic for theme management

### 2. CSS Variables Structure

**File**: `src/renderer/styles/variables.css` (PRIMARY THEME FILE)

All theme values are defined here:

#### Layout Variables
- `--spacing-*`: Spacing values (xs, sm, md, lg, xl, xxl)
- `--border-radius-*`: Border radius values
- `--shadow-*`: Box shadow values

#### Color Variables

**Background Colors:**
- `--bg-primary`: Main background
- `--bg-secondary`: Secondary background (panels, containers)
- `--bg-tertiary`: Tertiary background (hover states, subtle areas)
- `--bg-elevated`: Elevated surfaces (modals, dropdowns)

**Text Colors:**
- `--text-primary`: Primary text
- `--text-secondary`: Secondary text
- `--text-tertiary`: Tertiary text (subtle)
- `--text-inverse`: Inverse text (for dark backgrounds)

**UI Element Colors:**
- `--header-bg`: Header background
- `--header-text`: Header text color
- `--border-color`: Standard border color
- `--border-color-light`: Light border color

**Interactive Colors:**
- `--accent-color`: Primary accent color
- `--accent-hover`: Accent hover state
- `--accent-active`: Accent active state
- `--link-color`: Link color

**Code Editor Colors:**
- `--code-bg`: Code editor background
- `--code-text`: Code editor text
- `--code-border`: Code editor border
- `--code-gutter-bg`: Line number gutter background
- `--code-gutter-text`: Line number text
- `--code-selection-bg`: Selection background
- `--code-selection-bg-focused`: Focused selection background

**Syntax Highlighting Colors:**
- `--syntax-string`: String values
- `--syntax-number`: Numeric values
- `--syntax-keyword`: Keywords
- `--syntax-property`: Property names (JSON keys)
- `--syntax-punctuation`: Punctuation marks
- `--syntax-bool`: Boolean values
- `--syntax-null`: Null values
- `--syntax-bracket`: Brackets
- `--syntax-operator`: Operators
- `--syntax-variable`: Variables

### 3. Theme Selectors

```css
:root,
[data-theme="light"] {
  /* Light theme values */
}

[data-theme="dark"] {
  /* Dark theme overrides */
}
```

The theme is applied via `data-theme` attribute on `<html>` element:
- `data-theme="light"`: Light theme
- `data-theme="dark"`: Dark theme

### 4. Theme Manager

**File**: `src/renderer/lib/theme-manager.js`

Pure logic module (no styles) that handles:
- System theme detection
- Manual theme override
- Theme persistence
- Theme change notifications

**API:**
```javascript
import { themeManager } from './lib/theme-manager.js';

// Initialize (called first in main.js)
await themeManager.init();

// Get current theme
const theme = themeManager.getCurrentTheme(); // 'light' or 'dark'

// Set theme manually
await themeManager.setTheme('dark');

// Follow system theme
await themeManager.followSystem();

// Listen for theme changes
themeManager.onThemeChange((theme) => {
  console.log('Theme changed to:', theme);
});
```

### 5. Syntax Highlighting Themes

**File**: `src/renderer/lib/syntax-themes.js`

Maps syntax elements to CSS variable names. Syntax themes automatically match app theme:
- Light app theme → Light syntax colors
- Dark app theme → Dark syntax colors

**File**: `src/renderer/lib/codemirror-init.js`

CodeMirror 6 reads colors from CSS variables dynamically:
```javascript
const getCSSVar = (varName) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim();
};

// Colors read from CSS variables
{ tag: tags.string, color: getCSSVar('--syntax-string') }
```

## Usage in Components

### Adding New Components

When creating new components, use CSS variables:

```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.my-component:hover {
  background-color: var(--bg-secondary);
}
```

### Migration Rules

When migrating existing components:

1. Replace `#hex` colors → `var(--variable-name)`
2. Replace `rgb()` colors → `var(--variable-name)`
3. Replace hardcoded `background-color` → `var(--bg-*)`
4. Replace hardcoded `color` → `var(--text-*)`
5. Replace hardcoded `border-color` → `var(--border-color)`

**No exceptions** unless runtime-calculated values.

## System Theme Detection Flow

1. **App Startup**: `themeManager.init()` called first in `main.js`
2. **Check Override**: Load saved theme override from config file
3. **Get System Theme**: Query Electron `nativeTheme` API
4. **Apply Theme**: Set `data-theme` attribute on `<html>`
5. **Listen for Changes**: Subscribe to system theme change events

## Manual Override

Users can override system theme:
- Stored in user config file: `{userData}/theme-config.json`
- Override persists across app restarts
- Can be cleared to return to system theme

## Syntax Highlighting

Syntax highlighting automatically adapts to app theme:
- Colors read from CSS variables at runtime
- No hardcoded color values in JavaScript
- Theme changes apply immediately to all editors

## Adding New Themes

To add a new theme (e.g., high-contrast):

1. Add new selector in `variables.css`:
   ```css
   [data-theme="high-contrast"] {
     --bg-primary: #000000;
     --text-primary: #ffffff;
     /* ... all variable overrides */
   }
   ```

2. Update theme manager to support new theme
3. Add theme option to settings UI

## File Structure

```
src/
├── main/
│   └── index.js              # IPC handlers for theme detection
├── preload/
│   └── index.js              # Theme API exposure
└── renderer/
    ├── lib/
    │   ├── theme-manager.js  # Theme logic (no styles)
    │   ├── syntax-themes.js  # Syntax theme variable mappings
    │   └── codemirror-init.js # CodeMirror with CSS variable colors
    └── styles/
        ├── variables.css      # SINGLE SOURCE OF TRUTH - all theme values
        ├── base.css           # Uses CSS variables
        ├── components/        # All use CSS variables
        └── sections/         # All use CSS variables
```

## Best Practices

1. **Never use inline styles** for colors, backgrounds, or borders
2. **Always use CSS variables** from `variables.css`
3. **Check variable names** before creating new ones (may already exist)
4. **Test both themes** when adding new components
5. **Follow naming conventions**: `--category-specific` (e.g., `--bg-primary`)

## Troubleshooting

**Theme not applying:**
- Check `data-theme` attribute on `<html>` element
- Verify CSS variables are defined in `variables.css`
- Ensure theme manager initialized before components

**Colors not changing:**
- Verify component uses CSS variables, not hardcoded colors
- Check if variable name exists in `variables.css`
- Ensure `[data-theme]` selector has variable override

**Syntax highlighting not updating:**
- CodeMirror reads CSS variables at initialization
- Theme changes require editor re-initialization (future enhancement)

## Future Enhancements

- [ ] Multiple syntax theme options (not just light/dark)
- [ ] Theme preview in settings
- [ ] Custom theme creation
- [ ] Theme import/export
- [ ] Per-window theme support

