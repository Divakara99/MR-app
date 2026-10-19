import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MR Vacancies Hub',
        short_name: 'MR Vacancies',
        description: 'Verified pharma job vacancies for Medical Representatives. Managed by M Divakar Reddy.',
        theme_color: '#0284c7',
        background_color: '#f0f7ff',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    // @ts-ignore - allow all hosts for e2b preview (vite 6+ uses allowedHosts)
    allowedHosts: true as any,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': 'http://localhost:3000'
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
});
