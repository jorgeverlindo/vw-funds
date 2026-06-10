/**
 * dealerBackgroundGenerator.ts
 *
 * Per-template CLEAN background generation for the DEALER BACKGROUND FLOW.
 *
 * ⚠️  ISOLATION RULES:
 *   - Only used by the full_dealer_bg agent flow in ProjectAgentPane.tsx
 *   - NO connection to Inventory AI Config
 *   - NO connection to RideNow catalog backgrounds
 *
 * ARCHITECTURE (no car duplication):
 *   - This module produces CLEAN dealer scenes — NO car baked in
 *   - JellyBeanCard handles the car overlay via CSS (single source of truth)
 *   - Each template format gets its own aspect-ratio-correct clean background
 *
 * FLOW:
 *   Phase 1 (fast preview, ~30s): called at tool time
 *     → 1 Replicate call on dealer photo
 *     → returns clean_bg_url for canvas preview composite
 *
 *   Phase 2 (post-approval, parallel): called after user approves
 *     → N parallel Replicate calls (one per selected template format)
 *     → each returns a clean background at the correct aspect ratio
 *     → stored in bgImages[key] — no car, no duplication
 */

// ─── Template format configuration ───────────────────────────────────────────
//
// TemplateZones encodes the EXACT layout of each JellyBeanCard format so Flux
// Kontext can generate backgrounds that are already composition-aware:
//   • groundStartPct  — where the asphalt must start being visible (from top)
//   • textHeightPct   — bottom text block height (price / term / label)
//   • textWidthPct    — text block width (full width for normal; left ~48% for wide)
//   • carWidthPct     — fraction of width reserved for the vehicle
//   • topBarPct       — top bar height (Make Dealer + OEM logo)
//
// Values are derived from JellyBeanCard layout constants:
//   isWide = ar > 2.0
//   barPadV = h * 0.045  → top bar total ≈ h * 0.26
//   Normal text block = h * 0.04 + label + h * 0.14 + term + h * 0.06 ≈ h * 0.38
//   Wide text block (left 48%) ≈ h * 0.30
//   Car zone normal: width = 75%, height = 52%, bottom ≈ 26%
//   Car zone wide:   width = 55%, height = 90%, right-aligned

interface TemplateZones {
  /** Y fraction from top where flat asphalt must begin. */
  groundStartPct: number;
  /** Fraction of height for the bottom price/term text block. */
  textHeightPct: number;
  /** Fraction of width the text block occupies (1.0 = full width; 0.48 = left side for wide). */
  textWidthPct: number;
  /** Fraction of width for the vehicle landing zone. */
  carWidthPct: number;
  /** Fraction of height used by the top bar (Make Dealer + logo). */
  topBarPct: number;
}

interface TemplateFormatConfig {
  key: string;
  width: number;
  height: number;
  /** Derived from zones — passed directly to the Flux Kontext prompt. */
  compositionInstruction: string;
  /** true = car on the RIGHT (wide banners); false = car centred (normal/square/portrait). */
  carOnRight: boolean;
  zones: TemplateZones;
}

// ─── Zone → prompt builder ────────────────────────────────────────────────────

function pct(n: number): string { return `${Math.round(n * 100)}%`; }

