import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

const dataDir = resolve(fileURLToPath(import.meta.url), '../../data')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@data': dataDir },
  },
  server: {
    fs: { allow: [resolve(fileURLToPath(import.meta.url), '..'), dataDir] },
  },
})
