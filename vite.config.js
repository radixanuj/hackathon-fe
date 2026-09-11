import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API lives on a separate host in dev (Herd/Valet). Proxying /api keeps the
// browser same-origin, so no CORS preflight and no cookie/host surprises.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://hackathon-be.test',
        changeOrigin: true,
      },
    },
  },
})
