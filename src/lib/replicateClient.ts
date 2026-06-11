// ─── Replicate client ─────────────────────────────────────────────────────────
// All Replicate calls go through the /api/replicate proxy so the API token stays
// server-side and there are no CORS issues (Replicate blocks direct browser calls).
//
//   • Local dev  → Vite middleware in vite.config.ts (reads REPLICATE_API_TOKEN)
//   • Vercel     → Edge Functions in api/replicate/ (reads REPLICATE_API_TOKEN or
//                  VITE_REPLICATE_API_TOKEN — both are set in the project env vars)
//
// The proxy sets Prefer: wait=60 — most Flux predictions resolve in one request.
// If the server returns a still-running prediction, we poll every 2 s.

// Maps the app's AI model id → Replicate model path
const MODEL_MAP: Record<string, string> = {
  'nano-banana':         'google/nano-banana', // Gemini 2.5 Flash Image — scene recompose
  'flux-kontext-max':    'black-forest-labs/flux-kontext-pro',
  'flux-kontext-pro':    'black-forest-labs/flux-kontext-pro',
  'flux-one-depth':      'black-forest-labs/flux-1.1-pro',
  'midjourney-v8':       'black-forest-labs/flux-kontext-pro', // fallback
  'stable-diffusion-35': 'stability-ai/stable-diffusion-3-5-large',
  'dalle-3':             'black-forest-labs/flux-kontext-pro', // fallback
  'ideogram-3':          'black-forest-labs/flux-kontext-pro', // fallback
  'recraft-v4':          'black-forest-labs/flux-kontext-pro', // fallback
}

// ─── Asset → base64 data URL ──────────────────────────────────────────────────
// Replicate's API servers cannot reach localhost URLs (Vite assets, blob: URLs).
// This helper fetches the image in the browser (where it IS accessible), draws it
// on a canvas at a safe resolution, and returns a JPEG base64 data URL that can be
// sent as `input_image` directly in the JSON body.
//
// maxDimension: longest side in pixels after scaling (default 1280 — good quality
//               for Flux Kontext img2img without a huge payload).
// quality:      JPEG quality 0–1 (default 0.92).
export async function assetToDataUrl(
  url: string,
  maxDimension = 1280,
  quality      = 0.92,
): Promise<string> {
  if (url.startsWith('data:')) return url  // already encoded

  // Step 1 — fetch via browser (same-origin Vite assets always reachable here)
  // This avoids any crossOrigin/canvas-taint issue: we get a clean Blob and
  // create an object URL from it, which is always treated as same-origin.
  const res = await fetch(url)
  if (!res.ok) throw new Error(`assetToDataUrl: fetch failed for "${url}" (${res.status})`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)

  // Step 2 — draw onto canvas and compress to JPEG
  try {
    return await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const w0 = img.naturalWidth  || maxDimension
        const h0 = img.naturalHeight || maxDimension
        const scale = Math.min(1, maxDimension / Math.max(w0, h0))
        const w = Math.round(w0 * scale)
        const h = Math.round(h0 * scale)
        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas 2D unavailable')); return }
        // Fill white BEFORE drawing — vehicle cutout PNGs are RGBA with transparent
        // background. JPEG has no alpha channel, so without a white fill the
        // transparent areas become black (canvas default), which confuses
        // Flux Kontext's background-replacement editing mode.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error(`assetToDataUrl: image render failed for "${url}"`))
      img.src = objectUrl   // blob URL — no CORS, no taint
    })
  } finally {
    URL.revokeObjectURL(objectUrl)   // free memory regardless of success/failure
  }
}

