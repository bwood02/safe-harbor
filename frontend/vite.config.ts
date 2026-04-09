import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173, // dev server port
    // Proxy /api to the .NET backend so the SPA can use same-origin requests in dev
    // (avoids CORS and avoids needing VITE_API_BASE_URL to match launchSettings exactly).
    proxy: {
      '/api': {
        // Use 127.0.0.1 so Node reliably reaches Kestrel (localhost can resolve to IPv6-only on some Windows setups).
        target: 'http://127.0.0.1:5176',
        changeOrigin: true,
      },
    },
  },
})
