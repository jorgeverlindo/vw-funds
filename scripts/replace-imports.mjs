/**
 * replace-imports.mjs
 * Replaces  `import X from '...assets/...(png|jpg|jpeg|webp|gif)'`
 * with       `const X = 'https://res.cloudinary.com/...'`
 * in all .ts / .tsx files under src/.
 *
 * Run: node scripts/replace-imports.mjs
 * Uses the map saved by upload-to-cloudinary.mjs.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const SRC       = path.join(ROOT, 'src');
const MAP_FILE  = path.join(__dirname, 'cloudinary-map.json');

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

// Build a lookup keyed by resolved absolute path → cloudinary URL
const absMap = {};
for (const [rel, url] of Object.entries(map)) {
  absMap[path.resolve(ROOT, rel)] = url;
}

// Find all .ts / .tsx source files
function findSrc(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findSrc(full));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

// Match:  import NAME from 'RELATIVE_PATH.ext'
//         import NAME from "RELATIVE_PATH.ext"
// Handles relative paths AND figma:asset/ protocol, with optional trailing comments
const IMPORT_RE = /^import\s+(\S+)\s+from\s+['"]([^'"]+\.(png|jpe?g|JPE?G|webp|gif|svg))['"];?(\s*\/\/.*)?$/gm;
// figma:asset/<hash>.<ext>  →  treated as src/assets/<hash>.<ext>
const FIGMA_RE  = /^import\s+(\S+)\s+from\s+['"]figma:asset\/([^'"]+)['"];?(\s*\/\/.*)?$/gm;

let totalFiles = 0;
let totalReplaced = 0;

for (const file of findSrc(SRC)) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Replace relative imports (../../assets/...)
  let newSrc = src.replace(IMPORT_RE, (match, varName, importPath) => {
    const abs = path.resolve(path.dirname(file), importPath);
    const url = absMap[abs];
    if (!url) return match;
    changed = true;
    totalReplaced++;
    return `const ${varName} = '${url}';`;
  });

  // 2. Replace figma:asset/<hash>.<ext> imports
  newSrc = newSrc.replace(FIGMA_RE, (match, varName, assetFile) => {
    const assetKey = path.join('src/assets', assetFile).replace(/\\/g, '/');
    const url = map[assetKey];
    if (!url) return match;
    changed = true;
    totalReplaced++;
    return `const ${varName} = '${url}';`;
  });

  if (changed) {
    fs.writeFileSync(file, newSrc, 'utf8');
    totalFiles++;
    const relFile = path.relative(ROOT, file);
    console.log(`✅ ${relFile}`);
  }
}

console.log(`\n─────────────────────────────────`);
console.log(`Files modified: ${totalFiles}`);
console.log(`Imports replaced: ${totalReplaced}`);
