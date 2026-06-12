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
 * Build the Flux Kontext Pro prompt for a specific template format.
 *
 * Based on the Gemini visual guide:
 *   Wide (4:1, 3.9:1) → extend WALLS LATERALLY, keep anchor tower unchanged
 *   Tall portrait (9:16) → extend SKY above and GROUND below, walls unchanged
 *   Square / standard → moderate extension of sky and ground
 *
 * The blue tower with the brand logo is an UNALTERABLE ANCHOR in every format.
 * Brand text modules (e.g. "Chapman", "HONDA") stay on their walls at original size.
 */
function buildKontextPrompt(config: TemplateFormatConfig): string {
  const { width, height } = config;
  const ar = width / height;
  // Safe fallback zones when config is created inline without calling cfg()
  const z = config.zones ?? {
    groundStartPct: ar > 2.0 ? 0.30 : ar < 0.7 ? 0.55 : 0.60,
    textHeightPct: ar > 2.0 ? 0.30 : 0.38,
    textWidthPct: ar > 2.0 ? 0.48 : 1.0,
    carWidthPct: ar > 2.0 ? 0.55 : 0.75,
    topBarPct: ar > 2.0 ? 0.10 : 0.26,
  };

  const anchor =
    `UNALTERABLE ANCHOR — the central brand tower (cylindrical pillar, brand logo, brand name below it) ` +
    `must remain EXACTLY as shown: same position, same size, same colours, same logo, ` +
    `same text. Do NOT distort, resize, or alter any part of this anchor element. `;

  const wallText =
    `Brand text modules on the walls (dealer name left, brand name right, any wave or stripe graphics) ` +
    `must keep their original size and relative wall position. ` +
    `If walls extend, the text modules stay in place — the wall gets longer, not the text bigger. `;

  const clearForeground =
    `Remove ALL parked vehicles, people, and objects from the foreground. ` +
    `Do NOT add new vehicles, people, or objects. `;

  const preserveSignage =
    `Preserve ALL signage text exactly: same spelling, same colours, same font style. ` +
    `Do NOT alter, blur, or regenerate any text or logo on the building. `;

  // ── UNIFORM 3-BAND ANATOMY (every format) ────────────────────────────────
  // SKY (top)      → overlay zone for dealer name + brand logo
  // DEALERSHIP     → the building band, signage preserved
  // GROUND (bottom)→ wide open asphalt: the vehicle parks here AND the price
  //                  text overlays here. This band must be GENEROUS and start
  //                  at a consistent height so the client-side tire line
  //                  (wide 0.86 / normal 0.74 / portrait 0.76) always lands
  //                  on asphalt regardless of generation variation.
  const bands = ar > 2.0
    ? { sky: 25, buildingEnd: 50 }   // wide banners: ground = bottom 50%
    : ar < 0.7
      ? { sky: 35, buildingEnd: 60 } // portrait: ground = bottom 40%
      : { sky: 25, buildingEnd: 60 };// square/standard: ground = bottom 40%

  const anatomy =
    `COMPOSITION — exactly three horizontal bands, in this order: ` +
    `(1) SKY: the top ${bands.sky}% of the frame is clear open sky — ` +
    `uncluttered, no objects; the dealer name and brand logo will overlay this band. ` +
    `(2) DEALERSHIP: the building occupies the band between ${bands.sky}% and ${bands.buildingEnd}% ` +
    `of the frame height — full facade visible with all signage. ` +
    `(3) GROUND: everything below ${bands.buildingEnd}% — the bottom ${100 - bands.buildingEnd}% of the frame — ` +
    `is a wide, flat, completely EMPTY asphalt/concrete forecourt spanning the full width. ` +
    `A vehicle will be parked on this band and price text will overlay it: ` +
    `no cars, no poles, no markings, no clutter, uniform surface. ` +
    `The ground band is NON-NEGOTIABLE: it must visibly start at ${bands.buildingEnd}% from the top. `;

  if (ar > 2.0) {
    // ── WIDE BANNERS (2000×500, 970×250) ──────────────────────────────────
    return (
      `Professional ${width}×${height} automotive advertising background. ` +
      `Adapt this dealership photograph to an ultra-wide format by EXTENDING THE WALLS LATERALLY: ` +
      `the building facade extends further left and right to fill the wider frame — ` +
      `LONGER WALLS, not stretched, not zoomed. ` +
      anatomy +
      `The right ${Math.round(z.carWidthPct * 100)}% of the ground band stays fully open for the vehicle; ` +
      `the bottom-left stays clean for price text. ` +
      anchor +
      wallText +
      clearForeground +
      preserveSignage
    );
  } else if (ar < 0.7) {
    // ── PORTRAIT / STORY (9:16) ────────────────────────────────────────────
    return (
      `Professional ${width}×${height} automotive advertising background. ` +
      `Adapt this dealership photograph to a tall portrait format by EXTENDING SKY ABOVE ` +
      `and GROUND BELOW — the building walls do NOT extend. ` +
      anatomy +
      anchor +
      wallText +
      clearForeground +
      preserveSignage
    );
  } else {
    // ── SQUARE / STANDARD (1:1, 5:4, 4:3) ─────────────────────────────────
    return (
      `Professional ${width}×${height} automotive advertising background. ` +
      `Adapt this dealership photograph to fill the frame, keeping the full facade visible. ` +
      anatomy +
      anchor +
      wallText +
      clearForeground +
      preserveSignage
    );
  }
}

