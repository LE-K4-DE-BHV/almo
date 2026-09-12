/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // No "globals: true" - tests import describe/it/expect from 'vitest' explicitly,
    // matching the rest of the codebase's no-implicit-globals style.
  },
  server: {
    // Routes /api/* to the local backend so the browser sees everything as one
    // origin (localhost:5173) - same setup nginx gives us in prod (see
    // infra/nginx). Without this, cookies/CSRF would need cross-origin
    // handling that prod never actually needs.
    proxy: {
      '/api': {
        target: 'http://localhost:8094',
        changeOrigin: true,
      },
    },
  },
})
