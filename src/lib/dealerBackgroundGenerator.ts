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

interface TemplateFormatConfig {
  /** KNOWN_SIZES key used by getBgImage() */
  key: string;
  width: number;
  height: number;
  /** Composition guidance for this ad format's clean background */
  compositionInstruction: string;
  /** Whether the car will sit on the RIGHT side (JellyBeanCard isWide) */
  carOnRight: boolean;
}

const TEMPLATE_FORMAT_CONFIGS: TemplateFormatConfig[] = [
  {
    key: "website-2000x500",
    width: 2000, height: 500,
    compositionInstruction:
      "ULTRA-WIDE BANNER (4:1). RIGHT HALF must have clean empty ground for vehicle. " +
      "LEFT 55% completely clear for advertising text — no objects, poles, clutter. " +
      "Building extends full width as low backdrop. Very low horizon (bottom 30%).",
    carOnRight: true,
  },
  {
    key: "display-970x250",
    width: 970, height: 250,
    compositionInstruction:
      "LEADERBOARD (3.9:1). RIGHT THIRD: clean empty ground for vehicle. " +
      "LEFT TWO-THIRDS open for text. Building as compressed full-width backdrop.",
    carOnRight: true,
  },
  {
    key: "social-1080x1080",
    width: 1080, height: 1080,
    compositionInstruction:
      "SQUARE SOCIAL (1:1). CENTER: clean empty ground for hero vehicle. " +
      "Building fills upper 40% as atmospheric backdrop. Lower 60%: flat clean ground.",
    carOnRight: false,
  },
  {
    key: "display-300x250",
    width: 300, height: 250,
    compositionInstruction:
      "MEDIUM RECTANGLE (1.2:1). CENTER: clean empty foreground for vehicle. " +
      "Building backdrop. Clean asphalt in lower third.",
    carOnRight: false,
  },
  {
    key: "website-600x450",
    width: 600, height: 450,
    compositionInstruction:
      "STANDARD 4:3. CENTER: clean ground for hero vehicle. " +
      "Building fills upper 35% as atmospheric backdrop.",
    carOnRight: false,
  },
  {
    key: "website-600x1067",
    width: 600, height: 1067,
    compositionInstruction:
      "PORTRAIT / STORY (9:16). CENTER: clean wide ground for large vehicle. " +
      "Building in upper quarter as backdrop. More foreground ground visible.",
    carOnRight: false,
  },
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
    `\nSTEP 3 — PRESERVE: Keep the building facade, sky, signage, trees, and all ` +
    `elements ABOVE the horizon line EXACTLY unchanged — same colors, same details. ` +
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

// ─── Phase 2 public API ───────────────────────────────────────────────────────

/**
 * Phase 2a — Generate per-template CLEAN backgrounds (called AFTER user approval).
 * Same as before — returns clean scenes for use as composite inputs.
 */
export async function generateDealerBackgroundsForTemplates(
  dealerImageDataUrl: string,
  selectedTemplateKeys: string[] = [],
  onProgress?: (key: string) => void,
): Promise<Record<string, string>> {
  const configs = selectedTemplateKeys.length > 0
    ? TEMPLATE_FORMAT_CONFIGS.filter(c => selectedTemplateKeys.includes(c.key))
    : TEMPLATE_FORMAT_CONFIGS;

  if (configs.length === 0) return {};

  const results = await Promise.allSettled(
    configs.map(async (config) => {
      const url = await generateCleanBackground(dealerImageDataUrl, config);
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
          results[vehicle.offerId][config.key] = cleanBgImages[config.key]; // fallback: clean bg
        }
      })
  );

  await Promise.allSettled(tasks.map(t => t()));
  return results;
}
