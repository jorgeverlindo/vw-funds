/**
 * Browser-side API clients for Projects module AI features.
 *
 * All API keys are kept server-side — these functions call Vercel Edge Functions
 * which proxy to Anthropic and Replicate. No VITE_ keys required.
 *
 *   /api/anthropic/identify  — vehicle identification (Claude)
 *   /api/replicate/optimize  — image optimization (Flux Kontext)
 *   /api/replicate/predict   — predictions polling (used by both)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetectedVehicle {
  year: string | null;
  make: string;
  model: string;
  trim: string | null;
  confidence: "high" | "medium" | "low";
}

// ─── Replicate — Image Optimization ──────────────────────────────────────────

/**
 * Optimize an automotive ad image via the server-side /api/replicate/optimize proxy.
 * No API key required in the browser.
 */
export async function optimizeImageWithReplicate(imageDataUrl: string): Promise<string> {
  // Start prediction via server-side proxy
  const startRes = await fetch("/api/replicate/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  });

  if (!startRes.ok) {
    throw new Error(`Optimize API error: ${startRes.status} ${await startRes.text()}`);
  }

  let prediction = await startRes.json();

  // Poll until done
  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`/api/replicate/poll?id=${encodeURIComponent(prediction.id)}`);
    prediction = await pollRes.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate prediction failed: ${prediction.error ?? "unknown error"}`);
  }

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

  // Fetch result and convert to base64 data URL
  const imgRes = await fetch(outputUrl);
  const buffer = await imgRes.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

// ─── Anthropic — Vehicle Identification ───────────────────────────────────────

/**
 * Identify vehicles in an image via the server-side /api/anthropic/identify proxy.
 * No API key required in the browser.
 */
export async function identifyVehicleWithAnthropic(
  imageBase64: string,
  mediaType: string
): Promise<DetectedVehicle[]> {
  const res = await fetch("/api/anthropic/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType }),
  });

  if (!res.ok) {
    throw new Error(`Identify API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
