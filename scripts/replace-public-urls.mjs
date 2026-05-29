/**
 * replace-public-urls.mjs
 * Replaces string literals that reference public/ image paths
 * (e.g. '/backgrounds/forest.jpg', '/cars/civic.png') with Cloudinary URLs
 * in all .ts / .tsx files under src/.
 *
 * Run: node scripts/replace-public-urls.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const SRC       = path.join(ROOT, 'src');
const MAP_FILE  = path.join(__dirname, 'cloudinary-public-map.json');

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

// Build a sorted list of URL keys (longest first to avoid partial replacement)
// Also add URL-encoded variants for paths that contain spaces / special chars
const rawKeys = Object.keys(map);
const keyVariants = []; // { pattern, url }
for (const key of rawKeys) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  keyVariants.push({ pattern: key,     url: map[key] });
  if (encoded !== key) {
    keyVariants.push({ pattern: encoded, url: map[key] });
  }
}
// Sort longest first to avoid partial matches
keyVariants.sort((a, b) => b.pattern.length - a.pattern.length);
const keys = keyVariants; // renamed below

// Escape for use in a regex
function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findSrc(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findSrc(full));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

let totalFiles = 0;
let totalReplaced = 0;

for (const file of findSrc(SRC)) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const { pattern, url: cloudUrl } of keys) {
    // Match the path inside single or double quotes
    const re = new RegExp(`(['"])${escRe(pattern)}\\1`, 'g');
    const next = src.replace(re, (_, q) => {
      changed = true;
      totalReplaced++;
      return `${q}${cloudUrl}${q}`;
    });
    src = next;
  }

  if (changed) {
    fs.writeFileSync(file, src, 'utf8');
    totalFiles++;
    console.log(`✅ ${path.relative(ROOT, file)}`);
  }
}

console.log(`\n─────────────────────────────────`);
console.log(`Files modified: ${totalFiles}`);
console.log(`URL strings replaced: ${totalReplaced}`);
