import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file into process.env for local serverless functions
const envPath = path.resolve(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=')
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim()
        const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '')
        process.env[key] = val
      }
    }
  })
}

// Vite plugin to run Vercel serverless functions locally
function localApiPlugin() {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/')) {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const apiName = url.pathname.replace('/api/', '')
          const filePath = path.resolve(__dirname, 'api', `${apiName}.js`)

          console.log(`[Local API] 🚀 Received ${req.method} ${req.url}`);

          if (fs.existsSync(filePath)) {
            try {
              // Load the serverless function module dynamically via Vite SSR
              const module = await server.ssrLoadModule(`/api/${apiName}.js`)
              const handler = module.default

              // Parse body for POST/PUT/PATCH requests
              let body = {}
              if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const buffers = []
                for await (const chunk of req) {
                  buffers.push(chunk)
                }
                const rawBody = Buffer.concat(buffers).toString()
                if (rawBody) {
                  try {
                    body = JSON.parse(rawBody)
                  } catch (e) {
                    body = rawBody
                  }
                }
              }

              // Mock request object
              const mockReq = {
                method: req.method,
                headers: req.headers,
                body: body,
                query: Object.fromEntries(url.searchParams),
                url: req.url,
              }

              // Mock response object
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(name, value) {
                  this.headers[name.toLowerCase()] = value
                  res.setHeader(name, value)
                  return this;
                },
                status(code) {
                  this.statusCode = code
                  res.statusCode = code
                  return this;
                },
                json(data) {
                  this.setHeader('Content-Type', 'application/json')
                  console.log(`[Local API] ✅ Response ${this.statusCode} for ${req.url}`);
                  res.end(JSON.stringify(data))
                  return this;
                },
                end(data) {
                  console.log(`[Local API] ✅ Response ${this.statusCode} (end) for ${req.url}`);
                  res.end(data)
                  return this;
                }
              }

              // Run the handler
              await handler(mockReq, mockRes)
              return
            } catch (err) {
              console.error(`[Local API] ❌ Error executing API ${apiName}:`, err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }))
              return
            }
          } else {
            console.warn(`[Local API] ⚠️ File not found for API path: ${filePath}`);
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-framer': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react', 'sonner', 'canvas-confetti', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
