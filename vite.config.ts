import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许局域网和手机访问 (e.g. http://192.168.x.x:3000)
    port: 3000,
  }
})
