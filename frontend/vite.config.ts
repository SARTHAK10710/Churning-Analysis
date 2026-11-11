import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the React app calls /api/* and Vite forwards it to FastAPI.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
