// CodeMirror 6 initialization
// All colors from CSS variables - see variables.css
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { getSyntaxThemeVars } from './syntax-themes.js';

let editors = new Map();

/**
 * Get CSS variable value
 * @param {string} varName - CSS variable name (e.g., '--syntax-string')
 * @returns {string} CSS color value
 */
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim();
}

/**
 * Initialize CodeMirror editor on a textarea element
 * @param {HTMLTextAreaElement} textarea - The textarea element to replace
 * @param {object} options - Editor options
 */
export function initCodeMirror(textarea, options = {}) {
  if (!textarea || editors.has(textarea)) {
    return editors.get(textarea);
  }

  const parent = textarea.parentElement;
  if (!parent) {
    console.error('Textarea has no parent element');
    return null;
  }

  // Hide the original textarea
  textarea.style.display = 'none';

  // Get current app theme from data attribute
  const appTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const syntaxVars = getSyntaxThemeVars(appTheme);

  // Define comprehensive syntax highlighting style for JSON
  // All colors from CSS variables - automatically adapts to theme
  const jsonHighlightStyle = HighlightStyle.define([
    // JSON-specific highlighting - colors from CSS variables
    { tag: tags.string, color: getCSSVar(syntaxVars.string) },
    { tag: tags.number, color: getCSSVar(syntaxVars.number) },
    { tag: tags.bool, color: getCSSVar(syntaxVars.bool) },
    { tag: tags.null, color: getCSSVar(syntaxVars.null) },
    { tag: tags.propertyName, color: getCSSVar(syntaxVars.property) },
    { tag: tags.punctuation, color: getCSSVar(syntaxVars.punctuation) },
    { tag: tags.bracket, color: getCSSVar(syntaxVars.bracket) },
    { tag: tags.squareBracket, color: getCSSVar(syntaxVars.bracket) },
    { tag: tags.operator, color: getCSSVar(syntaxVars.operator) },
    // Fallback tags for better coverage
    { tag: tags.keyword, color: getCSSVar(syntaxVars.keyword) },
    { tag: tags.variableName, color: getCSSVar(syntaxVars.variable) },
    { tag: tags.definitionKeyword, color: getCSSVar(syntaxVars.keyword) },
    { tag: tags.modifier, color: getCSSVar(syntaxVars.keyword) },
  ]);

  // Create editor state with JSON language support
  const extensions = [
    lineNumbers({
      formatNumber: (lineNo) => lineNo.toString()
    }),
    keymap.of(defaultKeymap),
    json(), // This provides JSON language parsing
    syntaxHighlighting(jsonHighlightStyle), // This applies the highlighting
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Sync editor content to textarea
        const content = update.state.doc.toString();
        if (textarea.value !== content) {
          textarea.value = content;
          // Trigger input event for compatibility
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        }
      }
    })
  ];

  const state = EditorState.create({
    doc: textarea.value || '',
    extensions
  });

  // Create editor view
  const view = new EditorView({
    state,
    parent: parent
  });

  // Store reference
  editors.set(textarea, view);

  // Create a proxy for textarea.value to sync with editor
  const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  const textareaValue = {
    get() {
      return view.state.doc.toString();
    },
    set(newValue) {
      const currentValue = view.state.doc.toString();
      if (currentValue !== String(newValue || '')) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: String(newValue || '')
          }
        });
      }
      // Also set on original textarea for compatibility
      if (originalDescriptor && originalDescriptor.set) {
        originalDescriptor.set.call(this, newValue);
      }
    }
  };
  
  // Override value property
  try {
    Object.defineProperty(textarea, 'value', textareaValue);
  } catch (e) {
    console.warn('Could not override textarea.value property:', e);
  }

  return view;
}

/**
 * Initialize all CodeMirror editors on the page
 */
export function initAllCodeMirrors() {
  const textareas = document.querySelectorAll('textarea.codemirror');
  textareas.forEach(textarea => {
    initCodeMirror(textarea);
  });
}

/**
 * Get editor instance for a textarea
 */
export function getEditor(textarea) {
  return editors.get(textarea);
}