function buildZoneInstruction(
  width: number,
  height: number,
  carOnRight: boolean,
  z: TemplateZones,
): string {
  const ar  = width / height;
  const fmt = `${width}×${height}`;

  if (carOnRight) {
    // Wide layout: car RIGHT, text BOTTOM-LEFT
    return (
      `${fmt} ultra-wide banner (${ar.toFixed(1)}:1 aspect ratio). ` +
      `ZONE MAP — follow precisely: ` +

      `TOP BAR (top ${pct(z.topBarPct)} of height, full width): ` +
      `must be open sky, light clouds, or neutral gradient — ` +
      `white dealer name and OEM logo overlay this band. ` +

      `BACKDROP ZONE (upper ${pct(1 - z.textHeightPct)} of LEFT ${pct(1 - z.carWidthPct)} width): ` +
      `building facade, atmospheric depth, receding perspective — ` +
      `no strong dark vertical elements that clash with white text at bottom-left. ` +

      `PRICE ZONE (bottom-left ${pct(z.textWidthPct)} width × bottom ${pct(z.textHeightPct)} height): ` +
      `COMPLETELY CLEAR — no pavement markings, no poles, no visual clutter; ` +
      `white offer price and terms overlay this exact area. ` +

      `CAR ZONE (right ${pct(z.carWidthPct)} width, bottom ${pct(1 - z.topBarPct)} height): ` +
      `FLAT OPEN ASPHALT, no objects, no parked cars, no obstacles — ` +
      `a vehicle will be placed on this ground plane. ` +

      `HORIZON: must sit at or below ${pct(z.groundStartPct)} from top — ` +
      `the compressed height of this format requires a clearly readable ground band.`
    );
  } else {
    // Normal / square / portrait: car CENTRED, text at bottom full-width
    return (
      `${fmt} advertising format (${ar.toFixed(2)}:1 aspect ratio). ` +
      `ZONE MAP — follow precisely: ` +

      `TOP BAR (top ${pct(z.topBarPct)} of height, full width): ` +
      `open sky or neutral gradient — white dealer name and OEM logo appear here. ` +

      `BACKDROP ZONE (top ${pct(z.groundStartPct)} of full width): ` +
      `building facade with architectural detail and signage preserved; ` +
      `sky above the horizon line. ` +

      `CAR ZONE (centre ${pct(z.carWidthPct)} width, ` +
      `${pct(z.groundStartPct)}–${pct(1 - z.textHeightPct)} of height): ` +
      `FLAT OPEN ASPHALT, completely clear for vehicle placement — ` +
      `no parked cars, no obstacles, no kerbs, no bollards. ` +

      `PRICE ZONE (bottom ${pct(z.textHeightPct)} of height, full width): ` +
      `COMPLETELY CLEAR — no objects, no strong colour gradients; ` +
      `white price text and lease terms overlay this entire bottom band. ` +

      `GROUND PLANE: continuous flat asphalt from ${pct(z.groundStartPct)} down to the price zone boundary; ` +
      `this is the visual surface the vehicle will sit on.`
    );
  }
}

// ─── Helper: create a config entry ───────────────────────────────────────────

function cfg(
  key: string,
  width: number,
  height: number,
  carOnRight: boolean,
  zones: TemplateZones,
): TemplateFormatConfig {
  return { key, width, height, carOnRight, zones,
    compositionInstruction: buildZoneInstruction(width, height, carOnRight, zones) };
}

// ─── Config table ─────────────────────────────────────────────────────────────
//
// groundStartPct calibration:
//   Wide (compressed height): 0.30 — horizon must be very low
//   Normal 1.2:1, 4:3, 1:1  : 0.60 — building fills upper 60%, asphalt lower 40%
//   Portrait 9:16             : 0.55 — taller format, generous sky above the ground

const TEMPLATE_FORMAT_CONFIGS: TemplateFormatConfig[] = [

  // ── Wide banners (car RIGHT, text BOTTOM-LEFT) ──────────────────────────────
  cfg("website-2000x500", 2000, 500, true, {
    groundStartPct: 0.30, textHeightPct: 0.30, textWidthPct: 0.48,
    carWidthPct: 0.55, topBarPct: 0.10,
  }),
  cfg("display-970x250", 970, 250, true, {
    groundStartPct: 0.30, textHeightPct: 0.30, textWidthPct: 0.48,
    carWidthPct: 0.55, topBarPct: 0.10,
  }),

  // ── Normal / square (car CENTRED) ───────────────────────────────────────────
  cfg("display-300x250", 300, 250, false, {
    groundStartPct: 0.60, textHeightPct: 0.38, textWidthPct: 1.0,
    carWidthPct: 0.75, topBarPct: 0.26,
  }),
  cfg("social-1080x1080", 1080, 1080, false, {
    groundStartPct: 0.60, textHeightPct: 0.38, textWidthPct: 1.0,
    carWidthPct: 0.75, topBarPct: 0.26,
  }),
  cfg("website-600x450", 600, 450, false, {
    groundStartPct: 0.60, textHeightPct: 0.38, textWidthPct: 1.0,
    carWidthPct: 0.75, topBarPct: 0.26,
  }),

  // ── Portrait / story (car CENTRED, more ground visible) ─────────────────────
  cfg("website-600x1067", 600, 1067, false, {
    groundStartPct: 0.55, textHeightPct: 0.28, textWidthPct: 1.0,
    carWidthPct: 0.80, topBarPct: 0.12,
  }),

  // ── Multi-product (3 vehicles side-by-side) ──────────────────────────────────
  // These use a different JellyBeanCard variant — the ground must be wide and flat
  // so three vehicles can be placed across the frame simultaneously.
  cfg("website-1969x1080", 1969, 1080, false, {
    groundStartPct: 0.65, textHeightPct: 0.28, textWidthPct: 1.0,
    carWidthPct: 0.95, topBarPct: 0.10,
  }),
];

