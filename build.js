const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const srcPath = path.join(__dirname, 'src', 'app.jsx');
const outPath = path.join(__dirname, 'public', 'app.bundle.js');

console.log('[BUILD] Compiling', srcPath, '->', outPath);

try {
  const code = fs.readFileSync(srcPath, 'utf8');
  const startTime = Date.now();
  const transformed = Babel.transform(code, {
    presets: [['react', { runtime: 'classic' }]],
    filename: 'app.jsx'
  }).code;

  fs.writeFileSync(outPath, transformed, 'utf8');
  const elapsed = Date.now() - startTime;
  console.log(`[BUILD] SUCCESS in ${elapsed}ms! Output size: ${(transformed.length / 1024).toFixed(1)} KB`);
} catch (err) {
  console.error('[BUILD] FAILED:');
  console.error(err.message);
  if (err.loc) {
    console.error(`Line: ${err.loc.line}, Column: ${err.loc.column}`);
    const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
    for (let i = Math.max(0, err.loc.line - 4); i < Math.min(lines.length, err.loc.line + 3); i++) {
      console.error(`${i + 1}: ${lines[i]}`);
    }
  }
  process.exit(1);
}
