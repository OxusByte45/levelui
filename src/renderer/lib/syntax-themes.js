// Syntax Theme Configuration
// Maps syntax elements to CSS variable names
// All actual color values defined in variables.css

/**
 * Syntax theme variable mappings
 * These reference CSS variables that change based on [data-theme] attribute
 * No color values here - all colors come from CSS variables
 */
export const syntaxThemeVars = {
  light: {
    string: '--syntax-string',
    number: '--syntax-number',
    keyword: '--syntax-keyword',
    property: '--syntax-property',
    punctuation: '--syntax-punctuation',
    bool: '--syntax-bool',
    null: '--syntax-null',
    bracket: '--syntax-bracket',
    operator: '--syntax-operator',
    variable: '--syntax-variable'
  },
  dark: {
    // Same variable names - values change via [data-theme="dark"] in CSS
    string: '--syntax-string',
    number: '--syntax-number',
    keyword: '--syntax-keyword',
    property: '--syntax-property',
    punctuation: '--syntax-punctuation',
    bool: '--syntax-bool',
    null: '--syntax-null',
    bracket: '--syntax-bracket',
    operator: '--syntax-operator',
    variable: '--syntax-variable'
  }
};

/**
 * Get CSS variable mappings for current app theme
 * @param {string} appTheme - 'light' or 'dark'
 * @returns {Object} Variable name mappings
 */
export function getSyntaxThemeVars(appTheme) {
  return syntaxThemeVars[appTheme] || syntaxThemeVars.light;
}

