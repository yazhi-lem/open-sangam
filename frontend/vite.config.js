import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const dataDir = resolve(fileURLToPath(import.meta.url), '../../data')

// Only the API endpoints go to the local Avai backend. A bare '/avai' prefix
// also swallowed the /avai page route itself, so reloading /avai in dev or
// preview hit uvicorn (502) instead of the SPA and rendered a blank page.
const functionsTarget =
  process.env.FUNCTIONS_EMULATOR_URL ||
  'http://127.0.0.1:5001/open-sangam/us-central1'

const apiProxy = {
  '^/avai/(ask|health|dataset)(/|$)': {
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
  },
  '^/translate(/|$)': {
    target: functionsTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/translate/, '/translate'),
  },
  '^/analyze-word(/|$)': {
    target: functionsTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/analyze-word/, '/analyzeWord'),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@data': dataDir },
  },
  server: {
    fs: { allow: [resolve(fileURLToPath(import.meta.url), '..'), dataDir] },
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
})
