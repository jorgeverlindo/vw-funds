/**
 * dealerBackgroundGenerator.ts
 *
 * Per-template background generation for the DEALER BACKGROUND FLOW.
 *
 * ⚠️  ISOLATION RULES:
 *   - This module is ONLY used by the full_dealer_bg agent flow.
 *   - It has NO connection to Inventory AI Config (NewGlobalAIConfigContent).
 *   - It has NO connection to the RideNow catalog backgrounds.
 *   - Do not import from or call anything in this file from those flows.
 *
 * For each ad template format the user selected in their campaign, this module:
 *   1. Crops the dealer's uploaded photo to the correct aspect ratio
 *   2. Calls Replicate (Pass 1) to clean the background for that format
 *   3. Runs a canvas composite to place the vehicle at the correct position
 *      for that format (wide → car on right; square → car centered)
 *   4. Calls Replicate (Pass 2) to add shadow, lighting, and ground contact
 *
 * All templates are processed in parallel (Promise.allSettled).
 * A failed template silently falls back to the best available alternative.
 */

// ─── Template format configuration ───────────────────────────────────────────

interface TemplateFormatConfig {
  /** KNOWN_SIZES key used by getBgImage() */
  key: string;
  width: number;
  height: number;
  /** Replicate prompt fragment describing the COMPOSITION for this format */
  compositionInstruction: string;
  /** Whether the car should be on the RIGHT side (matches JellyBeanCard isWide) */
  carOnRight: boolean;
  /** Car scale as fraction of canvas width */
  carWidthFraction: number;
  /** Ground line as fraction of canvas height (where car tires land) */
  groundLineFraction: number;
}

/**
 * One config per KNOWN_SIZES key. Each describes the advertising composition
 * appropriate for that specific format.
 *
 * The Replicate prompt for each format instructs the model to build a
 * background with the CORRECT structure for that ad format — not just
 * crop a generic image.
 */
