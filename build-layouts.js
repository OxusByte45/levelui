const pug = require('pug');
const fs = require('fs');
const path = require('path');

const options = {
  basedir: path.join(__dirname, 'layouts'),
  pretty: true
};

try {
  const html = pug.renderFile('./layouts/index.pug', options);
  const outputDir = './assets/html';
  const cssDir = './assets/css';
  
  // Create directories if they don't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }
  
  // Copy CodeMirror CSS files if they don't exist
  const codemirrorCss = path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css');
  const lintCss = path.join(__dirname, 'node_modules/codemirror/addon/lint/lint.css');
  const codemirrorDest = path.join(cssDir, 'codemirror.css');
  const lintDest = path.join(cssDir, 'lint.css');
  
  if (fs.existsSync(codemirrorCss) && !fs.existsSync(codemirrorDest)) {
    fs.copyFileSync(codemirrorCss, codemirrorDest);
  }
  if (fs.existsSync(lintCss) && !fs.existsSync(lintDest)) {
    fs.copyFileSync(lintCss, lintDest);
  }
  
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  console.log('✓ Layouts compiled successfully');
} catch (error) {
  console.error('✗ Error compiling layouts:', error.message);
  process.exit(1);
}

