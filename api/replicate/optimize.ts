// ─── Vercel Serverless Function — POST /api/replicate/optimize ───────────────
// Proxies image optimization requests to Replicate (flux-kontext-pro),
// keeping the API key server-side. Replaces the browser-direct call.
//
// Body: { imageDataUrl: string }
// Returns: { outputUrl: string }

declare const process: { env: Record<string, string | undefined> };

export const config = { runtime: 'edge' };

const OPTIMIZE_PROMPT =
  'Photorealistic automotive advertisement background composite. ' +
  'Blend the background scene seamlessly around the car so the car looks naturally placed ' +
  'in the environment, with accurate ground shadow, subtle ground reflections, and matching ' +
  'environmental lighting. ' +
  'CRITICAL RULES: (1) The entire vehicle must remain 100% visible and fully within the frame ' +
  '— never crop, clip, or cut off any part of the car body, wheels, or roof. ' +
  '(2) Do not resize, reposition, or rescale the vehicle. ' +
  '(3) Do not alter the vehicle\'s color, reflections, or surface. ' +
  '(4) Do not change any text, logos, or UI overlays. ' +
  '(5) Only modify the background environment — everything else must remain pixel-perfect identical.';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.REPLICATE_API_TOKEN ?? process.env.VITE_REPLICATE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { imageDataUrl?: string };
  try { body = await request.json() as typeof body; }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { imageDataUrl } = body;
  if (!imageDataUrl) {
    return new Response(JSON.stringify({ error: 'imageDataUrl is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const replicateRes = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: OPTIMIZE_PROMPT,
          input_image: imageDataUrl,
          output_format: 'png',
          output_quality: 90,
        },
      }),
    },
  );

  const data = await replicateRes.json();
  return new Response(JSON.stringify(data), {
    status: replicateRes.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