// ─── Kodiak vehicle preservation suffix ──────────────────────────────────────
// Appended AFTER the scene instruction in every Kodiak Flux Kontext img2img prompt.
//
// Flux Kontext editing format:
//   "Change the background to [scene]. [KODIAK_VEHICLE_GUARD]"
//
// Keeping it as a SUFFIX (after the scene) follows the natural editing pattern:
// describe what changes first, then anchor what must stay the same.
// This consistently outperforms prefixed constraint prompts in Flux Kontext.
//
// NOTE: angle suffixes (", three-quarter left perspective" etc.) are intentionally
// NOT added to Kodiak prompts. In img2img the angle is locked by the inputImage —
// adding an angle hint in text causes Flux to re-render the vehicle perspective
// instead of preserving it from the input.
// Two-sentence guard used in Flux Kontext editing prompts:
//   1. Positive instruction: keep the vehicle as-is.
//   2. Specificity: lock color, body, and decals so Flux doesn't stylise them.
// Kept concise — long constraint lists can confuse Flux's editing attention.
export const KODIAK_VEHICLE_GUARD =
  'Preserve the Yamaha Kodiak 450 ATV exactly as it appears in the input image. Keep its dark gray color, body shape, and Yamaha decals unchanged.'

// Angle-specific prompt suffix appended to user prompt for each of the 6 angles.
// Indices match ANGLES array order: ['3/4 L', 'Front', '3/4 R', 'Right', 'Left', 'Rear']
//
export const ANGLE_PROMPT_SUFFIXES: string[] = [
  ', three-quarter left perspective',
  ', straight-on front view',
  ', three-quarter right perspective',
  ', right side profile',
  ', left side profile',
  ', rear view',
]

interface PredictionResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[] | null
  error?: string
}

interface GenerateOptions {
  prompt: string
  /** AI model id from the app's AI_MODELS list */
  modelId?: string
  /** Optional image URL or data-URL to pass as input_image (for img2img) */
  inputImage?: string
  /** nano-banana only: multiple reference images (scene first, then subjects) */
  imageInputs?: string[]
  /** nano-banana only: target aspect ratio, e.g. "21:9", "9:16", "1:1" */
  aspectRatio?: string
  /** Called with interim status strings while polling */
  onStatus?: (status: string) => void
  /** AbortSignal to cancel mid-flight */
  signal?: AbortSignal
}

async function startPrediction(opts: GenerateOptions): Promise<PredictionResponse> {
  const model = MODEL_MAP[opts.modelId ?? 'flux-kontext-pro'] ?? MODEL_MAP['flux-kontext-pro']
  const res = await fetch('/api/replicate/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      prompt: opts.prompt,
      model,
      inputImage: opts.inputImage,
      imageInputs: opts.imageInputs,
      aspectRatio: opts.aspectRatio,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<PredictionResponse>
}

async function pollPrediction(id: string, signal?: AbortSignal): Promise<PredictionResponse> {
  // Use flat route + query param to avoid Vercel dynamic-route resolution issues
  // (dynamic /predict/[id] can be intercepted by the SPA catch-all rewrite)
  const res = await fetch(`/api/replicate/poll?id=${encodeURIComponent(id)}`, { signal })
  if (!res.ok) throw new Error(`Poll error HTTP ${res.status}`)
  return res.json() as Promise<PredictionResponse>
}

function extractUrl(output: string | string[] | null | undefined): string | null {
  if (!output) return null
  return Array.isArray(output) ? (output[0] ?? null) : output
}

/**
 * Generate a single image via Replicate.
 * Returns the CDN URL of the generated image.
 */
export async function generateImage(opts: GenerateOptions): Promise<string> {
  opts.onStatus?.('starting')
  const prediction = await startPrediction(opts)

  // Prefer: wait=60 may return a finished prediction immediately
  if (prediction.status === 'succeeded') {
    const url = extractUrl(prediction.output)
    if (url) return url
    throw new Error('No output URL in succeeded prediction')
  }
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(prediction.error ?? `Prediction ${prediction.status}`)
  }

  // Poll until done (max 90 × 2s = 3 min)
  const MAX_POLLS = 90
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 2000)
      opts.signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')) }, { once: true })
    })

    const status = await pollPrediction(prediction.id, opts.signal)
    opts.onStatus?.(status.status)

    if (status.status === 'succeeded') {
      const url = extractUrl(status.output)
      if (url) return url
      throw new Error('No output URL in succeeded prediction')
    }
    if (status.status === 'failed' || status.status === 'canceled') {
      throw new Error(status.error ?? `Prediction ${status.status}`)
    }
  }

  throw new Error('Generation timed out after 3 minutes')
}

