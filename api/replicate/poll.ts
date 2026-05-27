// ─── Vercel Edge Function — GET /api/replicate/poll?id=<predictionId> ─────────
// Polls a Replicate prediction by ID, keeping the API token server-side.
//
// Using a flat route with a query parameter instead of a dynamic path segment
// (/predict/[id]) avoids a known Vercel routing issue where the SPA catch-all
// rewrite can intercept dynamic API routes before the Edge Function is matched.
//
// Environment variable: REPLICATE_API_TOKEN  (set in Vercel project settings)

// Vercel Edge Runtime exposes process.env but lacks Node type definitions.
declare const process: { env: Record<string, string | undefined> };

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
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

  const url = new URL(request.url);
  const id  = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing prediction id query param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const replicateRes = await fetch(
    `https://api.replicate.com/v1/predictions/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
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
