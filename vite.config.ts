import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  // Relative base: the built app runs from any path (domain root OR a subpath
  // like a GitHub Pages project site) without host-specific config. Safe here
  // because navigation is state-based, with no client-side router.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 1138,
    strictPort: true,
  },
  preview: {
    port: 1138,
    strictPort: true,
  },
})