// ─── Depth Anything v2 — ground plane detection ──────────────────────────────
//
// Calls Depth Anything v2 to produce a disparity map (bright = near, dark = far).
// We then analyze the map to find the Y coordinate of the ground plane transition:
// the row where the scene changes from "distant building/sky" to "near asphalt".
// That transition + a small offset = where to anchor the vehicle's tires.

export interface GroundAnalysis {
  /** Y fraction (0–1) where tires should land. Clamped [0.70, 0.93]. */
  groundFraction: number
  /** Width fraction (0–1) the car should occupy within the card. Clamped [0.35, 0.75]. */
  carWidthFraction: number
}

// groundFraction 0.65 = tires at 65% of image height, matching the background
// composition instruction that puts visible asphalt starting at ~60% from the top.
const GROUND_FALLBACK: GroundAnalysis = { groundFraction: 0.65, carWidthFraction: 0.65 }

/**
 * Analyze a depth map and return both ground Y and car width for the JellyBeanCard.
 *
 * groundFraction — steepest row brightness increase → scene-to-ground transition + 8% offset.
 * carWidthFraction — at the tire line, measure the horizontal span of the bright ground zone.
 *   A wide asphalt zone → wide car. A narrow or compressed zone → narrower car.
 *   Car fills 70% of the detected ground zone width, clamped [0.35, 0.75].
 */
async function analyzeGroundFromDepthMap(depthMapUrl: string): Promise<GroundAnalysis> {
  try {
    const res = await fetch(depthMapUrl)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload  = () => { URL.revokeObjectURL(objectUrl); resolve(el) }
      el.onerror = () => { URL.revokeObjectURL(objectUrl); reject() }
      el.src = objectUrl
    })

    // Downsample to 128×128 for fast pixel analysis
    const W = 128, H = 128
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, W, H)
    const { data } = ctx.getImageData(0, 0, W, H)

    // ── groundFraction: steepest row brightness increase ─────────────────────
    // Average R-channel brightness per row (center 60% of width)
    const x0 = Math.floor(W * 0.2), x1 = Math.floor(W * 0.8)
    const rowAvg: number[] = new Array(H).fill(0)
    for (let y = 0; y < H; y++) {
      let sum = 0
      for (let x = x0; x < x1; x++) sum += data[(y * W + x) * 4]
      rowAvg[y] = sum / (x1 - x0)
    }

    let maxGradient = 0
    let transitionRow = Math.floor(H * 0.75)
    for (let y = Math.floor(H * 0.35) + 1; y < Math.floor(H * 0.85) - 1; y++) {
      const grad = rowAvg[y + 1] - rowAvg[y - 1]
      if (grad > maxGradient) { maxGradient = grad; transitionRow = y }
    }
    const groundFraction = Math.min(0.93, Math.max(0.70, transitionRow / H + 0.08))

    // ── carWidthFraction: width of bright ground zone at the tire line ────────
    // Sample a ±4-row band around the tire Y for stability
    const tireRow = Math.min(H - 1, Math.round(groundFraction * H))
    const colBright: number[] = new Array(W).fill(0)
    const band = 4
    for (let x = 0; x < W; x++) {
      let sum = 0, count = 0
      for (let dy = -band; dy <= band; dy++) {
        const y = tireRow + dy
        if (y >= 0 && y < H) { sum += data[(y * W + x) * 4]; count++ }
      }
      colBright[x] = count > 0 ? sum / count : 0
    }

    const maxCol = Math.max(...colBright)
    const colThreshold = maxCol * 0.50   // pixels brighter than 50% of peak = ground zone

    let zoneLeft = 0, zoneRight = W - 1
    for (let x = 0; x < W; x++) {
      if (colBright[x] >= colThreshold) { zoneLeft = x; break }
    }
    for (let x = W - 1; x >= 0; x--) {
      if (colBright[x] >= colThreshold) { zoneRight = x; break }
    }

    const groundZoneWidth = (zoneRight - zoneLeft) / W
    // Car fills 70% of the detected ground zone; clamp to [0.35, 0.75]
    const carWidthFraction = Math.min(0.75, Math.max(0.35, groundZoneWidth * 0.70))

    return { groundFraction, carWidthFraction }
  } catch {
    return GROUND_FALLBACK
  }
}

