import path from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  // Pengujian server memakai bun:sqlite, jadi dijalankan dengan `bun test server`
  test: { exclude: ['server/**', 'node_modules/**'] },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