// ─── Load image helper ────────────────────────────────────────────────────────

async function loadImg(src: string): Promise<HTMLImageElement> {
  let objectUrl: string | null = null;
  try {
    if (!src.startsWith('data:')) {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`fetch failed (${res.status})`);
      objectUrl = URL.createObjectURL(await res.blob());
    }
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = objectUrl ?? src;
    });
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

// ─── Crop to aspect ratio ─────────────────────────────────────────────────────

/**
 * Center-crop the dealer photo to the target aspect ratio.
 * Output is capped at 1280px on the longest side (Replicate img2img preserves input dimensions,
 * so this controls the output size too).
 * Returns JPEG data URL.
 */
async function cropToAspectRatio(
  srcDataUrl: string,
  targetW: number,
  targetH: number,
): Promise<string> {
  const img = await loadImg(srcDataUrl);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const targetAr = targetW / targetH;
  const srcAr    = srcW   / srcH;

  let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
  if (srcAr > targetAr) {
    cropW = Math.round(srcH * targetAr);
    cropX = Math.round((srcW - cropW) / 2);
  } else {
    cropH = Math.round(srcW / targetAr);
    cropY = Math.round((srcH - cropH) * 0.35);
  }

  // Cap at 1280px — Flux Kontext img2img preserves input dimensions
  const maxDim = 1280;
  const scale  = Math.min(1, maxDim / Math.max(targetW, targetH));
  const outW   = Math.round(targetW * scale);
  const outH   = Math.round(targetH * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', 0.88);
}

// ─── Single clean background generation ──────────────────────────────────────

/**
 * Generate ONE clean background for a specific template format.
 *
 * IMPORTANT: Returns a clean scene with NO vehicle baked in.
 * JellyBeanCard handles the car overlay via CSS — this function must NOT
 * add any car to the image, or duplication will occur.
 */
async function generateCleanBackground(
  dealerImageDataUrl: string,
  config: TemplateFormatConfig,
): Promise<string> {
  const { generateImage } = await import('./replicateClient');

  // Crop dealer photo to this format's aspect ratio
  // Flux Kontext img2img preserves input dimensions → output will match this aspect ratio
  const croppedBg = await cropToAspectRatio(dealerImageDataUrl, config.width, config.height);

  // Pass 1 prompt: build a proper advertising ground plane, not just "clean"
  // Key insight: Flux Kontext needs explicit instructions to BUILD the surface,
  // not just remove objects. The ground plane is the "landing zone" for the vehicle.
  // DO NOT mention vehicles — Flux Kontext will add them if prompted.
  const cleanPrompt =
    `Transform this ${config.width}×${config.height} dealership photograph into a ` +
    `professional advertising background. ` +
    config.compositionInstruction +
    `\n\nSTEP 1 — CLEAR: Remove ALL parked vehicles, people, and objects from the ` +
    `foreground parking area. ` +
    `\nSTEP 2 — BUILD GROUND PLANE: The lower 40% of the image (from 60% height to the bottom) ` +
    `must be a CLEAR, OPEN asphalt or concrete surface with NO objects, NO parked cars, NO clutter. ` +
    `The ground plane must start visibly at approximately 60% from the top of the frame — ` +
    `this is where the vehicle's tires will land in the final advertisement. ` +
    `Use a natural camera perspective (eye-level, ~1.5m height) so the ground recedes naturally. ` +
    `The asphalt should be wide, clean, and clearly separated from the building backdrop above. ` +
    `Match existing pavement color and texture. ` +
    `\nSTEP 3 — PRESERVE EXACTLY: The building facade, sky, all signage, brand names, ` +
    `logos, and text on the building must be preserved PIXEL-PERFECT — same colors, same details, ` +
    `same spelling. Do NOT regenerate, alter, or obscure any brand name or letter on the building. ` +
    `\nDO NOT add vehicles, people, or new objects. ` +
    `Output: same location, professionally cleared foreground with correct perspective ground plane.`;

  try {
    return await generateImage({ prompt: cleanPrompt, inputImage: croppedBg });
  } catch {
    // Fallback: return the cropped original (some templates might fail)
    return croppedBg;
  }
}

// ─── Vehicle description type ─────────────────────────────────────────────────

export interface VehicleDesc {
  year: string;
  make: string;
  model: string;
  trim: string;
  /** offer ID — used as key in composites dict */
  offerId: string;
}

// ─── Car placement prompt builder ─────────────────────────────────────────────

/**
 * Build the Flux Kontext prompt that adds a vehicle to a clean dealer background.
 *
 * Core principle: one single Flux Kontext img2img call handles EVERYTHING —
 * correct perspective (model reads the bg), lighting harmony, shadow, ground
 * reflection. No canvas, no masks, no second model.
 */
function buildCarPlacementPrompt(
  vehicle: VehicleDesc,
  config: TemplateFormatConfig,
): string {
  const car = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;

  const placement = config.carOnRight
    ? `Position the vehicle on the RIGHT SIDE of the image in a three-quarter front-left view. ` +
      `The LEFT ${Math.round((1 - (config.width > config.height ? 0.55 : 0.5)) * 100)}% ` +
      `must remain completely clear — it will hold advertising text.`
    : `Position the vehicle centered in the foreground, three-quarter front-left view. ` +
      `The lower 30% of the image will hold text — ensure the vehicle sits above this zone.`;

  return (
    `Add a single ${car} to this cleared dealership parking area. ` +
    `${placement} ` +
    `\n\nVEHICLE PLACEMENT: Park it firmly on the asphalt with all four tires touching the ground. ` +
    `Scale it naturally for this scene — it should look parked here, not pasted. ` +
    `\n\nLIGHTING: Match the vehicle's lighting precisely to the scene. ` +
    `Same light direction, same color temperature, same intensity. ` +
    `The vehicle's paint and glass should reflect the environment realistically. ` +
    `\n\nSHADOW: Cast a soft, realistic shadow on the asphalt under the vehicle, ` +
    `following the existing light direction in the scene. ` +
    `\n\nREFLECTIONS: Add subtle asphalt reflections of the vehicle's lower body. ` +
    `\n\nPRESERVE EXACTLY: Building facade, sky, signage, trees, all background elements ` +
    `must remain pixel-perfect unchanged. Only add the vehicle + shadow + reflections. ` +
    `\n\nResult: professional automotive advertising photograph, commercial quality.`
  );
}

// ─── Single composite generation ──────────────────────────────────────────────

/**
 * Generate ONE composite for a specific vehicle + template format.
 *
 * Calls Flux Kontext img2img with a descriptive prompt.
 * The model handles perspective, lighting, shadow, and reflections in one pass.
 */
export async function generateOfferComposite(
  cleanBgDataUrl: string,
  vehicle: VehicleDesc,
  config: TemplateFormatConfig,
): Promise<string> {
  const { generateImage } = await import('./replicateClient');
  const prompt = buildCarPlacementPrompt(vehicle, config);
  return generateImage({ prompt, inputImage: cleanBgDataUrl });
}

// ─── Phase 1 public API ───────────────────────────────────────────────────────

/**
 * Phase 1a — Generate a single clean preview background (~30s).
 * Returns a 600×450 clean scene — no vehicle.
 */
export async function generatePreviewBackground(
  dealerImageDataUrl: string,
): Promise<string> {
  return generateCleanBackground(dealerImageDataUrl, {
    key: "website-600x450",
    width: 600, height: 450,
    compositionInstruction:
      "Standard 4:3 advertising format. Center: clean open ground for hero vehicle. " +
      "Building fills upper 40% as atmospheric backdrop.",
    carOnRight: false,
  });
}

/**
 * Phase 1b — Add the primary vehicle to the clean preview background (~30s).
 *
 * Replaces the old canvas + Flux Fill Pro pipeline.
 * Flux Kontext handles perspective, lighting, shadow, and reflections in one pass.
 * Result is shown in the approval card.
 */
export async function generatePreviewComposite(
  cleanBgDataUrl: string,
  primaryVehicle: VehicleDesc,
): Promise<string> {
  try {
    return await generateOfferComposite(cleanBgDataUrl, primaryVehicle, {
      key: "website-600x450",
      width: 600, height: 450,
      compositionInstruction: "",
      carOnRight: false,
    });
  } catch {
    return cleanBgDataUrl; // fallback: show clean bg without car
  }
}

// ─── Outpainting helpers (dealer bg flow only) ───────────────────────────────

/**
 * Sample the average colour of a rectangular region in a canvas.
 */
function sampleRegionColor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
): string {
  const d = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data;
  let r = 0, g = 0, b = 0;
  const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; }
  return `rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`;
}