/**
 * Run Depth Anything v2 on a background image and return ground plane layout.
 *
 * groundFraction  — Y fraction [0.70–0.93] for car tire contact
 * carWidthFraction — width fraction [0.35–0.75] for car sizing in JellyBeanCard
 *
 * Falls back to { 0.88, 0.65 } on any error. Typical latency: ~3–5s.
 */
export async function detectGroundFraction(bgDataUrl: string): Promise<GroundAnalysis> {
  try {
    const res = await fetch('/api/replicate/depth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: bgDataUrl }),
    })
    if (!res.ok) return GROUND_FALLBACK

    const prediction: PredictionResponse = await res.json()

    // Immediate success (Prefer: wait or fast model)
    if (prediction.status === 'succeeded') {
      const url = extractUrl(prediction.output)
      if (url) return analyzeGroundFromDepthMap(url)
    }

    if (!prediction.id) return GROUND_FALLBACK

    // Poll (depth models typically finish in 3–8s)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const status = await pollPrediction(prediction.id)
      if (status.status === 'succeeded') {
        const url = extractUrl(status.output)
        if (url) return analyzeGroundFromDepthMap(url)
        break
      }
      if (status.status === 'failed' || status.status === 'canceled') break
    }

    return GROUND_FALLBACK
  } catch {
    return GROUND_FALLBACK
  }
}

// ─── Flux Fill Pro inpainting ────────────────────────────────────────────────
//
// Used for Pass 2 (shadow + ground reflection + edge blend).
// The mask tells the model what to INPAINT:
//   WHITE = regenerate this area (shadow zone below car)
//   BLACK = preserve exactly as-is (car body, background)
//
// The car pixels are NEVER in the white zone → car identity is 100% preserved.
// Only the ground area directly under the tires is regenerated.

/**
 * Generate a shadow/ground-reflection inpaint mask.
 *
 * Creates a mask image (JPEG, same dimensions as the composite) where:
 *   WHITE = shadow zone (a soft elliptical patch below the car tires)
 *   BLACK = everything else (preserved by flux-fill-pro)
 *
 * @param width  canvas width
 * @param height canvas height
 * @param carX   left edge of car bounding box in canvas pixels
 * @param carW   width of car bounding box in canvas pixels
 * @param tireY  Y coordinate where car tires touch the ground (from top)
 */
