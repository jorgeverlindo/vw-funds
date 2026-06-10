// ─── Vercel Serverless Function — POST /api/anthropic/identify ────────────────
// Proxies vehicle identification requests to Anthropic, keeping the API key
// server-side. Replaces the browser-direct call in api-client.ts.
//
// Body: { imageBase64: string; mediaType: string }
// Returns: DetectedVehicle[]

declare const process: { env: Record<string, string | undefined> };

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_KEY is not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { imageBase64?: string; mediaType?: string };
  try { body = await request.json() as typeof body; }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { imageBase64, mediaType } = body;
  if (!imageBase64 || !mediaType) {
    return new Response(JSON.stringify({ error: 'imageBase64 and mediaType are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
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

  const data = await anthropicRes.json();

  if (!anthropicRes.ok) {
    return new Response(JSON.stringify({ error: data.error?.message ?? 'Anthropic error' }), {
      status: anthropicRes.status, headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = data.content?.[0]?.type === 'text' ? (data.content[0].text as string).trim() : '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const vehicles = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return new Response(JSON.stringify(vehicles), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
