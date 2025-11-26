// CodeMirror 6 initialization
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

let editors = new Map();

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

  // Define comprehensive syntax highlighting style for JSON
  // This is the standard CodeMirror 6 approach - works perfectly with Vite
  // Using HighlightStyle.define() is the recommended way for custom themes
  const jsonHighlightStyle = HighlightStyle.define([
    // JSON-specific highlighting
    { tag: tags.string, color: '#3c7cd4' },           // Blue for strings
    { tag: tags.number, color: '#164' },              // Green for numbers  
    { tag: tags.bool, color: '#219' },                // Purple for true/false
    { tag: tags.null, color: '#219' },                // Purple for null
    { tag: tags.propertyName, color: '#05a' },         // Blue for property keys
    { tag: tags.punctuation, color: '#999' },          // Gray for : , etc
    { tag: tags.bracket, color: '#999' },             // Gray for { }
    { tag: tags.squareBracket, color: '#999' },        // Gray for [ ]
    { tag: tags.operator, color: '#999' },            // Gray for operators
    // Fallback tags for better coverage
    { tag: tags.keyword, color: '#708' },             // Purple for keywords
    { tag: tags.variableName, color: '#333' },        // Dark gray for variables
    { tag: tags.definitionKeyword, color: '#708' },   // Purple for definition keywords
    { tag: tags.modifier, color: '#708' },            // Purple for modifiers
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

