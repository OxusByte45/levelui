// Theme Manager - Pure logic only, no style definitions
// All styling handled via CSS variables in variables.css

/**
 * Theme Manager
 * Handles system theme detection, manual overrides, and theme application
 */
export const themeManager = {
  _currentTheme: 'light',
  _override: null,
  _callbacks: [],

  // Expose override for settings UI
  get override() {
    return this._override;
  },

  /**
   * Initialize theme system
   * Detects system theme, loads saved override, applies theme
   */
  async init() {
    try {
      // Load saved override if exists
      if (window.electronAPI && window.electronAPI.theme) {
        const overrideResult = await window.electronAPI.theme.getOverride();
        if (overrideResult.success && overrideResult.themeOverride) {
          this._override = overrideResult.themeOverride;
        }

        // Listen for system theme changes
        window.electronAPI.theme.onChanged((theme) => {
          if (!this._override) {
            this._applyTheme(theme);
          }
        });
      }

      // Get initial theme
      let initialTheme = 'light';
      if (this._override) {
        initialTheme = this._override;
      } else if (window.electronAPI && window.electronAPI.theme) {
        const systemResult = await window.electronAPI.theme.getSystemTheme();
        if (systemResult.success) {
          initialTheme = systemResult.theme;
        }
      } else {
        // Fallback to matchMedia
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
      }

      this._applyTheme(initialTheme);
    } catch (err) {
      console.error('Theme manager initialization error:', err);
      this._applyTheme('light'); // Fallback to light
    }
  },

  /**
   * Get current theme
   * @returns {string} 'light' or 'dark'
   */
  getCurrentTheme() {
    return this._currentTheme;
  },

  /**
   * Set theme manually (override system)
   * @param {string} theme - 'light' or 'dark'
   */
  async setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme);
      return;
    }

    this._override = theme;

    // Save override via IPC
    if (window.electronAPI && window.electronAPI.theme) {
      try {
        await window.electronAPI.theme.setOverride(theme);
      } catch (err) {
        console.error('Failed to save theme override:', err);
      }
    }

    this._applyTheme(theme);
  },

  /**
   * Follow system theme (remove override)
   */
  async followSystem() {
    this._override = null;

    // Clear override in config
    if (window.electronAPI && window.electronAPI.theme) {
      try {
        await window.electronAPI.theme.setOverride(null);
      } catch (err) {
        console.error('Failed to clear theme override:', err);
      }
    }

    // Get current system theme and apply
    let systemTheme = 'light';
    if (window.electronAPI && window.electronAPI.theme) {
      const result = await window.electronAPI.theme.getSystemTheme();
      if (result.success) {
        systemTheme = result.theme;
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      systemTheme = prefersDark ? 'dark' : 'light';
    }

    this._currentTheme = systemTheme;
    this._applyTheme(systemTheme);
  },

  /**
   * Listen for theme changes
   * @param {Function} callback - Called with (theme) when theme changes
   */
  onThemeChange(callback) {
    if (typeof callback === 'function') {
      this._callbacks.push(callback);
    }
  },

  /**
   * Apply theme to document
   * @private
   * @param {string} theme - 'light' or 'dark'
   */
  _applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }

    this._currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // Notify callbacks
    this._callbacks.forEach(callback => {
      try {
        callback(theme);
      } catch (err) {
        console.error('Theme change callback error:', err);
      }
    });
  }
};