/**
 * Pad a clean 4:3 background to the target aspect ratio.
 *
 * KEY IMPROVEMENTS over the previous edge-stretch approach:
 *
 * 1. SCALE-DOWN — building occupies only a fraction of the target frame height
 *    instead of trying to fill it. This matches how Gemini "zooms out" the
 *    building to leave generous sky and foreground space.
 *    • Wide (4:1): building at 40% of frame height
 *    • Portrait (9:16): building at 32% of frame height (lots of sky + asphalt)
 *    • Square / standard: building at 55% of frame height
 *
 * 2. SMART VERTICAL POSITIONING
 *    • Wide: building vertically centred
 *    • Portrait: building starts at 33% from top → sky above, foreground below
 *    • Square: building starts at 20% from top
 *
 * 3. COLOUR-SAMPLED FILL instead of edge-stretch
 *    Sky area above the building → sampled sky colour from source top
 *    Asphalt area below the building → sampled asphalt colour from source bottom
 *    Side areas → gradient blend from the sampled edge
 *    This gives Flux Fill Pro a coherent "blank canvas" to paint over.
 */
async function padToTargetRatio(
  cleanBgDataUrl: string,
  targetW: number,
  targetH: number,
): Promise<{ paddedDataUrl: string; maskDataUrl: string }> {
  const img = await loadImg(cleanBgDataUrl);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const ar   = targetW / targetH;

  // ── Output dimensions (capped at 1280px longest side) ────────────────────
  const maxDim    = 1280;
  const sf        = Math.min(1, maxDim / Math.max(targetW, targetH));
  const outW      = Math.round(targetW * sf);
  const outH      = Math.round(targetH * sf);

  // ── Building fill-fraction and vertical anchor per format ─────────────────
  // fillH: what fraction of outH the building occupies
  // imgY: where the building starts (from top of canvas)
  let fillH: number;
  let imgY: number;
  if (ar > 2.0) {
    // Ultra-wide — building takes 40% of height, centred vertically
    fillH = 0.40;
    imgY  = Math.round((outH - outH * fillH) / 2);
  } else if (ar < 0.7) {
    // Portrait — building takes 32% of height, placed at 33% from top
    fillH = 0.32;
    imgY  = Math.round(outH * 0.33);
  } else {
    // Square / standard — building takes 55%, placed at 20% from top
    fillH = 0.55;
    imgY  = Math.round(outH * 0.20);
  }

  const targetImgH = Math.round(outH * fillH);
  const targetImgW = Math.round(targetImgH * srcW / srcH);
  const imgW = Math.min(targetImgW, outW);
  const imgH = Math.round(imgW * srcH / srcW);
  const imgX = Math.round((outW - imgW) / 2);

  // ── Sample colours from the source image ─────────────────────────────────
  const sampleC = document.createElement('canvas');
  sampleC.width = srcW; sampleC.height = srcH;
  const sCtx = sampleC.getContext('2d')!;
  sCtx.drawImage(img, 0, 0, srcW, srcH);

  const skyColor      = sampleRegionColor(sCtx, srcW * 0.2, 0,          srcW * 0.6, srcH * 0.15);
  const asphaltColor  = sampleRegionColor(sCtx, srcW * 0.2, srcH * 0.8, srcW * 0.6, srcH * 0.15);
  const leftEdgeColor = sampleRegionColor(sCtx, 0,          srcH * 0.3, srcW * 0.05, srcH * 0.4);
  const rightEdgeColor = sampleRegionColor(sCtx, srcW * 0.95, srcH * 0.3, srcW * 0.05, srcH * 0.4);

  // ── Build padded image ────────────────────────────────────────────────────
  const pc   = document.createElement('canvas');
  pc.width   = outW; pc.height = outH;
  const pCtx = pc.getContext('2d')!;

  // Sky fill (above the building area, plus top of side bands)
  pCtx.fillStyle = skyColor;
  pCtx.fillRect(0, 0, outW, imgY + Math.round(imgH * 0.15));

  // Asphalt fill (below the building area)
  pCtx.fillStyle = asphaltColor;
  pCtx.fillRect(0, imgY + Math.round(imgH * 0.85), outW, outH - imgY - Math.round(imgH * 0.85));

  // Building zone sides: gradient from sky→asphalt vertically
  if (imgX > 0) {
    // Left band
    const lg = pCtx.createLinearGradient(0, imgY, 0, imgY + imgH);
    lg.addColorStop(0, skyColor); lg.addColorStop(1, asphaltColor);
    pCtx.fillStyle = lg;
    pCtx.fillRect(0, imgY, imgX, imgH);
    // Right band
    const rg = pCtx.createLinearGradient(0, imgY, 0, imgY + imgH);
    rg.addColorStop(0, skyColor); rg.addColorStop(1, asphaltColor);
    pCtx.fillStyle = rg;
    pCtx.fillRect(imgX + imgW, imgY, outW - imgX - imgW, imgH);
  }

  // Subtle edge bleed: draw 8px of the actual source along each edge
  // so Flux has a colour-accurate starting point at the seams
  const bleed = 8;
  // Top of building → sky transition
  const topBleed = document.createElement('canvas');
  topBleed.width = imgW; topBleed.height = bleed;
  topBleed.getContext('2d')!.drawImage(img, 0, 0, srcW, 1, 0, 0, imgW, bleed);
  pCtx.globalAlpha = 0.5; pCtx.drawImage(topBleed, imgX, imgY - bleed); pCtx.globalAlpha = 1;

  // Bottom of building → asphalt transition
  const botBleed = document.createElement('canvas');
  botBleed.width = imgW; botBleed.height = bleed;
  botBleed.getContext('2d')!.drawImage(img, 0, srcH - 1, srcW, 1, 0, 0, imgW, bleed);
  pCtx.globalAlpha = 0.5; pCtx.drawImage(botBleed, imgX, imgY + imgH); pCtx.globalAlpha = 1;

  // Draw the source image
  pCtx.drawImage(img, imgX, imgY, imgW, imgH);

  const paddedDataUrl = pc.toDataURL('image/jpeg', 0.90);

  // ── Mask: white = generate, black = preserve original ─────────────────────
  const mc   = document.createElement('canvas');
  mc.width   = outW; mc.height = outH;
  const mCtx = mc.getContext('2d')!;

  mCtx.fillStyle = '#ffffff';
  mCtx.fillRect(0, 0, outW, outH);
  mCtx.fillStyle = '#000000';
  mCtx.fillRect(imgX, imgY, imgW, imgH);

  // Soft 16px feather so Flux blends the edges seamlessly
  const feather = 16;
  const edges = [
    [imgX, imgY, feather, imgH, true, false],           // left edge
    [imgX + imgW - feather, imgY, feather, imgH, false, false], // right edge (inverted)
    [imgX, imgY, imgW, feather, false, true],            // top edge
    [imgX, imgY + imgH - feather, imgW, feather, false, false], // bottom edge (inverted)
  ] as Array<[number, number, number, number, boolean, boolean]>;

  for (const [ex, ey, ew, eh, invert, isTop] of edges) {
    const g = isTop
      ? mCtx.createLinearGradient(ex, ey, ex, ey + eh)
      : ew < eh
        ? mCtx.createLinearGradient(ex, ey, ex + ew, ey)
        : mCtx.createLinearGradient(ex, ey, ex, ey + eh);
    if (invert) {
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#000000');
    } else {
      g.addColorStop(0, '#000000'); g.addColorStop(1, '#ffffff');
    }
    mCtx.fillStyle = g;
    mCtx.fillRect(ex, ey, ew, eh);
  }

  const maskDataUrl = mc.toDataURL('image/jpeg', 0.95);
  return { paddedDataUrl, maskDataUrl };
}

