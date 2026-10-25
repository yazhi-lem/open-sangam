import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import poemSlices from './scripts/poem-slices.js'

const dataDir = resolve(fileURLToPath(import.meta.url), '../../data')

// Only the API endpoints go to the local Avai backend. A bare '/avai' prefix
// also swallowed the /avai page route itself, so reloading /avai in dev or
// preview hit uvicorn (502) instead of the SPA and rendered a blank page.
const avaiApiProxy = {
  '^/avai/(ask|health|dataset|capabilities)(/|$)': {
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), poemSlices({ dataDir })],
  resolve: {
    alias: { '@data': dataDir },
  },
  server: {
    fs: { allow: [resolve(fileURLToPath(import.meta.url), '..'), dataDir] },
    proxy: avaiApiProxy,
  },
  preview: {
    proxy: avaiApiProxy,
  },
})
