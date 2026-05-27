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

// ─── Vehicle composite ─────────────────────────────────────────────────────────
// Browser-side canvas composite: draws a background image and composites the
// vehicle cutout on top using the cutout's native RGBA alpha channel.
// Used when a background is already available — the composite is sent to
// Flux Kontext with a "seamlessly blend" prompt instead of a "change background"
// prompt, which produces more reliable and higher-quality results.
//
// bgUrl          — any fetchable URL: blob:, https://, or data:
// vehicleAssetUrl — same-origin Vite asset path for the vehicle cutout PNG
// width / height — output canvas size (default 1024×768 = 4:3)
//
// Returns a JPEG base64 data URL of the composite.
export async function createVehicleComposite(
  bgUrl: string,
  vehicleAssetUrl: string,
  width  = 1024,
  height = 768,
): Promise<string> {
  // Load an image from any URL type without CORS taint.
  // data: URLs are loaded directly; everything else is fetched → blob → objectURL.
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

  // ── Composite canvas ──────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  // Layer 1 — background, stretched to fill
  ctx.drawImage(bgImg, 0, 0, width, height)

  // Layer 2 — vehicle, scaled to 72 % of canvas width and vertically centred.
  // The vehicle PNGs are RGBA — drawImage composites the alpha channel correctly,
  // so no manual white-pixel removal is needed here.
  const vehScale = (width * 0.72) / vehImg.naturalWidth
  const vW = Math.round(vehImg.naturalWidth  * vehScale)
  const vH = Math.round(vehImg.naturalHeight * vehScale)
  const vX = Math.round((width  - vW) / 2)
  const vY = Math.round((height - vH) / 2)
  ctx.drawImage(vehImg, vX, vY, vW, vH)

  return canvas.toDataURL('image/jpeg', 0.92)
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
