import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dohand-tarot/',
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/cards.json') || id.includes('/src/data/herbs.json')) {
            return 'data'
          }
        },
      },
    },
  },
})
