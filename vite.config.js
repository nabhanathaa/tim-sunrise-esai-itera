import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP } from './src/config.js'

// base './' membuat aplikasi jalan di GitHub Pages dengan nama repositori apa pun.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 900 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: `${APP.nama} · ${APP.kepanjangan}`,
        short_name: APP.nama,
        description: APP.deskripsi,
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#041F18',
        theme_color: '#062A20',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,geojson}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ]
})
