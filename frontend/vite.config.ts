import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// Plugin: copy vercel.json into dist after every build
const copyVercelJson = () => ({
  name: 'copy-vercel-json',
  closeBundle() {
    try {
      const dir = import.meta.dirname ?? resolve('.')
      copyFileSync(resolve(dir, 'vercel.json'), resolve(dir, 'dist/vercel.json'))
    } catch { /* ignore if not present */ }
  },
})

export default defineConfig({
  plugins: [react(), copyVercelJson()],
  server: {
    port: 5174,
    allowedHosts: true,
  },
})