/**
 * Build the Flux Fill Pro outpainting prompt for a specific template format.
 *
 * KEY CHANGE: prompt is written as "the building is small in this frame, fill the
 * surrounding space naturally" rather than "expand from the edges". This matches
 * how Gemini produces clean results — the model understands it must generate
 * large areas of sky and asphalt around the existing building.
 */
function buildOutpaintPrompt(config: TemplateFormatConfig): string {
  const { width, height, zones: z } = config;
  const ar = width / height;

  const preserve =
    `The building in the centre of the image is real — preserve it EXACTLY: ` +
    `same signage, brand names, logos, colours, architectural details, pixel-perfect. ` +
    `Do NOT alter, regenerate or remove any text or logo on the building. ` +
    `Match the existing sky colour, light direction, and pavement texture seamlessly. ` +
    `No people. No parked cars in foreground. Photorealistic automotive advertising quality.`;

  const asphaltRule =
    `The foreground must be a wide, flat, empty asphalt or concrete surface — ` +
    `the same material visible at the bottom of the building — ` +
    `completely clear, no curbs, no bollards, no markings. ` +
    `A vehicle will be placed here in post-production.`;

  if (ar > 2.0) {
    return (
      `Automotive advertising background. The dealership building appears small ` +
      `in the centre of this ultra-wide ${width}×${height} frame. ` +
      `Fill the large empty areas: ` +
      `LEFT and RIGHT of the building — continue the building facade and parking-lot ` +
      `asphalt horizontally, keeping the same architectural style and lighting. ` +
      `The sky occupies the upper ~${Math.round(z.groundStartPct * 100)}% of the frame, ` +
      `continuous and photorealistic. ` +
      asphaltRule + ` ` +
      `The right ${Math.round(z.carWidthPct * 100)}% of the frame must be an open flat ground surface. ` +
      preserve
    );
  } else if (ar < 0.7) {
    return (
      `Automotive advertising background. The dealership building appears small ` +
      `in the centre of this tall portrait ${width}×${height} frame. ` +
      `Fill the large empty areas: ` +
      `ABOVE the building — continue the clear blue sky, matching the existing sky colour exactly. ` +
      `BELOW the building — generate a very large, wide, flat concrete or asphalt parking lot ` +
      `that fills the lower ~${Math.round((1 - z.groundStartPct) * 100)}% of the frame completely. ` +
      `The ground surface must be perfectly flat, uniform, and extend to all edges. ` +
      asphaltRule + ` ` +
      preserve
    );
  } else {
    return (
      `Automotive advertising background. The dealership building appears in the ` +
      `upper portion of this ${width}×${height} frame. ` +
      `Fill the surrounding empty areas: ` +
      `SKY above the building — continue the existing sky naturally. ` +
      `ASPHALT below — a wide flat parking lot fills the lower ` +
      `~${Math.round((1 - z.groundStartPct) * 100)}% of the frame. ` +
      asphaltRule + ` ` +
      preserve
    );
  }
}

