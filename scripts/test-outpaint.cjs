/**
 * test-outpaint.cjs
 *
 * Tests the Flux Fill Pro outpainting pipeline for each template format.
 * Downloads a clean dealer background, pads it to each template AR,
 * calls Flux Fill Pro, and saves results to public/template-refs/outpainted/
 *
 * Usage: node scripts/test-outpaint.cjs [--key website-2000x500]
 *        (omit --key to generate all formats)
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const TOKEN = process.env.REPLICATE_API_TOKEN || require('fs').readFileSync(require('path').join(__dirname, '..', '.env.local'), 'utf8').match(/REPLICATE_API_TOKEN=(.+)/)?.[1]?.trim() || '';
const OUT_DIR = path.join(__dirname, '..', 'public', 'template-refs', 'outpainted');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Templates (mirrors TEMPLATE_FORMAT_CONFIGS) ───────────────────────────────
const TEMPLATES = [
  {
    key: 'website-2000x500',
    width: 2000, height: 500, carOnRight: true,
    zones: { topBarPct: 0.10, textHeightPct: 0.30, textWidthPct: 0.48, carWidthPct: 0.55, groundStartPct: 0.30 },
  },
  {
    key: 'display-970x250',
    width: 970, height: 250, carOnRight: true,
    zones: { topBarPct: 0.10, textHeightPct: 0.30, textWidthPct: 0.48, carWidthPct: 0.55, groundStartPct: 0.30 },
  },
  {
    key: 'display-300x250',
    width: 300, height: 250, carOnRight: false,
    zones: { topBarPct: 0.26, textHeightPct: 0.38, textWidthPct: 1.0,  carWidthPct: 0.75, groundStartPct: 0.60 },
  },
  {
    key: 'social-1080x1080',
    width: 1080, height: 1080, carOnRight: false,
    zones: { topBarPct: 0.26, textHeightPct: 0.38, textWidthPct: 1.0,  carWidthPct: 0.75, groundStartPct: 0.60 },
  },
  {
    key: 'website-600x450',
    width: 600, height: 450, carOnRight: false,
    zones: { topBarPct: 0.26, textHeightPct: 0.38, textWidthPct: 1.0,  carWidthPct: 0.75, groundStartPct: 0.60 },
  },
  {
    key: 'website-600x1067',
    width: 600, height: 1067, carOnRight: false,
    zones: { topBarPct: 0.12, textHeightPct: 0.28, textWidthPct: 1.0,  carWidthPct: 0.80, groundStartPct: 0.55 },
  },
];

// ── Fetch helpers ─────────────────────────────────────────────────────────────
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function fetchJson(url, opts) {
  const { method = 'GET', body, headers = {} } = opts || {};
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ── Padding + mask ────────────────────────────────────────────────────────────
async function padToTargetRatio(imgBuffer, targetW, targetH) {
  const src = await loadImage(imgBuffer);
  const srcW = src.width, srcH = src.height;

  const maxDim = 1280;
  const sf = Math.min(1, maxDim / Math.max(targetW, targetH));
  const outW = Math.round(targetW * sf);
  const outH = Math.round(targetH * sf);

  const fitScale = Math.min(outW / srcW, outH / srcH);
  const imgW = Math.round(srcW * fitScale);
  const imgH = Math.round(srcH * fitScale);
  const imgX = Math.round((outW - imgW) / 2);
  const imgY = Math.round((outH - imgH) / 2);

  // Padded image
  const pc = createCanvas(outW, outH);
  const pCtx = pc.getContext('2d');
  pCtx.fillStyle = '#888888';
  pCtx.fillRect(0, 0, outW, outH);

  // Edge stretch
  if (imgX > 0) {
    const lc = createCanvas(imgX, imgH);
    lc.getContext('2d').drawImage(src, 0, 0, 1, srcH, 0, 0, imgX, imgH);
    pCtx.drawImage(lc, 0, imgY);
    const rc = createCanvas(outW - imgX - imgW, imgH);
    if (rc.width > 0) {
      rc.getContext('2d').drawImage(src, srcW - 1, 0, 1, srcH, 0, 0, rc.width, imgH);
      pCtx.drawImage(rc, imgX + imgW, imgY);
    }
  }
  if (imgY > 0) {
    const tc = createCanvas(outW, imgY);
    tc.getContext('2d').drawImage(src, 0, 0, srcW, 1, 0, 0, outW, imgY);
    pCtx.drawImage(tc, 0, 0);
    const bc = createCanvas(outW, outH - imgY - imgH);
    if (bc.height > 0) {
      bc.getContext('2d').drawImage(src, 0, srcH - 1, srcW, 1, 0, 0, outW, bc.height);
      pCtx.drawImage(bc, 0, imgY + imgH);
    }
  }
  pCtx.drawImage(src, imgX, imgY, imgW, imgH);
  const paddedBuf = pc.toBuffer('image/jpeg', 90);

  // Mask
  const mc = createCanvas(outW, outH);
  const mCtx = mc.getContext('2d');
  mCtx.fillStyle = '#ffffff';
  mCtx.fillRect(0, 0, outW, outH);
  mCtx.fillStyle = '#000000';
  mCtx.fillRect(imgX, imgY, imgW, imgH);
  const maskBuf = mc.toBuffer('image/jpeg', 95);

  return { paddedBuf, maskBuf, outW, outH };
}

// ── Outpaint prompt ───────────────────────────────────────────────────────────
function buildOutpaintPrompt(tpl) {
  const { width, height, zones, carOnRight } = tpl;
  const ar = width / height;
  const z = zones;
  const preserve = `Preserve ALL building signage, brand names, logos EXACTLY as shown. Match existing lighting, sky colour, and pavement texture seamlessly. Photorealistic automotive advertising scene, no people, no parked cars in foreground.`;

  if (ar > 2.0) {
    return `Extend this dealership exterior scene to fill an ultra-wide ${width}×${height} advertising banner. Expand horizontally: continue the building facade and sky naturally on both sides. The bottom ${Math.round(z.textHeightPct*100)}% of the LEFT ${Math.round(z.textWidthPct*100)}% must be clear flat asphalt — no clutter. The RIGHT ${Math.round(z.carWidthPct*100)}% must have wide open flat asphalt for vehicle placement. Horizon line at or below ${Math.round(z.groundStartPct*100)}% from the top. ${preserve}`;
  } else if (ar < 0.7) {
    return `Extend this dealership exterior scene to fill a tall portrait ${width}×${height} advertising format. Above: add more sky matching existing colour. Below: MASSIVELY expand the concrete parking lot downward. The bottom ${Math.round((1-z.groundStartPct)*100)}% must be wide, completely flat asphalt — clean, no cars, no poles — vehicle will park here. Building in centre-upper portion. ${preserve}`;
  } else {
    return `Extend this dealership exterior scene to fill a ${width}×${height} advertising frame. Expand sky above and concrete/asphalt below as needed. The lower ${Math.round((1-z.groundStartPct)*100)}% must be flat, empty asphalt — no parked cars, no obstacles — vehicle landing zone. ${preserve}`;
  }
}

// ── Replicate Flux Fill Pro ───────────────────────────────────────────────────
async function callFluxFillPro(paddedBase64, maskBase64, prompt) {
  const body = await fetchJson('https://api.replicate.com/v1/models/black-forest-labs/flux-fill-pro/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: {
      input: {
        prompt,
        image: `data:image/jpeg;base64,${paddedBase64}`,
        mask:  `data:image/jpeg;base64,${maskBase64}`,
        output_format: 'jpg',
        output_quality: 90,
        steps: 28,
      },
    },
  });

  if (!body.id) throw new Error(`Prediction failed: ${JSON.stringify(body)}`);
  const id = body.id;

  // Poll
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await fetchJson(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (poll.status === 'succeeded') {
      const url = Array.isArray(poll.output) ? poll.output[0] : poll.output;
      return url;
    }
    if (poll.status === 'failed' || poll.status === 'canceled') {
      throw new Error(`Prediction ${poll.status}: ${poll.error}`);
    }
    process.stdout.write('.');
  }
  throw new Error('Timeout after 6 min');
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Clean Chapman Honda background (generated by Flux Kontext in a previous session)
// Using a publicly accessible clean dealer background for testing
const CLEAN_BASE_URL = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071536/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_300x250_1.png';

// Parse --key argument
const keyArg = process.argv.includes('--key')
  ? process.argv[process.argv.indexOf('--key') + 1]
  : null;

const templates = keyArg
  ? TEMPLATES.filter(t => t.key === keyArg)
  : TEMPLATES;

if (templates.length === 0) {
  console.error(`Unknown key: ${keyArg}`);
  process.exit(1);
}

(async () => {
  console.log(`\nDownloading clean base image…`);
  const baseBuffer = await fetchBuffer(CLEAN_BASE_URL);
  console.log(`✓ Base image loaded (${baseBuffer.length} bytes)\n`);

  for (const tpl of templates) {
    console.log(`\n── ${tpl.key}  (${tpl.width}×${tpl.height}) ──`);

    // 1. Pad to target AR
    const { paddedBuf, maskBuf, outW, outH } = await padToTargetRatio(baseBuffer, tpl.width, tpl.height);
    const paddedPath = path.join(OUT_DIR, `${tpl.key}_padded.jpg`);
    fs.writeFileSync(paddedPath, paddedBuf);
    const maskPath = path.join(OUT_DIR, `${tpl.key}_mask.jpg`);
    fs.writeFileSync(maskPath, maskBuf);
    console.log(`  ✓ Padded → ${outW}×${outH}  (saved: ${path.basename(paddedPath)})`);

    // 2. Call Flux Fill Pro
    console.log(`  ⟳ Flux Fill Pro outpainting…`);
    const prompt = buildOutpaintPrompt(tpl);
    const paddedBase64 = paddedBuf.toString('base64');
    const maskBase64   = maskBuf.toString('base64');

    const outUrl = await callFluxFillPro(paddedBase64, maskBase64, prompt);
    console.log(`\n  ✓ Done → ${outUrl}`);

    // 3. Download + save result
    const resultBuf = await fetchBuffer(outUrl);
    const outPath = path.join(OUT_DIR, `${tpl.key}.jpg`);
    fs.writeFileSync(outPath, resultBuf);
    console.log(`  ✓ Saved → ${outPath}`);
  }

  console.log('\n✅ All done → public/template-refs/outpainted/');
})().catch(err => { console.error('\n✗', err.message); process.exit(1); });
