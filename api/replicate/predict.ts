// ─── Vercel Serverless Function — POST /api/replicate/predict ─────────────────
// Proxies prediction-start requests to Replicate, keeping the API token server-side.
// Mirrors the Vite dev-server middleware in vite.config.ts so the same client
// code (replicateClient.ts → fetch('/api/replicate/predict')) works in both
// local dev and Vercel production.
//
// Strategy: ASYNC submission (no Prefer: wait).
//   • The Edge Function just submits the prediction and returns the prediction ID
//     immediately (< 1 s) — well within the 30 s Edge limit.
//   • The client polls GET /api/replicate/predict/:id until status === 'succeeded'.
//   • This avoids the HTTP 504 Gateway Timeout that occurs when Flux Kontext
//     takes > 25–30 s on busy Replicate queues.
//
// Environment variable: REPLICATE_API_TOKEN  (set in Vercel project settings)

// Vercel Edge Runtime exposes process.env but lacks Node type definitions.
declare const process: { env: Record<string, string | undefined> };

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Accept the token under either name so both local (.env.local REPLICATE_API_TOKEN)
  // and Vercel (VITE_REPLICATE_API_TOKEN, already added via CLI) work without changes.
  const token = process.env.REPLICATE_API_TOKEN ?? process.env.VITE_REPLICATE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { prompt?: string; model?: string; inputImage?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    prompt,
    model = 'black-forest-labs/flux-kontext-pro',
    inputImage,
  } = body;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const replicateRes = await fetch(
    `https://api.replicate.com/v1/models/${model}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // No Prefer: wait — async submission so the Edge Function returns in < 1 s.
        // The replicateClient polls GET /predict/:id until status === 'succeeded'.
      },
      body: JSON.stringify({
        input: {
          prompt,
          // aspect_ratio only for text-to-image; omit for img2img (Flux Kontext editing)
          ...(!inputImage ? { aspect_ratio: '4:3' } : {}),
          output_format: 'jpg',
          output_quality: 90,
          ...(inputImage ? { input_image: inputImage } : {}),
        },
      }),
    },
  );

  const data = await replicateRes.json();
  return new Response(JSON.stringify(data), {
    status: replicateRes.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
