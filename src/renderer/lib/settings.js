import { themeManager } from './theme-manager.js';

export function init(database, config) {
  const section = document.querySelector('section.settings');
  if (!section) return;
  
  // Settings initialization
  // This can be expanded to load/save settings

  // Initialize theme selector
  initThemeSelector();
}

/**
 * Initialize modern theme selector
 */
function initThemeSelector() {
  const themeButtons = document.querySelectorAll('.theme-selector .theme-option');
  if (!themeButtons.length) return;

  // Update active state based on current theme and override
  function updateActiveState() {
    const currentTheme = themeManager.getCurrentTheme();
    const hasOverride = themeManager.override !== null;
    
    themeButtons.forEach(button => {
      const theme = button.getAttribute('data-theme');
      let isActive = false;
      
      if (theme === 'system') {
        // System is active when no override is set
        isActive = !hasOverride;
      } else {
        // Light/Dark is active when override matches
        isActive = hasOverride && theme === currentTheme;
      }
      
      if (isActive) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
      }
    });
  }

  // Set initial state
  updateActiveState();

  // Listen for theme changes
  themeManager.onThemeChange(() => {
    updateActiveState();
  });

  // Handle button clicks
  themeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const theme = button.getAttribute('data-theme');
      
      if (theme === 'system') {
        await themeManager.followSystem();
      } else {
        await themeManager.setTheme(theme);
      }
      
      updateActiveState();
    });
  });
}

