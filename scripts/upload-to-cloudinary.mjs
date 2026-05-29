/**
 * upload-to-cloudinary.mjs
 * Uploads all image assets from src/assets to Cloudinary.
 * Saves a mapping file at scripts/cloudinary-map.json
 * Run: node scripts/upload-to-cloudinary.mjs
 */

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const ASSETS    = path.join(ROOT, 'src/assets');
const MAP_FILE  = path.join(__dirname, 'cloudinary-map.json');

cloudinary.config({
  cloud_name: 'dvq75cqna',
  api_key:    '738215759486667',
  api_secret: 'psrch0DFKrcgOK0wRBN0oCR3FPA',
  secure: true,
});

// Find all image files recursively
function findImages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(full));
    } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// Build a stable public_id from the asset path (no special chars)
function toPublicId(filePath) {
  const rel = path.relative(ASSETS, filePath);
  return 'vw-funds/' + rel
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')          // remove extension
    .replace(/[^a-zA-Z0-9/_-]/g, '_'); // sanitise chars
}

async function main() {
  // Load existing map if any (skip already-uploaded files)
  const existing = fs.existsSync(MAP_FILE)
    ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'))
    : {};

  const files = findImages(ASSETS);
  console.log(`Found ${files.length} image files. Starting upload...\n`);

  const map = { ...existing };
  let uploaded = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const file of files) {
    const relPath  = path.relative(ROOT, file).replace(/\\/g, '/');
    const publicId = toPublicId(file);

    if (map[relPath]) {
      skipped++;
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(file, {
        public_id:     publicId,
        overwrite:     false,
        resource_type: 'image',
        // Keep original quality — Cloudinary will serve optimised via f_auto/q_auto on the URL
      });
      map[relPath] = result.secure_url;
      uploaded++;
      console.log(`✅ ${relPath}`);
      console.log(`   → ${result.secure_url}\n`);
    } catch (err) {
      failed++;
      console.error(`❌ ${relPath}: ${err.message}`);
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));

  console.log('\n─────────────────────────────────');
  console.log(`Uploaded: ${uploaded}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`Map saved to: ${MAP_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
