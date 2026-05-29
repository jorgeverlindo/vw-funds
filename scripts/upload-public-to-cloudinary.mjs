/**
 * upload-public-to-cloudinary.mjs
 * Uploads all images from public/ to Cloudinary.
 * Saves mapping at scripts/cloudinary-public-map.json
 * Keys are the URL path as used in code, e.g. "/backgrounds/forest.jpg"
 * Run: node scripts/upload-public-to-cloudinary.mjs
 */

import { v2 as cloudinary } from 'cloudinary';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const PUBLIC    = path.join(ROOT, 'public');
const MAP_FILE  = path.join(__dirname, 'cloudinary-public-map.json');

cloudinary.config({
  cloud_name: 'dvq75cqna',
  api_key:    '738215759486667',
  api_secret: 'psrch0DFKrcgOK0wRBN0oCR3FPA',
  secure: true,
});

function findImages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findImages(full));
    else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) results.push(full);
  }
  return results;
}

function toPublicId(filePath) {
  const rel = path.relative(PUBLIC, filePath);
  return 'vw-funds/public/' + rel
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '_');
}

async function main() {
  const existing = fs.existsSync(MAP_FILE)
    ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'))
    : {};

  const files = findImages(PUBLIC);
  console.log(`Found ${files.length} image files in public/. Uploading...\n`);

  const map = { ...existing };
  let uploaded = 0, skipped = 0, failed = 0;

  for (const file of files) {
    // URL key as used in code: /backgrounds/forest.jpg
    const urlKey = '/' + path.relative(PUBLIC, file).replace(/\\/g, '/');
    const publicId = toPublicId(file);

    if (map[urlKey]) {
      skipped++;
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(file, {
        public_id:     publicId,
        overwrite:     false,
        resource_type: 'image',
      });
      map[urlKey] = result.secure_url;
      uploaded++;
      console.log(`✅ ${urlKey}`);
      console.log(`   → ${result.secure_url}\n`);
    } catch (err) {
      failed++;
      console.error(`❌ ${urlKey}: ${err.message}`);
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
  console.log(`\n─────────────────────────────────`);
  console.log(`Uploaded: ${uploaded}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`Map saved to: ${MAP_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
