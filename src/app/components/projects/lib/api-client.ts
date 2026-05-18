/**
 * Browser-side API clients for Projects module AI features.
 * Replaces the Next.js API routes (/api/optimize, /api/identify-vehicle).
 * Keys are read from Vite env vars: VITE_REPLICATE_TOKEN and VITE_ANTHROPIC_KEY.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetectedVehicle {
  year: string | null;
  make: string;
  model: string;
  trim: string | null;
  confidence: "high" | "medium" | "low";
}

// ─── Replicate — Flux Kontext Pro ─────────────────────────────────────────────

const REPLICATE_TOKEN = (import.meta as Record<string, unknown> & { env: Record<string, string> }).env.VITE_REPLICATE_TOKEN ?? "";

/**
 * Optimize an automotive ad image using Replicate flux-kontext-pro.
 * Accepts a base64 data URL, returns a base64 data URL result.
 */
export async function optimizeImageWithReplicate(imageDataUrl: string): Promise<string> {
  if (!REPLICATE_TOKEN) {
    throw new Error("VITE_REPLICATE_TOKEN is not set. Add it to your .env file.");
  }

  // Start prediction
  const startRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait=30",
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-kontext-pro",
      input: {
        prompt:
          "Photorealistic automotive advertisement background composite. Blend the background scene seamlessly around the car so the car looks naturally placed in the environment, with accurate ground shadow, subtle ground reflections, and matching environmental lighting. CRITICAL RULES: (1) The entire vehicle must remain 100% visible and fully within the frame — never crop, clip, or cut off any part of the car body, wheels, or roof. (2) Do not resize, reposition, or rescale the vehicle. (3) Do not alter the vehicle's color, reflections, or surface. (4) Do not change any text, logos, or UI overlays. (5) Only modify the background environment — everything else must remain pixel-perfect identical.",
        input_image: imageDataUrl,
        aspect_ratio: "match_input_image",
        output_format: "png",
        safety_tolerance: 6,
      },
    }),
  });

  if (!startRes.ok) {
    throw new Error(`Replicate API error: ${startRes.status} ${await startRes.text()}`);
  }

  let prediction = await startRes.json();

  // Poll until done (Replicate predictions can take up to 5 minutes)
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { "Authorization": `Bearer ${REPLICATE_TOKEN}` },
    });
    prediction = await pollRes.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate prediction failed: ${prediction.error ?? "unknown error"}`);
  }

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

  // Fetch result image and convert to base64 data URL
  const imgRes = await fetch(outputUrl);
  const buffer = await imgRes.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:image/png;base64,${base64}`;
}

// ─── Anthropic — Vehicle Identification ───────────────────────────────────────

const ANTHROPIC_KEY = (import.meta as Record<string, unknown> & { env: Record<string, string> }).env.VITE_ANTHROPIC_KEY ?? "";

/**
 * Identify vehicles in an image using Claude claude-opus-4-5.
 * Accepts base64 image data and media type, returns detected vehicles.
 */
export async function identifyVehicleWithAnthropic(
  imageBase64: string,
  mediaType: string
): Promise<DetectedVehicle[]> {
  if (!ANTHROPIC_KEY) {
    throw new Error("VITE_ANTHROPIC_KEY is not set. Add it to your .env file.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-request-source": "browser",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Analyze this image and identify all vehicles present.
For each vehicle return:
- year: model year as string (e.g. "2026"), or null if unknown
- make: manufacturer name (e.g. "Honda")
- model: model name (e.g. "CR-V", "HR-V", "Civic")
- trim: trim level if identifiable from visual cues such as badges, body kit, or distinctive styling (e.g. "TrailSport", "LX", "Sport"). Return null if trim cannot be reliably determined.
- confidence: "high", "medium", or "low"

Return ONLY a valid JSON array, no markdown, no explanation.
Example: [{"year":"2026","make":"Honda","model":"CR-V","trim":"TrailSport","confidence":"high"}]`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.type === "text" ? (data.content[0].text as string).trim() : "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}
