import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:3020',
    changeOrigin: true,
    secure: false,
  },
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5174,
    proxy: apiProxy,
  },
  preview: {
    host: true,
    port: 5174,
    proxy: apiProxy,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})

