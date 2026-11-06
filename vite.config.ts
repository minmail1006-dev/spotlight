import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' makes the build work on GitHub Pages under /<repo-name>/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 800 },
})
