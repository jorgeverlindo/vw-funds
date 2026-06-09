import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// ─── Replicate API proxy ──────────────────────────────────────────────────────
// Keeps REPLICATE_API_TOKEN server-side. Adds two routes to the Vite dev server:
//   POST /api/replicate/predict          — start a prediction
//   GET  /api/replicate/predict/:id      — poll prediction status
function replicatePlugin(token: string) {
  return {
    name: 'replicate-proxy',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      const readBody = (req: IncomingMessage): Promise<string> =>
        new Promise((resolve, reject) => {
          let data = ''
          req.on('data', (chunk: Buffer) => { data += chunk.toString() })
          req.on('end', () => resolve(data))
          req.on('error', reject)
        })

      server.middlewares.use('/api/replicate', async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (!token) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'REPLICATE_API_TOKEN not set in .env.local' }))
          return
        }

        try {
          // ── POST /api/replicate/predict — start prediction ────────────────
          if (req.method === 'POST' && req.url === '/predict') {
            const body = await readBody(req)
            const { prompt, model = 'black-forest-labs/flux-kontext-pro', inputImage } = JSON.parse(body) as {
              prompt: string
              model?: string
              inputImage?: string
            }

            const replicateRes = await fetch(
              `https://api.replicate.com/v1/models/${model}/predictions`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  Prefer: 'wait=60', // synchronous wait — result in one shot if < 60s
                },
                body: JSON.stringify({
                  input: {
                    prompt,
                    // aspect_ratio is only sent for text-to-image (no inputImage).
                    // For img2img (Flux Kontext editing), the output dimensions
                    // follow the input image — forcing a ratio here can cause
                    // the model to ignore or distort the input_image.
                    ...(!inputImage ? { aspect_ratio: '4:3' } : {}),
                    output_format: 'jpg',
                    output_quality: 90,
                    ...(inputImage ? { input_image: inputImage } : {}),
                  },
                }),
              },
            )

            const data = await replicateRes.json()
            res.statusCode = replicateRes.status
            res.end(JSON.stringify(data))
            return
          }

          // ── GET /api/replicate/predict/:id — poll status (legacy path) ───────
          if (req.method === 'GET' && req.url?.startsWith('/predict/')) {
            const id = req.url.replace('/predict/', '')
            const replicateRes = await fetch(
              `https://api.replicate.com/v1/predictions/${id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            )
            const data = await replicateRes.json()
            res.statusCode = replicateRes.status
            res.end(JSON.stringify(data))
            return
          }

          // ── POST /api/replicate/depth — Depth Anything v2 ─────────────────
          if (req.method === 'POST' && req.url === '/depth') {
            const body = await readBody(req)
            const { image } = JSON.parse(body) as { image?: string }
            if (!image) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'image is required' }))
              return
            }
            const replicateRes = await fetch(
              'https://api.replicate.com/v1/models/depth-anything/depth-anything-v2-large/predictions',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: { image } }),
              },
            )
            const data = await replicateRes.json()
            res.statusCode = replicateRes.status
            res.end(JSON.stringify(data))
            return
          }

          // ── GET /api/replicate/poll?id=<id> — poll status (flat route) ───────
          if (req.method === 'GET' && req.url?.startsWith('/poll')) {
            const urlObj = new URL(req.url, 'http://localhost')
            const id = urlObj.searchParams.get('id') ?? ''
            if (!id) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing prediction id' }))
              return
            }
            const replicateRes = await fetch(
              `https://api.replicate.com/v1/predictions/${id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            )
            const data = await replicateRes.json()
            res.statusCode = replicateRes.status
            res.end(JSON.stringify(data))
            return
          }

          next()
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        // Forward /api/* to the Hono agent server (never exposed in the browser bundle)
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      figmaAssetResolver(),
      replicatePlugin(env.REPLICATE_API_TOKEN ?? ''),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
        // Alias for the Projects module (constellation-app port)
        '@projects': path.resolve(__dirname, './src/app/components/projects'),
        '@comments': path.resolve(__dirname, './src/app/components/comments'),
      },
    },
  }
})