/**
 * Generate ONE clean background for a specific template format.
 *
 * Uses Flux Kontext Pro (img2img) — the same model as Phase 1a.
 * The input is cropped to the target aspect ratio, then Flux Kontext
 * recomposes the scene according to the format-specific prompt.
 *
 * Wide formats: walls extend laterally (building appears wider, not stretched).
 * Tall formats: sky and ground extend (building stays centred).
 * This matches the composition guide produced by Gemini/Imagen.
 */
async function generateCleanBackground(
  cleanBaseBgDataUrl: string,
  config: TemplateFormatConfig,
): Promise<string> {
  const { generateImage } = await import('./replicateClient');

  // Crop to target aspect ratio — Flux Kontext img2img preserves input dimensions
  const croppedBg = await cropToAspectRatio(cleanBaseBgDataUrl, config.width, config.height);
  const prompt    = buildKontextPrompt(config);

  try {
    return await generateImage({ prompt, inputImage: croppedBg });
  } catch {
    return croppedBg; // fallback: original crop
  }
}

// ─── Vertical center-crop (post-processing for ultra-wide formats) ───────────

/**
 * Crop an image vertically to a wider aspect ratio, keeping the full width.
 * Used after nano-banana generates 21:9 (its widest ratio) to reach 4:1 / 3.9:1:
 * the full width is preserved and excess sky/foreground is trimmed top+bottom.
 * Crop window is biased slightly downward (55%) to keep building + ground visible.
 */
async function cropVerticalToAR(
  srcUrl: string,
  targetW: number,
  targetH: number,
): Promise<string> {
  const img = await loadImg(srcUrl);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const targetAr = targetW / targetH;

  const cropH = Math.round(srcW / targetAr);
  if (cropH >= srcH) return srcUrl; // already wide enough — nothing to trim

  const cropY = Math.round((srcH - cropH) * 0.55); // slight downward bias

  const canvas = document.createElement('canvas');
  canvas.width  = srcW;
  canvas.height = cropH;
  canvas.getContext('2d')!.drawImage(img, 0, cropY, srcW, cropH, 0, 0, srcW, cropH);
  return canvas.toDataURL('image/jpeg', 0.90);
}

// ─── Per-format scene recompose (nano-banana / Gemini 2.5 Flash Image) ───────

/** Map a template aspect ratio to the closest nano-banana aspect_ratio enum value. */
function nanoAspectFor(width: number, height: number): string {
  const ar = width / height;
  if (ar > 2.0)  return '21:9';  // widest supported — post-crop to 4:1 client-side
  if (ar < 0.7)  return '9:16';
  if (ar > 1.7)  return '16:9';
  if (Math.abs(ar - 1) < 0.08) return '1:1';
  if (ar > 1.15 && ar < 1.3)   return '5:4';  // 300×250 (1.2)
  return ar >= 1 ? '4:3' : '3:4';
}

/**
 * Recompose the clean 4:3 base scene at a template's aspect ratio using
 * google/nano-banana (Gemini 2.5 Flash Image) — the model that produces
 * Gemini-quality scene extensions.
 *
 * Unlike crop+img2img (which destroys lateral content) or padded-canvas
 * inpainting (which invents unrelated content), nano-banana receives the FULL
 * original scene plus a target aspect_ratio and synthesizes the extension:
 * wide → walls extend laterally; tall → sky above and ground below.
 *
 * For ultra-wide templates (4:1, 3.9:1 — beyond nano's 21:9 max) the result
 * is generated at 21:9 and centre-cropped vertically, keeping full width.
 */