export function createShadowMask(
  width: number,
  height: number,
  carX: number,
  carW: number,
  tireY: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Start with all black (everything preserved)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Shadow ellipse parameters
  // Centered under the car, slightly wider than the car, soft gradient
  const centerX = carX + carW / 2;
  const ellipseW = carW * 1.15;          // 15% wider than the car
  const ellipseH = height * 0.10;        // 10% of frame height tall
  const ellipseCenterY = tireY + ellipseH * 0.3; // starts just below tire line

  // Radial gradient: bright white at center, fades to black
  const grad = ctx.createRadialGradient(
    centerX, ellipseCenterY, 0,
    centerX, ellipseCenterY, Math.max(ellipseW, ellipseH) / 1.5,
  );
  grad.addColorStop(0.0, 'rgba(255,255,255,1.0)');  // pure white — inpaint here
  grad.addColorStop(0.6, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0.0)');        // fade to black — preserve

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centerX, ellipseCenterY, ellipseW / 2, ellipseH / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Apply inpainting via flux-fill-pro.
 *
 * Takes a composite image + a mask and asks Flux Fill Pro to regenerate
 * only the white areas of the mask. Used for shadow generation.
 */
export async function inpaintImage(opts: {
  compositeDataUrl: string;
  maskDataUrl: string;
  prompt: string;
}): Promise<string> {
  const res = await fetch('/api/replicate/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: opts.prompt,
      model: 'black-forest-labs/flux-fill-pro',
      inputImage: opts.compositeDataUrl,
      maskImage:  opts.maskDataUrl,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  const prediction: PredictionResponse = await res.json();
  // Poll until done (same pattern as generateImage)
  if (prediction.status === 'succeeded') {
    const url = extractUrl(prediction.output);
    if (url) return url;
    throw new Error('No output URL');
  }

  // Poll
  for (let i = 0; i < 180; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await pollPrediction(prediction.id);
    if (status.status === 'succeeded') {
      const url = extractUrl(status.output);
      if (url) return url;
      throw new Error('No output URL');
    }
    if (status.status === 'failed' || status.status === 'canceled') {
      throw new Error(status.error ?? `Prediction ${status.status}`);
    }
  }
  throw new Error('Inpainting timed out');
}

// ─── Vehicle composite ─────────────────────────────────────────────────────────
// ── createDualInputForReplicate ───────────────────────────────────────────────
// Creates a side-by-side canvas showing:
//   LEFT (2/3): the dealer background scene
//   RIGHT (1/3): the vehicle reference on a neutral gray panel
//
// This combined image is sent to Replicate so the model can see BOTH images
// simultaneously and produce a fully composited result (correct perspective,
// scale, shadow — all handled by the model, not by manual canvas math).
//
export async function createDualInputForReplicate(
  bgUrl: string,
  vehicleUrl: string,
  totalWidth = 1280,
  height = 768,
): Promise<string> {
  const loadImg = async (src: string): Promise<HTMLImageElement> => {
    let objectUrl: string | null = null
    try {
      if (!src.startsWith('data:')) {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`fetch failed (${res.status}) for "${src.substring(0, 60)}"`)
        objectUrl = URL.createObjectURL(await res.blob())
      }
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload  = () => resolve(img)
        img.onerror = () => reject(new Error('image decode failed'))
        img.src = objectUrl ?? src
      })
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }

  const [bgImg, vehImg] = await Promise.all([loadImg(bgUrl), loadImg(vehicleUrl)])

  const canvas = document.createElement('canvas')
  canvas.width  = totalWidth
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  const bgW  = Math.round(totalWidth * 0.68)   // background occupies left 68%
  const refW = totalWidth - bgW                 // reference panel is right 32%

  // LEFT — background scene stretched to fill its zone
  ctx.drawImage(bgImg, 0, 0, bgW, height)

  // Thin separator
  ctx.fillStyle = '#222222'
  ctx.fillRect(bgW, 0, 3, height)

  // RIGHT — neutral panel for vehicle reference
  ctx.fillStyle = '#e8e8e8'
  ctx.fillRect(bgW + 3, 0, refW - 3, height)

  // Vehicle centered in the reference panel, fitted to 90% of the panel
  const maxVW = (refW - 3) * 0.88
  const maxVH = height * 0.72
  const vScale = Math.min(maxVW / vehImg.naturalWidth, maxVH / vehImg.naturalHeight)
  const vW = Math.round(vehImg.naturalWidth  * vScale)
  const vH = Math.round(vehImg.naturalHeight * vScale)
  const vX = bgW + 3 + Math.round(((refW - 3) - vW) / 2)
  const vY = Math.round((height - vH) / 2)
  ctx.drawImage(vehImg, vX, vY, vW, vH)

  // Label
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('VEHICLE REFERENCE', bgW + 10, height - 12)

  return canvas.toDataURL('image/jpeg', 0.92)
}

