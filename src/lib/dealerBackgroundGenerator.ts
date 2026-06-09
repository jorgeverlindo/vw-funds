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

  // Single Replicate call: clean and prepare the background for this format
  // DO NOT mention vehicles in the prompt — Flux Kontext will add them if prompted
  const cleanPrompt =
    `Prepare this ${config.width}×${config.height} dealership photograph as a ` +
    `professional advertising background. ` +
    config.compositionInstruction +
    ` TASKS: ` +
    `(1) Remove ALL parked vehicles, cars, and moving objects from the foreground lot. ` +
    `Replace the cleared area with seamless, clean ground surface (asphalt/pavement). ` +
    `(2) The ground plane in the foreground must be flat, clean, and unobstructed. ` +
    `(3) Fix perspective so the ground recedes naturally toward a single vanishing point. ` +
    `(4) Preserve the building facade, sky, signage, trees EXACTLY unchanged. ` +
    `(5) Do NOT add any objects, people, or vehicles. ` +
    `Output: same location, clean empty foreground ready for product overlay.`;

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
      "Clean background for preview. Empty foreground, building backdrop.",
    carOnRight: false,
  });
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
