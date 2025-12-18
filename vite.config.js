import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许外部访问
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
})