// ── createVehicleComposite ────────────────────────────────────────────────────
// Simple canvas overlay: places vehicle PNG directly on background.
// Used as a FALLBACK when the full Replicate compositing call fails.
// For the dealer background flow, createDualInputForReplicate + Replicate
// handles the compositing with correct perspective, scale and shadow.
//
export async function createVehicleComposite(
  bgUrl: string,
  vehicleAssetUrl: string,
  width  = 1024,
  height = 768,
): Promise<string> {
  const loadImg = async (src: string): Promise<HTMLImageElement> => {
    let objectUrl: string | null = null
    try {
      if (!src.startsWith('data:')) {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`createVehicleComposite: fetch failed (${res.status}) for "${src.substring(0, 60)}"`)
        objectUrl = URL.createObjectURL(await res.blob())
      }
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload  = () => resolve(img)
        img.onerror = () => reject(new Error(`createVehicleComposite: image decode failed`))
        img.src = objectUrl ?? src
      })
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }

  const [bgImg, vehImg] = await Promise.all([loadImg(bgUrl), loadImg(vehicleAssetUrl)])

  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  ctx.drawImage(bgImg, 0, 0, width, height)

  // ── Alpha detection: find actual tire bottom in the PNG ───────────────────
  // Car PNGs have varying transparent padding — using full PNG height as anchor
  // causes the car to float (tires end up above the calculated ground line).
  // We scan the PNG from bottom to find the last non-transparent row (the tires),
  // then anchor THAT to the ground line instead of the PNG's bounding box bottom.
  const detectTireBottom = (img: HTMLImageElement): number => {
    try {
      const offscreen = document.createElement('canvas')
      // Sample at reduced resolution for performance (still accurate)
      const sW = Math.min(img.naturalWidth, 256)
      const sH = Math.min(img.naturalHeight, 256)
      offscreen.width  = sW
      offscreen.height = sH
      const octx = offscreen.getContext('2d')
      if (!octx) return 1.0
      octx.drawImage(img, 0, 0, sW, sH)
      const { data } = octx.getImageData(0, 0, sW, sH)
      // Scan rows from bottom upward; find first row with any non-transparent pixel
      for (let y = sH - 1; y >= 0; y--) {
        for (let x = 0; x < sW; x++) {
          const alpha = data[(y * sW + x) * 4 + 3]
          if (alpha > 20) return y / sH   // fraction where tires actually are
        }
      }
    } catch { /* ignore — fall back */ }
    return 0.95   // safe fallback: assume tires at 95% of PNG height
  }

  const tireFraction = detectTireBottom(vehImg)   // e.g. 0.88 for 88% down the PNG

  // Scale to hero advertising proportions: 65% of canvas width
  const vehScale   = (width * 0.65) / vehImg.naturalWidth
  const vW         = Math.round(vehImg.naturalWidth  * vehScale)
  const vH         = Math.round(vehImg.naturalHeight * vehScale)
  const vX         = Math.round((width - vW) / 2)               // centered horizontally
  const groundBase = Math.round(height * 0.78)                   // ground line at 78% of frame
  // Anchor the ACTUAL TIRE POSITION (not the PNG bottom) to the ground line
  const tireYInCanvas = Math.round(vH * tireFraction)
  const vY         = groundBase - tireYInCanvas

  ctx.drawImage(vehImg, vX, vY, vW, vH)

  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * createVehicleCompositeWithCoords — same as createVehicleComposite but also
 * returns the car's bounding box coordinates in canvas pixels.
 * Used by the inpainting pipeline to generate a precise shadow mask.
 */
