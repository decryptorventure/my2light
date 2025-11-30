import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'My2Light - Sports Highlights',
        short_name: 'My2Light',
        description: 'Capture and share your best sports moments',
        theme_color: '#ffffff',
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
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Enable minification optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console calls
      },
      mangle: {
        safari10: true, // Better Safari compatibility
      },
    },
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks(id) {
          // Core React libraries
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }

          // Supabase (large library)
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }

          // UI libraries (icons + animations)
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('framer-motion')) {
            return 'animations';
          }
          if (id.includes('canvas-confetti')) {
            return 'confetti';
          }

          // Heavy libraries (QR scanner)
          if (id.includes('html5-qrcode')) {
            return 'qr-scanner';
          }

          // React Query (data fetching)
          if (id.includes('@tanstack/react-query')) {
            return 'react-query';
          }

          // Zustand (state management)
          if (id.includes('zustand')) {
            return 'zustand';
          }

          // Utility libraries
          if (id.includes('react-blurhash') ||
            id.includes('react-window') ||
            id.includes('date-fns')) {
            return 'utils';
          }

          // Admin-specific code
          if (id.includes('/pages/admin/') ||
            id.includes('/components/admin/')) {
            return 'admin';
          }

          // Default: keep in main bundle
          return undefined;
        },
        // Better chunk naming for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase warning limit (we're splitting properly)
    chunkSizeWarningLimit: 600,
  },
});