async function recomposeForFormat(
  cleanBaseBgDataUrl: string,
  config: TemplateFormatConfig,
): Promise<string> {
  const ar = config.width / config.height;

  // 4:3 templates match the clean base — no generation needed (zero cost)
  if (Math.abs(ar - 4 / 3) < 0.04) return cleanBaseBgDataUrl;

  const { generateImage } = await import('./replicateClient');
  const prompt = buildKontextPrompt(config);

  try {
    const result = await generateImage({
      modelId: 'nano-banana',
      prompt,
      imageInputs: [cleanBaseBgDataUrl],
      aspectRatio: nanoAspectFor(config.width, config.height),
    });
    // Ultra-wide: nano maxes at 21:9 (2.33:1) — trim vertically to the real AR
    if (ar > 2.4) return await cropVerticalToAR(result, config.width, config.height);
    return result;
  } catch {
    // Fallback: plain crop of the base (never blocks the flow)
    return cropToAspectRatio(cleanBaseBgDataUrl, config.width, config.height);
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
  /** Catalog cutout PNG (https URL) — passed to nano-banana as the vehicle reference */
  imageUrl?: string;
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
  /** true when the vehicle's catalog PNG is supplied as a second reference image */
  hasCarReference: boolean,
): string {
  const car = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;

  const subject = hasCarReference
    ? `The FIRST image is the scene: a dealership exterior. The SECOND image is only a ` +
      `vehicle reference (a ${car}) — use it solely to copy the vehicle's exact body, ` +
      `colour, wheels, and trim details. Do NOT copy the second image's framing or scale. ` +
      `Render the final image with the SCENE's framing: the full dealership building and ` +
      `sky must remain visible exactly as in the first image. `
    : `Add a single ${car} to this cleared dealership parking area. `;

  const placement = config.carOnRight
    ? `Position the vehicle on the RIGHT SIDE of the image in a three-quarter front-left view. ` +
      `The LEFT ${Math.round((1 - (config.width > config.height ? 0.55 : 0.5)) * 100)}% ` +
      `must remain completely clear — it will hold advertising text.`
    : `Position the vehicle centered in the foreground, three-quarter front-left view. ` +
      `The lower 30% of the image will hold text — ensure the vehicle sits above this zone.`;

  return (
    subject +
    `${placement} ` +
    `\n\nSCALE — CRITICAL: The vehicle is parked in the lot IN FRONT of the building, ` +
    `at a realistic distance from the camera. It occupies roughly 35–45% of the image width — ` +
    `clearly smaller than the building behind it. The building remains the dominant backdrop; ` +
    `its roofline and signage stay fully visible above the vehicle. ` +
    `A real parked car never fills the frame in a dealership wide shot. ` +
    `\n\nVEHICLE PLACEMENT: Park it firmly on the asphalt with all four tires touching the ground ` +
    `in the lower third of the frame — no gap between tires and pavement. ` +
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
 * Uses google/nano-banana (Gemini 2.5 Flash Image) with multi-image input:
 *   image 1 = the clean per-format background (scene)
 *   image 2 = the vehicle's catalog cutout PNG (subject reference)
 * The model places the exact reference vehicle into the scene with correct
 * perspective, lighting, shadow, and reflections — preserving car identity.
 *
 * Output matches the scene image's aspect ratio (aspect_ratio: match_input_image).
 */
export async function generateOfferComposite(
  cleanBgDataUrl: string,
  vehicle: VehicleDesc,
  config: TemplateFormatConfig,
): Promise<string> {
  const { generateImage } = await import('./replicateClient');
  const hasCarRef = !!vehicle.imageUrl?.startsWith('http');
  const prompt = buildCarPlacementPrompt(vehicle, config, hasCarRef);
  return generateImage({
    modelId: 'nano-banana',
    prompt,
    imageInputs: hasCarRef ? [cleanBgDataUrl, vehicle.imageUrl!] : [cleanBgDataUrl],
    aspectRatio: 'match_input_image',
  });
}

// ─── Phase 1 public API ───────────────────────────────────────────────────────

/**
 * Phase 1a — Generate a single clean preview background (~30s).
 * Returns a 600×450 clean scene — no vehicle.
 */
export async function generatePreviewBackground(
  dealerImageDataUrl: string,
): Promise<string> {
  // Use cfg() so the config includes zones (required by buildKontextPrompt)
  return generateCleanBackground(dealerImageDataUrl, cfg("website-600x450", 600, 450, false, {
    groundStartPct: 0.60, textHeightPct: 0.38, textWidthPct: 1.0,
    carWidthPct: 0.75, topBarPct: 0.26,
  }));
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

// ─── Phase 2 public API ───────────────────────────────────────────────────────

/**
 * Phase 2a — Generate per-template backgrounds using Flux Kontext Pro.
 *
 * Uses the same model as Phase 1a (Flux Kontext img2img), now with
 * format-specific composition prompts based on the Gemini visual guide:
 *   Wide: walls extend laterally (building gets wider walls, not stretched)
 *   Tall: sky and ground extend (building stays centred)
 *   Square/standard: moderate sky+ground extension
 *
 * @param cleanBaseBgDataUrl  Clean 4:3 background from Phase 1a
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
      const url = await recomposeForFormat(cleanBaseBgDataUrl, config);
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