export async function createVehicleCompositeWithCoords(
  bgUrl: string,
  vehicleAssetUrl: string,
  width  = 1024,
  height = 768,
  /** Ground plane Y fraction from detectGroundFraction(). Defaults to 0.88. */
  groundFraction = 0.88,
): Promise<{ dataUrl: string; carX: number; carW: number; tireY: number }> {
  const loadImg = async (src: string): Promise<HTMLImageElement> => {
    let objectUrl: string | null = null
    try {
      if (!src.startsWith('data:')) {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`fetch failed (${res.status})`)
        objectUrl = URL.createObjectURL(await res.blob())
      }
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload  = () => resolve(img)
        img.onerror = () => reject(new Error('image decode failed'))
        img.src = objectUrl ?? src
      })
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }

  const [bgImg, vehImg] = await Promise.all([loadImg(bgUrl), loadImg(vehicleAssetUrl)])
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(bgImg, 0, 0, width, height)

  // Alpha detection for tire position
  const detectTireBottom = (img: HTMLImageElement): number => {
    try {
      const sW = Math.min(img.naturalWidth, 256), sH = Math.min(img.naturalHeight, 256)
      const off = document.createElement('canvas')
      off.width = sW; off.height = sH
      const octx = off.getContext('2d')!
      octx.drawImage(img, 0, 0, sW, sH)
      const { data } = octx.getImageData(0, 0, sW, sH)
      for (let y = sH - 1; y >= 0; y--)
        for (let x = 0; x < sW; x++)
          if (data[(y * sW + x) * 4 + 3] > 20) return y / sH
    } catch { /* fallback */ }
    return 0.95
  }

  const tireFraction = detectTireBottom(vehImg)
  const vehScale     = (width * 0.65) / vehImg.naturalWidth
  const vW           = Math.round(vehImg.naturalWidth  * vehScale)
  const vH           = Math.round(vehImg.naturalHeight * vehScale)
  const vX           = Math.round((width - vW) / 2)
  // 0.65 = tires land at 65% of canvas height — matches the background composition
  // where the ground plane starts at ~60% from the top (STEP 2 prompt instruction).
  // groundFraction from Depth Anything fine-tunes this; fallback is 0.65.
  const groundBase   = Math.round(height * groundFraction)
  const tireYInCanvas = Math.round(vH * tireFraction)
  const vY            = groundBase - tireYInCanvas
  const tireY         = vY + tireYInCanvas  // absolute Y of tire contact

  ctx.drawImage(vehImg, vX, vY, vW, vH)

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), carX: vX, carW: vW, tireY }
}

/**
 * Generate all 6 angle images in parallel, with one automatic retry per angle.
 * Returns an array of 6 URLs (null on individual angle failure after retries).
 * Calls onAngleComplete(index, url | null) as each finishes.
 */
export async function generateAllAngles(opts: {
  prompt: string
  modelId?: string
  inputImage?: string
  signal?: AbortSignal
  onAngleStart?: (index: number) => void
  onAngleComplete?: (index: number, url: string | null, error?: string) => void
}): Promise<Array<string | null>> {
  const results: Array<string | null> = Array(6).fill(null)

  // Stagger launch by 300 ms per angle to avoid hitting Replicate's concurrency
  // cap with 6 simultaneous requests. Total extra wait = 1.5 s — negligible vs
  // the ~15–25 s each prediction takes.
  await Promise.all(
    ANGLE_PROMPT_SUFFIXES.map(async (suffix, i) => {
      // Stagger start: angle 0 = 0 ms, angle 1 = 300 ms, …, angle 5 = 1500 ms
      if (i > 0) {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, i * 300)
          opts.signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')) }, { once: true })
        })
      }
      if (opts.signal?.aborted) return

      opts.onAngleStart?.(i)

      const attemptGenerate = () => generateImage({
        prompt: opts.prompt + suffix,
        modelId: opts.modelId,
        inputImage: opts.inputImage,
        signal: opts.signal,
      })

      try {
        // First attempt
        const url = await attemptGenerate()
        results[i] = url
        opts.onAngleComplete?.(i, url)
      } catch (firstErr) {
        const firstMsg = firstErr instanceof Error ? firstErr.message : String(firstErr)
        // Don't retry aborts
        if (firstMsg === 'aborted' || opts.signal?.aborted) {
          opts.onAngleComplete?.(i, null, firstMsg)
          return
        }
        // Retry once after 3 s — handles transient Replicate rate-limit errors
        try {
          await new Promise<void>((resolve, reject) => {
            const t = setTimeout(resolve, 3000)
            opts.signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')) }, { once: true })
          })
          if (opts.signal?.aborted) { opts.onAngleComplete?.(i, null, 'aborted'); return }
          const url = await attemptGenerate()
          results[i] = url
          opts.onAngleComplete?.(i, url)
        } catch (retryErr) {
          const msg = retryErr instanceof Error ? retryErr.message : String(retryErr)
          opts.onAngleComplete?.(i, null, msg)
        }
      }
    }),
  )

  return results
}
