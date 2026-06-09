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
    `\nSTEP 2 — BUILD GROUND PLANE: In the lower 35% of the image, create a clean, ` +
    `flat asphalt/concrete surface with CORRECT ONE-POINT PERSPECTIVE. ` +
    `The ground must recede naturally toward a single vanishing point at the horizon. ` +
    `The surface must be WIDE, FLAT, and CLEARLY DEFINED — this is the zone where ` +
    `a product will be placed. The ground texture should match the existing pavement ` +
    `and blend seamlessly with the building entrance area. ` +
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

// ─── Phase 1 public API ───────────────────────────────────────────────────────

/**
 * Phase 1 — Generate a single clean preview background (fast, ~20-30s).
 *
 * Called at tool time, before showing the approval card.
 * Returns one clean background at ~600×450 (4:3) for canvas preview compositing.
 * The caller adds the car via canvas composite for visual display only —
 * the returned URL itself has NO car baked in.
 */
export async function generatePreviewBackground(
  dealerImageDataUrl: string,
): Promise<string> {
  return generateCleanBackground(dealerImageDataUrl, {
    key: "website-600x450",
    width: 600, height: 450,
    compositionInstruction:
      "Standard 4:3 advertising format. Center: clean empty ground plane for hero vehicle placement. " +
      "Building fills upper 35% as atmospheric backdrop.",
    carOnRight: false,
  });
}

/**
 * Pass 2 — Apply photorealistic finishing to a canvas composite.
 *
 * Takes a canvas-composited image (clean bg + vehicle PNG already placed)
 * and adds: shadow, ground reflection, lighting match, edge blending.
 *
 * STRICT CONSTRAINTS passed to Replicate:
 *   - Do NOT move, resize, or remove the vehicle
 *   - Do NOT change building, sky, or environment
 *   - Only apply the 4 finishing effects listed
 *
 * This is called for the APPROVAL CARD only (one-time, best quality preview).
 * Stored per-template backgrounds are clean scenes — JellyBean handles the car overlay.
 */
export async function applyPhotorealisticFinishing(
  canvasCompositeDataUrl: string,
): Promise<string> {
  const { generateImage } = await import('./replicateClient');

  const finishingPrompt =
    `This image shows a vehicle composite on a dealership background. ` +
    `Apply EXACTLY these four photorealistic finishing effects — nothing else: ` +
    `\n(1) CAST SHADOW: Add a soft, natural shadow on the ground directly beneath ` +
    `the vehicle. The shadow should follow the scene's sunlight direction, ` +
    `be soft-edged (not hard), and fade naturally away from the vehicle. ` +
    `\n(2) GROUND REFLECTION: Add a subtle, slightly blurred reflection of the ` +
    `vehicle's lower body on the asphalt surface beneath it. ` +
    `\n(3) LIGHTING MATCH: Adjust the vehicle's ambient light to match the scene — ` +
    `same color temperature (warm/cool), same light direction, same exposure level. ` +
    `\n(4) EDGE BLENDING: Eliminate any hard cutout halos or sharp edges around the ` +
    `vehicle. Blend the vehicle edges naturally into the scene's ambient light. ` +
    `\nSTRICT CONSTRAINTS: ` +
    `Do NOT move, resize, or reposition the vehicle. ` +
    `Do NOT change the background building, sky, or any scene element. ` +
    `Do NOT alter the vehicle's shape, color, or scale. ` +
    `Apply ONLY: shadow, reflection, lighting match, edge blending.`;

  try {
    return await generateImage({ prompt: finishingPrompt, inputImage: canvasCompositeDataUrl });
  } catch {
    return canvasCompositeDataUrl; // fallback: return unfinished composite
  }
}

// ─── Phase 2 public API ───────────────────────────────────────────────────────

/**
 * Phase 2 — Generate per-template clean backgrounds (called AFTER user approval).
 *
 * All formats run in parallel (Promise.allSettled).
 * Each returned URL is a CLEAN scene — no car, no duplication with JellyBean.
 *
 * @param dealerImageDataUrl  base64 data URL of dealer's uploaded photo
 * @param selectedTemplateKeys  KNOWN_SIZES keys to generate (empty = all)
 * @param onProgress  optional callback as each format completes
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
