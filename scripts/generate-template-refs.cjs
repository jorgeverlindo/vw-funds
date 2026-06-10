/**
 * generate-template-refs.js
 *
 * Generates one JPEG per ad template at its EXACT pixel dimensions,
 * showing the composition zones derived from TEMPLATE_FORMAT_CONFIGS:
 *
 *   • Sky/building backdrop  — where building + sky show through
 *   • Car landing zone       — where the vehicle will be placed
 *   • Text overlay zone      — where price/offer/term text renders
 *   • Top bar zone           — where Make Dealer + OEM logo render
 *
 * Output: public/template-refs/<key>.jpg
 *
 * Usage:  node scripts/generate-template-refs.js
 */

const { createCanvas } = require('@napi-rs/canvas');
const fs  = require('fs');
const path = require('path');

// ─── Template configs (mirrors src/lib/dealerBackgroundGenerator.ts) ─────────
const TEMPLATES = [
  {
    key: 'website-2000x500',
    width: 2000, height: 500,
    carOnRight: true,
    zones: { topBarPct: 0.10, textHeightPct: 0.30, textWidthPct: 0.48, carWidthPct: 0.55, groundStartPct: 0.30 },
  },
  {
    key: 'display-970x250',
    width: 970, height: 250,
    carOnRight: true,
    zones: { topBarPct: 0.10, textHeightPct: 0.30, textWidthPct: 0.48, carWidthPct: 0.55, groundStartPct: 0.30 },
  },
  {
    key: 'display-300x250',
    width: 300, height: 250,
    carOnRight: false,
    zones: { topBarPct: 0.26, textHeightPct: 0.38, textWidthPct: 1.0,  carWidthPct: 0.75, groundStartPct: 0.60 },
  },
  {
    key: 'social-1080x1080',
    width: 1080, height: 1080,
    carOnRight: false,
    zones: { topBarPct: 0.26, textHeightPct: 0.38, textWidthPct: 1.0,  carWidthPct: 0.75, groundStartPct: 0.60 },
  },
  {
    key: 'website-600x450',
    width: 600, height: 450,
    carOnRight: false,
    zones: { topBarPct: 0.26, textHeightPct: 0.38, textWidthPct: 1.0,  carWidthPct: 0.75, groundStartPct: 0.60 },
  },
  {
    key: 'website-600x1067',
    width: 600, height: 1067,
    carOnRight: false,
    zones: { topBarPct: 0.12, textHeightPct: 0.28, textWidthPct: 1.0,  carWidthPct: 0.80, groundStartPct: 0.55 },
  },
];

// ─── Colours ──────────────────────────────────────────────────────────────────
const CLR = {
  bg:       '#f2f1f6',  // overall background
  topBar:   'rgba(71,59,171,0.12)',  // top bar zone — brand tint
  backdrop: '#c8d8f0',  // building/sky backdrop zone — light blue
  ground:   '#e8f0e8',  // ground plane / car zone — light green
  car:      'rgba(71,59,171,0.10)', // car bounding area — purple tint
  text:     'rgba(0,0,0,0.08)',     // text zone — dark tint
  divider:  'rgba(0,0,0,0.12)',     // separator lines
  label:    'rgba(0,0,0,0.55)',     // zone label text
  labelBg:  'rgba(255,255,255,0.85)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function label(ctx, text, x, y, w, h, fontSize = 14) {
  const cx = x + w / 2, cy = y + h / 2;
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = 8;
  roundRect(ctx, cx - tw / 2 - pad, cy - fontSize / 2 - 4, tw + pad * 2, fontSize + 8, 4);
  ctx.fillStyle = CLR.labelBg;
  ctx.fill();
  ctx.fillStyle = CLR.label;
  ctx.fillText(text, cx - tw / 2, cy + fontSize * 0.35);
}

function hatch(ctx, x, y, w, h, color, spacing = 20) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -h; i < w + h; i += spacing) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

