import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'apple-touch-icon.png',
        'maskable-icon-512x512.png',
        'schemes.json'
      ],
      manifest: {
        name: 'सरकार मित्र',
        short_name: 'सरकार मित्र',
        description: 'बोला, सरकारी योजना समजून घ्या - महाराष्ट्र सरकारी योजना आवाज सहाय्यक',
        theme_color: '#EA580C',
        background_color: '#FFFAF3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Sarkar-Mitra/',
        scope: '/Sarkar-Mitra/',
        lang: 'mr',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        runtimeCaching: [
          {
            // Google Fonts stylesheets (Mukta / Noto Sans Devanagari)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Fonts webfont files (woff2)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // schemes.json caching so schemes, checklists, on-screen text work offline
            urlPattern: /.*schemes\.json.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'schemes-data-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/Sarkar-Mitra/',
  server: {
    port: 3000,
    open: true
  }
});