/**
 * Generate one background for a specific template by outpainting the clean base.
 *
 * Flow: clean 4:3 base → pad to target AR → Flux Fill Pro fills new areas.
 * The model extends sky, building, and asphalt coherently for each aspect ratio.
 */
async function outpaintForFormat(
  cleanBaseBgDataUrl: string,
  config: TemplateFormatConfig,
): Promise<string> {
  const { inpaintImage } = await import('./replicateClient');
  const { paddedDataUrl, maskDataUrl } = await padToTargetRatio(
    cleanBaseBgDataUrl, config.width, config.height,
  );
  try {
    return await inpaintImage({
      compositeDataUrl: paddedDataUrl,
      maskDataUrl,
      prompt: buildOutpaintPrompt(config),
    });
  } catch {
    return paddedDataUrl; // fallback: padded image without Fill Pro
  }
}

// ─── Phase 2 public API ───────────────────────────────────────────────────────

/**
 * Phase 2a — Outpaint the clean base background for every selected template.
 *
 * Takes the ALREADY-CLEAN 4:3 background (from Phase 1a) and outpaints it
 * to the correct aspect ratio for each template using Flux Fill Pro.
 * Each output is a full-scene background ready for vehicle compositing.
 *
 * @param cleanBaseBgDataUrl  Clean 4:3 background URL from Phase 1a
 * @param selectedTemplateKeys  KNOWN_SIZES keys to generate (empty = all)
 * @param onProgress  optional callback as each format completes
 */