// ─── Draw one template ────────────────────────────────────────────────────────
function drawTemplate(tpl) {
  const { width: W, height: H, carOnRight, zones, key } = tpl;
  const { topBarPct, textHeightPct, textWidthPct, carWidthPct, groundStartPct } = zones;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Overall background ────────────────────────────────────────────────────
  ctx.fillStyle = CLR.bg;
  ctx.fillRect(0, 0, W, H);

  const topBarH  = Math.round(H * topBarPct);
  const textH    = Math.round(H * textHeightPct);
  const textW    = Math.round(W * textWidthPct);
  const carW     = Math.round(W * carWidthPct);
  const carX     = carOnRight ? W - carW : Math.round((W - carW) / 2);
  const groundY  = Math.round(H * groundStartPct);
  const fontSize = Math.max(10, Math.round(Math.min(W, H) * 0.025));

  if (carOnRight) {
    // ── Wide layout: backdrop on LEFT, car zone on RIGHT ───────────────────
    const backdropW = W - carW;

    // Backdrop (building/sky) — left portion, full height minus top bar
    ctx.fillStyle = CLR.backdrop;
    ctx.fillRect(0, topBarH, backdropW, H - topBarH - textH);

    // Hatch pattern on backdrop
    hatch(ctx, 0, topBarH, backdropW, H - topBarH - textH, 'rgba(255,255,255,0.3)', 30);

    // Ground plane in backdrop (below groundY)
    ctx.fillStyle = CLR.ground;
    ctx.fillRect(0, groundY, backdropW, H - groundY - textH);

    // Car zone — right portion
    ctx.fillStyle = CLR.car;
    ctx.fillRect(carX, topBarH, carW, H - topBarH);

    // Vertical divider
    ctx.strokeStyle = CLR.divider;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(carX, topBarH);
    ctx.lineTo(carX, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text zone — bottom left
    ctx.fillStyle = CLR.text;
    ctx.fillRect(0, H - textH, textW, textH);

    // Labels
    label(ctx, '🏢  BUILDING / SKY', 0, topBarH, backdropW, (H - topBarH - textH) / 2, fontSize);
    label(ctx, '🚗  CAR ZONE', carX, topBarH, carW, H - topBarH, fontSize);
    label(ctx, '💲  TEXT / PRICE ZONE', 0, H - textH, textW, textH, fontSize * 0.85);
    label(ctx, '🪟  GROUND PLANE', 0, groundY, backdropW, H - groundY - textH, fontSize * 0.85);

  } else {
    // ── Normal / square / portrait layout: car centered ───────────────────
    const carZoneTop    = groundY;
    const carZoneBottom = H - textH;
    const carZoneH      = carZoneBottom - carZoneTop;

    // Backdrop zone (top portion, full width)
    ctx.fillStyle = CLR.backdrop;
    ctx.fillRect(0, topBarH, W, groundY - topBarH);
    hatch(ctx, 0, topBarH, W, groundY - topBarH, 'rgba(255,255,255,0.3)', 30);

    // Ground / car zone (mid)
    ctx.fillStyle = CLR.ground;
    ctx.fillRect(0, groundY, W, carZoneH);

    // Car bounding box centered
    ctx.fillStyle = CLR.car;
    ctx.fillRect(carX, groundY, carW, carZoneH);

    // Text zone — bottom full width
    ctx.fillStyle = CLR.text;
    ctx.fillRect(0, H - textH, W, textH);

    // Horizontal dividers
    ctx.strokeStyle = CLR.divider;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    [[topBarH, 0, W], [groundY, 0, W], [H - textH, 0, W]].forEach(([y, x0, x1]) => {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Vertical car bounds
    ctx.strokeStyle = 'rgba(71,59,171,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    [carX, carX + carW].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, H - textH); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Labels
    label(ctx, '🏢  BUILDING / SKY BACKDROP', 0, topBarH, W, groundY - topBarH, fontSize);
    label(ctx, '🚗  CAR ZONE  (' + Math.round(carWidthPct * 100) + '% width, centred)', carX, groundY + Math.round(carZoneH * 0.2), carW, Math.round(carZoneH * 0.4), fontSize * 0.85);
    label(ctx, '🪨  GROUND PLANE (asphalt)', 0, groundY, W, Math.round(carZoneH * 0.3), fontSize * 0.8);
    label(ctx, '💲  PRICE / TERM TEXT ZONE', 0, H - textH, W, textH, fontSize);
  }

  // ── Top bar ───────────────────────────────────────────────────────────────
  ctx.fillStyle = CLR.topBar;
  ctx.fillRect(0, 0, W, topBarH);
  label(ctx, '🏷  MAKE DEALER + OEM LOGO  (top bar)', 0, 0, W, topBarH, Math.max(9, fontSize * 0.8));

  // ── Outer border ──────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(71,59,171,0.3)';
  ctx.lineWidth = 4;
  ctx.setLineDash([]);
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // ── Dimension label in corner ─────────────────────────────────────────────
  const dimText = `${W} × ${H}`;
  ctx.font = `700 ${Math.max(14, fontSize * 1.1)}px system-ui, sans-serif`;
  const dw = ctx.measureText(dimText).width;
  ctx.fillStyle = 'rgba(71,59,171,0.9)';
  roundRect(ctx, W - dw - 24, H - 38, dw + 20, 30, 6);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillText(dimText, W - dw - 14, H - 18);

  return canvas.toBuffer('image/jpeg', 92);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'template-refs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

TEMPLATES.forEach(tpl => {
  const buf = drawTemplate(tpl);
  const outPath = path.join(outDir, `${tpl.key}.jpg`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓  ${tpl.key}.jpg  (${tpl.width}×${tpl.height})`);
});

console.log('\nSaved to public/template-refs/');
