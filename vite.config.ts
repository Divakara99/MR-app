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
      includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'pharmasales-jobs-logo.png'],
      manifest: {
        name: 'PharmaSales Jobs',
        short_name: 'PharmaSales Jobs',
        description: 'PharmaSales Jobs — The MR to NSM Jobs Network. Verified pharma field-force vacancies from Trainee MR to ASM, RSM, ZSM and NSM. Managed by M Divakar Reddy.',
        theme_color: '#0284c7',
        background_color: '#f0f7ff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
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
