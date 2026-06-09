// ─── Vercel Serverless Function — POST /api/replicate/depth ──────────────────
// Proxies depth estimation requests to Replicate using Depth Anything v2.
// Returns a depth map where bright = near (high disparity), dark = far.
//
// Used by the dealer background flow to detect the ground plane position
// so the vehicle composite anchors the car's tires at the correct Y position
// regardless of the background's camera angle or perspective.
//
// Environment variable: REPLICATE_API_TOKEN

declare const process: { env: Record<string, string | undefined> };

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.REPLICATE_API_TOKEN ?? process.env.VITE_REPLICATE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { image?: string };
  try {
    body = await request.json() as { image?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { image } = body;
  if (!image) {
    return new Response(JSON.stringify({ error: 'image is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Depth Anything v2 Large — monocular depth estimation
  // Output: disparity map URL (bright = near, dark = far)
  const replicateRes = await fetch(
    'https://api.replicate.com/v1/models/depth-anything/depth-anything-v2-large/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { image },
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