export async function generateDealerBackgroundsForTemplates(
  cleanBaseBgDataUrl: string,
  selectedTemplateKeys: string[] = [],
  onProgress?: (key: string) => void,
): Promise<Record<string, string>> {
  const configs = selectedTemplateKeys.length > 0
    ? TEMPLATE_FORMAT_CONFIGS.filter(c => selectedTemplateKeys.includes(c.key))
    : TEMPLATE_FORMAT_CONFIGS;

  if (configs.length === 0) return {};

  const results = await Promise.allSettled(
    configs.map(async (config) => {
      const url = await outpaintForFormat(cleanBaseBgDataUrl, config);
      onProgress?.(config.key);
      return { key: config.key, url };
    }),
  );

  const bgImages: Record<string, string> = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      bgImages[result.value.key] = result.value.url;
    }
  }
  return bgImages;
}

/**
 * Phase 2b — Generate per-offer × per-template composites in parallel.
 *
 * For each (vehicle, template) pair: one Flux Kontext call adds the vehicle
 * to the pre-generated clean bg with correct lighting, shadow, and perspective.
 *
 * Returns: Record<offerId, Record<templateKey, compositeUrl>>
 *
 * @param cleanBgImages  templateKey → clean bg URL (from Phase 2a)
 * @param vehicles       list of offers to generate composites for
 * @param onProgress     called as each composite finishes
 */
export async function generateAllComposites(
  cleanBgImages: Record<string, string>,
  vehicles: VehicleDesc[],
  onProgress?: (offerId: string, templateKey: string) => void,
): Promise<Record<string, Record<string, string>>> {
  const results: Record<string, Record<string, string>> = {};
  for (const v of vehicles) results[v.offerId] = {};

  const tasks = vehicles.flatMap(vehicle =>
    TEMPLATE_FORMAT_CONFIGS
      .filter(c => cleanBgImages[c.key])
      .map(config => async () => {
        try {
          const url = await generateOfferComposite(cleanBgImages[c.key], vehicle, config);
          results[vehicle.offerId][config.key] = url;
          onProgress?.(vehicle.offerId, config.key);
        } catch {
          // Do NOT store a fallback here. If Flux Kontext fails, leave this
          // key undefined in composites so JellyBeanCard falls back to the
          // CSS car overlay instead of showing a car-free background.
        }
      })
  );

  await Promise.allSettled(tasks.map(t => t()));
  return results;
}