const TEMPLATE_FORMAT_CONFIGS: TemplateFormatConfig[] = [
  {
    key: "website-2000x500",
    width: 2000, height: 500,
    compositionInstruction:
      "ULTRA-WIDE BANNER FORMAT (4:1 ratio). " +
      "The RIGHT SIDE (40%) of the image is where the vehicle will appear — " +
      "ensure this area has a clean, unobstructed ground surface for the vehicle. " +
      "The LEFT SIDE (55%) must be completely clear and open — this space is reserved " +
      "for advertising text overlay, so no objects, poles, or visual clutter there. " +
      "The dealership building extends across the full width as a low, wide backdrop. " +
      "Horizon is very low (bottom 30%). Panoramic, cinematic composition.",
    carOnRight: true,
    carWidthFraction: 0.42,
    groundLineFraction: 0.78,
  },
  {
    key: "display-970x250",
    width: 970, height: 250,
    compositionInstruction:
      "LEADERBOARD FORMAT (3.9:1 ratio). " +
      "Very wide and short. The RIGHT THIRD is for the vehicle — clean ground surface there. " +
      "The LEFT TWO-THIRDS is open for advertising text. " +
      "Building fills the full width as a compressed backdrop. Low horizon.",
    carOnRight: true,
    carWidthFraction: 0.38,
    groundLineFraction: 0.80,
  },
  {
    key: "social-1080x1080",
    width: 1080, height: 1080,
    compositionInstruction:
      "SQUARE SOCIAL MEDIA FORMAT (1:1 ratio). " +
      "The vehicle will be centered and large — HERO SUBJECT. " +
      "The building fills the UPPER 40% as atmospheric backdrop. " +
      "The lower 60% must be a clean, flat ground surface. " +
      "Square composition, strong center focus.",
    carOnRight: false,
    carWidthFraction: 0.65,
    groundLineFraction: 0.76,
  },
  {
    key: "display-300x250",
    width: 300, height: 250,
    compositionInstruction:
      "MEDIUM RECTANGLE DISPLAY FORMAT (1.2:1 ratio). " +
      "Compact, slightly wider than tall. " +
      "Vehicle centered with strong foreground presence. " +
      "Building facade visible as backdrop. Clean ground in lower third.",
    carOnRight: false,
    carWidthFraction: 0.70,
    groundLineFraction: 0.75,
  },
  {
    key: "website-600x450",
    width: 600, height: 450,
    compositionInstruction:
      "STANDARD 4:3 RECTANGLE FORMAT. " +
      "Vehicle centered, prominent foreground hero. " +
      "Building fills the upper 35% as atmospheric backdrop. " +
      "Clean asphalt foreground with natural perspective.",
    carOnRight: false,
    carWidthFraction: 0.65,
    groundLineFraction: 0.76,
  },
  {
    key: "website-600x1067",
    width: 600, height: 1067,
    compositionInstruction:
      "PORTRAIT / STORY FORMAT (9:16 ratio). " +
      "Very tall, narrow composition. " +
      "Vehicle centered horizontally, VERY LARGE and dominant. " +
      "Building visible in the upper quarter as backdrop. " +
      "More foreground ground visible below the vehicle. " +
      "Strong vertical advertising composition.",
    carOnRight: false,
    carWidthFraction: 0.72,
    groundLineFraction: 0.70,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Load any image URL (https://, data:, blob:) into an HTMLImageElement */
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

/**
 * Center-crop the dealer photo to the target aspect ratio.
 * Preserves the center of the image (where the building entrance usually is).
 * Returns a JPEG data URL at the target dimensions (up to 1280px wide for Replicate).
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
    // Source is wider — crop sides
    cropW = Math.round(srcH * targetAr);
    cropX = Math.round((srcW - cropW) / 2);
  } else {
    // Source is taller — crop top/bottom (bias toward keeping the building)
    cropH = Math.round(srcW / targetAr);
    cropY = Math.round((srcH - cropH) * 0.35); // 35% from top (building center)
  }

  // Cap output at 1280×1280 for Replicate API limits
  const maxDim = 1280;
  const scale  = Math.min(1, maxDim / Math.max(targetW, targetH));
  const outW   = Math.round(targetW * scale);
  const outH   = Math.round(targetH * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', 0.90);
}

/**
 * Find actual tire Y position in a vehicle PNG using alpha channel.
 * Returns the fraction (0–1) of the PNG height where tires are.
 * Used to anchor the car correctly on the ground line instead of using the PNG bounding box.
 */
function detectTireBottomFraction(img: HTMLImageElement): number {
  try {
    const sW = Math.min(img.naturalWidth,  256);
    const sH = Math.min(img.naturalHeight, 256);
    const offscreen = document.createElement('canvas');
    offscreen.width  = sW;
    offscreen.height = sH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return 0.92;
    ctx.drawImage(img, 0, 0, sW, sH);
    const { data } = ctx.getImageData(0, 0, sW, sH);
    for (let y = sH - 1; y >= 0; y--) {
      for (let x = 0; x < sW; x++) {
        if (data[(y * sW + x) * 4 + 3] > 20) return y / sH;
      }
    }
  } catch { /* fallback */ }
  return 0.92;
}

/**
 * Canvas composite: place the vehicle on the clean background at the
 * correct advertising position for this specific template format.
 *
 * Wide formats (banner): car on right side, matching JellyBeanCard isWide layout.
 * Square/normal formats: car centered horizontally.
 */
async function createCompositeForTemplate(
  bgDataUrl: string,
  vehicleUrl: string,
  config: TemplateFormatConfig,
  canvasW = 1024,
  canvasH = Math.round(1024 * config.height / config.width),
): Promise<string> {
  const [bgImg, vehImg] = await Promise.all([loadImg(bgDataUrl), loadImg(vehicleUrl)]);

  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = Math.max(canvasH, 100); // ensure valid height
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Vehicle — scale to target fraction of canvas width
  const vehScale    = (canvas.width * config.carWidthFraction) / vehImg.naturalWidth;
  const vW          = Math.round(vehImg.naturalWidth  * vehScale);
  const vH          = Math.round(vehImg.naturalHeight * vehScale);
  const groundBase  = Math.round(canvas.height * config.groundLineFraction);
  const tireFrac    = detectTireBottomFraction(vehImg);
  const vY          = groundBase - Math.round(vH * tireFrac);

  // Horizontal position: right-side for wide formats, centered otherwise
  const vX = config.carOnRight
    ? Math.round(canvas.width * 0.60 - vW * 0.5)   // right-center
    : Math.round((canvas.width - vW) / 2);          // true center

  ctx.drawImage(vehImg, vX, vY, vW, vH);
  return canvas.toDataURL('image/jpeg', 0.92);
}

// ─── Single-template pipeline ─────────────────────────────────────────────────

async function generateOneTemplate(
  dealerImageDataUrl: string,
  vehicleUrl: string,
  config: TemplateFormatConfig,
): Promise<string> {
  const { generateImage } = await import('./replicateClient');

  // Step 1 — Crop dealer photo to this format's aspect ratio
  const croppedBg = await cropToAspectRatio(dealerImageDataUrl, config.width, config.height);

  // Step 2 — Replicate Pass 1: clean background for this specific format
  const bgCleanPrompt =
    `Prepare this dealership photograph as an advertising background for the following format: ` +
    config.compositionInstruction +
    ` TASKS: (1) Remove ALL parked vehicles from the foreground — replace with clean ground surface. ` +
    `(2) Ensure the ground plane has correct one-point perspective for vehicle placement. ` +
    `(3) Keep the building facade, sky, and signage EXACTLY unchanged. ` +
    `(4) Do NOT add any objects or vehicles. ` +
    `Output: same location, empty foreground, ready for product placement in this format.`;

  let cleanBgUrl = croppedBg;
  try {
    cleanBgUrl = await generateImage({ prompt: bgCleanPrompt, inputImage: croppedBg });
  } catch { /* use cropped original */ }

  // Step 3 — Canvas composite: place car at correct advertising position for this format
  const canvasH = Math.round(1024 * config.height / config.width);
  let canvasComposite = cleanBgUrl;
  if (vehicleUrl?.startsWith('http')) {
    try {
      canvasComposite = await createCompositeForTemplate(
        cleanBgUrl, vehicleUrl, config, 1024, Math.min(canvasH, 1024),
      );
    } catch { /* use clean bg */ }
  }

  // Step 4 — Replicate Pass 2: photorealism (grounding, shadow, lighting, reflection)
  const enhancePrompt =
    `Enhance this ${config.width}×${config.height} automotive advertising composite. ` +
    `(1) GROUND: if the vehicle floats above the ground, lower it so tires contact the asphalt. ` +
    `(2) SHADOW: add a natural cast shadow beneath the tires matching the scene's sunlight. ` +
    `(3) REFLECTION: add subtle environment reflection on the vehicle's paint (building, sky). ` +
    `(4) EDGES: blend vehicle edges naturally — no cutout halos or hard borders. ` +
    `(5) LIGHTING: match vehicle exposure and color temperature to the scene. ` +
    `Preserve vehicle scale and background. Professional ${config.width}×${config.height} ad quality.`;

  try {
    return await generateImage({ prompt: enhancePrompt, inputImage: canvasComposite });
  } catch {
    return canvasComposite; // fallback: return canvas composite without enhancement
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate per-template backgrounds for all standard ad formats.
 *
 * @param dealerImageDataUrl  base64 data URL of the dealer's uploaded photo
 * @param vehicleUrl          HTTPS URL of the offer vehicle PNG (from offer.image)
 * @param selectedTemplateKeys  array of KNOWN_SIZES keys the user selected
 *                              (e.g. ["social-1080x1080", "website-2000x500"])
 *                              Pass empty array to generate ALL formats.
 * @param onTemplateProgress  optional callback fired as each template completes
 *
 * @returns Record<string, string> — format key → adapted background URL
 *
 * All formats run in PARALLEL (Promise.allSettled).
 * Failed formats are silently omitted from the result.
 */
export async function generateDealerBackgroundsForTemplates(
  dealerImageDataUrl: string,
  vehicleUrl: string,
  selectedTemplateKeys: string[] = [],
  onTemplateProgress?: (key: string, done: boolean) => void,
): Promise<Record<string, string>> {

  // Filter to only the formats the user actually selected
  const configs = selectedTemplateKeys.length > 0
    ? TEMPLATE_FORMAT_CONFIGS.filter(c => selectedTemplateKeys.includes(c.key))
    : TEMPLATE_FORMAT_CONFIGS;

  if (configs.length === 0) return {};

  // Run all in parallel — each format is fully independent
  const results = await Promise.allSettled(
    configs.map(async (config) => {
      onTemplateProgress?.(config.key, false);
      const url = await generateOneTemplate(dealerImageDataUrl, vehicleUrl, config);
      onTemplateProgress?.(config.key, true);
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
